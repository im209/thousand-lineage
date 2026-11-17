// Events tied to where the head is in life. Their choices are filled in from the real
// family (core/stages.ts), so they are about named people rather than stat trades alone.
import type { Event } from './data';

const base = { min: 1392, max: Number.MAX_SAFE_INTEGER, kind: 'life' as const };

export const stageEvents: Event[] = [
  {
    ...base,
    id: 'stage-marriage',
    title: '혼처를 정할 때',
    description:
      '이제 짝을 맞을 나이입니다. 어떤 집안과 인연을 맺느냐가 앞으로의 살림과 자식의 삶을 바꿉니다.',
    choices: [
      {
        title: '넉넉한 집안과 혼인한다',
        description: '재산 +8 · 결속 −3 · 지금 혼인',
        effects: { wealth: 8, cohesion: -3 },
        marry: { match: 'wealthy' },
      },
      {
        title: '정이 깊은 사람과 혼인한다',
        description: '결속 +8 · 건강한 배우자 · 지금 혼인',
        effects: { cohesion: 8 },
        marry: { match: 'warm' },
      },
      {
        title: '글 읽는 집안과 혼인한다',
        description: '재산 −4 · 교육 +6 · 배운 배우자 · 지금 혼인',
        effects: { wealth: -4, education: 6 },
        marry: { match: 'learned' },
      },
      {
        title: '아직은 일에 힘쓴다',
        description: '생계 +5 · 혼인은 인연에 맡긴다',
        effects: { stability: 5 },
      },
    ],
  },
  {
    ...base,
    id: 'stage-heir',
    title: '누구에게 집안을 맡길까',
    description:
      '머리에 서리가 내렸습니다. 뒤를 이을 사람을 미리 가르쳐 두면 다음 대가 덜 흔들립니다.',
    choices: [],
  },
];
