import {useEffect,useRef,type ReactNode} from 'react';
import type {State} from './engine';
import {Avatar} from './game-panels';

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

export function FirstChoiceGuide({s}:{s:State}){
 if(s.report||s.phase!=='play')return null;
 const person=s.people[s.head];
 return <div className="first-choice-guide">
  <Avatar person={person} size={42}/>
  <div><strong>{person.name}{s.turn<3?`의 ${['첫 번째','두 번째','세 번째'][s.turn]} 선택`:''}</strong>
   <p>{s.turn===0?'아래에서 하나를 눌러 첫 이야기를 시작하세요.':s.turn<3?'선택 하나가 끝나면, 가족에게 생긴 일을 읽어보세요.':`${s.year-person.born}세 · ${person.job} · ${person.region}`}</p>
  </div><span aria-hidden="true">↓</span>
 </div>;
}
