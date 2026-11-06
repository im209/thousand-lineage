import {endingFor,endings,type EndingId,type Ending} from './endings';
import {summary,type State} from './engine';

export type RecordedProject='learning'|'trade'|'care';
export type RunRecord={id:string;clan:number;years:number;generations:number;seed:number;endedYear:number;projects:RecordedProject[];reason:string;endingId?:EndingId};
export type RunRecords={version:1;bestYears:number;bestGenerations:number;projects:RecordedProject[];endings:EndingId[];recent:RunRecord[]};
export type RecordsResult={records:RunRecords;error:string};
const key='thousand-lineage-records-v1';
const projectIds:RecordedProject[]=['learning','trade','care'];
const endingIds=new Set<EndingId>(endings.map(ending=>ending.id));
const isEnding=(value:unknown):value is EndingId=>typeof value==='string'&&endingIds.has(value as EndingId);
const inferEnding=(reason:string)=>endings.find(ending=>ending.title===reason)?.id;
const empty=():RunRecords=>({version:1,bestYears:0,bestGenerations:0,projects:[],endings:[],recent:[]});
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown,min=0,max=Number.MAX_SAFE_INTEGER):value is number=>typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=max;
const projectList=(value:unknown):value is RecordedProject[]=>Array.isArray(value)&&value.length<=3&&new Set(value).size===value.length&&value.every(id=>projectIds.includes(id));
function validRun(value:unknown):value is RunRecord{
 if(!object(value))return false;
 return typeof value.id==='string'&&value.id.length>0&&value.id.length<=120&&integer(value.clan)&&integer(value.seed,0,0xffffffff)&&integer(value.years,0,Number.MAX_SAFE_INTEGER-1392)&&integer(value.endedYear,1392)&&value.endedYear-1392===value.years&&integer(value.generations,1)&&projectList(value.projects)&&typeof value.reason==='string'&&value.reason.length<=200&&(value.endingId===undefined||isEnding(value.endingId));
}
function parseRecords(raw:string|null):RunRecords|null{
 if(raw===null)return empty();
 const value:unknown=JSON.parse(raw);
 if(!object(value)||value.version!==1||!integer(value.bestYears,0,Number.MAX_SAFE_INTEGER-1392)||!integer(value.bestGenerations)||!projectList(value.projects)||!Array.isArray(value.recent)||value.recent.length>10||!value.recent.every(validRun))return null;
 if(new Set(value.recent.map(r=>r.id)).size!==value.recent.length||value.recent.some(r=>r.years>Number(value.bestYears)||r.generations>Number(value.bestGenerations)||r.projects.some(p=>!(value.projects as RecordedProject[]).includes(p))))return null;
 if(value.endings!==undefined&&(!Array.isArray(value.endings)||value.endings.length>endings.length||new Set(value.endings).size!==value.endings.length||!value.endings.every(isEnding)))return null;
 // Version 1 existed before ending collections. Only exact known titles are
 // evidence for migration; generic causes such as "후계자 부재" remain unknown.
 const recent=value.recent.map(run=>{const id=run.endingId??inferEnding(run.reason);return id?{...run,endingId:id}:run});
 const collected=[...(value.endings as EndingId[]|undefined??[])];
 for(const run of recent)if(run.endingId&&!collected.includes(run.endingId))collected.push(run.endingId);
 return {version:1,bestYears:value.bestYears,bestGenerations:value.bestGenerations,projects:value.projects,endings:collected,recent};
}
export function readRecords():RecordsResult{
 let raw:string|null;
 try{raw=localStorage.getItem(key)}catch{return {records:empty(),error:'브라우저 기록장에 접근할 수 없습니다. 이번 게임은 계속할 수 있습니다.'}}
 try{const records=parseRecords(raw);if(records)return {records,error:''}}catch{/* Damaged metadata must never block the active game. */}
 return {records:empty(),error:'이전 기록장을 읽지 못했습니다. 현재 게임의 자동 저장은 별도로 유지됩니다.'};
}
// Legacy saves have no runId. Their completed history yields a stable identity,
// excluding the dismissible result panel so reload/continue cannot add a duplicate.
function legacyId(s:State){
 const text=JSON.stringify([s.seed,s.clan,s.year,s.turn,s.rng,s.log]);let a=2166136261,b=5381;
 for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i)}
 return `legacy-${s.seed}-${s.clan}-${(a>>>0).toString(16)}-${(b>>>0).toString(16)}`;
}
// Display the ending that this completed attempt actually collected. New
// classification rules may expose more eligible titles without awarding them.
export function recordedEndingFor(s:State,records:RunRecords):Ending{
 if(s.phase==='ended'){
  const id=s.runId||legacyId(s),record=records.recent.find(run=>run.id===id);
  const ending=record?.endingId?endings.find(ending=>ending.id===record.endingId):undefined;
  if(ending)return ending;
 }
 return endingFor(s);
}
export function recordRun(s:State):RecordsResult{
 const previous=readRecords();if(s.phase!=='ended')return previous;
 // Structural intersection also keeps this module compatible with old saves.
 const extra=s as State&{runId?:string;projects?:{completed:RecordedProject[]}};
 const id=extra.runId||legacyId(s);
 const result=summary(s),completed=projectIds.filter(id=>extra.projects?.completed.includes(id)),ending=endingFor(s);
 const existing=previous.records.recent.find(r=>r.id===id);
 let records:RunRecords;
 if(existing){
  // A classified ending belongs to that completed attempt permanently. New
  // content must not turn a reload of an old ending into another collectible.
  if(existing.endingId)return previous;
  if(existing.seed!==s.seed||existing.clan!==s.clan||existing.endedYear!==s.year||existing.years!==result.years||existing.generations!==result.generations)return previous;
  records={...previous.records,endings:[...new Set([...previous.records.endings,ending.id])],recent:previous.records.recent.map(run=>run.id===id?{...run,endingId:ending.id}:run)};
 }else{
  const run:RunRecord={id,clan:s.clan,years:result.years,generations:result.generations,seed:s.seed,endedYear:s.year,projects:completed,reason:ending.title,endingId:ending.id};
  records={version:1,bestYears:Math.max(previous.records.bestYears,run.years),bestGenerations:Math.max(previous.records.bestGenerations,run.generations),projects:projectIds.filter(id=>previous.records.projects.includes(id)||completed.includes(id)),endings:[...new Set([...previous.records.endings,ending.id])],recent:[run,...previous.records.recent].slice(0,10)};
 }
 try{localStorage.setItem(key,JSON.stringify(records));return {records,error:previous.error}}
 catch{return {records,error:'이번 결과를 기록장에 저장하지 못했습니다. 표시된 최고 기록은 이 화면에만 남을 수 있습니다.'}}
}
