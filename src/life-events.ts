import type { Event, Choice } from './data';
const option = (
  title: string,
  description: string,
  effects: Choice['effects'],
  extra: Partial<Choice> = {},
): Choice => ({ title, description, effects, ...extra });
export const lifeEvents: Event[] = (
  [
    {
      id: 'life0',
      title: '이번 살림, 어디에 힘을 보탤까요?',
      description:
        '곳간의 여유와 가족의 하루는 이어져 있습니다. 생활을 안정시키거나 새 수입원을 마련할 수 있습니다.',
      choices: [
        option('살림을 정비하고 지출을 줄인다', '재산 +9 · 결속 −3', { wealth: 9, cohesion: -3 }),
        option(
          '가족의 먹거리와 휴식을 챙긴다',
          '재산 −6 · 생활환경 +8 · 생계 +8',
          { wealth: -6, health: 8, stability: 8 },
          { legacy: 'care' },
        ),
        option(
          '작은 장사를 시작한다',
          '재산 −10 · 연결 +9 · 상업 진로',
          { wealth: -10, connections: 9 },
          { legacy: 'trade', job: 'trade' },
        ),
      ],
    },
    {
      id: 'life1',
      title: '이웃이 내민 손',
      description:
        '이웃들이 일손과 자원을 함께 나누자고 제안했습니다. 오늘의 도움은 훗날 가족의 안전망이 될 수 있습니다.',
      choices: [
        option(
          '품을 나누며 관계를 쌓는다',
          '재산 −4 · 연결 +14 · 명성 +6',
          { wealth: -4, connections: 14, reputation: 6 },
          { legacy: 'community' },
        ),
        option('우리 집의 일을 먼저 마친다', '재산 +11 · 연결 −4', { wealth: 11, connections: -4 }),
        option(
          '이웃에게 배울 기회를 찾는다',
          '재산 −3 · 교육 +7 · 연결 +5',
          { wealth: -3, education: 7, connections: 5 },
          { legacy: 'learning' },
        ),
      ],
    },
    {
      id: 'life2',
      title: '아이에게 열린 배움의 길',
      description:
        '자라는 후손에게 배울 기회가 찾아왔습니다. 지금의 지원은 이 아이가 성인이 되었을 때의 진로에 영향을 줍니다.',
      choices: [
        option(
          '학업을 충분히 지원한다',
          '재산 −12 · 가문 교육 +6 · 이 아이 교육 +18',
          { wealth: -12, education: 6 },
          { legacy: 'learning', personalEducation: 18 },
        ),
        option(
          '일상에서 배울 시간을 마련한다',
          '재산 −3 · 결속 +5 · 이 아이 교육 +7',
          { wealth: -3, cohesion: 5 },
          { personalEducation: 7 },
        ),
        option('이번에는 생활 기반을 지킨다', '재산 +6 · 생계 +5', { wealth: 6, stability: 5 }),
      ],
    },
    {
      id: 'life3',
      title: '거래를 넓힐 기회',
      description:
        '새 거래를 제안받았습니다. 쌓아 둔 평판과 사람들과의 관계가 거래의 조건을 바꿉니다.',
      choices: [
        option(
          '밑천을 들여 거래를 넓힌다',
          '재산 −8 · 연결 +12 · 상업 진로',
          { wealth: -8, connections: 12 },
          { job: 'trade', legacy: 'trade' },
        ),
        option('작은 거래부터 시작한다', '재산 +8 · 연결 +3', { wealth: 8, connections: 3 }),
        option(
          '거래보다 기술을 익힌다',
          '재산 −5 · 교육 +10',
          { wealth: -5, education: 10 },
          { legacy: 'learning' },
        ),
      ],
    },
    {
      id: 'life4',
      title: '비를 피할 튼튼한 지붕',
      description:
        '집을 손볼 때가 되었습니다. 비용을 아끼는 일과 오랫동안 안전하게 지내는 일 사이에서 결정해야 합니다.',
      choices: [
        option(
          '가족이 오래 살 집으로 고친다',
          '재산 −14 · 생활환경 +16 · 생계 +5',
          { wealth: -14, health: 16, stability: 5 },
          { legacy: 'care' },
        ),
        option('급한 곳만 수리한다', '재산 −4 · 생활환경 +5', { wealth: -4, health: 5 }),
        option('수리를 미루고 밑천을 남긴다', '재산 +5 · 생활환경 −6', { wealth: 5, health: -6 }),
      ],
    },
    {
      id: 'life5',
      title: '가족이 함께 정하는 약속',
      description:
        '일과 돌봄의 부담을 누구에게나 공평하게 나누기는 어렵습니다. 시간을 내어 가족의 목소리를 듣습니다.',
      choices: [
        option(
          '함께 돌볼 시간을 늘린다',
          '재산 −5 · 결속 +14 · 생활환경 +4',
          { wealth: -5, cohesion: 14, health: 4 },
          { legacy: 'care' },
        ),
        option('서로의 일을 존중하며 역할을 나눈다', '결속 +6 · 생계 +5', {
          cohesion: 6,
          stability: 5,
        }),
        option(
          '당장의 수입에 집중한다',
          '재산 +15 · 결속 −9',
          { wealth: 15, cohesion: -9 },
          { legacy: 'trade' },
        ),
      ],
    },
    {
      id: 'life6',
      title: '마을에서 건네온 부탁',
      description:
        '함께 해결할 일에 가문이 나서 달라는 요청을 받았습니다. 명성과 사회적 지위는 이런 작은 신뢰에서 시작됩니다.',
      choices: [
        option(
          '책임을 맡아 끝까지 돕는다',
          '재산 −8 · 명성 +14 · 지위 +8',
          { wealth: -8, reputation: 14, status: 8 },
          { legacy: 'community' },
        ),
        option('가능한 만큼만 힘을 보탠다', '재산 −2 · 명성 +5 · 연결 +5', {
          wealth: -2,
          reputation: 5,
          connections: 5,
        }),
        option('이번에는 가족에게 집중한다', '생계 +5 · 결속 +4 · 명성 −3', {
          stability: 5,
          cohesion: 4,
          reputation: -3,
        }),
      ],
    },
    {
      id: 'life7',
      title: '넉넉하지 않은 한 해',
      description:
        '생활에 필요한 것들이 부족해졌습니다. 쌓아 둔 자원을 쓰거나 서로 의지하며 버텨야 합니다.',
      choices: [
        option('비축해 둔 재산을 푼다', '재산 −12 · 생계 +15 · 생활환경 +5', {
          wealth: -12,
          stability: 15,
          health: 5,
        }),
        option(
          '이웃과 물자를 나눈다',
          '재산 −3 · 연결 +8 · 생계 +5',
          { wealth: -3, connections: 8, stability: 5 },
          { legacy: 'community' },
        ),
        option('긴축하며 다음 해를 기다린다', '재산 +6 · 생계 −7 · 결속 −4', {
          wealth: 6,
          stability: -7,
          cohesion: -4,
        }),
      ],
    },
    {
      id: 'life8',
      title: '빚을 줄일 새로운 약속',
      description:
        '가족과 거래 상대가 빚을 조정할 방법을 의논합니다. 기반 일부를 포기하고 부담을 줄이거나 당장의 생활을 지킬 수 있습니다.',
      choices: [
        option(
          '재산과 거래망을 정리한다',
          '재산 −12 · 연결 −10 · 명성 −6 · 비용 조달 후 부채 50% 조정',
          { wealth: -12, connections: -10, reputation: -6 },
          { debtRelief: 0.5 },
        ),
        option(
          '살림을 줄이며 나눠 갚는다',
          '재산 −5 · 결속 −8 · 생계 −4 · 비용 조달 후 부채 30% 조정',
          { wealth: -5, cohesion: -8, stability: -4 },
          { debtRelief: 0.3 },
        ),
        option('당장의 생계를 먼저 지킨다', '생계 +10 · 생활환경 +4 · 부채 조정 없음', {
          stability: 10,
          health: 4,
        }),
      ],
    },

    {
      id: 'life9',
      title: '먼 친척이 문을 두드리다',
      description:
        '흉년에 떠돌던 먼 친척 식구가 찾아왔습니다. 받아들이면 입이 늘고, 돌려보내면 마음이 무겁습니다.',
      choices: [
        option(
          '방 한 칸을 내어 함께 산다',
          '재산 −6 · 결속 +8 · 연결 +4',
          { wealth: -6, cohesion: 8, connections: 4 },
          { legacy: 'care' },
        ),
        option('양식을 들려 보낸다', '재산 −3 · 명성 +5', { wealth: -3, reputation: 5 }),
        option('형편이 어렵다며 돌려보낸다', '생계 +4 · 결속 −5', { stability: 4, cohesion: -5 }),
      ],
    },
    {
      id: 'life10',
      title: '집안 어른의 겨울',
      description:
        '집안 어른의 기력이 눈에 띄게 줄었습니다. 곁을 지킬 손과 약값, 밀린 일 사이에서 정해야 합니다.',
      choices: [
        option(
          '일을 줄이고 곁을 지킨다',
          '재산 −4 · 결속 +8 · 생활환경 +3',
          { wealth: -4, cohesion: 8, health: 3 },
          { legacy: 'care' },
        ),
        option('약재를 구해 달인다', '재산 −9 · 생활환경 +10', { wealth: -9, health: 10 }),
        option('밀린 일부터 해낸다', '재산 +9 · 결속 −6', { wealth: 9, cohesion: -6 }),
      ],
    },
    {
      id: 'life11',
      title: '혼삿말이 오가다',
      description:
        '집안 자식의 혼처를 두고 말이 오갑니다. 어느 집과 인연을 맺느냐에 따라 살림과 체면이 달라집니다.',
      choices: [
        option(
          '넉넉한 집과 사돈을 맺는다',
          '재산 −8 · 연결 +10 · 사회적 영향력 +3',
          { wealth: -8, connections: 10, status: 3 },
          { legacy: 'community' },
        ),
        option('가까운 이웃과 조촐히 치른다', '재산 −3 · 결속 +6 · 연결 +3', {
          wealth: -3,
          cohesion: 6,
          connections: 3,
        }),
        option('혼수를 줄여 밑천을 남긴다', '재산 +6 · 명성 −4', { wealth: 6, reputation: -4 }),
      ],
    },
    {
      id: 'life12',
      max: 1949,
      title: '논 한 마지기',
      description:
        '이웃이 급히 논을 내놓았습니다. 땅은 든든한 밑천이지만 당장의 살림을 덜어 내야 살 수 있습니다.',
      choices: [
        option(
          '살림을 털어 땅을 산다',
          '재산 −12 · 생계 +14',
          { wealth: -12, stability: 14 },
          { legacy: 'land' },
        ),
        option('소작을 얻어 부친다', '재산 −2 · 생계 +6', { wealth: -2, stability: 6 }),
        option('땅 대신 씨앗과 연장을 장만한다', '재산 −5 · 생계 +5 · 교육 +3', {
          wealth: -5,
          stability: 5,
          education: 3,
        }),
      ],
    },
    {
      id: 'life13',
      min: 1900,
      title: '도시로 가는 기차',
      description:
        '도시에는 학교와 일자리가 있다고들 합니다. 누구를 보내고 누가 남을지 가족이 머리를 맞댑니다.',
      choices: [
        option(
          '자식을 도시 학교에 보낸다',
          '재산 −10 · 교육 +12',
          { wealth: -10, education: 12 },
          { legacy: 'learning' },
        ),
        option(
          '온 식구가 도시로 옮긴다',
          '재산 −8 · 연결 +8 · 결속 −3 · 새 터전',
          { wealth: -8, connections: 8, cohesion: -3 },
          { move: true, legacy: 'migration' },
        ),
        option(
          '고향을 지킨다',
          '생계 +6 · 결속 +4',
          { stability: 6, cohesion: 4 },
          { legacy: 'land' },
        ),
      ],
    },
    {
      id: 'life14',
      min: 1900,
      title: '월급봉투와 가게',
      description:
        '꼬박꼬박 들어오는 월급과 내 가게의 꿈 사이에서 가족의 벌이를 어떻게 꾸릴지 정합니다.',
      choices: [
        option('안정된 직장에 다닌다', '재산 +5 · 생계 +10', { wealth: 5, stability: 10 }),
        option(
          '작은 가게를 연다',
          '재산 −10 · 연결 +8 · 상업 진로',
          { wealth: -10, connections: 8 },
          { legacy: 'trade', job: 'trade' },
        ),
        option(
          '일하며 야간 학교에 다닌다',
          '재산 −5 · 교육 +10',
          { wealth: -5, education: 10 },
          { legacy: 'learning', job: 'study' },
        ),
      ],
    },
    {
      id: 'life15',
      title: '이웃과 틀어진 사이',
      description:
        '물길과 밭 경계를 두고 이웃과 말다툼이 났습니다. 굽히면 손해고, 버티면 사이가 멀어집니다.',
      choices: [
        option(
          '먼저 찾아가 술 한 잔을 권한다',
          '재산 −3 · 연결 +8 · 명성 +3',
          { wealth: -3, connections: 8, reputation: 3 },
          { legacy: 'community' },
        ),
        option('마을 어른께 판가름을 청한다', '명성 +5 · 연결 −2', {
          reputation: 5,
          connections: -2,
        }),
        option('한 치도 물러서지 않는다', '재산 +8 · 연결 −7', { wealth: 8, connections: -7 }),
      ],
    },
  ] as (Omit<Event, 'min' | 'max' | 'kind'> & { min?: number; max?: number })[]
).map(e => ({ min: 1392, max: Number.MAX_SAFE_INTEGER, kind: 'life' as const, ...e }));
