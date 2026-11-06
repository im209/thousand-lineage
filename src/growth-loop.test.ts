import {describe,it,expect} from 'vitest';
import {create,choose,continueStory,currentEvent,choiceCost,projectProgress,selectProject,societyState,type StartingStanding} from './engine';
import {decodeSave} from './save';

describe('a readable growth loop',()=>{
 it('starts every background in family life and keeps the first three real choices at five years',()=>{
  for(const origin of ['commoner','specialist','yangban','nobi'] as StartingStanding[]){
   for(const seed of [1,42,99]){
    let s=create(seed,0,origin);
    expect(societyState(s).focus).toBe('livelihood');
    for(let turn=0;turn<3&&s.phase==='play';turn++){
     expect(currentEvent(s).id).not.toMatch(/^social-/);
     const before=s.year;s=choose(s,0);
     expect(s.report!.to-before).toBe(5);
     expect(s.report!.outcome?.length).toBeGreaterThan(10);
     expect(decodeSave(JSON.stringify(s))).toEqual(s);
     s=continueStory(s);
    }
   }
  }
 });
 it('keeps an existing social focus and lets the explicit family-life choice exit the repeated career path',()=>{
  const s=create(1,0,'commoner');s.society!.focus='advancement';s.event='social-career';
  const restored=decodeSave(JSON.stringify(s))!;expect(restored.society!.focus).toBe('advancement');
  const choice=currentEvent(restored).choices.findIndex(c=>c.socialAction==='livelihood');
  expect(choice).toBeGreaterThanOrEqual(0);
  const next=continueStory(choose(restored,choice));
  expect(next.society!.focus).toBe('livelihood');
  expect(currentEvent(next).id).not.toMatch(/^social-/);
 });
 it('counts career and technical study toward the selected learning goal once per decision',()=>{
  for(const [origin,event] of [['commoner','social-career'],['specialist','social-technical']] as const){
   const s=selectProject(create(1,0,origin),'learning');s.event=event;
   const next=choose(s,0);
   expect(projectProgress(next,'learning')).toBe(1);
   expect(next.report!.entries.filter(e=>e.kind==='project-progress')).toHaveLength(1);
   expect(choose(next,0)).toBe(next);
  }
 });
 it('makes crossing the trade threshold observable and applies the promised cost reduction',()=>{
  const s=create(1,0,'commoner');s.stats.connections=59;s.event='life1';
  const next=choose(s,0);
  expect(next.report!.entries.some(e=>e.kind==='benefit'&&e.text.includes('8에서 3'))).toBe(true);
  const ready=continueStory(next);ready.event='life3';
  expect(choiceCost(ready,0)).toBe(3);
  const below={...ready,stats:{...ready.stats,connections:59.9}};
  expect(choiceCost(below,0)).toBe(8);
  expect(choose(ready,0).report!.entries.filter(e=>e.kind==='benefit')).toHaveLength(0);
 });
 it('preserves old reports without narrative and rejects malformed new narrative fields',()=>{
  const next=choose(create(42),0);delete next.report!.outcome;
  expect(decodeSave(JSON.stringify(next))).toEqual(next);
  expect(decodeSave(JSON.stringify({...next,report:{...next.report,outcome:42}}))).toBeNull();
 });
 it('grants an already prepared goal when family life raises its remaining stat condition, without counting twice',()=>{
  let reached=false;
  for(let seed=1;seed<=20;seed++){
   const s=selectProject(create(seed,0,'commoner'),'trade');s.projects!.progress.trade=3;s.stats.connections=54;
   const next=choose(s,0);
   if(next.phase!=='ended'&&next.stats.connections>=55){reached=true;expect(next.projects!.completed).toContain('trade');expect(next.projects!.progress.trade).toBe(3);expect(next.report!.entries.filter(e=>e.kind==='project')).toHaveLength(1);expect(next.report!.entries.filter(e=>e.kind==='project-progress')).toHaveLength(0);expect(next.peak.wealth).toBeGreaterThanOrEqual(next.stats.wealth);}
  }
  expect(reached).toBe(true);
 });
});
