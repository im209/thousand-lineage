import {describe,it,expect} from 'vitest';
import {create,choose,continueStory,currentEvent,choiceAvailable,type State} from './engine';
import {selectChronicle} from './chronicles';
import {decodeSave} from './save';

function fixture(year=1600):State{
 const s=create(42);s.year=year;s.people[s.head].born=year-25;s.people[s.head].health=100;
 s.society!.focus='livelihood';s.stats={wealth:90,education:80,health:100,stability:80,reputation:60,status:30,connections:70,cohesion:80};
 s.event='life0';s.turn=4;return s;
}
describe('Joseon stories in the complete game loop',()=>{
 it('schedules preparation after the current choice and records a real completion after both decisions',()=>{
  let s=selectChronicle(fixture(),'care');const year=s.year;
  s=continueStory(choose(s,0));expect(s.event).toBe('chronicle-care-prepare');expect(s.year).toBeGreaterThan(year);
  s=continueStory(choose(s,0));expect(s.event).toBe('chronicle-care-finish');expect(s.chronicles!.completed).toEqual([]);
  const restored=decodeSave(JSON.stringify(s));expect(restored).not.toBeNull();
  const result=choose(s,0),replayed=choose(restored!,0);expect(replayed).toEqual(result);
  expect(result.chronicles!.completed).toEqual(['relief']);expect(result.report!.entries.some(e=>e.kind==='chronicle'&&e.text.includes('완수'))).toBe(true);
  expect(decodeSave(JSON.stringify(result))).not.toBeNull();
 });
 it('keeps exact historical events ahead of a prepared continuation',()=>{
  const s=fixture(1589);s.chronicles={selected:'care',active:{arc:'care',startedYear:1586,dueTurn:4},completed:[],history:[]};
  const next=choose(s,0);expect(next.year).toBe(1592);expect(next.event).toBe('h1592');expect(next.chronicles!.active?.arc).toBe('care');
 });
 it('lets exile and debt recovery interrupt a chosen story without losing its preparation',()=>{
  const s=fixture();s.chronicles={selected:'care',active:{arc:'care',startedYear:1597,dueTurn:4},completed:[],history:[]};
  s.society!.political='exile';s.society!.alternate=true;
  let result=choose(s,0);expect(result.event).toBe('social-exile');expect(result.chronicles!.active?.arc).toBe('care');
  const debt=fixture();debt.debt=90;debt.stats.wealth=0;debt.chronicles=structuredClone(s.chronicles);
  result=choose(debt,0);expect(result.event).toBe('life8');expect(result.chronicles!.active?.arc).toBe('care');
 });
 it('does not charge or advance time for a locked completion, and offers a free way back',()=>{
  const s=fixture();s.event='chronicle-archives-finish';s.chronicles={selected:'archives',active:{arc:'archives',startedYear:1597,dueTurn:4},completed:[],history:[]};s.stats.wealth=0;
  expect(choiceAvailable(s,0)).toBe(false);expect(choose(s,0)).toBe(s);
  expect(currentEvent(s).choices.some((_,i)=>choiceAvailable(s,i))).toBe(true);
  const paused=choose(s,2);expect(paused.chronicles!.completed).toEqual([]);expect(paused.chronicles!.active).not.toBeNull();expect(paused.report!.borrowed).toBe(0);
 });
});
