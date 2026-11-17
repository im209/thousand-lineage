// People: creating, marrying, births, deaths, heirs, and family-graph checks.
import { clans, jobFor } from '../data';
import type { DeathCause } from '../family-events';
import { journeyText } from '../journeys';
import { withParticle } from '../korean';
import { givenName } from '../names';
import {
  ADULT_AGE,
  FIRST_YEAR,
  MILESTONE_YEAR,
  clamp,
  isMinor,
  livingLineage,
  log,
  pick,
  rand,
  type Person,
  type State,
} from './state';

const TRAITS = ['신중함', '다정함', '진취적', '끈기 있음'];

// Random draw order (name, sex, health, trait, ability, estate) must stay fixed:
// same-seed replays depend on it.
export function person(
  s: State,
  born: number,
  generation: number,
  clan: number,
  sex?: '여' | '남',
  lineage = false,
): Person {
  const c = clans[clan];
  const nameRoll = rand(s),
    chosenSex = sex ?? pick(s, ['여', '남'] as const);
  const taken = new Set(
    Object.values(s.people)
      .filter(p => p.alive || born - p.born < 60)
      .map(p => p.name),
  );
  const minor = s.year - born < ADULT_AGE;
  return {
    id: `p${Object.keys(s.people).length + 1}`,
    name: givenName(nameRoll, c.surname, born, chosenSex, taken),
    surname: c.surname,
    clan,
    sex: chosenSex,
    born,
    died: null,
    parents: [],
    adoptiveParents: [],
    spouses: [],
    children: [],
    generation,
    job: minor ? '미성년' : jobFor(s.year, s.stats.education > 60, false),
    education: s.stats.education,
    health: 55 + Math.floor(rand(s) * 40),
    region: s.moves.at(-1)!,
    trait: pick(s, TRAITS),
    ability: 30 + Math.floor(rand(s) * 60),
    estate: minor ? 0 : 5 + Math.floor(rand(s) * 10),
    alive: true,
    lineage,
    life: [],
  };
}

export function add(s: State, p: Person) {
  s.people[p.id] = p;
  return p;
}

/** A child of `parent` and `partner`, born this year. `how` is '자녀' or '쌍둥이'. */
export function addChild(s: State, parent: Person, partner: Person, how: string): Person {
  const father = parent.sex === '남' ? parent : partner;
  const child = add(s, person(s, s.year, parent.generation + 1, father.clan, undefined, true));
  child.parents = [parent.id, partner.id];
  child.region = parent.region;
  child.education = clamp(s.stats.education * 0.5 + parent.education * 0.5);
  parent.children.push(child.id);
  partner.children.push(child.id);
  child.life.push({
    year: s.year,
    text: `${withParticle(parent.name, '과/와')} ${partner.name}의 ${how}로 태어남`,
  });
  return child;
}

export const livingSpouse = (s: State, p: Person) =>
  p.spouses.map(id => s.people[id]).find(x => x.alive);

export function marry(s: State, p: Person) {
  const c = pick(
    s,
    clans.filter(c => c.id !== p.clan),
  );
  const spouse = add(
    s,
    person(
      s,
      s.year - 20 - Math.floor(rand(s) * 12),
      p.generation,
      c.id,
      p.sex === '여' ? '남' : '여',
    ),
  );
  spouse.region = p.region;
  p.spouses.push(spouse.id);
  spouse.spouses.push(p.id);
  p.life.push({ year: s.year, text: `${withParticle(spouse.name, '과/와')} 혼인` });
  spouse.life.push({ year: s.year, text: `${withParticle(p.name, '과/와')} 혼인` });
  log(s, `${withParticle(p.name, '과/와')} ${spouse.name}, 혼인하다.`, 'family', {
    type: 'marriage',
    people: [p.id, spouse.id],
  });
  s.stats.connections = clamp(s.stats.connections + 2);
  return spouse;
}

/** Death splits personal estate among living children; with none, a tenth returns to the family. */
export function die(s: State, p: Person, cause?: DeathCause) {
  if (!p.alive) return;
  p.alive = false;
  p.died = s.year;
  const text = cause
    ? `${p.name}, ${journeyText(`journey-${cause}`, s.year).death}`
    : `${p.name}, ${s.year - p.born}세에 생을 마치다.`;
  p.life.push({
    year: s.year,
    text: cause ? journeyText(`journey-${cause}`, s.year).death : '생을 마침',
  });
  log(s, text, 'family', { type: 'farewell', people: [p.id], ...(cause ? { cause } : {}) });
  const heirs = p.children.map(id => s.people[id]).filter(c => c.alive);
  if (heirs.length) {
    const share = p.estate / heirs.length;
    heirs.forEach(h => (h.estate += share));
  } else s.stats.wealth = clamp(s.stats.wealth + p.estate * 0.1);
  p.estate = 0;
}

/** Living descendants who could lead next: adults first, then education, then health. */
export function candidates(s: State) {
  return livingLineage(s)
    .filter(p => p.id !== s.head)
    .sort(
      (a, b) =>
        Number(!isMinor(s, b)) - Number(!isMinor(s, a)) ||
        b.education - a.education ||
        b.health - a.health,
    );
}

export function checkSuccession(s: State) {
  if (s.people[s.head].alive) return;
  if (candidates(s).length) s.phase = 'succession';
  else {
    s.phase = 'ended';
    s.endReason = '후계자 부재';
  }
}

export function relation(s: State, id: string) {
  const p = s.people[id],
    head = s.people[s.head];
  if (id === s.head) return '현재 대표';
  if (head.children.includes(id)) return p.sex === '여' ? '딸' : '아들';
  if (head.parents.includes(id)) return p.sex === '여' ? '어머니' : '아버지';
  if (head.parents.some(x => p.parents.includes(x))) return '형제자매';
  if (p.parents.some(x => head.children.includes(x))) return p.sex === '여' ? '손녀' : '손자';
  return '창시자의 ' + p.generation + '세대 후손';
}

export function summary(s: State) {
  const ps = Object.values(s.people),
    alive = livingLineage(s);
  return {
    years: s.year - FIRST_YEAR,
    generations: Math.max(...ps.filter(p => p.lineage).map(p => p.generation)),
    people: ps.length,
    descendants: ps.filter(p => p.lineage && p.id !== s.founder).length,
    living: alive.length,
    original: alive.filter(p => p.clan === s.clan).length,
  };
}

/** Structural checks on the family graph; an empty list means the save is consistent. */
export function validate(s: State) {
  const errors: string[] = [];
  for (const p of Object.values(s.people)) {
    if (p.died !== null && (p.died < p.born || p.died > s.year)) errors.push('death');
    if (p.alive !== (p.died === null)) errors.push('alive');
    for (const id of p.parents) {
      const parent = s.people[id];
      if (
        !parent ||
        parent.born + ADULT_AGE > p.born ||
        (parent.died !== null && parent.died < p.born) ||
        !parent.children.includes(p.id)
      )
        errors.push('parent');
    }
    for (const id of p.spouses) if (!s.people[id]?.spouses.includes(p.id)) errors.push('spouse');
    for (const id of p.children)
      if (!s.people[id]?.parents.includes(p.id) && !s.people[id]?.adoptiveParents.includes(p.id))
        errors.push('child');
  }
  if (
    !Number.isSafeInteger(s.year) ||
    s.year < FIRST_YEAR ||
    (s.year > MILESTONE_YEAR && !s.endless)
  )
    errors.push('year');
  return errors;
}
