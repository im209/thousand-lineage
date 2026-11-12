import type {State} from './engine';
import type {Choice,Event,Stat} from './data';

export type ArcId='archives'|'care'|'trade'|'war'|'justice'|'craft';
export type OutcomeId='school'|'books'|'relief'|'medicine'|'market'|'caravan'|'refuge'|'reconstruction'|'petition'|'inheritance'|'artisan'|'innovation';
export type ChronicleAction={type:'prepare';arc:ArcId}|{type:'complete';outcome:OutcomeId}|{type:'abandon'}|{type:'pause'};
export type ChronicleState={selected:ArcId|null;active:{arc:ArcId;startedYear:number;dueTurn:number}|null;completed:OutcomeId[];history:{arc:ArcId;outcome:OutcomeId;year:number;actor:string|null}[]};
export type ChronicleOutcome={id:OutcomeId;title:string;description:string;effects:Partial<Record<Stat,number>>;requirements?:Partial<Record<Stat,number>>};
export type Chronicle={id:ArcId;title:string;description:string;min:number;max:number;preparationCost:number;source:string;outcomes:ChronicleOutcome[]};
export const chronicles:Chronicle[]=[
 {id:'archives',title:'배움과 기록',description:'흩어진 책과 집안의 문서를 모읍니다. 함께 읽을 배움터를 열까요, 오래 남을 사본을 만들까요?',min:1392,max:1893,preparationCost:8,source:'https://sillok.history.go.kr/intro/intro.do',outcomes:[
  {id:'school',title:'가족과 이웃에게 배움터를 연다',description:'모아 둔 서책과 준비한 공간으로 함께 배우는 자리를 마련했습니다.',effects:{wealth:-4,education:10,reputation:6},requirements:{education:30}},
  {id:'books',title:'사가의 문서를 필사하고 나누어 보관한다',description:'닳아 가던 서책과 집안 문서에 새 사본이 생겼습니다. 가족은 기록을 나누어 맡아 다음 세대를 위해 간직합니다.',effects:{wealth:-6,education:8,cohesion:8},requirements:{education:40}},
 ]},
 {id:'care',title:'곡식과 돌봄',description:'곡식과 돌봄 물자를 먼저 모은 뒤 이웃의 어려움에 무엇을 내어 줄지 결정합니다.',min:1392,max:1893,preparationCost:8,source:'https://contents.history.go.kr/front/tg/view.do?levelId=tg_003_2250',outcomes:[
  {id:'relief',title:'비축한 곡식을 이웃에게 무상으로 나눈다',description:'곳간에서 꺼낸 곡식이 이웃의 밥상에 올랐습니다. 돌려받을 약속 대신 서로의 안부를 남겼습니다.',effects:{wealth:-5,reputation:12,connections:8}},
  {id:'medicine',title:'돌봄 경험과 의술 지식을 다음 사람에게 전한다',description:'가족과 이웃을 돌보며 익힌 경험을 정리했습니다. 다음 일손이 물자를 챙기고 배운 내용을 이어 갑니다.',effects:{wealth:-4,health:10,education:8},requirements:{education:35}},
 ]},
 {id:'trade',title:'장시와 교역',description:'장날에 내놓을 물품과 믿을 만한 거래 상대를 준비합니다. 가까운 약속을 지킬까요, 먼 길을 열까요?',min:1500,max:1893,preparationCost:10,source:'https://contents.history.go.kr/front/ta/view.do?levelId=ta_h61_0060_0030_0030',outcomes:[
  {id:'market',title:'약속한 물품을 전달해 장시의 신뢰를 지킨다',description:'밑천을 들여 준비한 물품을 약속대로 전달했습니다. 한 번의 거래가 다음 거래의 기반이 됩니다.',effects:{wealth:8,connections:10,reputation:5}},
  {id:'caravan',title:'운송 비용을 들여 먼 고장의 거래망을 잇는다',description:'고개 너머의 장터까지 물품을 실어 보냈습니다. 길 위에서 만난 사람들이 다음 거래의 약속을 건넵니다.',effects:{wealth:4,connections:16,stability:-4},requirements:{connections:45}},
 ]},
 {id:'war',title:'전란과 재건',description:'전란을 피해 떠나온 이웃과 무너진 집터가 남았습니다. 잠시 쉴 자리를 마련하거나 다시 살아갈 터전을 일굽니다.',min:1592,max:1660,preparationCost:8,source:'https://encykorea.aks.ac.kr/Article/E0043232',outcomes:[
  {id:'refuge',title:'떠나온 이웃에게 머물 곳과 식량을 내어 준다',description:'먼 길을 걸어온 이웃에게 자리를 내어 주었습니다. 가족은 식량을 나누고 함께 다음 날을 준비합니다.',effects:{wealth:-6,connections:10,cohesion:10}},
  {id:'reconstruction',title:'흩어진 일손을 모아 집터와 생업을 복구한다',description:'무너진 집터에 다시 기둥을 세웠습니다. 가족과 이웃의 일손이 모여 멈췄던 생업을 이어 갑니다.',effects:{wealth:-4,stability:14,health:8}},
 ]},
 {id:'justice',title:'문서와 가족의 몫',description:'말만으로 풀리지 않던 일을 문서에 담습니다. 생활의 어려움을 호소하거나 가족 사이의 약속을 새로 씁니다.',min:1392,max:1893,preparationCost:6,source:'https://contents.history.go.kr/front/nh/view.do?levelId=nh_025_0030_0010_0020_0010',outcomes:[
  {id:'petition',title:'근거 문서로 생활 문제를 호소하고 조정을 구한다',description:'모아 둔 문서로 가족의 사정을 설명했습니다. 모든 요구를 이루지는 못했지만 서로 지킬 조정안을 남겼습니다.',effects:{wealth:-4,stability:10,reputation:7},requirements:{connections:30}},
  {id:'inheritance',title:'가족의 몫을 함께 논의하고 약속을 문서로 남긴다',description:'각자의 형편과 돌봄의 몫을 듣고 가족의 약속을 적었습니다. 말이 엇갈릴 때 함께 펼쳐 볼 문서가 생겼습니다.',effects:{wealth:-3,cohesion:14,stability:6}},
 ]},
 {id:'craft',title:'손기술의 전승',description:'재료를 고르고 함께 일할 시간을 마련합니다. 손에 익은 기술을 전하거나 더 나은 제작법을 찾아봅니다.',min:1392,max:1893,preparationCost:7,source:'https://contents.history.go.kr/mobile/ta/view.do?levelId=ta_h71_0050_0030_0020_0030',outcomes:[
  {id:'artisan',title:'손기술을 다음 일손에게 차근차근 전한다',description:'준비한 재료로 작업을 함께하며 가문의 손기술을 전했습니다.',effects:{wealth:3,education:8,cohesion:8}},
  {id:'innovation',title:'재료를 써 가며 제작법을 개선하고 기록한다',description:'여러 번의 작업으로 제작법을 다듬고 다음 사람이 참고할 기록을 남겼습니다.',effects:{wealth:-5,education:14,reputation:8},requirements:{education:40}},
 ]},
];
const statNames:Record<Stat,string>={wealth:'재산',stability:'생계',status:'영향력',education:'교육',health:'생활환경',reputation:'명성',connections:'연결',cohesion:'결속'};
const formatEffects=(effects:Partial<Record<Stat,number>>)=>Object.entries(effects).map(([key,value])=>`${statNames[key as Stat]} ${value!>=0?'+':'−'}${Math.abs(value!)}`).join(' · ');
const arcFor=(id:ArcId)=>chronicles.find(c=>c.id===id)!;
const outcomeFor=(id:OutcomeId)=>chronicles.flatMap(c=>c.outcomes).find(o=>o.id===id);
export function chronicleState(s:Pick<State,'chronicles'>):ChronicleState{return s.chronicles??{selected:null,active:null,completed:[],history:[]}}
export function chronicleAvailability(s:State,id:ArcId):string|null{
 const arc=chronicles.find(c=>c.id===id);if(!arc)return '찾을 수 없는 가문의 길입니다.';
 if(s.year<arc.min||s.year>arc.max)return `${arc.min}~${arc.max}년에 선택할 수 있습니다.`;
 const state=chronicleState(s);if(arc.outcomes.every(o=>state.completed.includes(o.id)))return '이 길의 두 이야기를 모두 완수했습니다.';
 if(state.active&&state.active.arc!==id)return '진행 중인 준비를 완수하거나 정리한 뒤 다른 길을 선택하세요.';
 return null;
}
export function selectChronicle(state:State,id:ArcId):State{
 if(state.introPending||state.journey||state.phase!=='play'||state.report||chronicleAvailability(state,id))return state;
 const s=structuredClone(state);s.chronicles=structuredClone(chronicleState(s));s.chronicles.selected=id;
 if(s.chronicles.active)s.chronicles.active.dueTurn=Math.min(s.chronicles.active.dueTurn,s.turn);
 return s;
}
const expiredEvent:Event={id:'chronicle-expired',title:'시대가 바뀐 뒤 남은 준비',description:'준비하던 조선의 생활 경로가 시대 경계를 지나 마무리되었습니다. 남긴 경험을 간직하며 가족의 다음 이야기를 이어갑니다. 완수한 성취로 기록되지는 않습니다.',kind:'chronicle',min:1392,max:2026,choices:[{title:'남은 준비를 정리하고 다음 삶을 이어간다',description:'진행 중인 준비 종료 · 성취 지급 없음',effects:{},chronicleAction:{type:'abandon'}}]};
export const chronicleEvents:Event[]=[...chronicles.flatMap(arc=>[
 {id:`chronicle-${arc.id}-prepare`,title:arc.title+' · 준비할 것들',description:arc.description,kind:'chronicle' as const,min:arc.min,max:arc.max,source:arc.source,choices:[
  {title:'자원과 시간을 들여 준비한다',description:`재산 −${arc.preparationCost} · 다음 선택에서 두 마무리 중 결정`,effects:{wealth:-arc.preparationCost},chronicleAction:{type:'prepare' as const,arc:arc.id}},
  {title:'이번 계획을 보류하고 가족의 생활로 돌아간다',description:'준비 비용 없음 · 완수 기록 없음',effects:{},chronicleAction:{type:'pause' as const}},
 ]},
 {id:`chronicle-${arc.id}-finish`,title:arc.title+' · 무엇을 남길까요?',description:'준비한 자원과 시간을 어디에 쓸지 결정합니다. 한 번의 준비로 하나의 결과를 완수할 수 있습니다.',kind:'chronicle' as const,min:arc.min,max:arc.max,source:arc.source,choices:[
  ...arc.outcomes.map(outcome=>({title:outcome.title,description:formatEffects(outcome.effects),effects:outcome.effects,chronicleAction:{type:'complete' as const,outcome:outcome.id}})),
  {title:'마무리를 잠시 미루고 생활을 돌본다',description:'두 번의 다른 선택 뒤 준비한 이야기로 복귀 · 성취 지급 없음',effects:{},chronicleAction:{type:'pause' as const}},
  {title:'이번 준비를 정리하고 다른 길을 찾는다',description:'준비 종료 · 지출한 비용은 반환되지 않음',effects:{},chronicleAction:{type:'abandon' as const}},
 ]},
]),expiredEvent];
export function nextChronicleEvent(s:State):Event|undefined{
 const state=chronicleState(s),active=state.active;
 if(active){const arc=arcFor(active.arc);if(s.year>arc.max||s.year<arc.min)return expiredEvent;if(s.turn>=active.dueTurn)return chronicleEvents.find(e=>e.id===`chronicle-${arc.id}-finish`);return;}
 if(state.selected){if(chronicleAvailability(s,state.selected))return expiredEvent;return chronicleEvents.find(e=>e.id===`chronicle-${state.selected}-prepare`);}
}
export function chronicleLockReason(s:State,choice:Choice):string|null{
 const action=choice.chronicleAction;if(!action)return null;const state=chronicleState(s);
 if(action.type==='pause'||action.type==='abandon')return null;
 if(action.type==='prepare'){
  if(state.active)return '이미 준비한 이야기를 먼저 마무리하세요.';
  if(state.selected!==action.arc)return '이 가문의 길을 먼저 선택하세요.';
  const reason=chronicleAvailability(s,action.arc);if(reason)return reason;
  if(s.stats.wealth<arcFor(action.arc).preparationCost)return `준비할 재산 ${arcFor(action.arc).preparationCost} 필요`;
  return null;
 }
 const active=state.active;if(!active)return '먼저 자원과 시간을 들여 준비해야 합니다.';
 const arc=arcFor(active.arc),outcome=arc.outcomes.find(o=>o.id===action.outcome);
 if(!outcome)return '진행 중인 준비와 다른 결과입니다.';
 if(s.year<arc.min||s.year>arc.max)return '이 경로의 시대가 지나 준비를 정리해야 합니다.';
 if(s.turn<active.dueTurn)return '준비에 시간이 더 필요합니다.';
 if(state.completed.includes(action.outcome))return '이미 완수한 이야기입니다.';
 const cost=Math.max(0,-(outcome.effects.wealth??0));if(s.stats.wealth<cost)return `마무리할 재산 ${cost} 필요`;
 for(const [stat,value] of Object.entries(outcome.requirements??{}))if(s.stats[stat as Stat]<value!)return `${statNames[stat as Stat]} ${value} 필요`;
 return null;
}
export function prepareChronicleEvent(s:State,event:Event):Event{
 if(!event.id.startsWith('chronicle-'))return event;
 const state=chronicleState(s),id=state.active?.arc??state.selected;
 const arc=id?arcFor(id):undefined;
 if(arc&&(s.year<arc.min||s.year>arc.max))return expiredEvent;
 const current=!state.active&&state.selected?chronicleEvents.find(e=>e.id===`chronicle-${state.selected}-prepare`)!:event;
 return {...current,description:current.description+(state.active?` ${state.active.startedYear}년부터 준비한 일을 ${s.people[s.head]?.alive?s.people[s.head].name:'생존한 가족'}의 가족이 이어갑니다.`:''),choices:current.choices.map(choice=>({...choice,lockedReason:chronicleLockReason(s,choice)??undefined}))};
}
function record(s:State,text:string){s.log.push({year:s.year,text,kind:'chronicle'})}
export function applyChronicleAction(s:State,action:ChronicleAction):void{
 if(s.phase!=='play'||s.report)return;
 // Root applies the displayed stat costs first, so eligibility must use pre-cost wealth.
 // Structural/era checks below independently prevent duplicate grants and invalid transitions.
 s.chronicles=structuredClone(chronicleState(s));const state=s.chronicles;
 if(action.type==='prepare'){
  if(state.active||state.selected!==action.arc||chronicleAvailability(s,action.arc))return;
  state.active={arc:action.arc,startedYear:s.year,dueTurn:s.turn+1};record(s,`${arcFor(action.arc).title}: 자원과 시간을 들여 준비를 시작했습니다.`);return;
 }
 if(action.type==='pause'){state.selected=null;if(state.active)state.active.dueTurn=s.turn+3;record(s,'가문의 준비를 잠시 미루고 생활을 돌보기로 했습니다.');return;}
 if(action.type==='abandon'){state.selected=null;state.active=null;record(s,'준비하던 일을 정리했습니다. 완수한 성취로 기록하지 않습니다.');return;}
 const active=state.active;if(!active||s.turn<active.dueTurn||state.completed.includes(action.outcome))return;
 const arc=arcFor(active.arc);if(s.year<arc.min||s.year>arc.max||!arc.outcomes.some(o=>o.id===action.outcome))return;
 const outcome=outcomeFor(action.outcome)!;const head=s.people[s.head];const actor=head?.alive?head.id:null;
 state.completed.push(action.outcome);state.history.push({arc:arc.id,outcome:action.outcome,year:s.year,actor});state.active=null;state.selected=null;
 record(s,`${arc.title} 완수 — ${outcome.description}`);
 if(head?.alive)head.life.push({year:s.year,text:`${arc.title}: ${outcome.title}`});
}
