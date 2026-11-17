import { motion } from 'motion/react';
import {
  choiceAvailable,
  choiceCost,
  choiceLockReason,
  currentEvent,
  projectMatches,
  projectProgress,
  projectState,
  projects,
  turnYears,
  type State,
} from '../engine';
import { ActiveGoal } from '../growth-guide';
import { JourneyScene } from '../journey-scene';

const kindLabels: Record<string, string> = {
  surprise: '돌발 사건',
  history: '시대의 전환',
  chronicle: '조선의 삶',
  society: '신분과 관직',
  alternate: '대체역사 분기',
};

/** The current event and its choices. */
export function EventCard({ s, onChoose }: { s: State; onChoose: (index: number) => void }) {
  const event = currentEvent(s);
  const surprise = event.kind === 'surprise';
  const years = turnYears(s);
  return (
    <motion.div
      key={`${s.event}-${s.turn}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`event ${s.journey ? 'journey-event' : surprise ? 'surprise-event' : ''}`}
    >
      {surprise && !s.journey && (
        <div className="surprise-alert" aria-hidden="true">
          !
        </div>
      )}
      <p className="eyebrow">
        {s.journey ? '과거길의 돌발 사건' : (kindLabels[event.kind] ?? '가족의 일상')} · {s.year}년
      </p>
      <h2>{event.title}</h2>
      <p className="event-description">{event.description}</p>
      {s.journey && <JourneyScene s={s} />}
      <ActiveGoal s={s} />
      <div className="ink-divider">◆</div>
      <p className="question">
        {surprise
          ? '지금 바로 대처해야 합니다. 어떻게 할까요?'
          : '당신의 가족은 어떤 길을 택할까요?'}
      </p>
      {event.choices.map((c, i) => {
        const available = choiceAvailable(s, i);
        const lockReason = choiceLockReason(s, i);
        const cost = choiceCost(s, i);
        return (
          <button className="choice" key={i} disabled={!available} onClick={() => onChoose(i)}>
            <span className="choice-index">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <strong>{c.title}</strong>
              <small>{c.description}</small>
              {c.chanceLabel && <small className="chance-label">{c.chanceLabel}</small>}
              {(c.socialAction || c.chronicleAction) && lockReason && (
                <small className="lock-reason">잠김 · {lockReason}</small>
              )}
              {c.unlock && (
                <small className="unlock-hint">
                  {available
                    ? '✦ 유산으로 열린 선택'
                    : `잠김 · ${projects.find(p => p.id === c.unlock)?.title} 완성 필요`}
                </small>
              )}
              {projectMatches(s, c) && available && (
                <small className="project-hint">
                  {projectProgress(s, projectState(s).active!) < 3
                    ? '가문 과업 진행 +1'
                    : '과업 선택 완료 · 능력 조건을 채워주세요'}
                </small>
              )}
              {available && !!c.effects.wealth && cost <= s.stats.wealth && (
                <small className="balance-preview">
                  재산 {Math.round(s.stats.wealth)} →{' '}
                  {Math.round(
                    Math.min(
                      100,
                      s.stats.wealth + (c.effects.wealth > 0 ? c.effects.wealth : -cost),
                    ),
                  )}
                  섬
                </small>
              )}
              {available && cost > s.stats.wealth && (
                <small className="borrow-label">
                  가진 재산 {s.stats.wealth.toFixed(1)} · 모자란{' '}
                  {(cost - s.stats.wealth).toFixed(1)}은 빚으로 (해마다 1%씩 늘어요)
                </small>
              )}
            </span>
            <span>→</span>
          </button>
        );
      })}
      <p className="tiny">
        {s.journey ? (
          '사건을 먼저 해결합니다. 길 위에서 사망하면 시간이 더 흐르지 않으며, 생존 시 최대 3년을 진행합니다.'
        ) : (
          <>
            이번 선택 후 {years.min === years.max ? years.min : `${years.min}–${years.max}`}년을
            진행합니다. 역사 사건과 계승 시점에는 멈춥니다.
            {s.turn >= 3 && (
              <>
                <br />
                출생·혼인·사망은 가족의 나이와 상태에 따른 게임 확률로 결정됩니다. 재산이 부족하면
                표시된 금액을 빌립니다.
              </>
            )}
          </>
        )}
      </p>
    </motion.div>
  );
}
