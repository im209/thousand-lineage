import {useState} from 'react';
import type {State} from './engine';
import {chronicles,chronicleState,chronicleAvailability,type ArcId} from './chronicles';
import {endings,eligibleEndings,type EndingId} from './endings';
import {recordedEndingFor,type RunRecords} from './records';

const motifs:Record<ArcId,string>={archives:'書',care:'惠',trade:'市',war:'安',justice:'和',craft:'工'};
export function ChronicleSummary({s,onOpen}:{s:State;onOpen:()=>void}){
 const state=chronicleState(s),arc=chronicles.find(a=>a.id===(state.active?.arc??state.selected));
 return <button className="chronicle-summary" onClick={onOpen}><span className="chronicle-emblem">{arc?motifs[arc.id]:'路'}</span><span><small>{arc?state.active?'준비를 마친 가문의 이야기':'다음에 시작할 이야기':'조선의 삶 · 여섯 갈래의 이야기'}</small><strong>{arc?arc.title:s.year>=1894?'지난 시대에 남긴 발자취':'곳간을 열고, 책을 지키고, 새 길을 찾다'}</strong></span><b>{state.completed.length} / 12 <i>↗</i></b></button>;
}

export function ChroniclePanel({s,onSelect,onReturn}:{s:State;onSelect:(id:ArcId)=>void;onReturn:()=>void}){
 const state=chronicleState(s),editable=s.phase==='play'&&!s.report;
 const active=chronicles.find(a=>a.id===(state.active?.arc??state.selected));
 return <section className="life-panel" aria-label="조선의 삶">
  <div className="life-panel-heading"><div><p className="eyebrow">권력 밖에도, 가문의 이야기는 있습니다</p><h2>무엇을 남기는<br/>가문이 될까요?</h2><p>어려운 날에 곳간을 열고, 흩어질 책을 지켜내고.<br/>준비한 일을 다음 선택으로 완수해 가문의 결말을 바꿔보세요.</p></div><div className="life-counter"><b>{state.completed.length}<small> / 12</small></b><span>완수한 삶의 갈래</span></div></div>
  <ol className="life-steps"><li><b>1</b><span>이야기를 고르고</span></li><li><b>2</b><span>자원을 들여 준비하고</span></li><li><b>3</b><span>후속 결정으로 완수하기</span></li></ol>
  {active&&<div className="active-chronicle" role="status"><span>{state.active?'준비 완료 · 후속 결정 대기':'선택한 이야기'}</span><strong>{active.title}</strong><p>{state.active?`${state.active.startedYear}년에 시작한 준비를 이어갑니다. 다른 갈래는 이 일을 마치거나 정리한 뒤 시작할 수 있습니다.`:'현재 사건을 마치면 준비 사건이 이어집니다. 아직 비용을 쓰거나 성취를 얻은 것은 아닙니다.'}</p><button onClick={onReturn}>이야기에서 계속하기 →</button></div>}
  {s.year>=1894&&<p className="life-period-note">근대에 들어 새 조선 이야기는 시작할 수 없습니다. 완수한 성취는 후손에게 남아 최종 결말에 반영됩니다.</p>}
  {!editable&&<p className="life-period-note">{s.phase==='ended'?'이 가문의 이야기가 끝났습니다. 다음 가문에서 다른 길을 걸어보세요.':'선택 결과를 확인하고 대표 계승을 마친 뒤 새로운 이야기를 고를 수 있습니다.'}</p>}
  <div className="life-cards">{chronicles.map((arc,i)=>{
   const reason=chronicleAvailability(s,arc.id),selected=state.selected===arc.id||state.active?.arc===arc.id;
   const finished=arc.outcomes.every(o=>state.completed.includes(o.id));
   return <article className={`life-card ${arc.id} ${selected?'selected':''}`} key={arc.id}>
    <div className="life-card-top"><span className="life-motif" aria-hidden="true">{motifs[arc.id]}</span><span>{String(i+1).padStart(2,'0')} · {arc.min}–{arc.max}년</span></div>
    <h3>{arc.title}</h3><p>{arc.description}</p>
    <div className="life-outcomes">{arc.outcomes.map(o=><span key={o.id} className={state.completed.includes(o.id)?'done':''}>{state.completed.includes(o.id)?'✓':'◇'} {o.title}</span>)}</div>
    <small className="life-cost">준비 비용 · 재산 {arc.preparationCost}점</small>
    <button disabled={!editable||!!reason||selected} onClick={()=>onSelect(arc.id)} aria-pressed={selected}>{finished?'두 갈래 모두 완수':selected?state.active?'후속 결정을 기다리는 중':'다음 이야기로 선택됨':reason??'이 이야기 준비하기 →'}</button>
   </article>;
  })}</div>
  <p className="life-rule">각 이야기의 두 결말은 따로 준비해 완수할 수 있습니다. 한 번 얻은 성취는 중복 보상되지 않으며 대표가 바뀌어도 이어집니다. 역사 사건·유배·부채 위기가 먼저 진행될 수 있고, 시대가 끝나면 미완의 준비는 정리됩니다.</p>
  {state.history.length>0&&<div className="life-achievements"><h3>가문이 남긴 일</h3>{state.history.slice().reverse().map(h=>{const arc=chronicles.find(a=>a.id===h.arc)!,outcome=arc.outcomes.find(o=>o.id===h.outcome)!;return <article key={h.outcome}><time>{h.year}</time><div><strong>{outcome.title}</strong><small>{h.actor?s.people[h.actor]?.name+'의 세대':'가족 공동의 성취'} · {arc.title}</small></div><span>완수 ✓</span></article>})}</div>}
  <details className="life-sources"><summary>이 이야기의 역사적 배경</summary><p>사료 속 생활과 제도에서 착안한 가상 가문의 사건입니다. 자원·보상과 3년 단위 진행은 게임 규칙이며, 실제 인물의 공적을 플레이어 가문에 부여하지 않습니다. 장시 경로는 1500년, 전란·복구 경로는 1592–1660년으로 제한했습니다.</p><p>조선 초기에는 여성도 상속에 참여했습니다. 상속 관행은 시대와 집안마다 달랐으며, 여성의 재산권이나 민원을 조선 내내 금지된 것으로 다루지 않습니다. 분재 이야기는 문서와 가족 합의에 관한 사건이며, 기본 상속 계산은 균등 분배로 단순화되어 있습니다.</p><div>{chronicles.map(a=><a key={a.id} href={a.source} target="_blank" rel="noreferrer">{a.title} · 자료 ↗</a>)}</div></details>
  <button className="primary" onClick={onReturn}>이야기로 돌아가기 →</button>
 </section>;
}

export function EndingCatalog({records,s,error=''}:{records:RunRecords;s?:State;error?:string}){
 const [discoveredOnly,setDiscoveredOnly]=useState(false);
 const collected=records.endings??[],current=s?.phase==='ended'?recordedEndingFor(s,records).id:undefined;
 const revealed=[...collected].reverse().flatMap(id=>endings.filter(e=>e.id===id));
 const hiddenCount=endings.length-revealed.length;
 return <section className="ending-gallery" aria-label="가문 결말 도감">
  <div className="gallery-heading"><div><p className="eyebrow">가문이 걸어간 길만, 이곳에 남습니다</p><h2>{endings.length}가지 가문의 결말</h2><p>아직 만나지 않은 결말은 비밀입니다.<br/>한 가문의 이야기를 끝낼 때마다, 새로운 기록이 펼쳐집니다.</p></div><div className="gallery-count"><b>{revealed.length}<small> / {endings.length}</small></b><span>발견한 결말</span></div></div>
  <progress aria-label="결말 수집 진행" value={revealed.length} max={endings.length}/>
  <div className="gallery-controls"><p className="gallery-discovery-note">{revealed.length?`발견한 이야기 ${revealed.length}개 · 아직 남은 이야기 ${hiddenCount}개`:'첫 번째 가문은 어떤 기록을 남기게 될까요?'}</p><label><input type="checkbox" checked={discoveredOnly} onChange={e=>setDiscoveredOnly(e.target.checked)}/> 발견한 결말만</label></div>
  {error&&<p className="save-warning" role="alert">{error}</p>}
  <div className="ending-cards">{revealed.map(e=><article key={e.id} className={`ending-card discovered ${current===e.id?'current':''}`} data-ending-id={e.id}><div><small>{e.category}</small><span>{current===e.id?'이번 결말':'발견 ✓'}</span></div><h3>{e.title}</h3><p>{e.description}</p><footer><b>이 가문이 남긴 발자취</b><span>{e.requirement}</span></footer></article>)}
   {!discoveredOnly&&Array.from({length:hiddenCount},(_,i)=><article key={`unknown-${i}`} className="ending-card locked" aria-label="미발견 결말"><div><small>아직 펼치지 않은 기록</small><span>미발견</span></div><b className="ending-mystery" aria-hidden="true">?</b><h3>아직 밝혀지지 않은 결말</h3><p>가문의 삶을 이어가며<br/>이 페이지에 남을 이야기를 만나보세요.</p></article>)}
  </div>
  {discoveredOnly&&!revealed.length&&<p className="gallery-empty">아직 발견한 결말이 없습니다. 한 가문의 이야기를 끝내면 첫 기록이 펼쳐집니다.</p>}
  <p className="life-rule">한 판에서 얻은 대표 결말 하나가 공개됩니다. 발견한 기록은 새 가문을 시작해도 이 브라우저에 남습니다.</p>
 </section>;
}

export function EarnedEndings({s,records}:{s:State;records:RunRecords}){
 const primary:EndingId=recordedEndingFor(s,records).id,others=eligibleEndings(s).filter(e=>e.id!==primary&&records.endings.includes(e.id));
 if(!others.length)return null;
 return <div className="ending-companions"><b>이번 가문이 함께 남긴 성취</b><div>{others.map(e=><span key={e.id}>{e.title}</span>)}</div></div>;
}
