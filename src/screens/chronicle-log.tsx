import type { State } from '../engine';

const sourceNotes = new Map([
  ['history', '실제 역사 배경 · 가족의 대응은 허구'],
  ['alternate', '대체역사 · 창작 사건'],
  ['chronicle', '조선의 삶 · 사료에서 착안한 창작 사건'],
  ['society', '신분·관직 · 제도를 단순화한 창작 사건'],
  ['surprise', '돌발 사건 · 가상 가족의 기록'],
  ['surprise-result', '돌발 사건 · 가상 가족의 기록'],
]);

function download(name: string, body: Blob) {
  const url = URL.createObjectURL(body);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The full family chronicle, newest first, with a JSON export. */
export function ChronicleLog({ s }: { s: State }) {
  return (
    <section className="chronicle">
      <div className="section-top">
        <div>
          <p className="eyebrow">THE FAMILY CHRONICLE</p>
          <h2>우리 가족이 지나온 시간</h2>
        </div>
        <button
          onClick={() =>
            download(
              '천년가문-연대기.json',
              new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }),
            )
          }
        >
          기록 내보내기 ↓
        </button>
      </div>
      {s.log
        .slice()
        .reverse()
        .map((l, i) => (
          <article key={i}>
            <time>{l.year}</time>
            <p>
              {l.text}
              <small>{sourceNotes.get(l.kind) ?? '가상 가족의 기록'}</small>
            </p>
          </article>
        ))}
    </section>
  );
}

/** The last three log lines under the story. */
export function RecentLog({ s, onOpenChronicle }: { s: State; onOpenChronicle: () => void }) {
  return (
    <div className="recent">
      <div className="section-top">
        <p className="eyebrow">방금 기록된 이야기</p>
        <button onClick={onOpenChronicle}>전체 연대기 ↗</button>
      </div>
      {s.log
        .slice(-3)
        .reverse()
        .map((l, i) => (
          <p key={i}>
            <b>{l.year}</b>
            {l.text}
          </p>
        ))}
    </div>
  );
}
