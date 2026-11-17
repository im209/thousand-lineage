// Public game API. The rules live in ./core (one file per concern); screens, the store,
// tests and e2e scripts import everything from here so internal moves never break them.
//
//   core/state.ts           State/Person types, seeded random, clamp, log
//   core/people.ts          people, marriage, births, deaths, heirs, graph validation
//   core/annual.ts          one year passing (deaths, growth, births, household economy)
//   core/events.ts          next event, current event, choice cost/locks, turn length
//   core/event-variants.ts  static events adapted to this family
//   core/actions.ts         project rewards, surprises, exams, exam journeys
//   core/choose.ts          resolving a choice and passing the years
//   core/chapters.ts        eras: the story pauses with a summary at each era boundary
//   core/lives.ts           what each head did, and how they are remembered when they die
//   core/lifecycle.ts       new family, succession, future continuation
export type { Person, TurnReport, State } from './core/state';
export { rand, log } from './core/state';
export { candidates, relation, summary, validate } from './core/people';
export {
  turnYears,
  currentEvent,
  choiceCost,
  choiceLockReason,
  choiceAvailable,
} from './core/events';
export { choose } from './core/choose';
export {
  household,
  yearlyIncome,
  yearlyFood,
  workFactor,
  mortalityFactor,
  birthFactor,
} from './core/annual';
export { chapters, chapterOf, chapterEnding, chapterSummary, closesChapter } from './core/chapters';
export type { Chapter } from './core/chapters';
export { lifeOf, deedTitle, livingHeadTitle } from './core/lives';
export type { Life } from './core/lives';
export {
  create,
  beginStory,
  continueStory,
  selectProject,
  representativeNumber,
  succeed,
  canContinueFuture,
  continueFuture,
} from './core/lifecycle';

export {
  backgrounds,
  societyState,
  societyLabel,
  legalStatus,
  officeLabel,
  socialHint,
  examCandidate,
  examChance,
  coupChance,
  selectSocialFocus,
} from './society';
export type { StartingStanding, Society, SocialFocus } from './society';
export {
  projects,
  projectState,
  projectProgress,
  projectComplete,
  projectMatches,
} from './projects';
export type { ProjectId } from './projects';
