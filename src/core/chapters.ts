// One sitting = one era. The story pauses at each era boundary with a summary of the
// people who lived through it, then continues with their descendants.
import { FIRST_YEAR, MILESTONE_YEAR, type State } from './state';

export type Chapter = { title: string; from: number; to: number };

export const chapters: readonly Chapter[] = [
  { title: '조선 전기', from: FIRST_YEAR, to: 1550 },
  { title: '전란의 시대', from: 1550, to: 1700 },
  { title: '조선 후기', from: 1700, to: 1876 },
  { title: '격변의 시대', from: 1876, to: 1953 },
  { title: '오늘의 시대', from: 1953, to: MILESTONE_YEAR },
];

/** The chapter a year belongs to. A boundary year opens the next chapter. */
export function chapterOf(year: number): Chapter | undefined {
  return chapters.find(c => year >= c.from && year < c.to);
}

/** True when `year` closes a chapter that has a next one (2026 has its own ending). */
export const closesChapter = (year: number) =>
  chapters.some(c => c.to === year && c.to < MILESTONE_YEAR);

export const chapterEnding = (year: number) => chapters.find(c => c.to === year);

/** What happened to the family during the chapter that just closed. */
export function chapterSummary(s: State, chapter: Chapter) {
  const inChapter = (year: number | null) =>
    year !== null && year > chapter.from && year <= chapter.to;
  const lineage = Object.values(s.people).filter(p => p.lineage);
  const heads = s.log.filter(l => l.kind === 'succession' && inChapter(l.year)).length;
  return {
    years: chapter.to - chapter.from,
    heads: heads + 1,
    born: lineage.filter(p => inChapter(p.born)).length,
    died: lineage.filter(p => inChapter(p.died)).length,
    living: lineage.filter(p => p.alive).length,
    moves: s.moves.length - 1,
  };
}
