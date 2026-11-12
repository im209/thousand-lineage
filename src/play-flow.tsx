import {useEffect,useRef,type ReactNode} from 'react';
import type {State,Person} from './engine';
import {Avatar} from './game-panels';
import {closeFamily} from './family-memory';

export function StoryStage({s,children}:{s:State;children:ReactNode}){
 const stage=useRef<HTMLDivElement>(null);
 const isReport=!!s.report;
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   stage.current?.focus({preventScroll:true});
   if(s.turn===0&&!isReport)window.scrollTo(0,0);
   else stage.current?.scrollIntoView({block:'start',behavior:'instant'});
  });
  return()=>cancelAnimationFrame(frame);
 },[s.turn,isReport,s.phase,s.head]);
 return <div ref={stage} className="story-stage" tabIndex={-1} aria-label="현재 이야기">{children}</div>;
}

export function FirstChoiceGuide({s,onPerson}:{s:State;onPerson:(p:Person)=>void}){
 if(s.report||s.phase!=='play')return null;
 const person=s.people[s.head];
 const family=closeFamily(s).filter(p=>p.id!==s.head);
 return <div className="first-choice-guide">
  <button className="guide-portrait" onClick={()=>onPerson(person)} aria-label={`${person.name}의 생애 보기`}><Avatar person={person} size={42}/></button>
  <div className="guide-person"><strong>{person.name}{s.turn<3?`의 ${['첫 번째','두 번째','세 번째'][s.turn]} 선택`:''}</strong>
   <p><span className="representative-sex">{person.sex==='남'?'남성':'여성'}</span> · {s.turn===0?<>목표는 하나, <b>후손이 끊기지 않게</b> 가문을 잇는 것. 아래에서 하나를 골라보세요.</>:s.turn<3?'선택 하나가 끝나면, 가족에게 생긴 일을 읽어보세요.':`${s.year-person.born}세 · ${person.job} · ${person.region}`}</p>
  </div>{s.turn>=3&&family.length>0?<div className="guide-family" aria-label="대표의 가까운 가족">{family.slice(0,3).map(p=><button key={p.id} onClick={()=>onPerson(p)} aria-label={`${p.name}의 생애 보기`}><Avatar person={p} size={32}/><span>{p.name}<small>{person.spouses.includes(p.id)?'배우자':'자녀'} · {s.year-p.born}세</small></span></button>)}{family.length>3&&<small className="guide-family-more">외 {family.length-3}명</small>}</div>:<span aria-hidden="true">↓</span>}
 </div>;
}
