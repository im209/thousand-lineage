// Game state types and the small helpers every rule module shares.
import type { AbilityCheck } from '../ability-checks';
import type { ChronicleState } from '../chronicles';
import type { Stat } from '../data';
import type { FamilyEvent, LogEntry } from '../family-events';
import type { JourneyState } from '../journeys';
import type { ProjectState } from '../projects';
import type { ChallengeBenchmark } from '../share-links';
import type { Society } from '../society';
import type { SurpriseState } from '../surprises';
import type { Life, Tenure } from './lives';

export type Person = {
  intendedJob?: 'trade' | 'study';
  id: string;
  name: string;
  surname: string;
  clan: number;
  sex: '여' | '남';
  born: number;
  died: number | null;
  parents: string[];
  adoptiveParents: string[];
  spouses: string[];
  children: string[];
  generation: number;
  job: string;
  education: number;
  health: number;
  region: string;
  trait: string;
  ability: number;
  estate: number;
  alive: boolean;
  lineage: boolean;
  life: { year: number; text: string }[];
};

export type TurnReport = {
  checks?: AbilityCheck[];
  outcome?: string;
  from: number;
  to: number;
  title: string;
  decision: string;
  changes: Partial<Record<Stat, number>>;
  immediate: Partial<Record<Stat, number>>;
  borrowed: number;
  /** Where wealth went while the years passed: debt repaid, status upkeep (minus office income). */
  repaid?: number;
  upkeep?: number;
  /** Earned from work and eaten by the household over the turn, and how many mouths. */
  income?: number;
  food?: number;
  mouths?: number;
  debtBefore: number;
  debtAfter: number;
  entries: LogEntry[];
};

export type State = {
  journey?: JourneyState;
  surprise?: SurpriseState;
  endless?: boolean;
  challenge?: ChallengeBenchmark;
  introPending?: boolean;
  /** Per-turn wealth bookkeeping; only exists while a choice is being resolved. */
  ledger?: { repaid: number; upkeep: number; income: number; food: number };
  /** What the current head has chosen and achieved so far. */
  tenure?: Tenure;
  /** Former heads, in order, as the family remembers them. */
  lives?: Life[];
  /** Set when an era just closed: the year it closed. The era summary shows until dismissed. */
  chapterEnd?: number;
  chronicles?: ChronicleState;
  society?: Society;
  runId?: string;
  projects?: ProjectState;
  report?: TurnReport;
  representativeCount?: number;
  version: 1;
  seed: number;
  rng: number;
  year: number;
  clan: number;
  people: Record<string, Person>;
  head: string;
  founder: string;
  stats: Record<Stat, number>;
  debt: number;
  phase: 'play' | 'succession' | 'ended';
  event: string;
  seen: string[];
  log: LogEntry[];
  legacies: { key: string; generation: number }[];
  peak: { year: number; wealth: number };
  moves: string[];
  endReason: string;
  turn: number;
};

export const FIRST_YEAR = 1392;
export const MILESTONE_YEAR = 2026;
export const ADULT_AGE = 18;

/** Family stats and personal scores all live on a 0–100 scale. */
export const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * The single seeded random stream. Every call advances `s.rng`, so the order of calls is
 * part of the rules: same seed + same choices must replay the same family.
 */
export function rand(s: State) {
  s.rng = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
export const pick = <T>(s: State, a: readonly T[]): T => a[Math.floor(rand(s) * a.length)];

export function log(s: State, text: string, kind = 'family', family?: FamilyEvent) {
  s.log.push({ year: s.year, text, kind, ...(family ? { family } : {}) });
}

export const ageOf = (s: State, p: Person) => s.year - p.born;
export const isMinor = (s: State, p: Person) => ageOf(s, p) < ADULT_AGE;
export const living = (s: State) => Object.values(s.people).filter(p => p.alive);
export const livingLineage = (s: State) =>
  Object.values(s.people).filter(p => p.lineage && p.alive);
