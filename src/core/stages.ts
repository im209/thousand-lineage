// Which family-specific events fit right now, and the real people they are about.
import { candidates, livingSpouse } from './people';
import { ADULT_AGE, ageOf, living, livingLineage, type Person, type State } from './state';

/** A descendant old enough to marry who has no living spouse (not the head). */
export function marriageable(s: State): Person | undefined {
  return livingLineage(s)
    .filter(p => p.id !== s.head && ageOf(s, p) >= 17 && ageOf(s, p) <= 35 && !livingSpouse(s, p))
    .sort((a, b) => a.born - b.born)[0];
}

/** The oldest living family member aged 60 or more, other than the head. */
export function elder(s: State): Person | undefined {
  return living(s)
    .filter(p => p.id !== s.head && ageOf(s, p) >= 60)
    .sort((a, b) => a.born - b.born)[0];
}

export const adultHeirs = (s: State) =>
  candidates(s)
    .filter(p => ageOf(s, p) >= ADULT_AGE)
    .slice(0, 3);

/** Everyday events that only make sense for some families. */
export function eventFits(s: State, id: string) {
  if (id === 'life11') return !!marriageable(s);
  if (id === 'life10') return !!elder(s);
  return true;
}

/** A life-stage event the current head has not faced yet, if one is due. */
export function stageEventId(s: State): string | undefined {
  const head = s.people[s.head];
  if (!head.alive) return undefined;
  const faced = s.tenure?.head === s.head ? (s.tenure.events ?? []) : [];
  const age = ageOf(s, head);
  if (!faced.includes('stage-marriage') && age >= ADULT_AGE && age <= 45 && !livingSpouse(s, head))
    return 'stage-marriage';
  if (!faced.includes('stage-heir') && age >= 55 && adultHeirs(s).length) return 'stage-heir';
  return undefined;
}
