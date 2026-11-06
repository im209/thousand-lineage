import {describe,it,expect} from 'vitest';
import {create,selectProject,choose,continueStory,currentEvent,choiceAvailable,projectState,projectProgress,projectComplete,turnYears,type State,type Person} from './engine';
import {decodeSave} from './save';

function stoppedFixture():State{const s=create(42);s.year=2026;s.people[s.head].born=2000;s.society!.focus='livelihood';return s}
function other(s:State,id:string,age:number,alive=true):Person{return {...structuredClone(s.people[s.head]),id,name:id,born:s.year-age,alive,died:alive?null:s.year-1,health:70,education:20,parents:[],children:[],spouses:[],adoptiveParents:[],life:[]}}

describe('family projects',()=>{
 it('selects without changing time or RNG, preserves progress across a switch, and blocks locked UI phases',()=>{
  const original=create(42),s=selectProject(original,'care');
  expect(projectState(original).active).toBeNull();expect(projectState(s).active).toBe('care');
  expect(s.year).toBe(original.year);expect(s.rng).toBe(original.rng);
  s.projects!.progress.care=2;expect(selectProject(s,'learning').projects!.progress.care).toBe(2);
  expect(selectProject({...s,phase:'succession'},'trade').projects!.active).toBe('care');
  const result=choose(s,0);expect(selectProject(result,'trade')).toBe(result);
 });
 it('advances only the active matching legacy and requires both progress and threshold',()=>{
  let s=selectProject(stoppedFixture(),'learning');s.stats.education=20;s.event='life1';
  s=continueStory(choose(s,0));expect(projectProgress(s,'learning')).toBe(0);
  for(let i=0;i<3;i++){s.event='life1';s=continueStory(choose(s,2));}
  expect(projectProgress(s,'learning')).toBe(3);expect(projectComplete(s,'learning')).toBe(false);
  s.stats.education=55;s.event='life1';s=choose(s,1);
  expect(projectComplete(s,'learning')).toBe(true);expect(projectProgress(s,'learning')).toBe(3);
 });
 it('rewards living minors once, persists completion, and cannot farm by switching or reloading',()=>{
  let s=selectProject(stoppedFixture(),'learning');s.stats.education=60;s.projects!.progress.learning=2;
  s.people.child=other(s,'child',8);s.people.adult=other(s,'adult',20);s.people.dead=other(s,'dead',8,false);s.event='life1';
  const next=choose(s,2);expect(next.people.child.education).toBe(32);expect(next.people.adult.education).toBe(20);expect(next.people.dead.education).toBe(20);
  expect(next.report!.entries.filter(l=>l.kind==='project')).toHaveLength(1);
  const restored=decodeSave(JSON.stringify(next))!;expect(restored).not.toBeNull();expect(choose(restored,2)).toBe(restored);
  s=continueStory(restored);expect(selectProject(s,'learning')).toBe(s);s.event='life1';const again=choose(s,2);
  expect(again.people.child.education).toBe(32);expect(again.report!.entries.filter(l=>l.kind==='project')).toHaveLength(0);
 });
 it('gates the fourth choice in the engine and unlocks both applicable events',()=>{
  const s=stoppedFixture();s.event='life3';expect(currentEvent(s).choices).toHaveLength(4);expect(choiceAvailable(s,3)).toBe(false);expect(choose(s,3)).toBe(s);
  s.projects={active:null,progress:{learning:0,trade:3,care:0},completed:['trade']};expect(choiceAvailable(s,3)).toBe(true);
  expect(choose(s,3).report!.immediate.wealth).toBe(6);s.event='life0';expect(choiceAvailable(s,3)).toBe(true);expect(choiceAvailable(s,4)).toBe(false);
 });
 it('repays debt first and gives only the unused portion as wealth',()=>{
  const s=selectProject(stoppedFixture(),'trade');s.projects!.progress.trade=2;s.stats.connections=60;s.stats.wealth=30;s.debt=5;s.event='life3';
  const next=choose(s,0);expect(next.debt).toBe(0);expect(next.stats.wealth).toBe(30); // -3 negotiated cost +3 unused reward.
  expect(next.report!.entries.find(l=>l.kind==='project')!.text).toContain('부채 5.0점 상환');
 });
 it('care improves living health only, clamps values, and never resurrects anyone',()=>{
  const s=selectProject(stoppedFixture(),'care');s.projects!.progress.care=2;s.stats.cohesion=80;s.stats.health=60;s.event='life5';
  s.people.child=other(s,'child',8);s.people.child.health=96;s.people.dead=other(s,'dead',35,false);
  const next=choose(s,0);expect(next.people.child.health).toBe(100);expect(next.people.dead.health).toBe(70);expect(next.people.dead.alive).toBe(false);expect(next.stats.health).toBe(72);
 });
 it('accepts legacy saves while rejecting malformed project state and run identifiers',()=>{
  const s=create(42);delete s.projects;expect(decodeSave(JSON.stringify(s))).not.toBeNull();expect(projectState(s).progress).toEqual({learning:0,trade:0,care:0});
  for(const projects of [{active:'bad',progress:{learning:0,trade:0,care:0},completed:[]},{active:null,progress:{learning:4,trade:0,care:0},completed:[]},{active:null,progress:{learning:3,trade:0,care:0},completed:['learning','learning']},{active:'learning',progress:{learning:3,trade:0,care:0},completed:['learning']}])expect(decodeSave(JSON.stringify({...s,projects}))).toBeNull();
  expect(decodeSave(JSON.stringify({...s,runId:'x'.repeat(121)}))).toBeNull();
 });
 it('uses five-year opening decisions and keeps historical stops exact',()=>{
  let s=create(42);expect(turnYears(s)).toEqual({min:5,max:5});s=choose(s,0);expect(s.report!.to-s.report!.from).toBe(5);
  expect(turnYears({...s,event:'life0',turn:3})).toEqual({min:10,max:15});
  const old=create(42);old.year=1589;old.people[old.head].born=1565;old.turn=4;old.event='life0';const next=continueStory(choose(old,0));expect(next.year).toBe(1592);expect(next.event).toBe('h1592');
 });
 it('does not schedule scarcity when both resources are comfortable',()=>{
  for(let seed=1;seed<=80;seed++){const s=create(seed);s.stats.wealth=100;s.stats.stability=100;s.event='life0';const next=choose(s,0);if(next.phase==='play')expect(next.event).not.toBe('life7');}
 });
});

describe('debt recovery decisions',()=>{
 it('applies costs and new borrowing before relief, with exact immediate report and deterministic restoration',()=>{
  const s=stoppedFixture();s.event='life8';s.debt=40;s.stats.wealth=2;
  expect(currentEvent(s).description).toContain('40.0점');expect(currentEvent(s).description).toContain(s.people[s.head].name);
  const next=choose(s,0);expect(next.report!.borrowed).toBe(10);expect(next.debt).toBe(25);expect(next.stats.wealth).toBe(0);
  expect(next.report!.entries.some(e=>e.kind==='economy'&&e.text.includes('25.0점을 조정')&&e.text.includes('남은 부채 25.0점'))).toBe(true);
  expect(choose(decodeSave(JSON.stringify(s))!,0)).toEqual(next);expect(decodeSave(JSON.stringify(next))).toEqual(next);expect(choose(next,0)).toBe(next);
 });
 it('supports the smaller adjustment and the no-relief route without negative debt',()=>{
  const s=stoppedFixture();s.event='life8';s.debt=10;s.stats.wealth=20;
  expect(choose(s,1).debt).toBe(7);expect(choose(s,2).debt).toBe(10);
  s.debt=0;expect(choose(s,0).debt).toBe(0);expect(choose(s,1).debt).toBe(0);
 });
 it('offers recovery at the threshold with a three-event cooldown and preserves history priority',()=>{
  const s=stoppedFixture();s.event='life0';s.debt=25;
  expect(choose(s,0).event).toBe('life8');s.debt=24.9;expect(choose(s,0).event).not.toBe('life8');
  s.debt=25;s.seen=['life8'];expect(choose(s,0).event).not.toBe('life8');s.seen=['life8','life1','life3'];expect(choose(s,0).event).toBe('life8');
  const historical=create(42);historical.year=1589;historical.people[historical.head].born=1565;historical.turn=4;historical.event='life0';historical.debt=80;
  const next=choose(historical,0);expect(next.year).toBe(1592);expect(next.event).toBe('h1592');
 });
});
