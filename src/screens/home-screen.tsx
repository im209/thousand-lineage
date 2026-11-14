import { HeroScene } from '../game-panels';
import { RecordShelf } from '../progression-panels';
import type { RunRecords } from '../records';

export function HomeScreen({
  hasGame,
  records,
  recordError,
  onSetup,
  onContinue,
}: {
  hasGame: boolean;
  records: RunRecords;
  recordError: string;
  onSetup: () => void;
  onContinue: () => void;
}) {
  return (
    <main className="landing">
      <div className="intro">
        <p className="eyebrow">1392년, 당신의 첫 번째 봄</p>
        <h1>
          작은 선택 하나,
          <br />
          오래 이어질
          <br />
          <em>우리의 이야기.</em>
        </h1>
        <p className="lead">
          누군가는 땅을 일구고, 누군가는 글을 배웁니다.
          <br />
          서로를 만나 가족이 되고, 다음 사람에게 삶을 건넵니다.
          <br />
          <b>당신의 가문은 어떤 이야기로 남을까요?</b>
        </p>
        <div className="actions">
          <button className="primary" onClick={onSetup}>
            새로운 가문 시작하기 <span>↗</span>
          </button>
          {hasGame && <button onClick={onContinue}>기록 이어가기 →</button>}
        </div>
        <p className="tiny">설치 없이 플레이 · 자동 저장 · 가상의 가족 이야기</p>
      </div>
      <HeroScene />
      <ol className="how-to-play" aria-label="플레이 방법">
        <li>
          <b>1</b>
          <span>
            <strong>성씨를 고른다</strong>내 성씨·본관, 또는 랜덤 가문
          </span>
        </li>
        <li>
          <b>2</b>
          <span>
            <strong>시대마다 하나를 선택한다</strong>생업·배움·혼인으로 가족의 삶이 달라져요
          </span>
        </li>
        <li>
          <b>3</b>
          <span>
            <strong>대가 끊기지 않게 지킨다</strong>후손이 2026년까지 살아남으면 성공
          </span>
        </li>
      </ol>
      <RecordShelf records={records} error={recordError} />
    </main>
  );
}
