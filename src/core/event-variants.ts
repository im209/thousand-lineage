// Event data in data.ts is static. These variants adapt an event to the current family
// (a named child, a trade discount, inherited legacies, a business owner in 1997, ...).
import { events, type Event, type Stat } from '../data';
import { projectChoice } from '../projects';
import { prepareSurpriseEvent } from '../surprises';
import { isMinor, livingLineage, type State } from './state';

type Variant = (s: State, e: Event) => Event;

const debtRecovery: Variant = (s, e) => ({
  ...e,
  description: `${s.people[s.head].name}의 가족에게 부채 ${s.debt.toFixed(1)}점이 남아 있습니다. ${e.description} 조정 비율은 이번 선택의 부족한 비용까지 조달한 뒤 적용합니다.`,
});

const childEducation: Variant = (s, e) => {
  const child = livingLineage(s)
    .filter(p => isMinor(s, p))
    .sort((a, b) => a.born - b.born)[0];
  if (!child) return e;
  return {
    ...e,
    title: child.name + '에게 열린 배움의 길',
    description:
      child.name +
      '(' +
      (s.year - child.born) +
      '세)의 배움을 지원할 기회가 생겼습니다. 이 아이에게 쌓인 교육은 성인이 되었을 때 진로에 반영됩니다.',
    choices: e.choices.map(c => ({ ...c, target: child.id })),
  };
};

/** 연결 60 benefit: the big trade deal costs 3 instead of 8. */
const trustedTrade: Variant = (s, e) => {
  if (s.stats.connections < 60) return e;
  return {
    ...e,
    description: '오랫동안 쌓아 온 거래처의 신뢰 덕분에 적은 밑천으로 거래를 넓힐 수 있습니다.',
    choices: e.choices.map((c, i) =>
      i === 0
        ? {
            ...c,
            description: '연결 60 이상 혜택 · 재산 −3 · 연결 +12',
            effects: { ...c.effects, wealth: -3 },
          }
        : c,
    ),
  };
};

const familyDecision: Variant = (s, e) => ({
  ...e,
  description: s.people[s.head].name + '의 가족이 함께 결정할 일입니다. ' + e.description,
});

const businessCrisis: Variant = (s, e) => {
  if (!['상인', '자영업자'].includes(s.people[s.head].job)) return e;
  return {
    ...e,
    description:
      '외환위기로 가문 대표의 사업이 어려움을 겪고 있습니다. 운영 규모와 소득원을 다시 결정해야 합니다.',
    choices: [
      {
        title: '사업 규모를 줄인다',
        description: '재산 −8 · 안정 +8',
        effects: { wealth: -8, stability: 8 },
        legacy: 'trade',
      },
      {
        title: '다른 생업을 준비한다',
        description: '재산 −10 · 교육 +10',
        effects: { wealth: -10, education: 10 },
        legacy: 'learning',
        job: 'study',
      },
      {
        title: '거래처와 함께 회복을 기다린다',
        description: '재산 −15 · 연결 +12',
        effects: { wealth: -15, connections: 12 },
        legacy: 'community',
      },
    ],
  };
};

const legacyBonus: Record<string, Partial<Record<Stat, number>>> = {
  learning: { education: 10 },
  migration: { stability: 10 },
  trade: { wealth: 10 },
  community: { connections: 10, reputation: 5 },
};

/** A choice made 2–5 generations ago comes back as an opportunity. */
const inheritedLegacy: Variant = (_s, e) => ({
  ...e,
  description:
    '이전 세대가 남긴 선택이 오늘의 가족에게 기회가 되었습니다. 유산을 이어받거나 지금 필요한 자원으로 바꿀 수 있습니다.',
  choices: [
    {
      title: '가족의 유산을 이어받는다',
      description: '이어 온 경험이 가문의 역량을 높입니다.',
      effects: { ...(legacyBonus[e.requires ?? ''] ?? { health: 8, cohesion: 6 }) },
    },
    {
      title: '당장의 생활에 힘을 보탠다',
      description: '재산 +6 · 생계 +6',
      effects: { wealth: 6, stability: 6 },
    },
    {
      title: '다음 세대의 배움에 투자한다',
      description: '재산 −4 · 교육 +12',
      effects: { wealth: -4, education: 12 },
      legacy: 'learning',
    },
  ],
});

const variantsById: Record<string, Variant> = {
  life8: debtRecovery,
  life2: childEducation,
  life3: trustedTrade,
  life4: familyDecision,
  life5: familyDecision,
  h1997: businessCrisis,
};

/** The stored event for `s.event`, adapted to this family. */
export function familyEvent(s: State): Event {
  const base = events.find(e => e.id === s.event) ?? events[0];
  if (base.kind === 'surprise') return prepareSurpriseEvent(s, base);
  const special = projectChoice(base.id);
  const e = special ? { ...base, choices: [...base.choices, special] } : base;
  if (e.kind === 'legacy') return inheritedLegacy(s, e);
  return variantsById[e.id]?.(s, e) ?? e;
}
