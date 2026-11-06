import {useEffect,useRef} from 'react';
import {clans,labels,type Stat} from './data';
import {societyState,type State} from './engine';
import {Avatar} from './game-panels';
import {AssignedBackground} from './society-panels';

const openingHints={
 commoner:'농사와 생업으로 삶을 꾸립니다. 배움과 이웃의 신뢰를 쌓으면 더 넓은 길이 열립니다.',
 specialist:'기술과 실무를 익혀 온 집안입니다. 전문성을 쌓아 관청의 일을 맡는 길에 도전할 수 있습니다.',
 yangban:'배움과 가문의 평판을 물려받았습니다. 관직과 권력은 앞으로 직접 얻어야 합니다.',
 nobi:'예속된 신분에서 출발합니다. 재산과 사람들의 도움을 모아 면천을 이루는 것이 첫 도전입니다.',
};

export function FounderIntro({s,onBegin,error,saved}:{s:State;onBegin:()=>void;error:string;saved:boolean}){
 const founder=s.people[s.founder],title=useRef<HTMLHeadingElement>(null),origin=societyState(s).origin;
 useEffect(()=>{window.scrollTo(0,0);title.current?.focus({preventScroll:true})},[]);
 return <main className="founder-screen"><section className="founder-intro" aria-label="가문의 첫 인물">
  <ol className="founder-steps" aria-label="가문 시작 단계"><li className="done">✓ 가문 선택</li><li className="current" aria-current="step">02 첫 인물 확인</li><li>03 첫 번째 선택</li></ol>
  <div className="founder-heading"><p className="eyebrow">첫 장을 펼치기 전에</p><h2>당신의 가문은<br/>이 사람에게서 시작됩니다.</h2><p>이름과 삶의 자리가 정해졌습니다.<br/>어떤 사람이 당신의 가문을 시작하는지 만나보세요.</p></div>
  <div className="founder-layout"><div className="founder-person">
   <div className="founder-portrait"><span>1392</span><Avatar person={founder} size={142}/><small>가문의 첫 번째 인물</small></div>
   <p className="founder-clan">{clans[s.clan].label}</p><h1 ref={title} tabIndex={-1}>{founder.name}</h1>
   <p className="founder-bio">{s.year-founder.born}세 · {founder.sex==='여'?'여성':'남성'} · {founder.born}년생 · 미혼</p>
   <dl className="founder-facts"><div><dt>살고 있는 곳</dt><dd>{founder.region}</dd></div><div><dt>지금의 생업</dt><dd>{founder.job}</dd></div><div><dt>타고난 성향</dt><dd>{founder.trait}</dd></div></dl>
   <p className="founder-person-note">아직 혼인하지 않은 한 사람.<br/>이 작은 시작에서 가족의 이야기가 이어집니다.</p>
  </div><div className="founder-details">
   <AssignedBackground s={s}/>
  </div></div>
  <div className="founder-begin"><p><b>이 사람과 첫 선택을 해볼까요?</b><span>처음에는 생업과 가족 이야기부터 시작합니다.</span></p><button className="primary" onClick={onBegin}>이 인물로 시작하기 →</button><small>{saved?'이 인물과 출발 조건을 저장했습니다.':'저장 상태를 확인해 주세요.'}</small></div>
  <details className="founder-extra"><summary>출발 능력치와 이 신분의 가능성 살펴보기</summary>
   <div className="founder-starting-point"><h3>이 출발점에서는</h3><p>{openingHints[origin]}</p></div>
   <div className="founder-stat-heading"><h3>가문의 출발 능력치</h3><span>0–100 기준</span></div>
   <dl className="founder-stats">{(Object.keys(labels) as Stat[]).map(key=><div key={key}><dt>{labels[key]}</dt><dd>{Math.round(s.stats[key])}</dd><i aria-hidden="true"><b style={{width:`${s.stats[key]}%`}}/></i></div>)}</dl>
  </details>
  {error&&<p className="save-warning" role="alert">{error}</p>}
 </section></main>;
}
