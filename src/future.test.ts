import {describe,it,expect,beforeEach,vi} from 'vitest';
import {create,choose,canContinueFuture,continueFuture,continueStory,validate,candidates,succeed,type State} from './engine';
import {decodeSave} from './save';
import {era} from './data';
import {recordRun,readRecords} from './records';
import {challengeFor,challengeUrl,readChallenge,CHALLENGE_RULES} from './share-links';

function milestone(){const s=create(42);s.year=2026;s.people[s.head].born=1990;s.phase='ended';s.endReason='2026년까지 존속';s.runId='original-record';return s;}
beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});});
describe('continuing the family beyond the present',()=>{
 it('resumes existing 2026 saves without replacing their family or collected milestone',()=>{
  const s=decodeSave(JSON.stringify(milestone()))!,before=JSON.stringify(s),old=recordRun(s).records;
  expect(canContinueFuture(s)).toBe(true);
  const next=continueFuture(s);expect(JSON.stringify(s)).toBe(before);expect(next.endless).toBe(true);expect(next.phase).toBe('play');
  expect(next.people).toEqual(s.people);expect(next.seed).toBe(s.seed);expect(next.clan).toBe(s.clan);expect(next.runId).not.toBe(s.runId);
  expect(next.report).toBeUndefined();expect(readRecords().records).toEqual(old);expect(decodeSave(JSON.stringify(next))).toEqual(next);
  const advanced=choose(next,0);expect(advanced.year).toBeGreaterThan(2026);expect(advanced.endReason).not.toBe('2026년까지 존속');expect(validate(advanced)).toEqual([]);
 });
 it('supports years and generations far beyond the old limits in saves, records and invitations',()=>{
  const s=continueFuture(milestone());s.year=4000;s.people[s.head].born=3970;s.people[s.head].generation=150;
  const next=choose(s,0);expect(next.year).toBeGreaterThan(4000);expect(validate(next)).toEqual([]);expect(decodeSave(JSON.stringify(next))).toEqual(next);expect(era(next.year)).toBe('가상의 미래');
  const data=challengeFor(next,next.year-1392,150),url=challengeUrl(data,'https://example.com/game/');
  expect(readChallenge(new URL(url).hash)).toEqual({kind:'ready',data,compatible:true});
  next.phase='ended';for(const p of Object.values(next.people)){if(p.alive){p.alive=false;p.died=next.year;}}next.endReason='후계자 부재';
  const records=recordRun(next).records;expect(records.bestYears).toBeGreaterThan(634);expect(records.bestGenerations).toBe(150);expect(readRecords().records).toEqual(records);
  expect(records.endings).toContain('extinct');expect(CHALLENGE_RULES).not.toBe('family-20261106-2');
 });
 it('keeps extinction final and sends a deceased representative to succession at the milestone',()=>{
  const initial=create(42);expect(continueFuture(initial)).toBe(initial);
  const ended=milestone();ended.people[ended.head].alive=false;ended.people[ended.head].died=2026;
  expect(continueFuture(ended)).toBe(ended);
  const child={...structuredClone(ended.people[ended.head]),id:'child',name:'김서연',born:2010,died:null,alive:true,generation:2,parents:[ended.head],children:[],spouses:[]};
  ended.people.child=child;ended.people[ended.head].children=['child'];
  const next=continueFuture(ended);expect(next.phase).toBe('succession');expect(candidates(next)[0].id).toBe('child');expect(succeed(next,'child').phase).toBe('play');
  expect(continueFuture(next)).toBe(next);
 });
 it('records future extinction separately and preserves the earlier survival ending',()=>{
  const s=milestone(),old=recordRun(s).records.recent[0],future=continueFuture(s);
  future.year=2200;future.phase='ended';future.endReason='후계자 부재';for(const p of Object.values(future.people)){p.alive=false;p.died=2200;}
  const records=recordRun(future).records;expect(records.recent).toHaveLength(2);expect(records.recent[1]).toEqual(old);expect(records.recent[0].endingId).toBe('extinct');
  expect(records.endings).toContain(old.endingId);expect(readRecords().records.recent).toEqual(records.recent);
 });
});
