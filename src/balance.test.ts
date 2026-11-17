import { describe, it, expect } from 'vitest';
import { create, choose, currentEvent } from './engine';
import { events } from './data';

describe('balance rules', () => {
  it('lets a high stat slip when it is not tended, but leaves modest stats alone', () => {
    const s = create(42, 0, 'commoner');
    s.stats.reputation = 95;
    s.stats.status = 30;
    // h1392, first choice: touches neither reputation nor status
    expect(currentEvent(s).choices[0].effects.reputation).toBeUndefined();
    const next = choose(s, 0);
    const years = next.year - s.year;
    expect(years).toBe(5);
    expect(next.stats.reputation).toBeLessThan(95);
    expect(next.stats.reputation).toBeGreaterThan(95 - 60 * 0.015 * years - 0.01);
    expect(next.stats.status).toBe(30);
  });
  it('has enough everyday events that an era does not repeat the same few', () => {
    const everyday = events.filter(e => /^life\d+$/.test(e.id) && e.id !== 'life8');
    expect(everyday.filter(e => e.min <= 1392).length).toBeGreaterThanOrEqual(12);
    for (const e of everyday) {
      expect(e.choices.length).toBeGreaterThanOrEqual(3);
      expect(new Set(e.choices.map(c => c.title)).size).toBe(e.choices.length);
    }
  });
});
