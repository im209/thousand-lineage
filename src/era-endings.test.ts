import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create, choose, continueStory, type State } from './engine';
import { eraEnding } from './endings';
import { readRecords, recordRun, recordedEraEnding } from './records';
import { decodeSave } from './save';

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());

/** A family one choice away from the 1550 boundary. */
function closing(deeds: string[] = []): State {
  const s = create(42, 0, 'commoner');
  s.runId = 'run-a';
  s.year = 1549;
  s.people[s.head].born = 1520;
  s.turn = 2;
  s.event = 'life0';
  if (deeds.length) s.eraDeeds = deeds;
  return choose(s, 0);
}

describe('era endings', () => {
  it('decides an era by what was achieved during it', () => {
    expect(eraEnding(closing()).id).toBe('survivor');
    expect(eraEnding(closing(['exam', 'court'])).id).toBe('gentry');
    expect(eraEnding(closing(['project-trade'])).id).toBe('trade');
    expect(eraEnding(closing(['project-trade', 'relief'])).id).toBe('relief');
    expect(eraEnding(closing(['relief', 'medicine'])).id).toBe('healing_community');
  });
  it('records a closed era once, without ending the story', () => {
    const s = closing(['project-learning']);
    expect(s.phase).toBe('play');
    expect(s.chapterEnd).toBe(1550);
    const first = recordRun(s).records;
    expect(first.recent).toHaveLength(1);
    expect(first.recent[0]).toMatchObject({ endedYear: 1550, years: 158, endingId: 'learning' });
    expect(first.endings).toContain('learning');
    expect(first.bestYears).toBe(158);
    // the summary screen and a reload record nothing new
    const summary = continueStory(s);
    expect(recordRun(summary).records.recent).toHaveLength(1);
    expect(recordRun(decodeSave(JSON.stringify(summary))!).records.recent).toHaveLength(1);
    expect(recordedEraEnding(summary, readRecords().records).id).toBe('learning');
  });
  it('starts the next era with a clean slate and records it separately', () => {
    const s = closing(['project-learning']);
    recordRun(s);
    const next = continueStory(continueStory(s));
    expect(next.chapterEnd).toBeUndefined();
    expect(next.eraDeeds).toBeUndefined();
    expect(recordRun(next).records.recent).toHaveLength(1); // nothing to record mid-era
    const later = structuredClone(next);
    later.year = 1700;
    later.chapterEnd = 1700;
    const records = recordRun(later).records;
    expect(records.recent.map(r => r.endedYear)).toEqual([1700, 1550]);
    expect(records.recent[0].endingId).toBe('survivor');
  });
});
