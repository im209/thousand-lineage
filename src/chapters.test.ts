import { describe, it, expect } from 'vitest';
import { create, choose, continueStory, chapterEnding, chapterOf, closesChapter } from './engine';
import { decodeSave } from './save';

function beforeBoundary() {
  const s = create(42, 0, 'commoner');
  s.year = 1549;
  s.people[s.head].born = 1520;
  s.turn = 2; // before the 4th choice, so no surprise can interrupt
  s.event = 'life0';
  return s;
}

describe('eras', () => {
  it('maps years to eras and treats a boundary year as the next era', () => {
    expect(chapterOf(1392)?.title).toBe('조선 전기');
    expect(chapterOf(1550)?.title).toBe('전란의 시대');
    expect(chapterEnding(1550)?.title).toBe('조선 전기');
    expect(closesChapter(1550)).toBe(true);
    expect(closesChapter(2026)).toBe(false);
  });
  it('stops exactly at the boundary and blocks choices until the summary is dismissed', () => {
    const stopped = choose(beforeBoundary(), 0);
    expect(stopped.year).toBe(1550);
    expect(stopped.chapterEnd).toBe(1550);
    const summary = continueStory(stopped);
    expect(summary.report).toBeUndefined();
    expect(summary.chapterEnd).toBe(1550);
    expect(choose(summary, 0)).toBe(summary);
    const next = continueStory(summary);
    expect(next.chapterEnd).toBeUndefined();
    expect(choose(next, 0).year).toBeGreaterThan(1550);
  });
  it('restores a save made on the era summary and rejects a misplaced one', () => {
    const summary = continueStory(choose(beforeBoundary(), 0));
    expect(decodeSave(JSON.stringify(summary))).toEqual(summary);
    expect(decodeSave(JSON.stringify({ ...summary, chapterEnd: 1500 }))).toBeNull();
  });
});
