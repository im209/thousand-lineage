import type {Person, State} from './engine';
import {PixelAvatar} from './pixel-avatar';
import {featuredMemory} from './family-memory';

const memoryLabels = {birth:'새 이름이 기록되었습니다', marriage:'두 사람의 이야기가 만났습니다', farewell:'한 사람의 삶을 기억합니다', growth:'스스로의 길을 시작합니다'};

export function MemorySpotlight({s,onPerson}:{s:State;onPerson:(p:Person)=>void}) {
  const memory = featuredMemory(s);
  if (!memory) return null;
  return <section className={`memory-spotlight memory-${memory.kind}`} aria-label="가족의 중요한 순간">
    <div className="memory-portraits">{memory.people.map(p => <button key={p.id} onClick={() => onPerson(p)} aria-label={`${p.name}의 생애 보기`}>
      <PixelAvatar person={p} size={64}/><span>{p.name}</span>
    </button>)}</div>
    <div className="memory-copy"><span className="memory-label">{memory.year}년 · {memoryLabels[memory.kind]}</span><h3>{memory.text}</h3>
      <p>{memory.kind==='birth'?'이 작은 이름도 가문의 연대기에 남았습니다.':memory.kind==='marriage'?'서로 다른 가문에서 온 두 사람의 인연이 기록에 남았습니다.':memory.kind==='farewell'?'함께한 시간은 가족의 기록에 남습니다.':'가족의 품에서 자라, 스스로의 길을 시작했던 순간입니다.'}</p>
      <small>초상을 누르면 이 사람의 기록을 볼 수 있어요.</small>
    </div>
  </section>;
}

export function RepresentativeMemory({s,onPerson}:{s:State;onPerson:(p:Person)=>void}) {
  const p = s.people[s.head];
  const children = p.children.map(id => s.people[id]).filter(Boolean);
  const living = children.filter(child => child.alive).length;
  return <div className="representative-memory">
    <button className="memorial-portrait" onClick={() => onPerson(p)} aria-label={`${p.name}의 생애 보기`}><PixelAvatar person={p} size={80}/></button>
    <div><span className="memory-label">이전 장의 주인공</span><h3>{p.name}</h3><p>{p.born}–{p.died??s.year}년 · {p.sex==='여'?'여성':'남성'} · {p.job}</p>
      <p>{children.length ? `자녀 ${children.length}명의 이름을 남겼습니다. 그중 ${living}명이 살아 있습니다.` : '이 사람의 발자취가 가문의 기록에 남았습니다.'}</p>
      <button className="text-button" onClick={() => onPerson(p)}>함께한 삶 돌아보기 ↗</button>
    </div>
  </div>;
}
