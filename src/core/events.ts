// Which event comes next, what it looks like now, and what each choice costs or requires.
import { chronicleLockReason, nextChronicleEvent, prepareChronicleEvent } from '../chronicles';
import { events, type Event } from '../data';
import { prepareJourneyEvent } from '../journeys';
import { projectComplete, projectMatches, projects } from '../projects';
import {
  nextSocietyEvent,
  prepareSocialEvent,
  socialLockReason,
  societyState,
  wrapAlternateHistory,
} from '../society';
import { familyEvent } from './event-variants';
import { isMinor, livingLineage, pick, type State } from './state';

const MODERN_ERA = 1894;
/** Debt at or above this level brings the debt-recovery event (life8). */
export const DEBT_RECOVERY_LEVEL = 25;

/** How many years one choice advances. */
export function turnYears(s: State) {
  if (s.journey) return { min: 3, max: 3 };
  if (s.event.startsWith('surprise-')) {
    const r = s.surprise?.remaining ?? 5;
    return { min: r, max: r };
  }
  if (/^(social-|chronicle-)/.test(s.event)) return { min: 3, max: 3 };
  return s.turn < 3 ? { min: 5, max: 5 } : { min: 10, max: 15 };
}

export const needsDebtRecovery = (s: State) =>
  s.debt >= DEBT_RECOVERY_LEVEL && !s.seen.slice(-3).includes('life8');

/** Gyeongsang-do takes 1.4× losses in the 1592 war event. */
export const warLossMultiplier = (s: State, eventId: string) =>
  eventId === 'h1592' && s.moves.at(-1) === '경상도' ? 1.4 : 1;

/**
 * Priority: this year's history → exile → debt recovery → prepared Joseon life →
 * status/career route → a legacy from 2–5 generations ago → a random family event.
 */
export function nextEvent(s: State): Event {
  const history = events.find(e => e.year === s.year && !s.seen.includes(e.id));
  if (history) return history;
  const social = nextSocietyEvent(s);
  if (social?.id === 'social-exile') return social;
  if (needsDebtRecovery(s)) return events.find(e => e.id === 'life8')!;
  const chronicle = nextChronicleEvent(s);
  if (chronicle) return chronicle;
  if (social) return social;
  const g = s.people[s.head].generation;
  const legacy = events.find(
    e =>
      e.requires &&
      !s.seen.includes(e.id) &&
      s.legacies.some(l => l.key === e.requires && g - l.generation >= 2 && g - l.generation <= 5),
  );
  if (legacy) return legacy;
  const hasChild = livingLineage(s).some(p => isMinor(s, p));
  const pool = events.filter(
    e =>
      /^life[0-7]$/.test(e.id) &&
      e.min <= s.year &&
      e.max >= s.year &&
      (e.id !== 'life2' || hasChild) &&
      (e.id !== 'life7' || s.stats.wealth < 65 || s.stats.stability < 65),
  );
  const fresh = pool.filter(e => !s.seen.slice(-3).includes(e.id));
  const eligible = fresh.length ? fresh : pool;
  // Two tickets for a project-relevant event, one for other eligible family events.
  return pick(
    s,
    eligible.flatMap(e => (e.choices.some(c => projectMatches(s, c)) ? [e, e] : [e])),
  );
}

/** The event exactly as the player sees it now. Pure: never advances the random stream. */
export function currentEvent(s: State): Event {
  if (s.journey) return prepareJourneyEvent(s);
  const socialTurn = s.event.startsWith('social-');
  let e =
    socialTurn && s.year >= MODERN_ERA
      ? events.find(e => e.id === 'social-modern')!
      : socialTurn && societyState(s).political === 'exile'
        ? events.find(e => e.id === 'social-exile')!
        : familyEvent(s);
  if (e.kind === 'society' || e.id === 'h1894') e = prepareSocialEvent(s, e);
  if (e.kind === 'chronicle') e = prepareChronicleEvent(s, e);
  return wrapAlternateHistory(s, e);
}

export function choiceCost(s: State, index: number) {
  const c = currentEvent(s).choices[index];
  return Math.max(0, -(c?.effects.wealth ?? 0) * warLossMultiplier(s, s.event));
}

export function choiceLockReason(s: State, index: number): string | null {
  const c = currentEvent(s).choices[index];
  if (!c) return '선택지를 찾을 수 없습니다.';
  if (c.unlock && !projectComplete(s, c.unlock))
    return projects.find(p => p.id === c.unlock)!.title + ' 완성 필요';
  return socialLockReason(s, c) ?? chronicleLockReason(s, c);
}

export function choiceAvailable(s: State, index: number) {
  return choiceLockReason(s, index) === null;
}
