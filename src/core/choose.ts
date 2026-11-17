// Making a choice: pay its cost, apply effects and actions, let the years pass, write the report.
import type { AbilityCheck } from '../ability-checks';
import { applyChronicleAction } from '../chronicles';
import { decisionFeedback } from '../choice-feedback';
import { events, jobFor, regions, type Choice, type Event, type Stat } from '../data';
import { beginExamJourney, examCapital, journeyText } from '../journeys';
import { withParticle } from '../korean';
import { applySocialAction, examCandidate } from '../society';
import { SURPRISE_CHANCE, surpriseRoll, type SurpriseState } from '../surprises';
import {
  advanceProject,
  applyJourneyAction,
  applySurpriseAction,
  startSurprise,
  takeExam,
} from './actions';
import { mergeEffects } from '../stats';
import { annual, household } from './annual';
import { resolveGamble } from './gamble';
import { livingSpouse, marry } from './people';
import { achievedSoFar, closeLife, noteChoice, startTenure } from './lives';
import { chapterEnding, closesChapter } from './chapters';
import {
  choiceAvailable,
  choiceCost,
  currentEvent,
  nextEvent,
  turnYears,
  warLossMultiplier,
} from './events';
import { ADULT_AGE, MILESTONE_YEAR, clamp, log, pick, rand, type State } from './state';

const statDelta = (before: Record<Stat, number>, s: State) => {
  const delta: Partial<Record<Stat, number>> = {};
  for (const k of Object.keys(before) as Stat[]) delta[k] = s.stats[k] - before[k];
  return delta;
};

function applyEffects(s: State, e: Event, c: Choice) {
  for (const [key, value] of Object.entries(mergeEffects(c.effects))) {
    const k = key as Stat;
    const multiplier = value < 0 ? warLossMultiplier(s, e.id) : 1;
    s.stats[k] = clamp(s.stats[k] + value * multiplier);
  }
}

/** Legacy, a child's tutoring, moving house, and the head's intended career. */
function applyChoiceDetails(s: State, c: Choice) {
  if (c.legacy) s.legacies.push({ key: c.legacy, generation: s.people[s.head].generation });
  if (c.target && c.personalEducation) {
    const p = s.people[c.target];
    if (p?.alive) {
      p.education = clamp(p.education + c.personalEducation);
      p.life.push({ year: s.year, text: '가족의 지원으로 교육 ' + c.personalEducation + ' 증가' });
      log(s, p.name + '의 교육이 ' + c.personalEducation + '점 높아졌습니다.', 'growth');
    }
  }
  if (c.move) {
    const place = pick(
      s,
      regions.filter(r => r !== s.moves.at(-1)),
    );
    s.moves.push(place);
    Object.values(s.people)
      .filter(p => p.alive)
      .forEach(p => (p.region = place));
    log(s, place + '에 새 터전을 마련하다.');
  }
  if (c.job) {
    const p = s.people[s.head];
    p.intendedJob = c.job;
    if (s.year - p.born >= ADULT_AGE) p.job = jobFor(s.year, c.job === 'study', c.job === 'trade');
    else {
      p.job = '미성년';
      log(s, '가족이 ' + p.name + '의 성년 이후 진로를 준비합니다.', 'growth');
    }
  }
}

/** Exam, road, Joseon life, surprise and debt-relief actions attached to the choice. */
function applyChoiceActions(s: State, c: Choice) {
  const checks: AbilityCheck[] = [];
  let startingJourney = false,
    journeyDeath = false;
  if (c.socialAction === 'exam') {
    const trip = beginExamJourney(s, examCandidate(s)!);
    if (trip) {
      s.journey = trip;
      startingJourney = true;
      log(
        s,
        `${withParticle(s.people[trip.candidate].name, '은/는')} 과거를 보러 ${examCapital(s.year)}으로 떠났습니다. ${journeyText(trip.id, s.year).title}.`,
        'journey',
      );
    } else takeExam(s, checks);
  } else if (c.socialAction) applySocialAction(s, c.socialAction, () => rand(s));
  if (c.journeyAction) journeyDeath = applyJourneyAction(s, c.journeyAction, checks);
  if (c.chronicleAction) applyChronicleAction(s, c.chronicleAction);
  if (c.surpriseAction) applySurpriseAction(s, c.surpriseAction);
  if (c.gamble) resolveGamble(s, c.gamble, checks);
  if (c.marry) {
    const p = s.people[c.marry.target ?? s.head];
    if (p?.alive && !livingSpouse(s, p)) {
      const spouse = marry(s, p);
      if (c.marry.match === 'warm') spouse.health = clamp(spouse.health + 10);
      if (c.marry.match === 'learned') spouse.education = clamp(spouse.education + 15);
      if (c.marry.match === 'wealthy') spouse.estate += 10;
    }
  }
  if (c.debtRelief) {
    const forgiven = Math.min(s.debt, s.debt * Math.max(0, Math.min(1, c.debtRelief)));
    s.debt = Math.max(0, s.debt - forgiven);
    log(
      s,
      `비용 조달 후 부채 ${forgiven.toFixed(1)}점을 조정했습니다. 남은 부채 ${s.debt.toFixed(1)}점.`,
      'economy',
    );
  }
  return { checks, startingJourney, journeyDeath };
}

/**
 * Advances the years. Stops early at a history year, at a surprise (from the 4th choice,
 * one roll per turn picks a year inside the span), or when the family needs a successor.
 */
function passYears(s: State, e: Event, c: Choice, stopNow: boolean) {
  const duration = stopNow
      ? { min: 0, max: 0 }
      : c.journeyAction
        ? { min: 3, max: 3 }
        : turnYears(s),
    wasSurprise = e.kind === 'surprise',
    routeTurn = /^(social-|chronicle-)/.test(s.event);
  s.turn++;
  delete s.surprise;
  const target = stopNow
      ? s.year
      : s.year + duration.min + Math.floor(rand(s) * (duration.max - duration.min + 1)),
    until = s.endless ? target : Math.min(MILESTONE_YEAR, target);
  const interruptAt =
    !wasSurprise &&
    !routeTurn &&
    s.turn > 3 &&
    until - s.year >= 2 &&
    surpriseRoll(s, 1) < SURPRISE_CHANCE
      ? s.year + 1 + Math.floor(surpriseRoll(s, 4) * (until - s.year - 1))
      : 0;
  while (s.year < until && s.phase === 'play') {
    annual(s);
    if ((s.phase as State['phase']) !== 'ended' && closesChapter(s.year)) {
      s.chapterEnd = s.year;
      log(s, `${chapterEnding(s.year)!.title}가 저물다.`, 'chapter');
      break;
    }
    if (events.some(e => e.year === s.year && !s.seen.includes(e.id))) break;
    if (s.year === interruptAt && s.phase === 'play' && startSurprise(s, until)) break;
  }
}

/** The one-sentence outcome shown first on the result screen. */
function outcomeText(s: State, e: Event, c: Choice, index: number, logStart: number) {
  const entries = s.log.slice(logStart);
  const deathEntry = entries.find(
    l => l.family?.type === 'farewell' && (l.family.people.includes(s.head) || l.family.cause),
  );
  if (deathEntry) return deathEntry.text;
  const wedding = c.marry && entries.find(l => l.family?.type === 'marriage');
  if (wedding) return wedding.text;
  const gamble = c.gamble && entries.find(l => l.kind === 'gamble');
  if (gamble) return gamble.text;
  const actionEntries = entries.filter(l => l.text !== e.title + ' — ' + c.title);
  const actionEntry =
    (c.journeyAction ? actionEntries.find(l => l.kind === 'society') : undefined) ??
    actionEntries.find(l =>
      ['society', 'alternate', 'chronicle', 'surprise-result', 'journey'].includes(l.kind),
    );
  return (c.socialAction || c.chronicleAction || c.surpriseAction || c.journeyAction) && actionEntry
    ? actionEntry.text
    : decisionFeedback(e, c, index);
}

export function choose(state: State, index: number): State {
  if (
    state.introPending ||
    state.phase !== 'play' ||
    state.report ||
    state.chapterEnd ||
    !choiceAvailable(state, index)
  )
    return state;
  const s = structuredClone(state),
    e = currentEvent(s),
    c = e.choices[index];
  if (!c) return state;
  if (s.tenure?.head !== s.head) startTenure(s); // saves from before lives were tracked
  const deedsBefore = achievedSoFar(s);
  const before = { ...s.stats },
    from = s.year,
    logStart = s.log.length,
    debtBefore = s.debt;

  // Anything the family cannot pay is borrowed.
  const borrowed = Math.max(0, choiceCost(s, index) - s.stats.wealth);
  s.debt += borrowed;
  s.seen.push(e.id);
  log(s, e.title + ' — ' + c.title, e.kind);
  if (borrowed > 0)
    log(
      s,
      '부족한 재산 ' +
        borrowed.toFixed(1) +
        '점을 빌렸습니다. 빚은 해마다 1%씩 늘고, 재산이 15를 넘으면 조금씩 갚습니다.',
      'economy',
    );

  applyEffects(s, e, c);
  applyChoiceDetails(s, c);
  const { checks, startingJourney, journeyDeath } = applyChoiceActions(s, c);
  advanceProject(s, c);
  const immediate = statDelta(before, s);

  s.ledger = { repaid: 0, upkeep: 0, income: 0, food: 0 };
  passYears(s, e, c, startingJourney || journeyDeath);
  const ledger = s.ledger;
  delete s.ledger;
  if (s.phase !== 'ended') advanceProject(s, c, false);
  noteChoice(s, c, deedsBefore, e.id);
  closeLife(s, journeyDeath);
  if (s.stats.wealth > s.peak.wealth) s.peak = { year: s.year, wealth: s.stats.wealth };
  if (s.phase === 'play') {
    const pending = s.surprise as SurpriseState | undefined;
    s.event = s.journey ? s.journey.id : pending ? pending.id : nextEvent(s).id;
  }
  if (before.reputation < 60 && s.stats.reputation >= 60)
    log(s, '평판 60 달성! 거래를 넓힐 때 드는 밑천이 8섬에서 3섬으로 줄어듭니다.', 'benefit');

  s.report = {
    ...(checks.length ? { checks } : {}),
    outcome: outcomeText(s, e, c, index, logStart),
    from,
    to: s.year,
    title: e.title,
    decision: c.title,
    changes: statDelta(before, s),
    immediate,
    borrowed,
    repaid: ledger.repaid,
    upkeep: ledger.upkeep,
    income: ledger.income,
    food: ledger.food,
    mouths: household(s).length,
    debtBefore,
    debtAfter: s.debt,
    entries: s.log.slice(logStart),
  };
  return s;
}
