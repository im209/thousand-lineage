import {familyMemories} from './family-memory';
import type {State} from './engine';
import {PixelAvatar} from './pixel-avatar';
import {labels,type Stat} from './data';
import './result-reveal.css';

export function ResultReveal({s,revealed,onReveal}:{s:State;revealed:boolean;onReveal:()=>void}){
 const r=s.report!;const checks=r.checks??[];
 const death=familyMemories(s).some(e=>e.kind==='farewell'&&(e.cause||e.people.some(p=>p.id===s.head)));
 const title=death?'한 사람의 삶을 기억합니다':checks.length?checks.at(-1)!.success?'뜻을 이루었습니다':'뜻대로 되지 않았습니다':s.journey?'길 위에서 이야기가 멈췄습니다':'선택이 가족의 삶에 남았습니다';
 return <section className={`result-theatre ${revealed?'is-revealed':'is-revealing'} ${death?'is-farewell':''}`} aria-label="판정과 변화">
  <div className="reveal-stage" aria-hidden="true"><span className="reveal-paper">家</span><span className="reveal-trail">◆ · ◆ · ◆</span><span className="reveal-seal">{death?'記':checks.length?checks.at(-1)!.success?'成':'未':'錄'}</span></div>
  <div className="reveal-heading"><span>내 선택이 남긴 한 장면</span><strong>{title}</strong></div>
  {!revealed&&<button className="reveal-skip" onClick={onReveal}>연출 건너뛰기</button>}
  <div className="reveal-outcomes" hidden={!revealed}>
   {checks.map((check,i)=><article className={`ability-result ${check.success?'check-success':'check-failure'}`} key={i}>
    <PixelAvatar person={s.people[check.actor]} size={44}/><div><div className="ability-result-title"><b>{s.people[check.actor].name} · {check.label}</b><strong>{check.success?'성공':'실패'}</strong></div>
    <p>{check.factors.map(f=>`${f.label} ${Math.round(f.value)}`).join(' · ')}</p>
    <div className="ability-meter" aria-hidden="true"><span style={{width:`${check.chance*100}%`}}/></div><small>판정 당시 성공 확률 {check.label==='과거길 돌파'?100-Math.round((1-check.chance)*100):Math.round(check.chance*100)}% · 게임 확률</small></div>
   </article>)}
   {!checks.length&&<div className="reveal-deltas">{(Object.entries(r.immediate) as [Stat,number][]).filter(([,v])=>Math.abs(v)>=.5).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3).map(([key,value])=><span key={key}>{labels[key]} <b>{value>=0?'+':''}{value.toFixed(1)}</b></span>)}<small>{death?'가족의 기록과 남은 사람들을 확인해 주세요.':s.journey?'다음 화면에서 길 위의 위험에 대처합니다.':'선택 직후 변화 · 아래에서 그동안의 가족 이야기를 확인하세요.'}</small></div>}
  </div>
 </section>
}
