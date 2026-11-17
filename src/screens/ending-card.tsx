import { EarnedEndings } from '../chronicle-panels';
import { canContinueFuture, livingHeadTitle, summary, type State } from '../engine';
import { endings } from '../endings';
import { RecordShelf } from '../progression-panels';
import { recordedEndingFor, type RunRecords } from '../records';
import { ResultShare } from '../result-share';

/** The end of a run: the ending, the family's numbers, and what to do next. */
export function EndingCard({
  s,
  records,
  recordError,
  onShowEndings,
  onContinueFuture,
  onReplay,
  onNewStory,
}: {
  s: State;
  records: RunRecords;
  recordError: string;
  onShowEndings: () => void;
  onContinueFuture: () => void;
  onReplay: () => void;
  onNewStory: () => void;
}) {
  const result = summary(s);
  const ending = recordedEndingFor(s, records);
  const lives = s.lives ?? [];
  const nowTitle = livingHeadTitle(s);
  return (
    <div className="event ending">
      <p className="eyebrow">終章 · {ending.title}</p>
      <h2>
        당신의 가문은
        <br />
        <em>{result.years}년</em>을 이어왔습니다.
      </h2>
      <span className="ending-badge">{endings.length}가지 가문 결말 중 하나</span>
      <p className="ending-description">{ending.description}</p>
      <EarnedEndings s={s} records={records} />
      <p>
        {result.living
          ? '세상이 달라져도, 후손들의 삶은 계속됩니다.'
          : '남겨진 이름과 이야기를 이곳에 기록합니다.'}
      </p>
      <div className="result-grid">
        <div>
          <b>{result.generations}대</b>계보 세대
        </div>
        <div>
          <b>{result.people}명</b>기록된 인물
        </div>
        <div>
          <b>{result.living}명</b>생존 후손
        </div>
        <div>
          <b>{result.original}명</b>같은 성씨·본관의 생존 후손
        </div>
      </div>
      <p>
        최고 재산 지표: {s.peak.year}년 · {Math.round(s.peak.wealth)}
        <br />
        거주 기록: {s.moves.join(' → ')}
      </p>
      {(lives.length > 0 || nowTitle) && (
        <details className="lives-roll" open={lives.length <= 6}>
          <summary>이 가문을 이끈 사람들 · {lives.length + (nowTitle ? 1 : 0)}명</summary>
          <ul className="era-lives">
            {lives.map(l => (
              <li key={l.id}>
                <b>
                  {s.people[l.id].name}{' '}
                  <small>
                    {l.from}–{l.to}
                  </small>
                </b>
                <span>{l.title}</span>
              </li>
            ))}
            {nowTitle && (
              <li>
                <b>
                  {s.people[s.head].name} <small>지금의 대표</small>
                </b>
                <span>{nowTitle}</span>
              </li>
            )}
          </ul>
        </details>
      )}
      <button className="ending-gallery-link" onClick={onShowEndings}>
        발견한 결말 도감 보기 ↗
      </button>
      {canContinueFuture(s) && (
        <div className="future-continuation">
          <p>
            여기서 끝내지 않아도 괜찮아요.
            <br />
            지금까지의 결말은 도감에 남고, 같은 가족의 미래가 이어집니다.
          </p>
          <button className="primary" onClick={onContinueFuture}>
            이 가문으로 미래까지 이어가기 →
          </button>
          <small>연도 제한 없음 · 2026년 이후는 가상의 미래</small>
        </div>
      )}
      <RecordShelf records={records} error={recordError} compact />
      <ResultShare s={s} />
      <div className="replay-actions">
        <button onClick={onReplay}>같은 운명, 다른 선택으로 재도전 ↻</button>
      </div>
      <p className="replay-help">
        같은 가문·출발 신분·난수 시드로 시작합니다. 선택에 따라 이후 인물과 사건은 달라질 수
        있습니다.
      </p>
      <div className="actions">
        <button className="primary" onClick={onNewStory}>
          새로운 이야기 →
        </button>
      </div>
      <p className="tiny">실제 가문의 역사나 족보가 아닌 가상 시뮬레이션의 결과입니다.</p>
    </div>
  );
}
