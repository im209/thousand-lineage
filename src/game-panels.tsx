import {ResultReveal} from './result-reveal';
import {useState,useEffect} from 'react';
import {PixelVillage} from './pixel-village';
import {MemorySpotlight,RepresentativeMemory} from './memory-panels';
import {featuredMemory,reportHeadline} from './family-memory';
import {withParticle} from './korean';
import {PixelAvatar} from './pixel-avatar';
import {labels,clans,type Stat} from './data';
import {candidates,relation,representativeNumber,type State,type Person} from './engine';
export function HeroScene(){return <div className="hero-scene village-frame"><div className="village-frame-top"><span>第一章 · 이야기의 시작</span><span>1392</span></div><PixelVillage/><div className="village-frame-bottom"><span className="village-seal" aria-hidden="true">家</span><div><b>작은 집에서, 긴 이야기가 시작됩니다.</b><p>한 사람의 선택이 다음 세대의 삶으로.</p></div><span className="village-spark" aria-hidden="true">✦</span></div></div>}
export function FamilyStrip({s,onPerson}:{s:State;onPerson:(p:Person)=>void}){const p=s.people[s.head];const family=[...(p.alive?[p]:[]),...[...p.spouses,...p.children].map(id=>s.people[id]).filter(p=>p.alive)].slice(0,5);return <div className="family-strip"><span>이번 이야기의 가족</span><div>{family.map(member=><button key={member.id} onClick={()=>onPerson(member)}><Avatar person={member} size={34}/><span>{member.name}<small>{s.year-member.born}세 · {member.sex==='남'?'남':'여'}</small></span></button>)}</div></div>}
export function Avatar({person,size=64}:{person:Person;size?:number}){return <PixelAvatar person={person} size={size}/>;}
export function QuickStats({s}:{s:State}){const living=Object.values(s.people).filter(p=>p.lineage&&p.alive);const next=candidates(s);return <div className="quick-stats"><div className="metric wealth"><span>◈ 재산</span><strong>{Math.round(s.stats.wealth)}<small>/ 100</small></strong><p>{s.debt>0?`부채 ${s.debt.toFixed(1)}점`:'새 선택의 밑천'}</p></div><div className="metric health"><span>✦ 생활환경</span><strong>{Math.round(s.stats.health)}<small>/ 100</small></strong><p>{s.stats.health>=60?'가족이 쉴 수 있는 터전':'가족의 생활을 돌봐 주세요'}</p></div><div className="metric family"><span>♧ 생존 후손</span><strong>{living.length}<small>명</small></strong><p>{s.people[s.head].alive?'현재 대표 포함':'생존한 후손만 집계'}</p></div><div className={`metric heirs ${next.length?'':'risk'}`}><span>↳ 후계 후보</span><strong>{next.length}<small>명</small></strong><p>{next.length?`성인 ${next.filter(p=>s.year-p.born>=18).length}명`:'아직 다음 후손이 없습니다'}</p></div></div>}
export function TurnResult({s,onContinue,onPerson,animate=false}:{s:State;animate?:boolean;onContinue:()=>void;onPerson:(p:Person)=>void}){
 const [expandedReport,setExpandedReport]=useState('');
 const [revealed,setRevealed]=useState(()=>!animate||window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{if(revealed)return;const timer=window.setTimeout(()=>setRevealed(true),1400);return()=>window.clearTimeout(timer)},[revealed]);
 const r=s.report;if(!r)return null;
 const reportKey=[s.runId??s.seed,s.turn,r.from,r.to,r.decision].join('|'),expanded=expandedReport===reportKey;
 const entries=r.entries.filter(e=>e.text!==r.title+' — '+r.decision);
 const featured=featuredMemory(s);
 const important=entries.filter(e=>e.family||['surprise','surprise-result','journey','growth','economy'].includes(e.kind)||e.text.includes('태어나다')||e.text.includes('생을 마치다')||e.text.includes('혼인'));
 const head=s.people[s.head];
 const headline=reportHeadline(s);
 const visible=(important.length?important:entries).filter(e=>e.text!==headline&&(!featured||e.text!==featured.text||e.year!==featured.year));
 return <section className="event turn-result" aria-label="선택 결과">
  <p className="eyebrow">{r.to===r.from?"그날, 우리 가족에게":`${r.to-r.from}년 동안, 우리 가족에게`}</p>
  <div className="result-year">{r.from}{r.to!==r.from&&<><span>→</span>{r.to}</>}<small>년</small></div>
  <ResultReveal key={reportKey} s={s} revealed={revealed} onReveal={()=>setRevealed(true)}/>
  <div hidden={!revealed} className="revealed-report">
  <h2 className="result-headline">{headline}</h2>
  <p className="decision-recap">내가 고른 길 · “{r.decision}”</p>

  {r.entries.some(e=>e.kind==='project-progress')&&<div className="goal-result" role="status"><b>이번 선택으로 목표에 한 걸음</b>{r.entries.filter(e=>e.kind==='project-progress').map((e,i)=><p key={i}>{e.text}</p>)}</div>}
  {r.entries.some(e=>e.kind==='benefit')&&<div className="benefit-result" role="status"><b>쌓은 능력이 새 혜택으로</b>{r.entries.filter(e=>e.kind==='benefit').map((e,i)=><p key={i}>{e.text}</p>)}</div>}
  <MemorySpotlight s={s} onPerson={onPerson}/>
  <h3 className="family-time-heading">{featured?"함께 남은 기록":"그동안 가족에게는"}</h3><div className="turn-highlights" aria-label="이번 선택 이후 가족의 이야기">
   {visible.length?visible.slice(0,expanded?visible.length:4).map((l,i)=><article key={i}><span className={l.kind==='surprise'?'surprise-tag':''}>{l.kind==='surprise'?'돌발':l.kind==='surprise-result'?'대처':l.family?.type==='birth'||l.text.includes('태어나다')?'새 생명':l.family?.type==='farewell'||l.text.includes('생을 마치다')?'기억':l.family?.type==='marriage'||l.text.includes('혼인')?'인연':l.family?.type==='growth'||l.kind==='growth'?'성장':'변화'}</span><div><small>{l.year}년</small><p>{l.text}</p></div></article>):<p>{featured?"이 순간은 가족의 연대기에 남았습니다.":`${head.name}의 가족은 조용한 날들을 보냈습니다.`}</p>}
  </div>
  {visible.length>4&&<button className="text-button" aria-expanded={expanded} onClick={()=>setExpandedReport(expanded?'':reportKey)}>{expanded?'접기':`이번 기간 기록 ${visible.length}개 모두 보기`}</button>}
  {r.entries.some(e=>e.kind==='project')&&<div className="project-result" role="status"><strong>✦ 가문의 유산을 완성했습니다</strong>{r.entries.filter(e=>e.kind==='project').map((e,i)=><p key={i}>{e.text}</p>)}</div>}
  {r.entries.some(e=>['society','alternate'].includes(e.kind))&&<div className="social-result" role="status"><strong>가문의 자리가 달라지는 순간</strong>{r.entries.filter(e=>['society','alternate'].includes(e.kind)&&e.text!==r.title+' — '+r.decision).map((e,i)=><p key={i}>{e.text}</p>)}</div>}
  {r.entries.some(e=>e.kind==='chronicle')&&<div className="chronicle-result" role="status"><strong>가문의 삶에 남긴 발자취</strong>{r.entries.filter(e=>e.kind==='chronicle'&&e.text!==r.title+' — '+r.decision).map((e,i)=><p key={i}>{e.text}</p>)}</div>}
  <div className="immediate-effects" aria-label="선택 직후 변화">{(Object.entries(r.immediate) as [Stat,number][]).filter(([,v])=>Math.abs(v)>=.5).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3).map(([stat,value])=><span key={stat}>{labels[stat]} <b className={value>=0?'up':'down'}>{value>=0?'+':''}{value.toFixed(1)}</b></span>)}</div><small className="immediate-label">선택 직후의 주요 변화 · 기간 전체 변화는 아래에서 확인합니다.</small>
  <div className="result-stats-heading"><h3>살림은 이렇게 달라졌어요</h3><span>기간 전체의 변화</span></div>
  <div className="delta-grid">{(Object.entries(r.changes) as [Stat,number][]).filter(([,v])=>Math.abs(v)>=.5).map(([k,v])=><div key={k}><span>{labels[k]}</span><strong className={v>=0?'up':'down'}>{v>=0?'+':''}{v.toFixed(1)}</strong><small>선택 직후 {(r.immediate[k]??0)>=0?'+':''}{(r.immediate[k]??0).toFixed(1)}</small></div>)}</div>
  <p className="tiny">큰 숫자는 경과 기간 전체의 변화입니다. 선택 직후 변화와 이후 생활·상환을 함께 반영합니다.</p>
  {r.borrowed>0&&<p className="debt-note">부족한 재산 {r.borrowed.toFixed(1)}점을 빌렸습니다. 현재 부채 {r.debtAfter.toFixed(1)}점 · 연 1%의 게임 규칙이 적용됩니다.</p>}
  {s.surprise&&s.phase==='play'&&<div className="surprise-notice" role="status"><b>!</b><p><strong>그런데 {s.year}년, 뜻밖의 일이 생겼습니다.</strong>남은 {s.surprise.remaining}년이 흐르기 전에 먼저 대처해야 합니다.</p></div>}
  <button className="primary continue-button" onClick={onContinue}>{s.journey?'과거길의 일 확인하기':s.surprise&&s.phase==='play'?'무슨 일인지 보기':s.phase==='succession'?'다음 대표 선택하기':s.phase==='ended'?'가문의 마지막 기록 보기':'다음 이야기로'} →</button>
  </div>
 </section>;
}
export function HeirSelection({s,onSelect,onPerson}:{s:State;onSelect:(id:string)=>void;onPerson:(p:Person)=>void}){const [selected,setSelected]=useState('');const head=s.people[s.head];const heirs=candidates(s);const chosen=heirs.find(p=>p.id===selected);return <section className="event succession"><p className="eyebrow">다음 장을 여는 사람 · 제{representativeNumber(s)+1}대 대표</p><h2>이제 누구의 삶을<br/>함께할까요?</h2><p className="event-description">{head.name}의 이야기가 {s.year}년에 끝났습니다. 남아 있는 가족 중 다음 대표를 골라 주세요.</p><RepresentativeMemory s={s} onPerson={onPerson}/><p className="tiny">성인 후보를 먼저 보여드립니다. ‘대표 순번’과 ‘창시자로부터의 혈연 세대’는 별개입니다.</p><div className="heir-list">{heirs.map((p,i)=>{const minor=s.year-p.born<18;return <article key={p.id} className={`heir-card ${selected===p.id?'selected':''}`}><button className="heir-pick" onClick={()=>setSelected(p.id)} aria-pressed={selected===p.id}><Avatar person={p} size={52}/><span><strong>{p.name} <small>{s.year-p.born}세 · {p.sex}</small></strong><span>{relation(s,p.id)} · {clans[p.clan].label}</span><small>{minor?'가족 보호가 필요한 미성년':p.job}{i===0&&!minor?' · 성인 후보':''}</small></span><b>{selected===p.id?'✓':'○'}</b></button><div className="heir-metrics"><span>교육 <b>{Math.round(p.education)}</b></span><span>건강 <b>{p.health}</b></span><span>{p.trait}</span><button onClick={()=>onPerson(p)}>생애 보기 ↗</button></div></article>})}</div>{chosen&&<div className="succession-preview"><b>{withParticle(chosen.name,'이/가')} 대표가 되면</b><p>가문 교육 {Math.round(s.stats.education)} → {Math.round(s.stats.education*.6+chosen.education*.4)} · 생활환경 {Math.round(s.stats.health)} → {Math.round(s.stats.health*.7+chosen.health*.3)}<br/>{s.year-chosen.born<18?'가족 공동 돌봄으로 운영합니다. 생계 −5 · 결속 −3의 초기 부담이 있습니다.':'성인 대표가 가문의 일을 직접 맡습니다.'}</p></div>}<button className="primary continue-button" disabled={!chosen} onClick={()=>chosen&&onSelect(chosen.id)}>{chosen?`${withParticle(chosen.name,'과/와')} 다음 장 시작`:'이어갈 사람을 선택하세요'} →</button></section>}
