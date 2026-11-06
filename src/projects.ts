import type {Choice,Stat} from './data';
import type {State} from './engine';

export type ProjectId='learning'|'trade'|'care';
export type ProjectState={active:ProjectId|null;progress:Record<ProjectId,number>;completed:ProjectId[]};
export type Project={id:ProjectId;title:string;description:string;requirement:string;reward:string;stat:Stat;threshold:number;keys:string[]};
export const projects:Project[]=[
 {id:'learning',title:'배움의 집',description:'배울 기회를 모아 다음 세대에게 물려주세요.',requirement:'배움 선택 3회 · 교육 55',reward:'현재 생존한 미성년의 교육 +12 · 배움 특별 선택 해금',stat:'education',threshold:55,keys:['learning']},
 {id:'trade',title:'신뢰받는 상가',description:'꾸준한 거래로 가문의 든든한 수입원을 마련하세요.',requirement:'상업 선택 3회 · 연결 55',reward:'부채 최대 8 상환, 남는 몫은 재산 · 상업 특별 선택 해금',stat:'connections',threshold:55,keys:['trade']},
 {id:'care',title:'함께 사는 집',description:'돌봄을 이어 가며 가족의 생활 기반을 다져주세요.',requirement:'돌봄 선택 3회 · 결속 65',reward:'현재 생존 가족 건강 +10 · 생활환경 +8 · 돌봄 특별 선택 해금',stat:'cohesion',threshold:65,keys:['care']},
];
export function projectState(s:Pick<State,'projects'>):ProjectState{return s.projects??{active:null,progress:{learning:0,trade:0,care:0},completed:[]}}
export function projectProgress(s:Pick<State,'projects'>,id:ProjectId){return projectState(s).progress[id]}
export function projectComplete(s:Pick<State,'projects'>,id:ProjectId){return projectState(s).completed.includes(id)}
export function projectMatches(s:Pick<State,'projects'>,c:Choice){const active=projectState(s).active;return !!active&&projects.find(p=>p.id===active)!.keys.includes(c.legacy??'')}

// These choices are visible before unlocking, so their long-term payoff is reviewable.
export function projectChoice(eventId:string):Choice|undefined{
 if(eventId==='life1')return {title:'가문의 배움터에서 이웃과 지식을 나눈다',description:'재산 −2 · 교육 +6 · 연결 +6',effects:{wealth:-2,education:6,connections:6},legacy:'learning',unlock:'learning'};
 if(eventId==='life2')return {title:'가족이 함께 아이를 가르친다',description:'재산 −2 · 가문 교육 +4 · 이 아이 교육 +12',effects:{wealth:-2,education:4},personalEducation:12,legacy:'learning',unlock:'learning'};
 if(eventId==='life0')return {title:'단골 거래를 꾸준히 이어 간다',description:'재산 +7 · 연결 +3 · 결속 −2',effects:{wealth:7,connections:3,cohesion:-2},legacy:'trade',unlock:'trade'};
 if(eventId==='life3')return {title:'믿을 만한 거래처와 수익을 나눈다',description:'재산 +6 · 연결 +5',effects:{wealth:6,connections:5},legacy:'trade',unlock:'trade'};
 if(eventId==='life4')return {title:'가족이 배운 기술로 집을 함께 고친다',description:'재산 −3 · 생활환경 +8 · 결속 +3',effects:{wealth:-3,health:8,cohesion:3},legacy:'care',unlock:'care'};
 if(eventId==='life5')return {title:'정착된 돌봄을 이웃과 나눈다',description:'재산 −2 · 결속 +7 · 연결 +6',effects:{wealth:-2,cohesion:7,connections:6},legacy:'care',unlock:'care'};
}
