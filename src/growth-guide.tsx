import {labels,type Stat} from './data';
import {projects,projectState,projectProgress,type ProjectId,type State} from './engine';
import {ProjectBoard} from './progression-panels';

const number=(value:number)=>Number(value.toFixed(1));
export function ActiveGoal({s}:{s:State}){
 const active=projects.find(p=>p.id===projectState(s).active);
 if(!active)return null;
 return <div className="active-goal" aria-label="현재 목표 진행"><b>{active.title}</b><span>관련 선택 {projectProgress(s,active.id)}/3 · {labels[active.stat]} {number(s.stats[active.stat])}/{active.threshold}</span></div>;
}

const statHelp:Record<Stat,string>={
 wealth:'선택의 비용을 지불하는 밑천입니다. 여유 재산은 빚의 자동 상환에도 쓰입니다.',
 stability:'높게 유지하면 해마다 가족의 생활환경이 조금씩 좋아집니다.',
 health:'같은 나이일 때 가족의 사망 위험을 낮춥니다. 개인 건강과 구별되는 공동 생활환경입니다.',
 education:'아이에게 물려줄 교육, 성년의 진로, 과거 합격 확률과 연간 재산 변화에 반영됩니다.',
 connections:'60 이상이면 ‘거래를 넓힐 기회’의 큰 거래 비용이 재산 8에서 3으로 줄어듭니다. 진로의 인맥 조건에도 쓰입니다.',
 cohesion:'출생 확률에 반영되고, 돌봄 과업의 완성 조건입니다. 혼인과 출생은 확률로 결정됩니다.',
 reputation:'시험 합격 후 관직을 구하거나 가문이 사회적으로 인정받을 때 필요한 조건입니다.',
 status:'사회 활동으로 쌓은 영향력의 기록입니다. 점수만으로 신분이나 관직이 바뀌지는 않습니다.',
};

export function GrowthGuide({s,onSelect,onDirections,onLives}:{s:State;onSelect:(id:ProjectId)=>void;onDirections:()=>void;onLives:()=>void}){
 const state=projectState(s),active=projects.find(p=>p.id===state.active);
 const suggested=projects.find(p=>p.id==='care'&&!state.completed.includes(p.id))??projects.find(p=>!state.completed.includes(p.id));
 const goal=active??suggested;
 return <section className="growth-guide" aria-label="가문의 목표와 성장 혜택">
  {goal?<><div className="growth-heading"><div><small>{active?'이번 가문에 남길 것':'작은 목표 하나부터'}</small><h3>{goal.title}</h3></div>{active&&<b>{projectProgress(s,goal.id)}/3</b>}</div>
   <p className="growth-payoff"><b>완성하면</b> {goal.reward}</p>
   <p className="growth-condition">{goal.requirement}{active?` · 현재 ${labels[goal.stat]} ${number(s.stats[goal.stat])}`:''}</p>
   {active?<p className="growth-tip">선택지의 ‘가문 과업 진행 +1’을 따라가세요. 관련 선택과 능력 조건을 모두 채우면 즉시 완성됩니다.</p>:<button className="goal-start" onClick={()=>onSelect(goal.id)}>{goal.title}을 목표로 →</button>}
  <details className="goal-picker"><summary>다른 목표 고르기</summary><ProjectBoard s={s} onSelect={onSelect} picker/></details>
  </>:<div className="growth-heading"><h3>세 가지 유산을 모두 남겼습니다</h3></div>}
  {(s.turn>=3||s.stats.connections>=60)&&<div className={`trade-benefit ${s.stats.connections>=60?'ready':''}`}><b>{s.stats.connections>=60?'쌓은 인맥이 혜택으로':'다음 생활 혜택 · 거래 신뢰'}</b><p>사회적 연결 <strong>{number(s.stats.connections)} / 60</strong> · 조건을 채우면 큰 거래 비용 <strong>8 → 3</strong></p><small>‘거래를 넓힐 기회’ 사건에서 적용됩니다.</small></div>}
  {s.turn>=3&&<details className="stat-benefits"><summary>스탯은 어디에 쓰이나요?</summary><dl>{(Object.keys(statHelp) as Stat[]).map(stat=><div key={stat}><dt>{labels[stat]} <b>{number(s.stats[stat])}</b></dt><dd>{statHelp[stat]}</dd></div>)}</dl></details>}
  {s.turn>=3&&<div className="growth-links"><span>가족의 기반이 생겼다면</span><button className="career-invitation" onClick={onDirections}>신분과 진로 살펴보기 ↗</button><button className="lives-invitation" onClick={onLives}>조선의 삶 살펴보기 ↗</button></div>}
 </section>;
}
