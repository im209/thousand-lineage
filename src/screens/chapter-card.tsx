import { chapterEnding, chapterOf, chapterSummary, type State } from '../engine';

/** Shown when an era closes: what the family lived through, and the era that comes next. */
export function ChapterCard({ s, onContinue }: { s: State; onContinue: () => void }) {
  const closed = chapterEnding(s.chapterEnd ?? s.year);
  if (!closed) return null;
  const next = chapterOf(closed.to);
  const result = chapterSummary(s, closed);
  const head = s.people[s.head];
  return (
    <div className="event ending chapter-end">
      <p className="eyebrow">
        한 시대가 저물다 · {closed.from}–{closed.to}년
      </p>
      <h2>
        {closed.title},
        <br />
        <em>{result.years}년</em>을 건넜습니다.
      </h2>
      <p>
        {head.alive
          ? `${head.name}의 가족이 다음 시대의 문 앞에 섰습니다.`
          : '남은 가족이 다음 시대의 문 앞에 섰습니다.'}
      </p>
      <div className="result-grid">
        <div>
          <b>{result.heads}명</b>이 시대의 대표
        </div>
        <div>
          <b>{result.born}명</b>태어난 후손
        </div>
        <div>
          <b>{result.died}명</b>떠나보낸 가족
        </div>
        <div>
          <b>{result.living}명</b>살아 있는 후손
        </div>
      </div>
      {next && (
        <p>
          다음 시대 · <b>{next.title}</b> ({next.from}–{next.to}년)
        </p>
      )}
      <div className="actions">
        <button className="primary" onClick={onContinue}>
          다음 시대로 →
        </button>
      </div>
      <p className="tiny">여기서 쉬어 가도 돼요. 자동 저장됩니다.</p>
    </div>
  );
}
