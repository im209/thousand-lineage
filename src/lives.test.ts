import { describe, it, expect } from 'vitest';
import {
  create,
  choose,
  continueStory,
  succeed,
  candidates,
  currentEvent,
  choiceAvailable,
  lifeOf,
  livingHeadTitle,
  type State,
} from './engine';
import { decodeSave } from './save';

/** Plays the first available choice until the first succession. */
function untilSuccession(seed: number): State {
  let s = create(seed, 0, 'commoner');
  for (let n = 0; n < 200 && s.phase === 'play'; n++) {
    s = continueStory(s);
    if (s.chapterEnd || s.phase !== 'play') continue;
    const index = currentEvent(s).choices.findIndex((_, i) => choiceAvailable(s, i));
    s = choose(s, index);
  }
  return continueStory(s);
}

describe('remembered lives', () => {
  it('remembers a head once, when they die', () => {
    const s = [1, 2, 3, 4, 6, 8].map(untilSuccession).find(x => x.phase === 'succession')!;
    expect(s).toBeDefined();
    const life = lifeOf(s, s.head)!;
    expect(life.title.length).toBeGreaterThan(0);
    expect(life.from).toBe(1392);
    expect(life.to).toBe(s.year);
    expect(life.choices).toBe(s.turn);
    expect(s.lives).toHaveLength(1);
    expect(s.tenure).toBeUndefined();
    expect(s.log.some(l => l.kind === 'life' && l.text.includes(life.title))).toBe(true);
    expect(decodeSave(JSON.stringify(s))).toEqual(s);

    const next = succeed(s, candidates(s)[0].id);
    expect(next.tenure).toMatchObject({ head: next.head, from: next.year, choices: 0 });
    expect(next.lives).toHaveLength(1);
  });
  it('describes a living head without words for the dead', () => {
    const s = create(42, 0, 'commoner');
    const title = livingHeadTitle(s)!;
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/떠난|머물다 간|오래도록/);
    s.people[s.head].alive = false;
    expect(livingHeadTitle(s)).toBeUndefined();
  });
  it('starts tracking for saves made before lives existed', () => {
    const old = create(42, 0, 'commoner');
    delete old.tenure;
    const s = choose(old, 0);
    expect(s.tenure?.head ?? s.lives?.[0].id).toBe(old.head);
  });
});
