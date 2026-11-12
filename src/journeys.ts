import type {Person,State} from './engine';
import type {Event,Choice} from './data';
import {surpriseRoll} from './surprises';
import {withParticle} from './korean';

export const JOURNEY_CHANCE=.28;
export const journeyIds=['journey-tiger','journey-flood','journey-bandits'] as const;
export type JourneyId=typeof journeyIds[number];
export type JourneyAction='escort'|'risk'|'return';
export type JourneyState={id:JourneyId;candidate:string;startedYear:number};
const content={
 'journey-tiger':{title:'한양 가는 길, 범의 울음',description:'고갯길에 짐짝 하나가 흩어져 있고, 수풀 너머에서 낮은 울음이 들립니다. 해가 지기 전에 고개를 넘으려면 결정을 내려야 합니다.',safe:'포수와 동행해 고개를 넘는다',risk:'혼자 산길을 강행한다',death:'과거를 보러 한양으로 가던 길에 호환으로 생을 마쳤습니다.',survived:'숨을 죽인 채 고개를 넘어 한양에 도착했습니다.',odds:.35,trait:'신중함',reduced:.20},
 'journey-flood':{title:'나루 앞에서 끊긴 과거길',description:'밤새 내린 비로 강물이 불었습니다. 나룻배는 끊겼고, 시험을 보러 가던 사람들은 물가에 모여 서로의 눈치를 봅니다.',safe:'길잡이를 구해 상류 다리로 돌아간다',risk:'거센 물살을 헤치고 건넌다',death:'과거길에서 불어난 강을 건너다 물살에 휩쓸려 생을 마쳤습니다.',survived:'젖은 책보를 품에 안고 강을 건너 한양에 도착했습니다.',odds:.30,trait:'끈기 있음',reduced:.20},
 'journey-bandits':{title:'책보를 가로막은 산적',description:'외진 길에서 낯선 무리가 앞을 막았습니다. 책보와 노잣돈을 내놓으라며 다가옵니다. 함께 길을 나섰던 사람들은 이미 흩어졌습니다.',safe:'노잣돈을 내주고 사람을 따라 큰길로 간다',risk:'책보를 지키며 홀로 돌파한다',death:'과거길에서 산적에게 맞서다 생을 마쳤습니다.',survived:'책보를 놓지 않고 산적을 따돌려 한양에 도착했습니다.',odds:.25,trait:'신중함',reduced:.15},
} as const;

export function beginExamJourney(s:State,candidate:Person):JourneyState|undefined {
 if(s.turn<3||s.year<1394||s.year>=1894||surpriseRoll(s,20)>=JOURNEY_CHANCE)return undefined;
 return {id:journeyIds[Math.floor(surpriseRoll(s,21)*journeyIds.length)],candidate:candidate.id,startedYear:s.year};
}
export function journeyRisk(s:State){const j=s.journey;if(!j)return 0;const d=content[j.id],p=s.people[j.candidate];return p?.trait===d.trait?d.reduced:d.odds;}
export function journeyEscortCost(s:State){return s.stats.connections>=60?3:6;}
export function journeyText(id:JourneyId){return content[id];}
export const journeyEvents:Event[]=journeyIds.map(id=>({id,title:content[id].title,description:content[id].description,kind:'surprise',min:1394,max:1893,choices:[]}));

export function prepareJourneyEvent(s:State):Event {
 const j=s.journey!,p=s.people[j.candidate],d=content[j.id],risk=Math.round(journeyRisk(s)*100),cost=journeyEscortCost(s);
 const choices:Choice[]=[
  {title:d.safe,description:`추가 재산 −${cost} · 이 사건의 사망 위험 없이 도착 후 응시${cost===3?' · 연결 60 혜택':''}`,effects:{wealth:-cost},journeyAction:'escort'},
  {title:d.risk,description:`추가 비용 없음 · 살아남으면 응시 · 사망하면 응시 취소`,effects:{},journeyAction:'risk',chanceLabel:`${p.name} 사망 확률 ${risk}% · 게임 확률${p.trait===d.trait?` · ${p.trait}으로 ${Math.round(d.odds*100)}% → ${risk}%`:''}`},
  {title:'이번 과거를 포기하고 집으로 돌아간다',description:'추가 비용·사건 사망 위험 없음 · 이미 쓴 준비비 8은 돌아오지 않음',effects:{},journeyAction:'return'},
 ];
 return {...journeyEvents.find(e=>e.id===j.id)!,description:`${withParticle(p.name,'은/는')} ${p.region}에서 한양으로 과거를 보러 가던 중입니다. ${d.description}`,choices};
}

export function validJourney(s:Record<string,any>,value:unknown):boolean {
 if(value===undefined)return !(s.phase==='play'&&String(s.event).startsWith('journey-'));
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const j=value as Record<string,unknown>,p=typeof j.candidate==='string'?s.people[j.candidate]:undefined;
 return journeyIds.includes(j.id as JourneyId)&&s.event===j.id&&s.phase==='play'&&!s.surprise&&Number.isInteger(j.startedYear)&&j.startedYear===s.year&&s.year>=1394&&s.year<1894&&!!p&&p.alive&&p.lineage&&p.sex==='남'&&s.year-p.born>=18&&s.year-p.born<75;
}
