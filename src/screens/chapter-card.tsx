import { chapterEnding, chapterOf, chapterSummary, type State } from '../engine';
import { recordedEraEnding, type RunRecords } from '../records';

/** Shown when an era closes: what the family lived through, and the era that comes next. */
export function ChapterCard({
  s,
  records,
  onContinue,
  onShowEndings,
}: {
  s: State;
  records: RunRecords;
  onContinue: () => void;
  onShowEndings: () => void;
}) {
  const closed = chapterEnding(s.chapterEnd ?? s.year);
  if (!closed) return null;
  const next = chapterOf(closed.to);
  const result = chapterSummary(s, closed);
  const head = s.people[s.head];
  const ending = recordedEraEnding(s, records);
  const lives = (s.lives ?? []).filter(l => l.to > closed.from && l.to <= closed.to);
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
      <span className="ending-badge">이 시대의 결말 · {ending.title}</span>
      <p className="ending-description">{ending.description}</p>
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
      {lives.length > 0 && (
        <ul className="era-lives" aria-label="이 시대를 산 사람들">
          {lives.map(l => (
            <li key={l.id}>
              <b>{s.people[l.id].name}</b>
              <span>{l.title}</span>
            </li>
          ))}
        </ul>
      )}
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
      <button className="ending-gallery-link" onClick={onShowEndings}>
        결말 도감에 기록됨 · 보러 가기 ↗
      </button>
      <p className="tiny">여기서 쉬어 가도 돼요. 자동 저장됩니다.</p>
    </div>
  );
}
