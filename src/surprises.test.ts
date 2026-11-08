import {describe,it,expect,beforeAll} from 'vitest';
import {create,choose,succeed,candidates,validate,continueStory,currentEvent,choiceAvailable,turnYears,type State} from './engine';
import {decodeSave} from './save';
import {surpriseEvents,surpriseIds} from './surprises';
import {events} from './data';

const firstAvailable=(s:State)=>currentEvent(s).choices.findIndex((_,i)=>choiceAvailable(s,i));
/** Plays a whole run with real actions, calling `visit` before every decision. */
function play(seed:number,visit:(s:State)=>void=()=>{},pickChoice:(s:State)=>number=firstAvailable){
 let s=create(seed);s.introPending=false;let steps=0;
 while(s.phase!=='ended'&&steps++<400){
  s=continueStory(s);
  if(s.phase==='succession'){s=succeed(s,candidates(s)[0].id);continue}
  visit(s);s=choose(s,pickChoice(s));expect(validate(s)).toEqual([]);
 }
 return s;
}

const LONG=120000;
// One shared batch of real playthroughs: every pre-decision state, per seed.
const runs:{seed:number;states:State[]}[]=[];
beforeAll(()=>{for(let seed=1;seed<=30;seed++){const states:State[]=[];play(seed,s=>states.push(s));runs.push({seed,states})}},LONG);
const all=()=>runs.flatMap(r=>r.states);
const pendings=()=>all().filter(s=>s.event.startsWith('surprise-'));

describe('돌발 사건',()=>{
 it('registers every surprise as a playable event with three choices',()=>{
  expect(surpriseEvents.map(e=>e.id)).toEqual([...surpriseIds]);
  for(const e of surpriseEvents){expect(events.some(x=>x.id===e.id)).toBe(true);expect(e.choices).toHaveLength(3)}
 });

 it('never interrupts the first three choices or follows another surprise',()=>{
  for(const run of runs){
   let previous='';
   for(const s of run.states){
    if(s.event.startsWith('surprise-')){expect(s.turn).toBeGreaterThanOrEqual(4);expect(previous.startsWith('surprise-')).toBe(false)}
    previous=s.event;
   }
  }
 });

 it('appears on a reasonable share of eligible turns and uses several kinds',()=>{
  const turns=all().length,surprises=pendings().length,kinds=new Set(pendings().map(s=>s.event));
  expect(surprises/turns).toBeGreaterThan(.05);
  expect(surprises/turns).toBeLessThan(.25);
  expect(kinds.size).toBeGreaterThanOrEqual(6);
 });

 it('answering a surprise only spends the years left in the interrupted span',()=>{
  let checked=0;
  for(const s of pendings()){
   const remaining=s.surprise!.remaining;
   expect(turnYears(s)).toEqual({min:remaining,max:remaining});
   const next=choose(s,firstAvailable(s));
   // A historical year or the 2026 end can stop the span early; it never runs longer.
   expect(next.year-s.year).toBeLessThanOrEqual(remaining);
   expect(next.surprise).toBeUndefined();
   checked++;
  }
  expect(checked).toBeGreaterThan(5);
 });

 it('the riskiest choices never take the representative and keep genealogy valid',()=>{
  // Always pick the last option, which includes home care during plague and waiting for a runaway.
  for(let seed=1;seed<=12;seed++)play(seed,s=>{
   if(!s.event.startsWith('surprise-'))return;
   const head=s.head,index=s.event==='surprise-plague'?1:s.event==='surprise-bandits'?1:2;
   if(!choiceAvailable(s,index))return;
   const next=choose(s,index);
   expect(next.people[head].alive||next.people[head].died!==s.year).toBe(true);
   if(s.event==='surprise-plague')expect(s.surprise!.target).not.toBe(head);
  },s=>s.event.startsWith('surprise-')?(s.event==='surprise-plague'||s.event==='surprise-bandits'?1:2):firstAvailable(s));
 },LONG);

 it('twins are two real children of a living couple',()=>{
  let found=0;
  for(const s of pendings()){
   if(s.event!=='surprise-twins'||found)continue;
   const parent=s.people[s.surprise!.target!];const born=parent.children.map(id=>s.people[id]).filter(c=>c.born===s.year);
   expect(born.length).toBeGreaterThanOrEqual(2);
   expect(new Set(born.map(c=>c.name)).size).toBe(born.length);
   for(const c of born)expect(c.parents).toContain(parent.id);
   found++;
  }
  expect(found).toBe(1);
 });

 it('a pending surprise survives save and reload, and replays deterministically',()=>{
  const pending=pendings()[0];
  expect(pending).toBeDefined();
  const restored=decodeSave(JSON.stringify(pending));
  expect(restored).toEqual(pending);
  const seed=runs.find(r=>r.states.some(s=>s.event.startsWith('surprise-')))!.seed;
  expect(JSON.stringify(play(seed))).toBe(JSON.stringify(play(seed)));
 },LONG);

 it('rejects a save whose surprise points at a missing person',()=>{
  const pending=pendings()[0];
  const broken={...pending,surprise:{...pending.surprise!,target:'nobody'}};
  expect(decodeSave(JSON.stringify(broken))).toBeNull();
 });
});
