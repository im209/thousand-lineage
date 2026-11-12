import {clans,events,regions,jobFor,type Stat,type Event} from './data';
import {decisionFeedback} from './choice-feedback';
import {withParticle} from './korean';
import type {FamilyEvent,LogEntry,DeathCause} from './family-events';
import {beginExamJourney,prepareJourneyEvent,journeyRisk,journeyText,type JourneyState,type JourneyAction} from './journeys';
import type {ChallengeBenchmark} from './share-links';
import {projects,projectState,projectComplete,projectMatches,projectChoice,type ProjectId,type ProjectState} from './projects';
import {societyState,examCandidate,randomStartingStanding,initializeSociety,societyAnnual,retireOffice,nextSocietyEvent,prepareSocialEvent,wrapAlternateHistory,socialLockReason,applySocialAction,type StartingStanding,type Society} from './society';
import {nextChronicleEvent,prepareChronicleEvent,chronicleLockReason,applyChronicleAction,type ChronicleState} from './chronicles';
import {SURPRISE_CHANCE,surpriseRoll,pickSurprise,prepareSurpriseEvent,type SurpriseState,type SurpriseAction} from './surprises';
export {backgrounds,societyState,societyLabel,legalStatus,officeLabel,socialHint,examCandidate,examChance,coupChance,selectSocialFocus} from './society';
export type {StartingStanding,Society,SocialFocus} from './society';
export {projects,projectState,projectProgress,projectComplete,projectMatches} from './projects';
export type {ProjectId} from './projects';
export type Person={intendedJob?:'trade'|'study';id:string;name:string;surname:string;clan:number;sex:'여'|'남';born:number;died:number|null;parents:string[];adoptiveParents:string[];spouses:string[];children:string[];generation:number;job:string;education:number;health:number;region:string;trait:string;ability:number;estate:number;alive:boolean;lineage:boolean;life:{year:number;text:string}[]};
export type TurnReport={outcome?:string;from:number;to:number;title:string;decision:string;changes:Partial<Record<Stat,number>>;immediate:Partial<Record<Stat,number>>;borrowed:number;debtBefore:number;debtAfter:number;entries:LogEntry[]};
export type State={journey?:JourneyState;surprise?:SurpriseState;endless?:boolean;challenge?:ChallengeBenchmark;introPending?:boolean;chronicles?:ChronicleState;society?:Society;runId?:string;projects?:ProjectState;report?:TurnReport;representativeCount?:number;version:1;seed:number;rng:number;year:number;clan:number;people:Record<string,Person>;head:string;founder:string;stats:Record<Stat,number>;debt:number;phase:'play'|'succession'|'ended';event:string;seen:string[];log:LogEntry[];legacies:{key:string;generation:number}[];peak:{year:number;wealth:number};moves:string[];endReason:string;turn:number};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function rand(s:State){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296}
const pick=<T,>(s:State,a:T[])=>a[Math.floor(rand(s)*a.length)];
export function log(s:State,text:string,kind='family',family?:FamilyEvent){s.log.push({year:s.year,text,kind,...(family?{family}:{})})}
export function selectProject(state:State,id:ProjectId):State{
 if(state.introPending||state.journey||state.phase!=='play'||state.report||!projects.some(p=>p.id===id)||projectComplete(state,id)||projectState(state).active===id)return state;
 const s=structuredClone(state);s.projects=structuredClone(projectState(s));s.projects.active=id;return s;
}
export function turnYears(s:State){if(s.journey)return {min:3,max:3};if(s.event.startsWith('surprise-')){const r=s.surprise?.remaining??5;return {min:r,max:r}}return /^(social-|chronicle-)/.test(s.event)?{min:3,max:3}:s.turn<3?{min:5,max:5}:{min:10,max:15}}
function advanceProject(s:State,c:import('./data').Choice,countChoice=true){
 const active=projectState(s).active;if(!active||projectComplete(s,active))return;
 s.projects=structuredClone(projectState(s));
 if(countChoice&&projectMatches(s,c)){const previous=s.projects.progress[active];s.projects.progress[active]=Math.min(3,previous+1);if(s.projects.progress[active]>previous)log(s,`${projects.find(p=>p.id===active)!.title} · 관련 선택 ${s.projects.progress[active]}/3`,'project-progress');}
 const project=projects.find(p=>p.id===active)!;
 if(s.projects.progress[active]<3||s.stats[project.stat]<project.threshold)return;
 s.projects.completed.push(active);s.projects.active=null;
 const living=Object.values(s.people).filter(p=>p.alive);let detail='';
 if(active==='learning'){
  const children=living.filter(p=>s.year-p.born<18);for(const p of children){p.education=clamp(p.education+12);p.life.push({year:s.year,text:'가문의 배움터 완성으로 교육 12 증가'});}
  detail=`생존한 미성년 ${children.length}명의 교육 +12. 배움 특별 선택을 열었습니다.`;
 }else if(active==='trade'){
  const repayment=Math.min(8,s.debt);s.debt-=repayment;s.stats.wealth=clamp(s.stats.wealth+8-repayment);
  detail=`부채 ${repayment.toFixed(1)}점 상환, 재산 +${(8-repayment).toFixed(1)}. 상업 특별 선택을 열었습니다.`;
 }else{
  for(const p of living){p.health=clamp(p.health+10);p.life.push({year:s.year,text:'가문의 돌봄 기반 완성으로 건강 10 증가'});}
  s.stats.health=clamp(s.stats.health+8);detail=`생존 가족 ${living.length}명의 건강 +10, 생활환경 +8. 돌봄 특별 선택을 열었습니다.`;
 }
 log(s,`${project.title} 완성! ${detail}`,'project');
}
function person(s:State,born:number,generation:number,clan:number,sex?:'여'|'남',lineage=false):Person {const c=clans[clan];return {id:`p${Object.keys(s.people).length+1}`,name:c.surname+pick(s,born<1900?['덕수','정희','영수','순이','성준','복례','정원','명수','옥희','도윤']:['서연','민준','지우','하윤','서준','수현','지민','도현']),surname:c.surname,clan,sex:sex??pick(s,['여','남']),born,died:null,parents:[],adoptiveParents:[],spouses:[],children:[],generation,job:s.year-born<18?'미성년':jobFor(s.year,s.stats.education>60,false),education:s.stats.education,health:55+Math.floor(rand(s)*40),region:s.moves.at(-1)!,trait:pick(s,['신중함','다정함','진취적','끈기 있음']),ability:30+Math.floor(rand(s)*60),estate:s.year-born<18?0:5+Math.floor(rand(s)*10),alive:true,lineage,life:[]}}
function add(s:State,p:Person){s.people[p.id]=p;return p}
export function create(seed:number,clan=0,origin:StartingStanding=randomStartingStanding(seed)):State {const s:State={representativeCount:1,version:1,seed:seed>>>0,rng:seed>>>0,year:1392,clan,people:{},head:'',founder:'',stats:{wealth:40,stability:50,status:25,education:25,health:65,reputation:30,connections:35,cohesion:65},debt:0,phase:'play',event:'h1392',seen:[],log:[],legacies:[],peak:{year:1392,wealth:40},moves:['경상도'],endReason:'',turn:0};s.moves=[pick(s,regions)];s.stats.wealth=25+Math.floor(rand(s)*40);s.stats.education=15+Math.floor(rand(s)*35);const f=add(s,person(s,1392-18-Math.floor(rand(s)*9),1,clan,undefined,true));s.head=s.founder=f.id;f.job=pick(s,['농민','상인','수공업자','학인']);initializeSociety(s,origin);s.society!.focus='livelihood';s.peak.wealth=s.stats.wealth;log(s,`${clans[clan].label} ${f.name}, 가문의 첫 장을 열다.`);return s}
export function candidates(s:State){return Object.values(s.people).filter(p=>p.lineage&&p.alive&&p.id!==s.head).sort((a,b)=>Number(s.year-b.born>=18)-Number(s.year-a.born>=18)||b.education-a.education||b.health-a.health)}
function marry(s:State,p:Person){const c=pick(s,clans.filter(c=>c.id!==p.clan));const spouse=add(s,person(s,s.year-20-Math.floor(rand(s)*12),p.generation,c.id,p.sex==='여'?'남':'여'));spouse.region=p.region;p.spouses.push(spouse.id);spouse.spouses.push(p.id);p.life.push({year:s.year,text:`${withParticle(spouse.name,'과/와')} 혼인`});spouse.life.push({year:s.year,text:`${withParticle(p.name,'과/와')} 혼인`});log(s,`${withParticle(p.name,'과/와')} ${spouse.name}, 혼인하다.`,'family',{type:'marriage',people:[p.id,spouse.id]});s.stats.connections=clamp(s.stats.connections+2)}
function die(s:State,p:Person,cause?:DeathCause){
 if(!p.alive)return;
 p.alive=false;p.died=s.year;
 const text=cause?`${p.name}, ${journeyText(`journey-${cause}`).death}`:`${p.name}, ${s.year-p.born}세에 생을 마치다.`;
 p.life.push({year:s.year,text:cause?journeyText(`journey-${cause}`).death:'생을 마침'});
 log(s,text,'family',{type:'farewell',people:[p.id],...(cause?{cause}:{})});
 const heirs=p.children.map(id=>s.people[id]).filter(c=>c.alive);
 if(heirs.length){const share=p.estate/heirs.length;heirs.forEach(h=>h.estate+=share)}else s.stats.wealth=clamp(s.stats.wealth+p.estate*.1);p.estate=0;
}
function checkSuccession(s:State){if(!s.people[s.head].alive){if(candidates(s).length)s.phase='succession';else{s.phase='ended';s.endReason='후계자 부재'}}}

function annual(s:State){s.year++;societyAnnual(s);const alive=Object.values(s.people).filter(p=>p.alive);for(const p of alive){const age=s.year-p.born;const mortality=age>95?.5:age>75?.08:age>55?.025:age<5?(s.year<1900?.012:.002):.0015;if(rand(s)<mortality*(1.35-s.stats.health/150)){die(s,p);continue}if(!p.lineage)continue;if(age===18){p.education=clamp(p.education*.7+s.stats.education*.3);p.job=jobFor(s.year,p.education>55,p.intendedJob==='trade');p.life.push({year:s.year,text:`성년이 되어 ${p.job}의 길을 시작함`});log(s,`${p.name}, 성년이 되어 ${p.job}의 길을 시작하다.`,'growth',{type:'growth',people:[p.id]})}if(age<18)p.job='미성년';if(age>=20&&age<49&&!p.spouses.some(id=>s.people[id].alive)&&rand(s)<.18)marry(s,p);const sp=p.spouses.map(id=>s.people[id]).find(x=>x.alive);if(!sp)continue;const mother=p.sex==='여'?p:sp;const father=p.sex==='남'?p:sp;const ma=s.year-mother.born;const last=p.children.map(id=>s.people[id].born).sort((a,b)=>b-a)[0]??0;if(ma>=20&&ma<=42&&s.year-father.born<65&&s.year-last>=3&&p.children.length<5&&rand(s)<.13*(.65+s.stats.cohesion/100)*(mother.health/100)/(1+alive.length/60)){const child=add(s,person(s,s.year,p.generation+1,father.clan,undefined,true));child.parents=[p.id,sp.id];child.region=p.region;child.education=clamp(s.stats.education*.5+p.education*.5);p.children.push(child.id);sp.children.push(child.id);child.life.push({year:s.year,text:`${p.name}와 ${sp.name}의 자녀로 태어남`});log(s,`${child.name}, ${p.generation+1}대 자녀가 태어나다.`,'family',{type:'birth',people:[child.id]})}}
 retireOffice(s);s.stats.wealth=clamp(s.stats.wealth+(rand(s)-.52)*3+(s.stats.education-50)*.004);s.stats.stability=clamp(s.stats.stability+(s.stats.wealth-50)*.012);if(s.debt>0){const repayment=Math.min(s.debt,Math.max(0,s.stats.wealth-15)*.08);s.stats.wealth=clamp(s.stats.wealth-repayment);s.debt=Math.max(0,s.debt-repayment)*1.01;s.stats.stability=clamp(s.stats.stability-Math.min(1,s.debt*.015))}s.stats.health=clamp(s.stats.health+(s.stats.stability-50)*.006);if(s.stats.wealth>s.peak.wealth)s.peak={year:s.year,wealth:s.stats.wealth};
 checkSuccession(s);if(!s.endless&&s.year>=2026){s.phase='ended';s.endReason=Object.values(s.people).some(p=>p.lineage&&p.alive)?'2026년까지 존속':'후계자 부재'}}
function debtEvent(s:State,e:Event):Event{return {...e,description:`${s.people[s.head].name}의 가족에게 부채 ${s.debt.toFixed(1)}점이 남아 있습니다. ${e.description} 조정 비율은 이번 선택의 부족한 비용까지 조달한 뒤 적용합니다.`}}
function startSurprise(s:State,until:number){
 // Never cut into a story that must continue: a prepared Joseon life arc, exile, or debt recovery.
 if(s.chronicles?.active||nextChronicleEvent(s)||societyState(s).political==='exile'||s.debt>=25&&!s.seen.slice(-3).includes('life8'))return false;
 const picked=pickSurprise(s);if(!picked)return false;
 s.surprise={id:picked.id,target:picked.target,remaining:until-s.year};
 if(picked.id==='surprise-twins'&&picked.target){
  const p=s.people[picked.target],sp=p.spouses.map(id=>s.people[id]).find(x=>x.alive)!,father=p.sex==='남'?p:sp;
  const twins=[0,1].map(()=>{const child=add(s,person(s,s.year,p.generation+1,father.clan,undefined,true));child.parents=[p.id,sp.id];child.region=p.region;child.education=clamp(s.stats.education*.5+p.education*.5);p.children.push(child.id);sp.children.push(child.id);child.life.push({year:s.year,text:p.name+'와 '+sp.name+'의 쌍둥이로 태어남'});return child});
  for(let i=0;i<5&&twins[1].name===twins[0].name;i++)twins[1].name=person(s,s.year,1,father.clan).name;
  log(s,withParticle(twins[0].name,'과/와')+' '+twins[1].name+', 쌍둥이로 태어나다.','family',{type:'birth',people:twins.map(p=>p.id)});
 }
 log(s,'뜻밖의 일 · '+prepareSurpriseEvent(s,events.find(e=>e.id===picked.id)!).title,'surprise');
 return true;
}
function applySurpriseAction(s:State,action:SurpriseAction){
 const target=s.surprise?.target?s.people[s.surprise.target]:undefined,head=s.people[s.head],roll=surpriseRoll(s,5);
 const leave=(p:Person)=>{const place=pick(s,regions.filter(r=>r!==p.region));p.region=place;p.life.push({year:s.year,text:place+'(으)로 떠나 따로 살아감'})};
 if(action==='plague-doctor'&&target?.alive){target.health=clamp(target.health+10);target.life.push({year:s.year,text:'돌림병을 이겨냄'});log(s,target.name+', 의원의 약으로 병을 이겨내다.','surprise-result')}
 if(action==='plague-home'&&target?.alive&&target.id!==s.head){if(roll<.25){die(s,target);log(s,'정성껏 간병했지만 '+target.name+'을(를) 지키지 못했습니다.','surprise-result')}else{target.life.push({year:s.year,text:'가족의 간병으로 병을 이겨냄'});log(s,target.name+', 가족의 간병으로 병을 이겨내다.','surprise-result')}}
 if(action==='bandits-resist'){if(roll<.7)log(s,'장정들과 힘을 모아 도적을 물리쳤습니다. 마을이 이 가문을 다시 보게 되었습니다.','surprise-result');else{s.stats.wealth=clamp(s.stats.wealth-10);head.health=clamp(head.health-15);head.life.push({year:s.year,text:'도적과 맞서다 다침'});log(s,'도적을 막지 못해 재물을 잃고 '+head.name+'이(가) 다쳤습니다.','surprise-result')}}
 if(action==='runaway-honor'&&target?.alive){leave(target);log(s,target.name+'은(는) 끝내 돌아오지 않고 '+target.region+'에서 새 삶을 꾸렸습니다.','surprise-result')}
 if(action==='runaway-wait'&&target?.alive){if(roll<.5){s.stats.cohesion=clamp(s.stats.cohesion+4);target.life.push({year:s.year,text:'집으로 돌아옴'});log(s,target.name+', 계절이 바뀌기 전에 집으로 돌아오다.','surprise-result')}else{s.stats.cohesion=clamp(s.stats.cohesion-6);leave(target);log(s,target.name+'은(는) 돌아오지 않고 '+target.region+'에 자리를 잡았습니다.','surprise-result')}}
}
function applyJourneyAction(s:State,action:JourneyAction):boolean{
 const trip=s.journey!,p=s.people[trip.candidate];
 if(action==='return'){
  p.life.push({year:s.year,text:'험한 과거길에서 귀환하여 다음 기약을 남김'});
  log(s,`${withParticle(p.name,'은/는')} 이번 과거를 포기하고 무사히 집으로 돌아왔습니다. 이미 쓴 준비비는 돌아오지 않습니다.`,'journey');
 }else if(action==='risk'&&surpriseRoll(s,22)<journeyRisk(s)){
  die(s,p,trip.id.slice('journey-'.length) as DeathCause);retireOffice(s);checkSuccession(s);delete s.journey;return true;
 }else{
  const text=action==='escort'?'위험을 피해 한양에 무사히 도착했습니다.':journeyText(trip.id).survived;
  p.life.push({year:s.year,text});log(s,`${p.name}, ${text}`,'journey');
  applySocialAction(s,'exam',()=>rand(s),p.id);
 }
 delete s.journey;return false;
}
function nextEvent(s:State){
 const h=events.find(e=>e.year===s.year&&!s.seen.includes(e.id));if(h)return h;
 const social=nextSocietyEvent(s);if(social?.id==='social-exile')return social;
 if(s.debt>=25&&!s.seen.slice(-3).includes('life8'))return events.find(e=>e.id==='life8')!;
 const chronicle=nextChronicleEvent(s);if(chronicle)return chronicle;
 if(social)return social;
 const g=s.people[s.head].generation;
 const legacy=events.find(e=>e.requires&&!s.seen.includes(e.id)&&s.legacies.some(l=>l.key===e.requires&&g-l.generation>=2&&g-l.generation<=5));if(legacy)return legacy;
 const hasChild=Object.values(s.people).some(p=>p.lineage&&p.alive&&s.year-p.born<18);
 const pool=events.filter(e=>/^life[0-7]$/.test(e.id)&&e.min<=s.year&&e.max>=s.year&&(e.id!=='life2'||hasChild)&&(e.id!=='life7'||s.stats.wealth<65||s.stats.stability<65));
 const fresh=pool.filter(e=>!s.seen.slice(-3).includes(e.id));
 const eligible=fresh.length?fresh:pool;
 // Two tickets for a project-relevant event, one for other eligible family events.
 return pick(s,eligible.flatMap(e=>e.choices.some(c=>projectMatches(s,c))?[e,e]:[e]));
}
function baseCurrentEvent(s:State):Event{const base=events.find(e=>e.id===s.event)??events[0];if(base.kind==='surprise')return prepareSurpriseEvent(s,base);const special=projectChoice(base.id);const e=special?{...base,choices:[...base.choices,special]}:base;if(e.id==='life8')return debtEvent(s,e);if(e.id==='life2'){const child=Object.values(s.people).filter(p=>p.lineage&&p.alive&&s.year-p.born<18).sort((a,b)=>a.born-b.born)[0];if(child)return {...e,title:child.name+'에게 열린 배움의 길',description:child.name+'('+ (s.year-child.born)+'세)의 배움을 지원할 기회가 생겼습니다. 이 아이에게 쌓인 교육은 성인이 되었을 때 진로에 반영됩니다.',choices:e.choices.map(c=>({...c,target:child.id}))}}if(e.id==='life3'&&s.stats.connections>=60)return {...e,description:'오랫동안 쌓아 온 거래처의 신뢰 덕분에 적은 밑천으로 거래를 넓힐 수 있습니다.',choices:e.choices.map((c,i)=>i===0?{...c,description:'연결 60 이상 혜택 · 재산 −3 · 연결 +12',effects:{...c.effects,wealth:-3}}:c)};if(e.kind==='legacy'){const key=e.requires;const bonus:Partial<Record<Stat,number>>=key==='learning'?{education:10}:key==='migration'?{stability:10}:key==='trade'?{wealth:10}:key==='community'?{connections:10,reputation:5}:{health:8,cohesion:6};return {...e,description:'이전 세대가 남긴 선택이 오늘의 가족에게 기회가 되었습니다. 유산을 이어받거나 지금 필요한 자원으로 바꿀 수 있습니다.',choices:[{title:'가족의 유산을 이어받는다',description:'이어 온 경험이 가문의 역량을 높입니다.',effects:bonus},{title:'당장의 생활에 힘을 보탠다',description:'재산 +6 · 생계 +6',effects:{wealth:6,stability:6}},{title:'다음 세대의 배움에 투자한다',description:'재산 −4 · 교육 +12',effects:{wealth:-4,education:12},legacy:'learning'}]}}if(e.id==='h1997'&&['상인','자영업자'].includes(s.people[s.head].job))return {...e,description:'외환위기로 가문 대표의 사업이 어려움을 겪고 있습니다. 운영 규모와 소득원을 다시 결정해야 합니다.',choices:[{title:'사업 규모를 줄인다',description:'재산 −8 · 안정 +8',effects:{wealth:-8,stability:8},legacy:'trade'},{title:'다른 생업을 준비한다',description:'재산 −10 · 교육 +10',effects:{wealth:-10,education:10},legacy:'learning',job:'study'},{title:'거래처와 함께 회복을 기다린다',description:'재산 −15 · 연결 +12',effects:{wealth:-15,connections:12},legacy:'community'}]};if(e.id==='life4'||e.id==='life5')return {...e,description:s.people[s.head].name+'의 가족이 함께 결정할 일입니다. '+e.description};return e}
export function currentEvent(s:State):Event{if(s.journey)return prepareJourneyEvent(s);let e=s.year>=1894&&s.event.startsWith('social-')?events.find(e=>e.id==='social-modern')!:s.year<1894&&s.event.startsWith('social-')&&societyState(s).political==='exile'?events.find(e=>e.id==='social-exile')!:baseCurrentEvent(s);if(e.kind==='society'||e.id==='h1894')e=prepareSocialEvent(s,e);if(e.kind==='chronicle')e=prepareChronicleEvent(s,e);return wrapAlternateHistory(s,e)}
export function choiceCost(s:State,index:number){const c=currentEvent(s).choices[index];const modifier=s.event==='h1592'&&s.moves.at(-1)==='경상도'?1.4:1;return Math.max(0,-(c?.effects.wealth??0)*modifier)}
export function choiceLockReason(s:State,index:number):string|null{const c=currentEvent(s).choices[index];if(!c)return '선택지를 찾을 수 없습니다.';if(c.unlock&&!projectComplete(s,c.unlock))return projects.find(p=>p.id===c.unlock)!.title+' 완성 필요';return socialLockReason(s,c)??chronicleLockReason(s,c)}
export function choiceAvailable(s:State,index:number){return choiceLockReason(s,index)===null}
export function choose(state:State,index:number):State {
 if(state.introPending||state.phase!=='play'||state.report||!choiceAvailable(state,index))return state;
 const s=structuredClone(state), e=currentEvent(s), c=e.choices[index];if(!c)return state;
 const before={...s.stats},from=s.year,logStart=s.log.length,debtBefore=s.debt;
 const cost=choiceCost(s,index),borrowed=Math.max(0,cost-s.stats.wealth);s.debt+=borrowed;
 s.seen.push(e.id);log(s,e.title+' — '+c.title,e.kind);
 if(borrowed>0)log(s,'부족한 재산 '+borrowed.toFixed(1)+'점을 빌렸습니다. 남은 부채는 해마다 1% 증가하며 여유 자산에서 상환합니다.','economy');
 for(const [key,value] of Object.entries(c.effects)){const k=key as Stat;const modifier=e.id==='h1592'&&s.moves.at(-1)==='경상도'&&value<0?1.4:1;s.stats[k]=clamp(s.stats[k]+value*modifier)}
 if(c.legacy)s.legacies.push({key:c.legacy,generation:s.people[s.head].generation});
 if(c.target&&c.personalEducation){const p=s.people[c.target];if(p?.alive){p.education=clamp(p.education+c.personalEducation);p.life.push({year:s.year,text:'가족의 지원으로 교육 '+c.personalEducation+' 증가'});log(s,p.name+'의 교육이 '+c.personalEducation+'점 높아졌습니다.','growth')}}
 if(c.move){const place=pick(s,regions.filter(r=>r!==s.moves.at(-1)));s.moves.push(place);Object.values(s.people).filter(p=>p.alive).forEach(p=>p.region=place);log(s,place+'에 새 터전을 마련하다.')}
 if(c.job){const p=s.people[s.head];p.intendedJob=c.job;if(s.year-p.born>=18)p.job=jobFor(s.year,c.job==='study',c.job==='trade');else {p.job='미성년';log(s,'가족이 '+p.name+'의 성년 이후 진로를 준비합니다.','growth')}}
 let startingJourney=false,journeyDeath=false;
 if(c.socialAction==='exam'){
  const trip=beginExamJourney(s,examCandidate(s)!);
  if(trip){s.journey=trip;startingJourney=true;log(s,`${withParticle(s.people[trip.candidate].name,'은/는')} 과거를 보러 한양으로 떠났습니다. ${journeyText(trip.id).title}.`,'journey');}
  else applySocialAction(s,c.socialAction,()=>rand(s));
 }else if(c.socialAction)applySocialAction(s,c.socialAction,()=>rand(s));
 if(c.journeyAction)journeyDeath=applyJourneyAction(s,c.journeyAction);
 if(c.chronicleAction)applyChronicleAction(s,c.chronicleAction);
 if(c.surpriseAction)applySurpriseAction(s,c.surpriseAction);
 if(c.debtRelief){const forgiven=Math.min(s.debt,s.debt*Math.max(0,Math.min(1,c.debtRelief)));s.debt=Math.max(0,s.debt-forgiven);log(s,`비용 조달 후 부채 ${forgiven.toFixed(1)}점을 조정했습니다. 남은 부채 ${s.debt.toFixed(1)}점.`,'economy');}
 advanceProject(s,c);
 const immediate:Partial<Record<Stat,number>>={};for(const k of Object.keys(before) as Stat[])immediate[k]=s.stats[k]-before[k];
 const duration=startingJourney||journeyDeath?{min:0,max:0}:c.journeyAction?{min:3,max:3}:turnYears(s),wasSurprise=e.kind==='surprise',routeTurn=/^(social-|chronicle-)/.test(s.event);s.turn++;delete s.surprise;const target=startingJourney||journeyDeath?s.year:s.year+duration.min+Math.floor(rand(s)*(duration.max-duration.min+1)),until=s.endless?target:Math.min(2026,target);
 // 돌발 사건: from the 4th choice, one roll per turn picks a year inside this span to interrupt.
 const interruptAt=!wasSurprise&&!routeTurn&&s.turn>3&&until-s.year>=2&&surpriseRoll(s,1)<SURPRISE_CHANCE?s.year+1+Math.floor(surpriseRoll(s,4)*(until-s.year-1)):0;
 while(s.year<until&&s.phase==='play'){annual(s);if(events.some(e=>e.year===s.year&&!s.seen.includes(e.id)))break;if(s.year===interruptAt&&s.phase==='play'&&startSurprise(s,until))break}
 if(s.phase!=='ended')advanceProject(s,c,false);
 if(s.stats.wealth>s.peak.wealth)s.peak={year:s.year,wealth:s.stats.wealth};
 if(s.phase==='play'){const pending=s.surprise as SurpriseState|undefined;s.event=s.journey?s.journey.id:pending?pending.id:nextEvent(s).id}
 if(before.connections<60&&s.stats.connections>=60)log(s,'사회적 연결 60 달성! 거래 확장 사건의 큰 거래 비용이 재산 8에서 3으로 줄어듭니다.','benefit');
 const changes:Partial<Record<Stat,number>>={};for(const k of Object.keys(before) as Stat[])changes[k]=s.stats[k]-before[k];
 const actionEntries=s.log.slice(logStart).filter(l=>l.text!==e.title+' — '+c.title);
 const actionEntry=(c.journeyAction?actionEntries.find(l=>l.kind==='society'):undefined)??actionEntries.find(l=>['society','alternate','chronicle','surprise-result','journey'].includes(l.kind));
 const deathEntry=s.log.slice(logStart).find(l=>l.family?.type==='farewell'&&(l.family.people.includes(s.head)||l.family.cause));
 s.report={outcome:deathEntry?.text??((c.socialAction||c.chronicleAction||c.surpriseAction||c.journeyAction)&&actionEntry?actionEntry.text:decisionFeedback(e,c,index)),from,to:s.year,title:e.title,decision:c.title,changes,immediate,borrowed,debtBefore,debtAfter:s.debt,entries:s.log.slice(logStart)};return s;
}
export function beginStory(state:State):State{if(!state.introPending||state.phase!=='play')return state;return {...state,introPending:false}}
export function continueStory(state:State):State{if(!state.report)return state;const s=structuredClone(state);delete s.report;return s}
export function canContinueFuture(s:State){return s.phase==='ended'&&!s.endless&&s.year===2026&&Object.values(s.people).some(p=>p.lineage&&p.alive)}
export function continueFuture(state:State):State{
 if(!canContinueFuture(state))return state;
 const s=structuredClone(state);s.endless=true;s.endReason='';delete s.report;
 s.runId='future-'+(s.runId??('legacy-'+s.seed+'-'+s.clan+'-'+s.rng)).slice(0,113);
 s.phase=s.people[s.head].alive?'play':'succession';
 log(s,'2026년까지의 기록을 남기고, 아직 쓰이지 않은 미래로 가문의 이야기를 이어갑니다. 이후 시대는 가상의 미래입니다.','future');
 if(s.phase==='play')s.event=nextEvent(s).id;
 return s;
}
export function representativeNumber(s:State){return s.representativeCount??1+s.log.filter(l=>l.kind==='succession').length}
export function relation(s:State,id:string){const p=s.people[id],head=s.people[s.head];if(id===s.head)return '현재 대표';if(head.children.includes(id))return p.sex==='여'?'딸':'아들';if(head.parents.includes(id))return p.sex==='여'?'어머니':'아버지';if(head.parents.some(x=>p.parents.includes(x)))return '형제자매';if(p.parents.some(x=>head.children.includes(x)))return p.sex==='여'?'손녀':'손자';return '창시자의 '+p.generation+'세대 후손'}
export function succeed(state:State,id:string):State {if(state.report||state.phase!=='succession'||!candidates(state).some(p=>p.id===id))return state;const s=structuredClone(state);s.representativeCount=representativeNumber(state)+1;s.head=id;s.phase='play';const p=s.people[id];if(s.year-p.born<18){s.stats.stability=clamp(s.stats.stability-5);s.stats.cohesion=clamp(s.stats.cohesion-3);p.job='미성년'}s.stats.education=clamp(s.stats.education*.6+p.education*.4);s.stats.health=clamp(s.stats.health*.7+p.health*.3);log(s,`${p.generation}대 ${p.name}, 가문을 잇다.${s.year-p.born<18?' 성년까지 가족 공동 돌봄으로 운영한다.':''}`,'succession');p.life.push({year:s.year,text:'가문 대표 계승'});s.event=nextEvent(s).id;return s}
export function summary(s:State){const ps=Object.values(s.people),living=ps.filter(p=>p.lineage&&p.alive);return {years:s.year-1392,generations:Math.max(...ps.filter(p=>p.lineage).map(p=>p.generation)),people:ps.length,descendants:ps.filter(p=>p.lineage&&p.id!==s.founder).length,living:living.length,original:living.filter(p=>p.clan===s.clan).length}}
export function validate(s:State){const errors:string[]=[];for(const p of Object.values(s.people)){if(p.died!==null&&(p.died<p.born||p.died>s.year))errors.push('death');if(p.alive!==(p.died===null))errors.push('alive');for(const id of p.parents){const parent=s.people[id];if(!parent||parent.born+18>p.born||(parent.died!==null&&parent.died<p.born)||!parent.children.includes(p.id))errors.push('parent')}for(const id of p.spouses)if(!s.people[id]?.spouses.includes(p.id))errors.push('spouse');for(const id of p.children)if(!s.people[id]?.parents.includes(p.id)&&!s.people[id]?.adoptiveParents.includes(p.id))errors.push('child')}if(!Number.isSafeInteger(s.year)||s.year<1392||s.year>2026&&!s.endless)errors.push('year');return errors}
