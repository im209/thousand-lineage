// Event data in data.ts is static. These variants adapt an event to the current family
// (a named child, a trade discount, inherited legacies, a business owner in 1997, ...).
import { events, type Effects, type Event } from '../data';
import { projectChoice } from '../projects';
import { prepareSurpriseEvent } from '../surprises';
import { gambleLabel } from './gamble';
import { relation } from './people';
import { adultHeirs, elder, marriageable } from './stages';
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

/** 평판 60 benefit: the big trade deal costs 3 instead of 8. */
const trustedTrade: Variant = (s, e) => {
  if (s.stats.reputation < 60) return e;
  return {
    ...e,
    description: '오랫동안 쌓아 온 거래처의 신뢰 덕분에 적은 밑천으로 거래를 넓힐 수 있습니다.',
    choices: e.choices.map((c, i) =>
      i === 0
        ? {
            ...c,
            description: '평판 60 이상 혜택',
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

const legacyBonus: Record<string, Effects> = {
  learning: { education: 10 },
  migration: { stability: 10 },
  trade: { wealth: 15 },
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
      description: '재산 +9 · 생계 +6',
      effects: { wealth: 9, stability: 6 },
    },
    {
      title: '다음 세대의 배움에 투자한다',
      description: '재산 −4 · 교육 +12',
      effects: { wealth: -4, education: 12 },
      legacy: 'learning',
    },
  ],
});

const matches = ['wealthy', 'warm', 'plain'] as const;
/** Marriage talks are about a real unmarried descendant; every choice marries them. */
const marriageTalks: Variant = (s, e) => {
  const p = marriageable(s);
  if (!p) return e;
  return {
    ...e,
    title: `${p.name}의 혼삿말`,
    description: `${p.name}(${s.year - p.born}세)의 혼처를 두고 말이 오갑니다. 어느 집과 인연을 맺느냐에 따라 살림과 체면이 달라집니다.`,
    choices: e.choices.map((c, i) => ({
      ...c,
      marry: { target: p.id, match: matches[i] ?? 'plain' },
    })),
  };
};

const eldersWinter: Variant = (s, e) => {
  const p = elder(s);
  if (!p) return e;
  return {
    ...e,
    title: `${p.name}의 겨울`,
    description: `${p.name}(${s.year - p.born}세)의 기력이 눈에 띄게 줄었습니다. 곁을 지킬 손과 약값, 밀린 일 사이에서 정해야 합니다.`,
  };
};

const ownMarriage: Variant = (s, e) => ({
  ...e,
  description: `${s.people[s.head].name}, ${s.year - s.people[s.head].born}세. ${e.description}`,
});

/** Grooming an heir: the choices are the real adult candidates. */
const groomHeir: Variant = (s, e) => ({
  ...e,
  choices: [
    ...adultHeirs(s).map(p => ({
      title: `${p.name}에게 살림을 가르친다`,
      description: `${relation(s, p.id)} · ${s.year - p.born}세 · 재산 −4 · ${p.name} 교육 +10`,
      effects: { wealth: -4 },
      target: p.id,
      personalEducation: 10,
    })),
    {
      title: '아직 정하지 않고 두루 살핀다',
      description: '결속 +4',
      effects: { cohesion: 4 },
    },
  ],
});

/** Shows the real odds on risky choices. */
const withOdds = (s: State, e: Event): Event =>
  e.choices.some(c => c.gamble)
    ? {
        ...e,
        choices: e.choices.map(c =>
          c.gamble ? { ...c, chanceLabel: gambleLabel(s, c.gamble) } : c,
        ),
      }
    : e;

const variantsById: Record<string, Variant> = {
  life11: marriageTalks,
  life10: eldersWinter,
  'stage-marriage': ownMarriage,
  'stage-heir': groomHeir,
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
  return withOdds(s, variantsById[e.id]?.(s, e) ?? e);
}
