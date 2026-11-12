import {describe,it,expect} from 'vitest';
import {create,choose,continueStory,currentEvent,validate,selectProject,selectSocialFocus,type State,type Person} from './engine';
import {beginExamJourney,journeyIds,journeyRisk,JOURNEY_CHANCE,type JourneyId} from './journeys';
import {surpriseRoll,eligibleSurprises} from './surprises';
import {decodeSave} from './save';
import {familyMemories,reportHeadline} from './family-memory';
import {selectChronicle} from './chronicles';

function fixture(seed=42):State {
 const s=create(seed,0,'commoner');s.year=1600;s.turn=5;s.event='social-career';
 const p=s.people[s.head];p.born=1570;p.sex='남';p.health=100;p.education=80;p.ability=80;
 s.stats={wealth:80,education:80,health:100,stability:80,cohesion:80,connections:40,status:30,reputation:60};
 return s;
}
function child(s:State,id='child'):Person {
 const p={...structuredClone(s.people[s.head]),id,name:'김후손',born:1590,generation:2,parents:[s.head],children:[],spouses:[],life:[],job:'미성년'};
 s.people[p.id]=p;s.people[s.head].children.push(p.id);return p;
}
function pending(seed=42,id:JourneyId='journey-tiger'):State {
 const s=fixture(seed);s.journey={id,candidate:s.head,startedYear:s.year};s.event=id;return s;
}
function fatal(id:JourneyId='journey-tiger'):State {
 const s=pending(1,id);s.people[s.head].trait='다정함';
 while(surpriseRoll(s,22)>=journeyRisk(s))s.seed++;
 return s;
}

describe('exam-road surprises',()=>{
 it('only interrupts an eligible exam after onboarding and charges preparation once',()=>{
  let s=fixture(1);while(!beginExamJourney(s,s.people[s.head]))s=fixture(s.seed+1);
  const out=choose(s,1);expect(out.year).toBe(s.year);expect(out.rng).toBe(s.rng);
  expect(out.report!.immediate.wealth).toBe(-8);expect(out.society!.examPassed).toBe(false);
  expect(out.journey?.candidate).toBe(s.head);expect(out.people).toEqual(s.people);
  expect(decodeSave(JSON.stringify(out))).toEqual(out);expect(choose(out,0)).toBe(out);
  const road=continueStory(out),resolved=choose(road,0);
  expect(resolved.report!.immediate.wealth).toBe(-6);expect(resolved.journey).toBeUndefined();
  expect(resolved.log.filter(l=>l.text.includes('과거 합격')||l.text.includes('이번 과거에는 합격하지'))).toHaveLength(1);
  expect(resolved.report!.outcome).toMatch(/과거 합격|이번 과거에는 합격하지/);
  s.turn=2;expect(beginExamJourney(s,s.people[s.head])).toBeUndefined();
  s.turn=5;s.year=1894;expect(beginExamJourney(s,s.people[s.head])).toBeUndefined();
  expect(eligibleSurprises(fixture()).some(e=>String(e.id).startsWith('journey-'))).toBe(false);
 });

 it('kills the representative immediately, inherits once and awaits the real successor',()=>{
  const s=fatal(),heir=child(s);s.people[s.head].estate=20;heir.estate=3;
  const out=choose(s,1);
  expect(out.phase).toBe('succession');expect(out.year).toBe(s.year);expect(out.report!.from).toBe(out.report!.to);
  expect(out.people[s.head].alive).toBe(false);expect(out.people[s.head].died).toBe(s.year);
  expect(out.people.child.estate).toBe(23);expect(out.journey).toBeUndefined();expect(out.society!.examPassed).toBe(false);
  expect(out.people[s.head].life.at(-1)?.text).toContain('호환');expect(reportHeadline(out)).toContain('호환');
  expect(familyMemories(out)[0].cause).toBe('tiger');expect(validate(out)).toEqual([]);expect(decodeSave(JSON.stringify(out))).toEqual(out);
  expect(choose(out,1)).toBe(out);expect(choose(continueStory(out),1)).toEqual(continueStory(out));
 });

 it('ends a line with no heirs at the event year, without unrelated annual deaths or a fake exam pass',()=>{
  for(const id of journeyIds){const s=fatal(id),out=choose(s,1);expect(out.phase).toBe('ended');expect(out.endReason).toBe('후계자 부재');expect(out.year).toBe(s.year);expect(out.society!.examPassed).toBe(false);expect(out.society!.examPerson).toBeNull();expect(out.rng).toBe(s.rng);expect(validate(out)).toEqual([]);}
 });

 it('risks the actual adult son, not his female sponsor, and keeps the candidate pinned',()=>{
  const s=fatal(),head=s.people[s.head];head.sex='여';head.born=1540;
  const son=child(s,'son');son.born=1570;son.sex='남';son.trait='다정함';s.journey!.candidate=son.id;
  const out=choose(s,1);expect(out.people[head.id].alive).toBe(true);expect(out.people[son.id].alive).toBe(false);expect(out.phase).toBe('play');expect(out.year).toBe(s.year);expect(reportHeadline(out)).toContain(son.name);
  const safe=pending();safe.people[safe.head].education=10;const better=child(safe,'better');better.born=1590;
  // This second candidate is unrelated to normal genealogy validation, so keep a plausible adult parent age.
  safe.people[safe.head].born=1540;better.born=1570;better.education=100;better.ability=100;
  const arrived=choose(safe,0);const examEntries=arrived.log.filter(l=>l.text.includes('과거 합격')||l.text.includes('이번 과거에는 합격하지'));
  expect(examEntries).toHaveLength(1);expect(examEntries[0].text.startsWith(safe.people[safe.head].name+',')).toBe(true);
 });

 it('allows safe return, does not charge the preparation again, and blocks unrelated route changes while traveling',()=>{
  const s=pending();const out=choose(s,2);expect(out.report!.immediate.wealth).toBe(0);expect(out.society!.examPassed).toBe(false);expect(out.journey).toBeUndefined();expect(out.report!.outcome).toContain('돌아왔습니다');
  expect(selectSocialFocus(s,'politics')).toBe(s);expect(selectProject(s,'care')).toBe(s);expect(selectChronicle(s,'archives')).toBe(s);
  s.stats.wealth=0;const paid=choose(s,0);expect(paid.report!.borrowed).toBe(6);expect(paid.report!.debtBefore).toBe(0);
  s.stats.connections=60;expect(choose(s,0).report!.borrowed).toBe(3);
 });

 it('resolves an 1893 departure before crossing reform and rejects inconsistent pending saves',()=>{
  const s=pending();s.year=1893;s.people[s.head].born=1863;s.journey!.startedYear=1893;
  const out=choose(s,0);expect(out.year).toBe(1894);expect(out.event).toBe('h1894');expect(out.journey).toBeUndefined();expect(out.society!.standing).toBe('citizen');expect(decodeSave(JSON.stringify(out))).toEqual(out);
  for(const change of [{candidate:'missing'},{startedYear:1892},{id:'journey-unknown'}])expect(decodeSave(JSON.stringify({...s,journey:{...s.journey,...change}}))).toBeNull();
  expect(decodeSave(JSON.stringify({...s,year:1894,journey:{...s.journey,startedYear:1894}}))).toBeNull();
  expect(decodeSave(JSON.stringify({...s,journey:undefined}))).toBeNull();
  s.people[s.head].alive=false;s.people[s.head].died=1893;expect(decodeSave(JSON.stringify(s))).toBeNull();
 });

 it('replays every choice exactly after reload and displays the actual trait-adjusted risk',()=>{
  for(const id of journeyIds)for(let seed=1;seed<=20;seed++){
   const s=pending(seed,id);s.people[s.head].trait=id==='journey-flood'?'끈기 있음':'신중함';
   const risk=Math.round(journeyRisk(s)*100);expect(currentEvent(s).choices[1].chanceLabel).toContain(`사망 확률 ${risk}%`);
   for(let choice=0;choice<3;choice++)expect(choose(decodeSave(JSON.stringify(s))!,choice)).toEqual(choose(s,choice));
  }
 });

 it('samples the declared encounter and lethal probabilities without consuming the engine RNG',()=>{
  const s=pending();let deaths=0,encounters=0;const before=s.rng,risk=journeyRisk(s);
  for(let seed=0;seed<10000;seed++){s.seed=seed;if(surpriseRoll(s,20)<JOURNEY_CHANCE)encounters++;if(surpriseRoll(s,22)<risk)deaths++;}
  expect(Math.abs(deaths/10000-risk)).toBeLessThan(.02);expect(Math.abs(encounters/10000-JOURNEY_CHANCE)).toBeLessThan(.02);expect(s.rng).toBe(before);
 });
});
