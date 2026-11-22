// One head = one chapter of the story. While a head leads we keep a small tally of what
// they chose and achieved; when they die it becomes how the family remembers them.
import type { Choice } from '../data';
import type { State } from './state';

export type Tenure = {
  head: string;
  from: number;
  wealth: number;
  debt?: number;
  choices: number;
  tally: Record<string, number>;
  deeds: string[];
  /** Everyday events this head has already faced, so one life does not repeat them. */
  events?: string[];
};
export type Life = {
  id: string;
  from: number;
  to: number;
  title: string;
  choices: number;
  wealthChange: number;
  debt: number;
  deeds: string[];
};

/** How a deed is remembered, most memorable first. */
const deedTitles: [string, string][] = [
  ['founder', '새 왕조를 연 사람'],
  ['kingmaker', '왕을 세운 사람'],
  ['yangban', '가문을 일으킨 사람'],
  ['court', '조정에 오른 사람'],
  ['exam', '과거에 급제한 사람'],
  ['freed', '속박을 끊은 사람'],
  ['restored', '유배에서 돌아온 사람'],
  ['school', '마을의 스승'],
  ['books', '책을 지킨 사람'],
  ['relief', '곳간을 연 사람'],
  ['medicine', '병든 이를 돌본 사람'],
  ['market', '장터의 신용'],
  ['caravan', '먼 길을 이은 사람'],
  ['refuge', '피란민을 품은 사람'],
  ['reconstruction', '폐허를 다시 세운 사람'],
  ['petition', '억울함을 글로 푼 사람'],
  ['inheritance', '몫을 고르게 나눈 사람'],
  ['artisan', '손기술을 물려준 사람'],
  ['innovation', '새 방법을 찾아낸 사람'],
  ['project-learning', '배움의 집을 세운 사람'],
  ['project-trade', '상가를 일으킨 사람'],
  ['project-care', '함께 사는 집을 지은 사람'],
];
const habitTitles: Record<string, string> = {
  learning: '글을 가까이한 사람',
  trade: '장사에 밝았던 사람',
  care: '식구를 먼저 챙긴 사람',
  community: '이웃과 나눈 사람',
  migration: '터전을 옮긴 사람',
  land: '고향을 지킨 사람',
};
const traitTitles: Record<string, string> = {
  신중함: '조심스레 살림을 지킨 사람',
  다정함: '다정하게 식구를 돌본 사람',
  진취적: '새 길을 기웃거린 사람',
  '끈기 있음': '끈질기게 버틴 사람',
};
export const deedTitle = (id: string) => deedTitles.find(([key]) => key === id)?.[1];

/** Everything a turn can newly achieve, as deed ids. */
export function achievedSoFar(s: State): string[] {
  return [
    ...(s.society?.achievements ?? []),
    ...(s.chronicles?.completed ?? []),
    ...(s.projects?.completed ?? []).map(id => 'project-' + id),
  ];
}

export function startTenure(s: State) {
  s.tenure = {
    head: s.head,
    from: s.year,
    wealth: s.stats.wealth,
    debt: s.debt,
    choices: 0,
    tally: {},
    deeds: [],
  };
}

/** Counts a choice for the head who made it. Call with the deeds known before the choice. */
export function noteChoice(s: State, c: Choice, before: readonly string[], eventId: string) {
  const t = s.tenure;
  if (!t) return;
  t.choices++;
  (t.events ??= []).push(eventId);
  if (c.legacy) t.tally[c.legacy] = (t.tally[c.legacy] ?? 0) + 1;
  for (const id of achievedSoFar(s)) {
    if (before.includes(id)) continue;
    if (!t.deeds.includes(id) && deedTitle(id)) t.deeds.push(id);
    if (!(s.eraDeeds ??= []).includes(id)) s.eraDeeds.push(id);
  }
}

function titleFor(s: State, t: Tenure, diedOnRoad: boolean, alive = false) {
  const deed = deedTitles.find(([id]) => t.deeds.includes(id));
  if (deed) return deed[1];
  if (diedOnRoad) return '과거길에서 돌아오지 못한 사람';
  // Debt is inherited, so only the change during this head's years counts.
  const debtAtStart = t.debt ?? s.debt;
  if (s.debt >= 25 && s.debt - debtAtStart >= 15)
    return alive ? '빚을 지고 버티는 사람' : '빚을 남기고 떠난 사람';
  if (debtAtStart >= 15 && s.debt <= debtAtStart / 2) return '빚을 갚아 낸 사람';
  if (s.stats.wealth - t.wealth >= 25) return '곳간을 채운 사람';
  const [habit, count] = Object.entries(t.tally).sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  if (count >= 3 && habitTitles[habit]) return habitTitles[habit];
  if (t.choices <= 2 && !alive) return '짧게 머물다 간 사람';
  // Nothing stood out in their choices, so remember the person: a short or long life,
  // many children, or simply their temperament.
  const p = s.people[t.head],
    age = s.year - p.born;
  if (age < 40 && !alive) return '일찍 떠난 사람';
  if (p.children.length >= 4) return '자식 복이 많았던 사람';
  if (age >= 75 && !alive) return '오래도록 집안을 지킨 사람';
  return traitTitles[p.trait] ?? '묵묵히 집안을 지킨 사람';
}

/** When the head has died, turns their tenure into a remembered life (once). */
export function closeLife(s: State, diedOnRoad: boolean) {
  const t = s.tenure;
  if (!t || t.head !== s.head || s.people[s.head].alive) return;
  if (s.lives?.some(l => l.id === t.head)) return;
  const life: Life = {
    id: t.head,
    from: t.from,
    to: s.year,
    title: titleFor(s, t, diedOnRoad),
    choices: t.choices,
    wealthChange: s.stats.wealth - t.wealth,
    debt: s.debt,
    deeds: t.deeds,
  };
  s.lives = [...(s.lives ?? []), life];
  delete s.tenure;
  s.log.push({ year: s.year, text: `故 ${s.people[t.head].name} · ${life.title}`, kind: 'life' });
}

/** How the living head would be remembered so far (shown when the story ends with them alive). */
export function livingHeadTitle(s: State): string | undefined {
  const t = s.tenure;
  if (!t || t.head !== s.head || !s.people[s.head].alive) return undefined;
  return titleFor(s, t, false, true);
}

export const lifeOf = (s: State, id: string) => s.lives?.find(l => l.id === id);
