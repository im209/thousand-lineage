// 돌발 사건: interruptions that break into the years a choice advances.
// Rules (see CLAUDE.md):
// - Never during the first three choices, never twice in a row, never on 3-year route turns.
// - Decided by a hash of seed + turn, so the main RNG stream is untouched and a same-seed
//   replay meets the same interruption roll on the same turn.
// - A surprise never kills the family representative. Risky options show their odds.
// - Answering a surprise only advances the years that were left in the interrupted span.
import type {State,Person} from './engine';
import type {Choice,Event} from './data';

export const surpriseIds=['surprise-plague','surprise-drought','surprise-fire','surprise-bandits','surprise-harvest','surprise-patron','surprise-twins','surprise-runaway'] as const;
export type SurpriseId=typeof surpriseIds[number];
export type SurpriseAction='plague-doctor'|'plague-home'|'bandits-resist'|'runaway-honor'|'runaway-wait';
export type SurpriseState={id:SurpriseId;target:string|null;remaining:number};

export const SURPRISE_CHANCE=.2;
const option=(title:string,description:string,effects:Choice['effects'],extra:Partial<Choice>={}):Choice=>({title,description,effects,...extra});
const base={min:1392,max:99999,kind:'surprise' as const};

// {name} is replaced with the affected family member when the event is shown.
export const surpriseEvents:Event[]=[
 {...base,id:'surprise-plague',title:'돌림병이 마을을 덮치다',description:'마을에 돌림병이 번져 {name}도 열병으로 앓아누웠습니다. 어떻게 돌볼지 지금 정해야 합니다.',choices:[
  option('의원을 불러 약을 쓴다','재산 −10 · {name} 건강 회복',{wealth:-10,cohesion:3},{legacy:'care',surpriseAction:'plague-doctor'}),
  option('집안에서 정성껏 간병한다','결속 +6 · 비용 없음',{cohesion:6},{surpriseAction:'plague-home',chanceLabel:'회복 확률 75% · 실패하면 {name}을(를) 잃습니다'}),
  option('마을과 함께 병자를 격리한다','연결 −4 · 생계 −4 · 생활환경 +8',{connections:-4,stability:-4,health:8},{legacy:'community'})]},
 {...base,id:'surprise-drought',max:1959,title:'비가 오지 않는 여름',description:'석 달째 비가 내리지 않아 논밭이 갈라졌습니다. 올해 수확은 기대하기 어렵습니다.',choices:[
  option('비축해 둔 곡식을 푼다','재산 −8 · 생계 +4',{wealth:-8,stability:4}),
  option('허리띠를 졸라매고 버틴다','생계 −8 · 생활환경 −4',{stability:-8,health:-4}),
  option('이웃과 물을 나누며 함께 버틴다','재산 −3 · 연결 +7 · 생계 −2',{wealth:-3,connections:7,stability:-2},{legacy:'community'})]},
 {...base,id:'surprise-fire',title:'한밤중의 불길',description:'밤사이 불이 번져 {name}의 가족이 살던 집 일부가 타 버렸습니다. 다행히 다친 사람은 없습니다.',choices:[
  option('빚을 내서라도 다시 짓는다','재산 −12 · 생계 +6 · 생활환경 +4',{wealth:-12,stability:6,health:4}),
  option('친척 집에 몸을 의탁한다','결속 −4 · 연결 +5 · 생계 −4',{cohesion:-4,connections:5,stability:-4}),
  option('이참에 다른 고장으로 떠난다','생계 −3 · 새 터전',{stability:-3},{move:true,legacy:'migration'})]},
 {...base,id:'surprise-bandits',title:'곳간을 노린 도적',description:'밤중에 도적 떼가 들이닥쳐 곳간 문을 두드립니다. 가족이 모은 재물이 위험합니다.',choices:[
  option('재물을 내주고 가족을 지킨다','재산 −15',{wealth:-15}),
  option('마을 장정들과 함께 맞선다','명성 +8 · 연결 +3',{reputation:8,connections:3},{surpriseAction:'bandits-resist',chanceLabel:'성공 확률 70% · 실패하면 재산 −10, {name} 부상'}),
  option('관아에 알리고 도움을 청한다','재산 −5 · 명성 +3 · 사회적 영향력 +2',{wealth:-5,reputation:3,status:2})]},
 {...base,id:'surprise-harvest',title:'뜻밖의 풍년',description:'날씨가 도와 곳간이 넘칠 만큼 수확이 좋았습니다. 남는 것을 어디에 쓸지 정할 수 있습니다.',choices:[
  option('곳간을 채워 둔다','재산 +12',{wealth:12}),
  option('잔치를 열어 이웃과 나눈다','재산 +3 · 명성 +8 · 연결 +6',{wealth:3,reputation:8,connections:6},{legacy:'community'}),
  option('아이들의 배움에 쓴다','재산 +4 · 교육 +10',{wealth:4,education:10},{legacy:'learning'})]},
 {...base,id:'surprise-patron',title:'길에서 만난 귀인',description:'{name}이(가) 길에서 어려움에 처한 나그네를 도왔는데, 알고 보니 이름난 집안의 어른이었습니다.',choices:[
  option('인연을 이어 왕래한다','연결 +10 · 사회적 영향력 +4',{connections:10,status:4}),
  option('{name}의 배움을 부탁한다','교육 +4 · {name} 교육 +14',{education:4},{personalEducation:14,legacy:'learning'}),
  option('사업 밑천을 빌린다','재산 +10 · 연결 +4',{wealth:10,connections:4},{legacy:'trade'})]},
 {...base,id:'surprise-twins',title:'쌍둥이가 태어나다',description:'{name}의 집에 한꺼번에 두 아이가 태어났습니다. 기쁨만큼 손도 두 배로 필요합니다.',choices:[
  option('온 가족이 함께 키운다','결속 +8 · 재산 −4',{cohesion:8,wealth:-4},{legacy:'care'}),
  option('친척과 이웃의 손을 빌린다','연결 +6 · 결속 +2',{connections:6,cohesion:2}),
  option('유모를 들여 산모를 쉬게 한다','재산 −8 · 생활환경 +7',{wealth:-8,health:7})]},
 {...base,id:'surprise-runaway',title:'집을 나간 자식',description:'정해진 혼담을 거부한 {name}이(가) 편지 한 장을 남기고 집을 나갔습니다.',choices:[
  option('찾아가 뜻을 들어준다','결속 +8 · 명성 −3',{cohesion:8,reputation:-3}),
  option('가문의 체면을 지킨다','명성 +5 · 결속 −10',{reputation:5,cohesion:-10},{surpriseAction:'runaway-honor'}),
  option('돌아오기를 기다린다','비용 없음',{},{surpriseAction:'runaway-wait',chanceLabel:'돌아올 확률 50% · 돌아오면 결속 +4, 아니면 결속 −6'})]},
];

// Modern wording for events whose Joseon framing no longer fits.
const modern:Partial<Record<SurpriseId,{title:string;description:string}>>={
 'surprise-plague':{title:'유행병이 번지다',description:'유행병이 번져 {name}도 고열로 앓아누웠습니다. 어떻게 돌볼지 지금 정해야 합니다.'},
 'surprise-bandits':{title:'믿었던 거래의 배신',description:'가까운 거래처에 맡긴 돈이 사기로 사라질 위기입니다. 가족이 모은 재산이 위험합니다.'},
 'surprise-harvest':{title:'뜻밖의 호황',description:'가족의 생업에 뜻밖의 호황이 찾아와 수입이 크게 늘었습니다. 남는 것을 어디에 쓸지 정할 수 있습니다.'},
};

/** Deterministic roll in [0,1) from seed, turn and a salt. Does not touch s.rng. */
export function surpriseRoll(s:State,salt:number){
 let h=(s.seed^Math.imul(s.turn+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b))>>>0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d)>>>0;h^=h>>>15;h=Math.imul(h,0x846ca68b)>>>0;h^=h>>>16;
 return (h>>>0)/4294967296;
}

const living=(s:State)=>Object.values(s.people).filter(p=>p.alive);
const age=(s:State,p:Person)=>s.year-p.born;

export function twinsParent(s:State):Person|undefined{
 return living(s).filter(p=>p.lineage).find(p=>{
  const spouse=p.spouses.map(id=>s.people[id]).find(x=>x?.alive);if(!spouse)return false;
  const mother=p.sex==='여'?p:spouse,father=p.sex==='남'?p:spouse;
  const last=p.children.map(id=>s.people[id].born).sort((a,b)=>b-a)[0]??0;
  return age(s,mother)>=20&&age(s,mother)<=38&&age(s,father)<60&&p.children.length<=3&&s.year-last>=2;
 });
}
function runawayChild(s:State){
 const head=s.people[s.head];
 return head.children.map(id=>s.people[id]).filter(p=>p.alive&&age(s,p)>=16&&age(s,p)<=30).sort((a,b)=>b.born-a.born)[0];
}
function plagueTarget(s:State,roll:number){
 // Never the representative: the riskiest option can cost this person's life.
 const pool=living(s).filter(p=>p.id!==s.head).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 return pool.length?pool[Math.floor(roll*pool.length)]:undefined;
}
function minorOrHead(s:State){
 return living(s).filter(p=>p.lineage&&age(s,p)<18).sort((a,b)=>b.born-a.born)[0]??s.people[s.head];
}

/** Weighted list of surprises that make sense for the family right now. */
export function eligibleSurprises(s:State):{id:SurpriseId;weight:number}[]{
 const last=[...s.seen].reverse().find(id=>id.startsWith('surprise-'));
 const list:{id:SurpriseId;weight:number}[]=[
  {id:'surprise-plague',weight:living(s).some(p=>p.id!==s.head)?1+(s.stats.health<55?2:0):0},
  {id:'surprise-drought',weight:s.year<1960?1+(s.stats.stability<45?1:0):0},
  {id:'surprise-fire',weight:.8},
  {id:'surprise-bandits',weight:s.stats.wealth>=45?1+(s.stats.wealth>=65?1:0):0},
  {id:'surprise-harvest',weight:1+(s.stats.stability>=60?.5:0)},
  {id:'surprise-patron',weight:.8+(s.stats.reputation>=50?.7:0)},
  {id:'surprise-twins',weight:twinsParent(s)?.9:0},
  {id:'surprise-runaway',weight:runawayChild(s)?.8:0},
 ];
 return list.filter(x=>x.weight>0&&x.id!==last);
}

export function pickSurprise(s:State):{id:SurpriseId;target:string|null}|null{
 const list=eligibleSurprises(s);const total=list.reduce((n,x)=>n+x.weight,0);if(!total)return null;
 let r=surpriseRoll(s,2)*total,id=list[list.length-1].id;
 for(const x of list){if(r<x.weight){id=x.id;break}r-=x.weight}
 const roll=surpriseRoll(s,3);
 const target=id==='surprise-plague'?plagueTarget(s,roll)
  :id==='surprise-twins'?twinsParent(s)
  :id==='surprise-runaway'?runawayChild(s)
  :id==='surprise-patron'?minorOrHead(s)
  :s.people[s.head];
 return {id,target:target?.id??null};
}

/** The surprise as shown to the player: names filled in, modern wording when needed. */
export function prepareSurpriseEvent(s:State,e:Event):Event{
 const state=s.surprise;const target=state?.target?s.people[state.target]:undefined;
 const name=(target?.alive?target:s.people[s.head]).name;
 const fill=(t:string)=>t.replaceAll('{name}',name);
 const words=s.year>=1950?modern[e.id as SurpriseId]:undefined;
 return {...e,title:fill(words?.title??e.title),description:fill(words?.description??e.description),choices:e.choices.map(c=>({...c,title:fill(c.title),description:fill(c.description),chanceLabel:c.chanceLabel&&fill(c.chanceLabel),target:c.personalEducation?target?.id:c.target}))};
}

export function validSurprise(s:Record<string,any>,v:unknown){
 if(v===undefined)return true;
 if(!v||typeof v!=='object')return false;const x=v as Record<string,unknown>;
 return surpriseIds.includes(x.id as SurpriseId)&&(x.target===null||typeof x.target==='string'&&!!s.people[x.target])&&Number.isInteger(x.remaining)&&(x.remaining as number)>=1&&(x.remaining as number)<=15;
}
