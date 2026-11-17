// The five things a family has. Wealth is counted in 섬 (sacks of rice); the others run 0–100.
//
// Event data was written for eight stats. Rather than hand-edit every choice, effects pass
// through mergeEffects (old keys fold into the five) and each choice's description is
// rebuilt from its effects, so what the player reads always matches what happens.
export type Stat = 'wealth' | 'health' | 'cohesion' | 'education' | 'reputation';
export type LegacyStat = 'stability' | 'connections' | 'status';
export type Effects = Partial<Record<Stat | LegacyStat, number>>;

export const labels: Record<Stat, string> = {
  wealth: '재산',
  health: '살림',
  cohesion: '화목',
  education: '교육',
  reputation: '평판',
};
export const WEALTH_UNIT = '섬';

const foldsInto: Record<Stat | LegacyStat, Stat> = {
  wealth: 'wealth',
  health: 'health',
  stability: 'health', // 생계 안정 + 생활환경 → 살림
  cohesion: 'cohesion',
  education: 'education',
  reputation: 'reputation',
  connections: 'reputation', // 연결 + 명성 + 영향력 → 평판
  status: 'reputation',
};
export const statOf = (key: string): Stat => foldsInto[key as Stat | LegacyStat] ?? (key as Stat);

/** Same-direction parts: the biggest counts fully, the rest by half. Opposite parts: summed. */
function combine(values: number[]) {
  if (values.length === 1) return values[0];
  const mixed = values.some(v => v > 0) && values.some(v => v < 0);
  if (mixed) return Math.round(values.reduce((a, b) => a + b, 0));
  const [first, ...rest] = [...values].sort((a, b) => Math.abs(b) - Math.abs(a));
  return Math.round(first + rest.reduce((a, b) => a + b, 0) / 2);
}

export function mergeEffects(effects: Effects): Partial<Record<Stat, number>> {
  const groups = new Map<Stat, number[]>();
  for (const [key, value] of Object.entries(effects)) {
    const stat = statOf(key);
    groups.set(stat, [...(groups.get(stat) ?? []), value]);
  }
  const merged: Partial<Record<Stat, number>> = {};
  for (const stat of Object.keys(labels) as Stat[]) {
    const values = groups.get(stat);
    if (values) merged[stat] = combine(values);
  }
  return merged;
}

const signed = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(n);
/** "재산 −6섬 · 살림 +12" */
export function describeEffects(effects: Partial<Record<Stat, number>>) {
  return (Object.keys(labels) as Stat[])
    .filter(stat => effects[stat])
    .map(stat => `${labels[stat]} ${signed(effects[stat]!)}${stat === 'wealth' ? WEALTH_UNIT : ''}`)
    .join(' · ');
}

// A description segment that only states a family stat change, in old or new words.
const statToken =
  /^(추가 )?(재산|생계 안정|생계|안정|결속|화목|가문 교육|교육|생활환경|살림|사회적 연결|연결|명성|평판|지위|사회적 영향력|영향력)\s*[+−-]\s*\d+(\.\d+)?섬?$/;
/** The parts of a description that are not plain stat changes ("상업 진로", "이 아이 교육 +18"). */
export const notesOf = (description: string) =>
  description
    .split(' · ')
    .map(part => part.trim())
    .filter(part => part && !statToken.test(part));
