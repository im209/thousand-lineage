import { describe, it, expect } from 'vitest';
import { create, choose, continueStory, currentEvent, choiceAvailable, type State } from './engine';
import { decodeSave } from './save';

/** A founder on an ordinary everyday event, past the opening turns. */
function at(event: string, seed = 42): State {
  const s = create(seed, 0, 'commoner');
  s.event = event;
  s.turn = 2; // before the 4th choice, so no surprise interrupts
  return s;
}

describe('events about the real family', () => {
  it('lets an unmarried head choose a spouse, and marries at once', () => {
    const s = at('stage-marriage');
    const head = s.people[s.head];
    expect(head.spouses).toHaveLength(0);
    const event = currentEvent(s);
    expect(event.description).toContain(head.name);
    const next = choose(s, 1); // 정이 깊은 사람
    const spouse = next.people[next.people[next.head].spouses[0]];
    expect(spouse).toBeDefined();
    expect(spouse.spouses).toContain(next.head);
    expect(next.report!.outcome).toContain('혼인하다');
    expect(next.tenure?.events ?? next.lives).toBeDefined();
  });
  it('offers the head’s own marriage once, while unmarried and of age', () => {
    let s = create(7, 0, 'commoner');
    let offered = 0;
    for (let n = 0; n < 30 && s.phase === 'play'; n++) {
      if (currentEvent(s).id === 'stage-marriage') offered++;
      const i = currentEvent(s).choices.findIndex((_, k) => choiceAvailable(s, k));
      s = continueStory(choose(s, i));
      if (s.chapterEnd) s = continueStory(s);
    }
    expect(offered).toBeLessThanOrEqual(1);
  });
  it('names real adult candidates when grooming an heir', () => {
    const s = at('stage-heir');
    const head = s.people[s.head];
    head.born = s.year - 60;
    const child = { ...structuredClone(head), id: 'heir', name: '김후손', born: s.year - 25 };
    child.generation = 2;
    child.parents = [head.id];
    child.children = [];
    child.spouses = [];
    s.people.heir = child;
    head.children = ['heir'];
    const event = currentEvent(s);
    expect(event.choices[0].title).toContain('김후손');
    const before = child.education;
    const next = choose(s, 0);
    expect(next.people.heir.education).toBeGreaterThan(before);
    expect(next.report!.outcome).toContain('김후손');
  });
});

describe('risky choices', () => {
  it('shows the real odds, moved by the family stat, and applies exactly one outcome', () => {
    const s = at('life3');
    s.stats.connections = 80;
    const event = currentEvent(s);
    const index = event.choices.findIndex(c => c.gamble);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(event.choices[index].chanceLabel).toContain('62%'); // 50% + (80 − 50) × 0.4%
    const next = choose(s, index);
    const check = next.report!.checks![0];
    expect(check.chance).toBeCloseTo(0.62);
    expect(next.report!.immediate.wealth).toBe(check.success ? 20 : -12);
    expect(next.report!.outcome!.length).toBeGreaterThan(0);
    expect(decodeSave(JSON.stringify(next))).toEqual(next);
  });
  it('keeps odds within 10–90% at the extremes', () => {
    for (const [value, label] of [
      [0, '30%'],
      [100, '70%'],
    ] as const) {
      const s = at('life3');
      s.stats.connections = value;
      expect(currentEvent(s).choices.find(c => c.gamble)!.chanceLabel).toContain(label);
    }
  });
});
