import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {create,type State} from './engine';
import {readRecords,recordRun,recordedEndingFor} from './records';
import {endingFor,eligibleEndings} from './endings';

let values:Map<string,string>;
beforeEach(()=>{values=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)})});
afterEach(()=>vi.unstubAllGlobals());
function ended(runId:string,years=30):State{
 const s=create(42) as State&{runId:string};s.runId=runId;s.phase='ended';s.year=1392+years;s.endReason='후계자 부재';return s;
}
describe('browser run records',()=>{
 it('does not record unfinished games and deduplicates an ending after reload',()=>{
  expect(recordRun(create(42)).records.recent).toHaveLength(0);expect(values.size).toBe(0);
  const s=ended('first');recordRun(s);const loaded=JSON.parse(JSON.stringify(s));delete loaded.report;
  expect(recordRun(loaded).records.recent).toHaveLength(1);
 });
 it('counts separate same-seed attempts and preserves independent bests',()=>{
  recordRun(ended('first',120));const second=ended('retry',60);second.people[second.head].generation=4;
  const r=recordRun(second).records;expect(r.recent).toHaveLength(2);expect(r.bestYears).toBe(120);expect(r.bestGenerations).toBe(4);
  expect(readRecords().records).toEqual(r);
 });
 it('keeps ten recent results without losing older bests or discoveries',()=>{
  const first=ended('first',600) as State&{projects:{completed:('learning'|'trade'|'care')[]}};
  first.projects={active:null,progress:{learning:3,trade:0,care:0},completed:['learning']};recordRun(first);
  for(let i=0;i<12;i++)recordRun(ended(`run-${i}`,i+10));
  const {records}=readRecords();expect(records.recent).toHaveLength(10);expect(records.bestYears).toBe(600);expect(records.projects).toEqual(['learning']);expect(records.recent[0].id).toBe('run-11');expect(records.endings).toEqual(['learning','survivor']);
 });
 it('deduplicates legacy games even when result panels are dismissed',()=>{
  const s=ended('unused');delete (s as State&{runId?:string}).runId;recordRun(s);
  expect(recordRun(JSON.parse(JSON.stringify(s))).records.recent).toHaveLength(1);
 });
 it('handles malformed records without damaging the active save',()=>{
  values.set('thousand-lineage-v1','untouched');values.set('thousand-lineage-records-v1','{broken');
  expect(readRecords().error).toContain('읽지 못했습니다');expect(readRecords().records.recent).toEqual([]);
  expect(recordRun(ended('recovered')).records.recent).toHaveLength(1);expect(values.get('thousand-lineage-v1')).toBe('untouched');
  values.set('thousand-lineage-records-v1',JSON.stringify({version:1,bestYears:0,bestGenerations:0,projects:[],recent:[{id:'invalid'}]}));
  expect(readRecords().error).not.toBe('');
 });
 it('reports denied reads and writes without throwing',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied')},setItem:()=>{throw Error('denied')}});
  expect(readRecords().error).not.toBe('');const result=recordRun(ended('not-persisted'));
  expect(result.error).toContain('저장하지 못했습니다');expect(result.records.bestYears).toBe(30);
 });
 it('collects exactly one primary ending per completed attempt, not every eligible title',()=>{
  const s=ended('many-merits');s.society!.achievements=['freed','founder','yangban'];
  Object.assign(s,{chronicles:{completed:['relief','medicine','books','market']}});
  expect(eligibleEndings(s).length).toBeGreaterThan(5);expect(endingFor(s).id).toBe('freed_founder');
  const r=recordRun(s).records;expect(r.endings).toEqual(['freed_founder']);expect(r.recent[0].endingId).toBe('freed_founder');
  expect(recordRun(s).records).toEqual(r);
 });
 it('migrates exact legacy titles without resetting bests, projects, or unknown records',()=>{
  const known=recordRun(ended('known',90)).records;recordRun(ended('unknown',50));
  const legacy:any=structuredClone(readRecords().records);delete legacy.endings;
  legacy.recent.forEach((r:any)=>delete r.endingId);
  legacy.recent[0].reason='후계자 부재';legacy.recent[1].reason='상업 명가';
  legacy.projects=['learning'];legacy.recent[0].projects=['learning'];
  values.set('thousand-lineage-records-v1',JSON.stringify(legacy));
  const migrated=readRecords();expect(migrated.error).toBe('');expect(migrated.records.bestYears).toBe(known.bestYears);
  expect(migrated.records.projects).toEqual(['learning']);expect(migrated.records.recent).toHaveLength(2);
  expect(migrated.records.endings).toEqual(['trade']);expect(migrated.records.recent[0].endingId).toBeUndefined();expect(migrated.records.recent[1].endingId).toBe('trade');
 });
 it('backfills one unknown legacy ending only when the saved attempt facts match',()=>{
  const s=ended('backfill',80);s.society!.achievements=['freed'];const legacy:any=structuredClone(recordRun(s).records);
  delete legacy.endings;delete legacy.recent[0].endingId;legacy.recent[0].reason='2026년까지 존속';
  values.set('thousand-lineage-records-v1',JSON.stringify(legacy));
  const mismatch=structuredClone(s);mismatch.year++;expect(recordRun(mismatch).records.endings).toEqual([]);
  const filled=recordRun(s).records;expect(filled.endings).toEqual(['freed']);expect(filled.recent).toHaveLength(1);expect(filled.recent[0].endingId).toBe('freed');expect(filled.recent[0].reason).toBe('2026년까지 존속');
  expect(recordRun(s).records).toEqual(filled);
 });
 it('does not reclassify an already collected attempt when newer content qualifies',()=>{
  const s=ended('stable-ending');recordRun(s);
  Object.assign(s,{chronicles:{completed:['school']}});
  expect(endingFor(s).id).toBe('school');expect(recordRun(s).records.endings).toEqual(['survivor']);
  s.runId='new-attempt';const next=recordRun(s).records;expect(next.endings).toEqual(['survivor','school']);expect(next.recent).toHaveLength(2);
 });
 it('displays the collected historical ending despite a newly eligible combination, for current and legacy identities',()=>{
  for(const legacy of [false,true]){
   const s=ended(legacy?'legacy-display':'current-display');if(legacy)delete s.runId;
   s.society!.achievements=['freed','founder'];const records=structuredClone(recordRun(s).records);
   const matching=records.recent[0];matching.endingId='founder';matching.reason='새 왕조의 후손';records.endings=['founder'];
   expect(endingFor(s).id).toBe('freed_founder');expect(recordedEndingFor(s,records).id).toBe('founder');
   const loaded=JSON.parse(JSON.stringify(s));delete loaded.report;expect(recordedEndingFor(loaded,records).id).toBe('founder');
   const newAttempt=structuredClone(s);newAttempt.runId='another-attempt';expect(recordedEndingFor(newAttempt,records).id).toBe('freed_founder');
   const unfinished=structuredClone(s);unfinished.phase='play';expect(recordedEndingFor(unfinished,records).id).toBe('freed_founder');
   delete matching.endingId;expect(recordedEndingFor(s,records).id).toBe('freed_founder');
  }
 });
 it('rejects corrupt ending identifiers and never invents badges from partial titles',()=>{
  const base=recordRun(ended('corrupt')).records;
  values.set('thousand-lineage-records-v1',JSON.stringify({...base,endings:['made-up-ending']}));expect(readRecords().error).not.toBe('');
  values.set('thousand-lineage-records-v1',JSON.stringify({...base,recent:[{...base.recent[0],endingId:'made-up-ending'}]}));expect(readRecords().error).not.toBe('');
  const partial:any=structuredClone(base);delete partial.endings;delete partial.recent[0].endingId;partial.recent[0].reason='상업 명가가 될 뻔한 가문';
  values.set('thousand-lineage-records-v1',JSON.stringify(partial));expect(readRecords().records.endings).toEqual([]);
 });
});
