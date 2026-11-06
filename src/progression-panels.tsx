import {useState} from 'react';
import {labels} from './data';
import {projects,projectState,projectProgress,projectComplete,type ProjectId,type State} from './engine';
import type {RunRecords} from './records';
import {endings} from './endings';

export function ProjectBoard({s,onSelect}:{s:State;onSelect:(id:ProjectId)=>void}){
 const [open,setOpen]=useState(false);
 const state=projectState(s),active=projects.find(p=>p.id===state.active);
 const editable=s.phase==='play'&&!s.report;
 const showOptions=editable&&(open||(!active&&state.completed.length<projects.length));
 return <section className={`project-board ${active?'has-active':''}`} aria-label="가문 과업">
  <div className="project-heading"><div><span className="eyebrow">가문이 함께 만드는 것</span><h3>{active?active.title:state.completed.length===3?'세 가지 유산을 남긴 가문':'이번 가문의 목표를 정해보세요'}</h3></div><span className="project-count">완성 {state.completed.length} / 3</span></div>
  {active&&<><div className="project-progress"><div className="project-steps" aria-label={`선택 진행 ${projectProgress(s,active.id)} / 3`}>{[1,2,3].map(n=><i key={n} className={projectProgress(s,active.id)>=n?'done':''}>{projectProgress(s,active.id)>=n?'✓':n}</i>)}</div><span>관련 선택 {projectProgress(s,active.id)} / 3 · {labels[active.stat]} {Math.round(s.stats[active.stat])} / {active.threshold}</span></div><p className="project-reward"><b>완성하면</b> {active.reward}</p>{editable&&<button className="project-switch" onClick={()=>setOpen(!open)}>{open?'과업 목록 접기':'다른 과업 보기'} ↗</button>}</>}
  {!active&&state.completed.length<3&&!editable&&<p className="project-reward">다음 이야기에서 새로운 과업을 선택할 수 있습니다.</p>}
  {showOptions&&<><p className="project-intro">선택을 쌓아 유산을 완성하세요. 완성한 유산은 특별 선택을 열어줍니다.</p><div className="project-options">{projects.map(p=><button key={p.id} disabled={projectComplete(s,p.id)} aria-pressed={state.active===p.id} className={`project-option ${p.id}`} onClick={()=>{onSelect(p.id);setOpen(false)}}><span>{projectComplete(s,p.id)?'완성 ✓':p.id==='learning'?'배움':p.id==='trade'?'상업':'돌봄'}</span><strong>{p.title}</strong><small>{p.requirement}</small><p>{p.reward}</p><b>{projectComplete(s,p.id)?'특별 선택 해금됨':state.active===p.id?'진행 중':'이 과업 시작 →'}</b></button>)}</div></>}
  {state.completed.length>0&&<div className="earned-projects">{projects.filter(p=>state.completed.includes(p.id)).map(p=><span key={p.id}>✦ {p.title}</span>)}</div>}
 </section>;
}

export function RecordShelf({records,error,compact=false}:{records:RunRecords;error:string;compact?:boolean}){
 if(!records.recent.length&&!error)return null;
 return <section className={`record-shelf ${compact?'compact':''}`} aria-label="나의 가문 기록"><div><span className="eyebrow">이 브라우저에 남긴 기록</span><h3>다음 이야기의 목표</h3></div><div className="record-numbers"><span><b>{records.bestYears}</b>최고 생존 연수</span><span><b>{records.bestGenerations}</b>최고 계보 세대</span><span><b>{records.projects.length} / 3</b>수집한 가문 유산</span><span><b>{(records.endings??[]).length} / {endings.length}</b>발견한 가문 결말</span></div>{!compact&&<p>완료한 최근 {records.recent.length}개 이야기를 보관합니다. 새 가문을 시작해도 최고 기록은 남습니다.</p>}{error&&<p role="alert">{error}</p>}</section>;
}

export function FamilyOutlook({s}:{s:State}){
 if(s.phase!=='play'||s.report)return null;
 const living=Object.values(s.people).filter(p=>p.alive&&p.lineage),head=s.people[s.head];
 const heirs=living.filter(p=>p.id!==s.head);
 let text='';
 if(!heirs.length&&s.year-head.born>=40)text='아직 이어갈 후손이 없습니다. 돌봄 과업은 살아 있는 가족의 건강을 높입니다. 혼인과 출생은 보장되지 않습니다.';
 else if(s.debt>=25)text=`부채 ${s.debt.toFixed(1)}점이 살림을 압박하고 있습니다. 빚을 정리하는 사건에서 자원 일부를 희생해 부담을 줄일 수 있습니다.`;
 else if(s.stats.health<35)text='생활환경이 나빠졌습니다. 집과 돌봄에 투자하면 가족의 생존 환경을 개선할 수 있습니다.';
 if(!text)return null;
 return <p className="family-outlook"><b>지금 살펴볼 일</b>{text}</p>;
}
