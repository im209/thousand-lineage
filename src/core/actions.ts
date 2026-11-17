// What special choices do beyond their stat effects: project rewards, surprises, exams, journeys.
import type { AbilityCheck } from '../ability-checks';
import { nextChronicleEvent } from '../chronicles';
import { events, regions, type Choice } from '../data';
import type { DeathCause } from '../family-events';
import { examCapital, journeyRisk, journeyText, type JourneyAction } from '../journeys';
import { withParticle } from '../korean';
import {
  projectComplete,
  projectMatches,
  projectState,
  projects,
  type ProjectId,
} from '../projects';
import {
  applySocialAction,
  examCandidate,
  examChance,
  retireOffice,
  societyState,
} from '../society';
import {
  pickSurprise,
  prepareSurpriseEvent,
  surpriseRoll,
  type SurpriseAction,
} from '../surprises';
import { needsDebtRecovery } from './events';
import { addChild, checkSuccession, die, livingSpouse } from './people';
import { clamp, isMinor, living, log, pick, rand, type Person, type State } from './state';

// ── Family projects (배움의 집 · 신뢰받는 상가 · 함께 사는 집) ─────────────────────

const projectRewards: Record<ProjectId, (s: State) => string> = {
  learning(s) {
    const children = living(s).filter(p => isMinor(s, p));
    for (const p of children) {
      p.education = clamp(p.education + 12);
      p.life.push({ year: s.year, text: '가문의 배움터 완성으로 교육 12 증가' });
    }
    return `생존한 미성년 ${children.length}명의 교육 +12. 배움 특별 선택을 열었습니다.`;
  },
  trade(s) {
    const repayment = Math.min(8, s.debt);
    s.debt -= repayment;
    s.stats.wealth = clamp(s.stats.wealth + 8 - repayment);
    return `부채 ${repayment.toFixed(1)}점 상환, 재산 +${(8 - repayment).toFixed(1)}. 상업 특별 선택을 열었습니다.`;
  },
  care(s) {
    const everyone = living(s);
    for (const p of everyone) {
      p.health = clamp(p.health + 10);
      p.life.push({ year: s.year, text: '가문의 돌봄 기반 완성으로 건강 10 증가' });
    }
    s.stats.health = clamp(s.stats.health + 8);
    return `생존 가족 ${everyone.length}명의 건강 +10, 살림 +8. 돌봄 특별 선택을 열었습니다.`;
  },
};

/** Counts a matching choice (max 3), then completes the project once its stat threshold is met. */
export function advanceProject(s: State, c: Choice, countChoice = true) {
  const active = projectState(s).active;
  if (!active || projectComplete(s, active)) return;
  s.projects = structuredClone(projectState(s));
  const project = projects.find(p => p.id === active)!;
  if (countChoice && projectMatches(s, c)) {
    const previous = s.projects.progress[active];
    s.projects.progress[active] = Math.min(3, previous + 1);
    if (s.projects.progress[active] > previous)
      log(s, `${project.title} · 관련 선택 ${s.projects.progress[active]}/3`, 'project-progress');
  }
  if (s.projects.progress[active] < 3 || s.stats[project.stat] < project.threshold) return;
  s.projects.completed.push(active);
  s.projects.active = null;
  const detail = projectRewards[active](s);
  log(s, `${project.title} 완성! ${detail}`, 'project');
}

// ── Surprises (돌발 사건) ─────────────────────────────────────────────────────────

/** Tries to interrupt the passing years. Never cuts into a story that must continue. */
export function startSurprise(s: State, until: number) {
  if (
    s.chronicles?.active ||
    nextChronicleEvent(s) ||
    societyState(s).political === 'exile' ||
    needsDebtRecovery(s)
  )
    return false;
  const picked = pickSurprise(s);
  if (!picked) return false;
  s.surprise = { id: picked.id, target: picked.target, remaining: until - s.year };
  if (picked.id === 'surprise-twins' && picked.target) {
    const p = s.people[picked.target],
      sp = livingSpouse(s, p)!;
    const twins = [0, 1].map(() => addChild(s, p, sp, '쌍둥이'));
    log(
      s,
      withParticle(twins[0].name, '과/와') + ' ' + twins[1].name + ', 쌍둥이로 태어나다.',
      'family',
      { type: 'birth', people: twins.map(p => p.id) },
    );
  }
  log(
    s,
    '뜻밖의 일 · ' + prepareSurpriseEvent(s, events.find(e => e.id === picked.id)!).title,
    'surprise',
  );
  return true;
}

export function applySurpriseAction(s: State, action: SurpriseAction) {
  const target = s.surprise?.target ? s.people[s.surprise.target] : undefined,
    head = s.people[s.head],
    roll = surpriseRoll(s, 5);
  const leave = (p: Person) => {
    const place = pick(
      s,
      regions.filter(r => r !== p.region),
    );
    p.region = place;
    p.life.push({ year: s.year, text: place + '(으)로 떠나 따로 살아감' });
  };
  if (action === 'plague-doctor' && target?.alive) {
    target.health = clamp(target.health + 10);
    target.life.push({ year: s.year, text: '돌림병을 이겨냄' });
    log(s, target.name + ', 의원의 약으로 병을 이겨내다.', 'surprise-result');
  }
  if (action === 'plague-home' && target?.alive && target.id !== s.head) {
    if (roll < 0.25) {
      die(s, target);
      log(s, '정성껏 간병했지만 ' + target.name + '을(를) 지키지 못했습니다.', 'surprise-result');
    } else {
      target.life.push({ year: s.year, text: '가족의 간병으로 병을 이겨냄' });
      log(s, target.name + ', 가족의 간병으로 병을 이겨내다.', 'surprise-result');
    }
  }
  if (action === 'bandits-resist') {
    if (roll < 0.7)
      log(
        s,
        '장정들과 힘을 모아 도적을 물리쳤습니다. 마을이 이 가문을 다시 보게 되었습니다.',
        'surprise-result',
      );
    else {
      s.stats.wealth = clamp(s.stats.wealth - 10);
      head.health = clamp(head.health - 15);
      head.life.push({ year: s.year, text: '도적과 맞서다 다침' });
      log(s, '도적을 막지 못해 재물을 잃고 ' + head.name + '이(가) 다쳤습니다.', 'surprise-result');
    }
  }
  if (action === 'runaway-honor' && target?.alive) {
    leave(target);
    log(
      s,
      target.name + '은(는) 끝내 돌아오지 않고 ' + target.region + '에서 새 삶을 꾸렸습니다.',
      'surprise-result',
    );
  }
  if (action === 'runaway-wait' && target?.alive) {
    if (roll < 0.5) {
      s.stats.cohesion = clamp(s.stats.cohesion + 4);
      target.life.push({ year: s.year, text: '집으로 돌아옴' });
      log(s, target.name + ', 계절이 바뀌기 전에 집으로 돌아오다.', 'surprise-result');
    } else {
      s.stats.cohesion = clamp(s.stats.cohesion - 6);
      leave(target);
      log(
        s,
        target.name + '은(는) 돌아오지 않고 ' + target.region + '에 자리를 잡았습니다.',
        'surprise-result',
      );
    }
  }
}

// ── Civil exam and the road to the capital (과거시험 · 과거길) ─────────────────────

/** Sits the exam now and records the real odds and result for the result screen. */
export function takeExam(s: State, checks: AbilityCheck[], id?: string) {
  const p = id ? s.people[id] : examCandidate(s)!;
  const check: AbilityCheck = {
    actor: p.id,
    label: '과거시험',
    chance: examChance(s, p),
    success: false,
    factors: [
      { label: '개인 교육', value: p.education },
      { label: '개인 능력', value: p.ability },
      { label: '가문 교육', value: s.stats.education },
    ],
  };
  applySocialAction(s, 'exam', () => rand(s), p.id);
  check.success = societyState(s).examPassed;
  checks.push(check);
}

/** Resolves a road event. Returns true when the traveller died on the road. */
export function applyJourneyAction(
  s: State,
  action: JourneyAction,
  checks: AbilityCheck[],
): boolean {
  const trip = s.journey!,
    p = s.people[trip.candidate];
  const fatal = action === 'risk' && surpriseRoll(s, 22) < journeyRisk(s);
  if (action === 'risk')
    checks.push({
      actor: p.id,
      label: '과거길 돌파',
      chance: 1 - journeyRisk(s),
      success: !fatal,
      factors: [
        { label: '개인 능력', value: p.ability },
        { label: '개인 건강', value: p.health },
      ],
    });
  if (action === 'return') {
    p.life.push({ year: s.year, text: '험한 과거길에서 귀환하여 다음 기약을 남김' });
    log(
      s,
      `${withParticle(p.name, '은/는')} 이번 과거를 포기하고 무사히 집으로 돌아왔습니다. 이미 쓴 준비비는 돌아오지 않습니다.`,
      'journey',
    );
  } else if (fatal) {
    die(s, p, trip.id.slice('journey-'.length) as DeathCause);
    retireOffice(s);
    checkSuccession(s);
    delete s.journey;
    return true;
  } else {
    const text =
      action === 'escort'
        ? `위험을 피해 ${examCapital(s.year)}에 무사히 도착했습니다.`
        : journeyText(trip.id, s.year).survived;
    p.life.push({ year: s.year, text });
    log(s, `${p.name}, ${text}`, 'journey');
    takeExam(s, checks, p.id);
  }
  delete s.journey;
  return false;
}
