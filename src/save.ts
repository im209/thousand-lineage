import {events,clans,labels} from './data';
import {validate,type State} from './engine';
import {projects} from './projects';
import {chronicles} from './chronicles';
import {validBenchmark} from './share-links';
import {validSurprise} from './surprises';
const record=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
export function decodeSave(raw:string|null):State|null{
 try{const s:unknown=JSON.parse(raw??'null');if(!record(s)||s.version!==1||!record(s.people)||!record(s.stats)||!record(s.peak))return null;
 if(!Number.isSafeInteger(s.year)||s.year<1392||s.year>2026&&s.endless!==true||!clans[s.clan]||!['play','succession','ended'].includes(s.phase)||!events.some(e=>e.id===s.event))return null;
 if(!finite(s.seed)||!finite(s.rng)||!finite(s.debt)||s.debt<0||!finite(s.turn)||!finite(s.peak.year)||!finite(s.peak.wealth))return null;
 if(!s.people[s.head]||!s.people[s.founder]||!strings(s.moves)||!s.moves.length||!strings(s.seen)||!Array.isArray(s.legacies))return null;
 if(!s.legacies.every((l:unknown)=>record(l)&&typeof l.key==='string'&&finite(l.generation)))return null;
 if(!Object.keys(labels).every(k=>finite(s.stats[k])&&s.stats[k]>=0&&s.stats[k]<=100))return null;
 const entries=(list:unknown)=>Array.isArray(list)&&list.every(l=>record(l)&&finite(l.year)&&typeof l.text==='string');
 if(!entries(s.log)||!s.log.every((l:any)=>typeof l.kind==='string'))return null;
 for(const [id,p] of Object.entries(s.people)){if(!record(p)||p.id!==id||typeof p.name!=='string'||typeof p.surname!=='string'||!clans[p.clan]||!['여','남'].includes(p.sex)||typeof p.alive!=='boolean'||typeof p.lineage!=='boolean')return null;
 if(!finite(p.born)||p.born>s.year||!(p.died===null||finite(p.died))||!finite(p.generation)||p.generation<1||!finite(p.health)||!finite(p.education)||!finite(p.estate)||!finite(p.ability))return null;
 if(!['parents','children','spouses','adoptiveParents'].every(k=>strings(p[k])&&p[k].every((key:string)=>!!s.people[key]))||!entries(p.life))return null;
 if(!['job','region','trait'].every(k=>typeof p[k]==='string'))return null;
 // Migrate earlier saves that assigned adult careers to minors.
 if(s.year-p.born<18)p.job='미성년';
 }
 if(s.report){const r=s.report;if(!record(r)||!finite(r.from)||!finite(r.to)||r.to!==s.year||typeof r.title!=='string'||typeof r.decision!=='string'||!record(r.changes)||!record(r.immediate)||!entries(r.entries)||!['borrowed','debtBefore','debtAfter'].every(k=>finite(r[k])))return null;if(![r.changes,r.immediate].every(obj=>Object.entries(obj).every(([k,v])=>k in labels&&finite(v))))return null;}
 if(s.report?.outcome!==undefined&&(typeof s.report.outcome!=='string'||s.report.outcome.length>2000))return null;
 if(s.representativeCount!==undefined&&(!Number.isInteger(s.representativeCount)||s.representativeCount<1))return null;
 if(s.endless!==undefined&&typeof s.endless!=='boolean')return null;
 if(s.challenge!==undefined&&!validBenchmark(s.challenge))return null;
 if(s.runId!==undefined&&(typeof s.runId!=='string'||s.runId.length<1||s.runId.length>120))return null;
 if(s.introPending!==undefined&&typeof s.introPending!=='boolean')return null;
 if(!validSurprise(s,s.surprise))return null;
 if(s.introPending&&(s.year!==1392||s.turn!==0||s.phase!=='play'||s.report||s.head!==s.founder||s.event!=='h1392'))return null;
 if(s.chronicles!==undefined){
  const c=s.chronicles,arcIds=chronicles.map(a=>a.id),outcomes=chronicles.flatMap(a=>a.outcomes.map(o=>o.id));
  if(!record(c)||!(c.selected===null||arcIds.includes(c.selected))||!strings(c.completed)||!Array.isArray(c.history))return null;
  if(c.completed.length>outcomes.length||new Set(c.completed).size!==c.completed.length||c.completed.some(id=>!outcomes.includes(id as any))||c.history.length!==c.completed.length)return null;
  if(!c.history.every((h:unknown,i:number)=>{if(!record(h))return false;const arc=chronicles.find(a=>a.id===h.arc),actor=h.actor===null?null:s.people[h.actor];return !!arc&&arc.outcomes.some(o=>o.id===h.outcome)&&h.outcome===c.completed[i]&&Number.isInteger(h.year)&&h.year>=arc.min&&h.year<=arc.max&&h.year<=s.year&&(i===0||h.year>=c.history[i-1].year)&&(h.actor===null||!!actor&&actor.lineage&&actor.born<=h.year&&(actor.died===null||actor.died>=h.year));}))return null;
  if(c.active!==null){const a=c.active;if(!record(a))return null;const arc=chronicles.find(x=>x.id===a.arc);if(!arc||!Number.isInteger(a.startedYear)||a.startedYear<arc.min||a.startedYear>arc.max||a.startedYear>s.year||!Number.isInteger(a.dueTurn)||a.dueTurn<0||a.dueTurn>s.turn+3||(c.selected!==null&&c.selected!==a.arc))return null;}
 }
 if(s.society!==undefined){
  const a=s.society;if(!record(a))return null;
  if(!['commoner','specialist','yangban','nobi'].includes(a.origin)||!['commoner','specialist','yangban','nobi','citizen'].includes(a.standing)||!['livelihood','advancement','politics'].includes(a.focus)||!['none','technical','local','court'].includes(a.office)||!['quiet','exile','kingmaker','founder'].includes(a.political))return null;
  if(typeof a.examPassed!=='boolean'||typeof a.alternate!=='boolean'||!(a.examPerson===null||typeof a.examPerson==='string'&&!!s.people[a.examPerson]))return null;
  if(!finite(a.recognition)||a.recognition<0||a.recognition>10||!['support','risk'].every(k=>finite(a[k])&&a[k]>=0&&a[k]<=100)||!Number.isInteger(a.lastEventTurn)||a.lastEventTurn< -2||a.lastEventTurn>s.turn)return null;
  if(!strings(a.achievements)||new Set(a.achievements).size!==a.achievements.length||!a.achievements.every(id=>['freed','exam','yangban','court','kingmaker','founder','restored','abolished'].includes(id)))return null;
 }
 if(s.projects!==undefined){
  const p=s.projects,ids=projects.map(p=>p.id);
  if(!record(p)||!record(p.progress)||!Array.isArray(p.completed)||!(p.active===null||ids.includes(p.active)))return null;
  if(!ids.every(id=>Number.isInteger(p.progress[id])&&p.progress[id]>=0&&p.progress[id]<=3)||Object.keys(p.progress).some(id=>!ids.includes(id as any)))return null;
  if(!p.completed.every((id:unknown)=>typeof id==='string'&&ids.includes(id as any))||new Set(p.completed).size!==p.completed.length)return null;
  if(p.completed.some((id:string)=>p.progress[id]!==3)||p.completed.includes(p.active))return null;
 }
 const state=s as State;return validate(state).length===0?state:null;
 }catch{return null}
}
