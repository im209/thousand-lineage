// Starting a family, moving between screens of a turn, succession, and the post-2026 future.
import { clans, regions } from '../data';
import { projectComplete, projectState, projects, type ProjectId } from '../projects';
import { initializeSociety, randomStartingStanding, type StartingStanding } from '../society';
import { nextEvent } from './events';
import { startTenure } from './lives';
import { add, candidates, person } from './people';
import { FIRST_YEAR, MILESTONE_YEAR, clamp, isMinor, log, pick, rand, type State } from './state';

export function create(
  seed: number,
  clan = 0,
  origin: StartingStanding = randomStartingStanding(seed),
): State {
  const s: State = {
    representativeCount: 1,
    version: 1,
    seed: seed >>> 0,
    rng: seed >>> 0,
    year: FIRST_YEAR,
    clan,
    people: {},
    head: '',
    founder: '',
    stats: {
      wealth: 40,
      stability: 50,
      status: 25,
      education: 25,
      health: 65,
      reputation: 30,
      connections: 35,
      cohesion: 65,
    },
    debt: 0,
    phase: 'play',
    event: 'h1392',
    seen: [],
    log: [],
    legacies: [],
    peak: { year: FIRST_YEAR, wealth: 40 },
    moves: ['경상도'],
    endReason: '',
    turn: 0,
  };
  s.moves = [pick(s, regions)];
  s.stats.wealth = 25 + Math.floor(rand(s) * 40);
  s.stats.education = 15 + Math.floor(rand(s) * 35);
  const founder = add(
    s,
    person(s, FIRST_YEAR - 18 - Math.floor(rand(s) * 9), 1, clan, undefined, true),
  );
  s.head = s.founder = founder.id;
  startTenure(s);
  founder.job = pick(s, ['농민', '상인', '수공업자', '학인']);
  initializeSociety(s, origin);
  s.society!.focus = 'livelihood';
  s.peak.wealth = s.stats.wealth;
  log(s, `${clans[clan].label} ${founder.name}, 가문의 첫 장을 열다.`);
  return s;
}

/** Leaves the founder introduction. Time never passes before this. */
export function beginStory(state: State): State {
  if (!state.introPending || state.phase !== 'play') return state;
  return { ...state, introPending: false };
}

/** Closes the result screen; if an era just closed, the next call closes its summary. */
export function continueStory(state: State): State {
  if (!state.report && !state.chapterEnd) return state;
  const s = structuredClone(state);
  if (s.report) delete s.report;
  else delete s.chapterEnd;
  return s;
}

export function selectProject(state: State, id: ProjectId): State {
  if (
    state.introPending ||
    state.journey ||
    state.phase !== 'play' ||
    state.report ||
    !projects.some(p => p.id === id) ||
    projectComplete(state, id) ||
    projectState(state).active === id
  )
    return state;
  const s = structuredClone(state);
  s.projects = structuredClone(projectState(s));
  s.projects.active = id;
  return s;
}

export function representativeNumber(s: State) {
  return s.representativeCount ?? 1 + s.log.filter(l => l.kind === 'succession').length;
}

/** A minor heir costs 생계 −5 · 결속 −3; the heir's own education and health blend into the family's. */
export function succeed(state: State, id: string): State {
  if (
    state.report ||
    state.chapterEnd ||
    state.phase !== 'succession' ||
    !candidates(state).some(p => p.id === id)
  )
    return state;
  const s = structuredClone(state);
  s.representativeCount = representativeNumber(state) + 1;
  s.head = id;
  s.phase = 'play';
  const p = s.people[id];
  const minor = isMinor(s, p);
  if (minor) {
    s.stats.stability = clamp(s.stats.stability - 5);
    s.stats.cohesion = clamp(s.stats.cohesion - 3);
    p.job = '미성년';
  }
  s.stats.education = clamp(s.stats.education * 0.6 + p.education * 0.4);
  s.stats.health = clamp(s.stats.health * 0.7 + p.health * 0.3);
  log(
    s,
    `${p.generation}대 ${p.name}, 가문을 잇다.${minor ? ' 성년까지 가족 공동 돌봄으로 운영한다.' : ''}`,
    'succession',
  );
  p.life.push({ year: s.year, text: '가문 대표 계승' });
  startTenure(s);
  s.event = nextEvent(s).id;
  return s;
}

export function canContinueFuture(s: State) {
  return (
    s.phase === 'ended' &&
    !s.endless &&
    s.year === MILESTONE_YEAR &&
    Object.values(s.people).some(p => p.lineage && p.alive)
  );
}

/** After a 2026 survival ending, the same family continues into an open-ended fictional future. */
export function continueFuture(state: State): State {
  if (!canContinueFuture(state)) return state;
  const s = structuredClone(state);
  s.endless = true;
  s.endReason = '';
  delete s.report;
  s.runId = 'future-' + (s.runId ?? 'legacy-' + s.seed + '-' + s.clan + '-' + s.rng).slice(0, 113);
  s.phase = s.people[s.head].alive ? 'play' : 'succession';
  log(
    s,
    '2026년까지의 기록을 남기고, 아직 쓰이지 않은 미래로 가문의 이야기를 이어갑니다. 이후 시대는 가상의 미래입니다.',
    'future',
  );
  if (s.phase === 'play') s.event = nextEvent(s).id;
  return s;
}
