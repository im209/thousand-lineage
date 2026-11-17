import { describe, it, expect } from 'vitest';
import { events } from './data';
import { create, choose, currentEvent, household, yearlyFood, yearlyIncome } from './engine';
import { decodeSave } from './save';
import { describeEffects, labels, mergeEffects, notesOf } from './stats';

describe('five stats', () => {
  it('folds the old eight into five: biggest part in full, the rest by half', () => {
    expect(mergeEffects({ health: 8, stability: 8 })).toEqual({ health: 12 });
    expect(mergeEffects({ connections: 14, reputation: 6 })).toEqual({ reputation: 17 });
    expect(mergeEffects({ health: -12, stability: -10, wealth: 6 })).toEqual({
      wealth: 6,
      health: -17,
    });
    expect(mergeEffects({ stability: 6, health: -4 })).toEqual({ health: 2 }); // opposite parts sum
  });
  it('writes every choice description from its real effects', () => {
    expect(describeEffects({ wealth: -6, health: 12 })).toBe('재산 −6섬 · 살림 +12');
    expect(notesOf('재산 −8 · 연결 +12 · 상업 진로')).toEqual(['상업 진로']);
    expect(notesOf('재산 −12 · 가문 교육 +6 · 이 아이 교육 +18')).toEqual(['이 아이 교육 +18']);
    for (const event of events)
      for (const c of event.choices) {
        expect(Object.keys(c.effects).every(k => k in labels)).toBe(true);
        if (!c.gamble) expect(c.description.startsWith(describeEffects(c.effects))).toBe(true);
        expect(c.description).not.toMatch(/생활환경|생계|결속|사회적 연결|명성|영향력/);
      }
  });
  it('shows the same folded effects on the event the player sees and applies exactly those', () => {
    const s = create(42, 0, 'commoner');
    s.event = 'life0';
    s.turn = 2;
    const choice = currentEvent(s).choices[1]; // 먹거리와 휴식
    expect(choice.description).toBe('재산 −6섬 · 살림 +12');
    const next = choose(s, 1);
    expect(next.report!.immediate).toMatchObject({ wealth: -6, health: 12 });
  });
  it('converts a save made with eight stats', () => {
    const s = create(42, 0, 'commoner');
    const old = JSON.parse(JSON.stringify(s));
    old.stats = {
      wealth: 40,
      stability: 50,
      status: 25,
      education: 25,
      health: 70,
      reputation: 30,
      connections: 50,
      cohesion: 65,
    };
    const loaded = decodeSave(JSON.stringify(old))!;
    expect(loaded.stats).toEqual({
      wealth: 40,
      health: 60,
      cohesion: 65,
      education: 25,
      reputation: 40,
    });
  });
});

describe('household ledger', () => {
  it('counts the mouths at home and reports what was earned and eaten', () => {
    const s = create(42, 0, 'commoner');
    expect(household(s).map(p => p.id)).toEqual([s.head]);
    expect(yearlyFood(s)).toBeCloseTo(0.36);
    expect(yearlyIncome(s)).toBeGreaterThan(0.5);
    const next = choose(s, 0);
    const r = next.report!;
    expect(r.income).toBeGreaterThan(0);
    expect(r.food).toBeGreaterThan(0);
    expect(r.mouths).toBe(household(next).length);
    // the ledger explains the whole wealth change
    const explained = (r.immediate.wealth ?? 0) + r.income! - r.food! - r.repaid! - r.upkeep!;
    expect(explained).toBeCloseTo(r.changes.wealth ?? 0, 5);
  });
  it('makes a bigger household cost more to feed', () => {
    const s = create(42, 0, 'commoner');
    const head = s.people[s.head];
    const child = {
      ...structuredClone(head),
      id: 'kid',
      born: s.year - 3,
      children: [],
      spouses: [],
    };
    child.parents = [head.id];
    s.people.kid = child;
    head.children = ['kid'];
    expect(household(s)).toHaveLength(2);
    expect(yearlyFood(s)).toBeCloseTo(0.72);
    child.born = s.year - 30; // grown children feed themselves
    expect(household(s)).toHaveLength(1);
  });
});
