// One year passing: ageing, deaths, coming of age, marriages, births, then the household economy.
import { jobFor } from '../data';
import { retireOffice, societyAnnual } from '../society';
import { addChild, checkSuccession, die, livingSpouse, marry } from './people';
import { ADULT_AGE, MILESTONE_YEAR, clamp, log, rand, type Person, type State } from './state';

/** Yearly death chance before the family's living conditions (`stats.health`) are applied. */
function baseMortality(age: number, year: number) {
  if (age > 95) return 0.5;
  if (age > 75) return 0.08;
  if (age > 55) return 0.025;
  if (age < 5) return year < 1900 ? 0.012 : 0.002;
  return 0.0015;
}

/** Living conditions scale every death chance: 0 → ×1.35, 100 → ×0.68. */
const livingConditions = (s: State) => 1.35 - s.stats.health / 150;

function comeOfAge(s: State, p: Person) {
  p.education = clamp(p.education * 0.7 + s.stats.education * 0.3);
  p.job = jobFor(s.year, p.education > 55, p.intendedJob === 'trade');
  p.life.push({ year: s.year, text: `성년이 되어 ${p.job}의 길을 시작함` });
  log(s, `${p.name}, 성년이 되어 ${p.job}의 길을 시작하다.`, 'growth', {
    type: 'growth',
    people: [p.id],
  });
}

/** Birth chance rises with family harmony and the mother's health, and falls as the household grows. */
function birthChance(s: State, mother: Person, householdSize: number) {
  return (
    (0.13 * (0.65 + s.stats.cohesion / 100) * (mother.health / 100)) / (1 + householdSize / 60)
  );
}

function canHaveChild(s: State, p: Person, mother: Person, father: Person) {
  const motherAge = s.year - mother.born;
  const lastBirth = p.children.map(id => s.people[id].born).sort((a, b) => b - a)[0] ?? 0;
  return (
    motherAge >= 20 &&
    motherAge <= 42 &&
    s.year - father.born < 65 &&
    s.year - lastBirth >= 3 &&
    p.children.length < 5
  );
}

function livePeopleYear(s: State) {
  const alive = Object.values(s.people).filter(p => p.alive);
  for (const p of alive) {
    const age = s.year - p.born;
    if (rand(s) < baseMortality(age, s.year) * livingConditions(s)) {
      die(s, p);
      continue;
    }
    if (!p.lineage) continue;
    if (age === ADULT_AGE) comeOfAge(s, p);
    if (age < ADULT_AGE) p.job = '미성년';
    if (age >= 20 && age < 49 && !p.spouses.some(id => s.people[id].alive) && rand(s) < 0.18)
      marry(s, p);
    const sp = livingSpouse(s, p);
    if (!sp) continue;
    const mother = p.sex === '여' ? p : sp;
    const father = p.sex === '남' ? p : sp;
    if (canHaveChild(s, p, mother, father) && rand(s) < birthChance(s, mother, alive.length)) {
      const child = addChild(s, p, sp, '자녀');
      log(s, `${child.name}, ${p.generation + 1}대 자녀가 태어나다.`, 'family', {
        type: 'birth',
        people: [child.id],
      });
    }
  }
}

/** Debt grows 1% a year but interest alone never pushes it past DEBT_CEILING. */
export const DEBT_CEILING = 100;
const growDebt = (debt: number) =>
  debt >= DEBT_CEILING ? debt : Math.min(DEBT_CEILING, debt * 1.01);

/** Wealth drifts, stability follows wealth, debt repays from wealth above 15 and grows 1% a year. */
function householdYear(s: State) {
  s.stats.wealth = clamp(s.stats.wealth + (rand(s) - 0.52) * 3 + (s.stats.education - 50) * 0.004);
  s.stats.stability = clamp(s.stats.stability + (s.stats.wealth - 50) * 0.012);
  if (s.debt > 0) {
    const repayment = Math.min(s.debt, Math.max(0, s.stats.wealth - 15) * 0.08);
    s.stats.wealth = clamp(s.stats.wealth - repayment);
    if (s.ledger) s.ledger.repaid += repayment;
    s.debt = growDebt(Math.max(0, s.debt - repayment));
    s.stats.stability = clamp(s.stats.stability - Math.min(1, s.debt * 0.015));
  }
  s.stats.health = clamp(s.stats.health + (s.stats.stability - 50) * 0.006);
  if (s.stats.wealth > s.peak.wealth) s.peak = { year: s.year, wealth: s.stats.wealth };
}

export function annual(s: State) {
  s.year++;
  const beforeUpkeep = s.stats.wealth;
  societyAnnual(s);
  if (s.ledger) s.ledger.upkeep += beforeUpkeep - s.stats.wealth;
  livePeopleYear(s);
  retireOffice(s);
  householdYear(s);
  checkSuccession(s);
  if (!s.endless && s.year >= MILESTONE_YEAR) {
    s.phase = 'ended';
    s.endReason = Object.values(s.people).some(p => p.lineage && p.alive)
      ? '2026년까지 존속'
      : '후계자 부재';
  }
}
