import {describe,expect,it} from 'vitest';
import {create,type State} from './engine';
import {endingFor,endings,eligibleEndings,type EndingId} from './endings';

type SocietyFixture={origin:'commoner'|'specialist'|'yangban'|'nobi';standing:'commoner'|'specialist'|'yangban'|'nobi'|'citizen';focus:'livelihood'|'advancement'|'politics';office:'none'|'technical'|'local'|'court';examPassed:boolean;examPerson:string|null;recognition:number;support:number;risk:number;political:'quiet'|'exile'|'kingmaker'|'founder';alternate:boolean;achievements:('freed'|'exam'|'yangban'|'court'|'kingmaker'|'founder'|'restored'|'abolished')[];lastEventTurn:number};
function finished(overrides:Partial<SocietyFixture>={}){
 const s=create(42) as State&{society:SocietyFixture};s.phase='ended';s.year=2026;s.endReason='2026년까지 존속';
 s.society={origin:'commoner',standing:'commoner',focus:'livelihood',office:'none',examPassed:false,examPerson:null,recognition:0,support:0,risk:0,political:'quiet',alternate:false,achievements:[],lastEventTurn:0,...overrides};
 return s;
}
describe('earned ending classification',()=>{
 it('defines exactly 26 unique, explained outcomes and keeps old saves compatible',()=>{
  expect(endings).toHaveLength(26);expect(new Set(endings.map(e=>e.id)).size).toBe(26);
  expect(endings.every(e=>e.category&&e.hint&&e.requirement)).toBe(true);
  const old=create(42) as State&{society?:SocietyFixture};old.phase='ended';old.year=2026;delete old.society;delete old.projects;
  expect(endingFor(old).id).toBe('survivor');
  expect(eligibleEndings(old).map(e=>e.id)).toEqual(['survivor']);
 });
 it('prioritizes actual lineage extinction even after founding a dynasty',()=>{
  const s=finished({achievements:['founder'],political:'founder',alternate:true});
  const founder=s.people[s.founder];founder.alive=false;founder.died=s.year;
  // A surviving spouse does not count as a surviving descendant.
  s.people.spouse={...structuredClone(founder),id:'spouse',alive:true,died:null,lineage:false};
  expect(endingFor(s).id).toBe('extinct');
  expect(eligibleEndings(s).map(e=>e.id)).toEqual(['extinct']);
 });
 it('gives one political outcome using durable achievement priority',()=>{
  const s=finished({achievements:['kingmaker','restored','founder','yangban'],political:'quiet'});
  expect(endingFor(s).id).toBe('founder');
  s.society.achievements=['kingmaker','restored','yangban'];expect(endingFor(s).id).toBe('restored');
  s.society.achievements=['kingmaker','yangban'];expect(endingFor(s).id).toBe('kingmaker');
 });
 it('requires an earned gentry outcome, not inherited origin or technical office alone',()=>{
  expect(endingFor(finished({origin:'yangban',standing:'yangban'})).id).toBe('survivor');
  expect(endingFor(finished({origin:'specialist',office:'technical',achievements:['exam'],examPassed:true})).id).toBe('survivor');
  expect(endingFor(finished({office:'local'})).id).toBe('survivor');
  expect(endingFor(finished({origin:'yangban',office:'local'})).id).toBe('survivor');
  expect(endingFor(finished({office:'court'})).id).toBe('gentry');
  expect(endingFor(finished({achievements:['yangban']})).id).toBe('gentry');
 });
 it('uses completed projects only and resolves overlapping accomplishments',()=>{
  const s=finished();s.projects={active:'learning',progress:{learning:3,trade:0,care:0},completed:[]};
  expect(endingFor(s).id).toBe('survivor');
  s.projects.completed=['learning'];expect(endingFor(s).id).toBe('learning');
  s.projects.completed=['learning','trade'];expect(endingFor(s).id).toBe('trade');
  s.society.achievements=['court'];expect(endingFor(s).id).toBe('gentry');
 });
 it('classifies every advertised ending from a distinct earned outcome',()=>{
  const arcs=['school','books','relief','medicine','market','caravan','refuge','reconstruction','petition','inheritance','artisan','innovation'];
  for(const ending of endings){
   const s=finished();const id=ending.id;
   if(arcs.includes(id))Object.assign(s,{chronicles:{completed:[id]}});
   if(['care','trade','learning'].includes(id)){const project=id as 'care'|'trade'|'learning';s.projects={active:null,progress:{learning:0,trade:0,care:0,[project]:3},completed:[project]};}
   if(['freed','founder','restored','kingmaker'].includes(id))s.society.achievements=[id as 'freed'|'founder'|'restored'|'kingmaker'];
   if(id==='gentry')s.society.achievements=['yangban'];
   if(id==='freed_founder')s.society.achievements=['freed','founder'];
   if(id==='freed_gentry')s.society.achievements=['freed','yangban'];
   if(id==='healing_community')Object.assign(s,{chronicles:{completed:['relief','medicine']}});
   if(id==='knowledge_road')Object.assign(s,{chronicles:{completed:['books','market']}});
   if(id==='extinct'){s.people[s.head].alive=false;s.people[s.head].died=s.year;}
   expect(endingFor(s).id,id).toBe(id);
  }
 });
 it('prioritizes combinations while listing their qualifying underlying accomplishments',()=>{
  const s=finished({achievements:['freed','yangban','founder','restored','kingmaker']});
  Object.assign(s,{chronicles:{completed:['school','relief','medicine','books','caravan']}});
  const eligible=eligibleEndings(s).map(e=>e.id);
  expect(eligible.slice(0,7)).toEqual(['freed_founder','freed_gentry','healing_community','knowledge_road','founder','restored','kingmaker']);
  expect(eligible).toContain('caravan');expect(eligible).toContain('books');expect(eligible).toContain('gentry');expect(eligible).toContain('freed');
  expect(eligible).not.toContain('survivor');expect(new Set(eligible).size).toBe(eligible.length);
  s.people[s.head].alive=false;s.people[s.head].died=s.year;expect(eligibleEndings(s).map(e=>e.id)).toEqual(['extinct']);
 });
 it('uses chronological completion order for arcs, below political outcomes and above ordinary merits',()=>{
  const s=finished({achievements:['yangban']});Object.assign(s,{chronicles:{completed:['school','artisan','petition']}});
  expect(endingFor(s).id).toBe('petition');
  Object.assign(s,{chronicles:{completed:['petition','artisan','school']}});expect(endingFor(s).id).toBe('school');
  s.society.achievements.push('restored');expect(endingFor(s).id).toBe('restored');
 });
 it('requires the exact combination instead of treating related achievements as substitutes',()=>{
  const s=finished({achievements:['freed','court']});expect(endingFor(s).id).toBe('gentry');expect(eligibleEndings(s).map(e=>e.id)).not.toContain('freed_gentry');
  Object.assign(s,{chronicles:{completed:['books','artisan']}});expect(endingFor(s).id).toBe('artisan');
  Object.assign(s,{chronicles:{completed:['books','caravan']}});expect(endingFor(s).id).toBe('knowledge_road');
  Object.assign(s,{chronicles:{completed:['medicine','relief']}});expect(endingFor(s).id).toBe('healing_community');
 });
 it('never changes game phase, history, or rewards when reading an ending',()=>{
  const s=create(42);const before=structuredClone(s);const result=endingFor(s);
  expect(s).toEqual(before);expect(s.phase).toBe('play');expect(Object.isFrozen(result)).toBe(true);
 });
});
