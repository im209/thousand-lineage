import {describe,it,expect} from 'vitest';
import {create,choose,continueStory,currentEvent,choiceAvailable,choiceLockReason,selectSocialFocus,societyState,examCandidate,examChance,coupChance,turnYears,legalStatus,societyLabel,type State,type StartingStanding} from './engine';
import {applySocialAction,societyAnnual,socialLockReason,retireOffice} from './society';
import {decodeSave} from './save';
function fixture(seed=42,origin:StartingStanding='commoner'){const s=create(seed,0,origin);s.year=1600;s.people[s.head].born=1575;s.people[s.head].sex='남';s.people[s.head].education=80;s.people[s.head].ability=80;s.stats={wealth:80,education:80,status:50,connections:80,reputation:80,cohesion:80,health:80,stability:80};s.event='social-career';return s}
describe('social progression and alternate history',()=>{
 it('initializes backgrounds independently of surname and preserves pure helpers and focus changes',()=>{
  const a=create(42,0,'nobi'),b=create(42,500,'nobi');expect(a.stats).toEqual(b.stats);expect(a.society).toEqual(b.society);expect(a.society!.standing).toBe('nobi');expect(a.society!.focus).toBe('advancement');
  const raw=JSON.stringify(a);societyState(a);examCandidate(a);examChance(a);coupChance(a);expect(JSON.stringify(a)).toBe(raw);
  const next=selectSocialFocus(a,'politics');expect(next.year).toBe(a.year);expect(next.rng).toBe(a.rng);expect(a.society!.focus).toBe('advancement');
  expect(selectSocialFocus(choose(a,0),'politics').society!.focus).toBe('advancement');
 });
 it('requires earned emancipation and prevents technical or unfree families bypassing the exam route',()=>{
  const s=fixture(42,'nobi');s.event='social-free';s.stats.wealth=24;expect(choiceAvailable(s,0)).toBe(false);expect(choose(s,0)).toBe(s);
  s.stats.wealth=40;const freed=choose(s,0);expect(freed.society!.standing).toBe('commoner');expect(freed.society!.achievements).toContain('freed');
  const technical=fixture(42,'specialist');expect(choiceLockReason(technical,1)).toContain('기술');expect(choiceAvailable(technical,0)).toBe(true);
  const nobi=fixture(42,'nobi');expect(choiceAvailable(nobi,1)).toBe(false);
 });
 it('lets a female representative sponsor a living adult male relative, never a deceased person',()=>{
  const s=fixture();s.people[s.head].sex='여';expect(examCandidate(s)).toBeUndefined();expect(choiceAvailable(s,1)).toBe(false);
  const p={...structuredClone(s.people[s.head]),id:'relative',sex:'남' as const,parents:[],children:[],spouses:[],life:[]};s.people[p.id]=p;expect(examCandidate(s)?.id).toBe('relative');expect(choiceAvailable(s,1)).toBe(true);
  p.alive=false;p.died=1599;expect(examCandidate(s)).toBeUndefined();
 });
 it('has seeded exam successes and failures, and passes without granting instant yangban standing',()=>{
  const results=[];for(let seed=1;seed<=30;seed++){const s=fixture(seed);const next=choose(s,1);results.push(next.society!.examPassed);expect(next.society!.standing).toBe('commoner');expect(next.society!.office).toBe('none');expect(choose(decodeSave(JSON.stringify(s))!,1)).toEqual(next);}
  expect(results).toContain(true);expect(results).toContain(false);
 });
 it('requires office plus sustained recognition, and retains a deceased exam winner as a historical record',()=>{
  const s=fixture();applySocialAction(s,'exam',()=>0);expect(s.society!.examPassed).toBe(true);expect(socialLockReason(s,{title:'',description:'',effects:{},socialAction:'recognize'})).not.toBeNull();
  applySocialAction(s,'appointment',()=>0);applySocialAction(s,'study',()=>0);applySocialAction(s,'study',()=>0);
  expect(socialLockReason(s,{title:'',description:'',effects:{},socialAction:'recognize'})).toBeNull();applySocialAction(s,'recognize',()=>0);expect(s.society!.standing).toBe('yangban');expect(s.society!.achievements).toContain('yangban');
  s.people[s.head].alive=false;s.people[s.head].died=s.year;s.turn=s.society!.lastEventTurn;expect(decodeSave(JSON.stringify(s))?.society?.examPerson).toBe(s.head);
 });
 it('gates coup attempts and provides seeded success, exile and real recovery without deleting family',()=>{
  const outcomes=[];for(let seed=1;seed<=40;seed++){const s=fixture(seed,'yangban');s.event='social-politics';s.society!.office='court';s.society!.support=80;s.society!.risk=20;const people=Object.keys(s.people);expect(choiceAvailable(s,2)).toBe(true);const next=choose(s,2);outcomes.push(next.society!.political);expect(next.society!.alternate).toBe(true);expect(people.every(id=>!!next.people[id])).toBe(true);if(next.society!.political==='exile'){expect(next.event).toBe('social-exile');expect(next.people[s.head].alive).toBe(true);const recovery=continueStory(next);recovery.stats.wealth=30;recovery.stats.connections=40;const restored=choose(recovery,1);expect(restored.society!.political).toBe('quiet');expect(restored.society!.office).toBe('none');expect(restored.society!.achievements).toContain('restored');}}
  expect(outcomes).toContain('founder');expect(outcomes).toContain('exile');const locked=fixture();locked.event='social-politics';expect(choiceAvailable(locked,1)).toBe(false);expect(choiceAvailable(locked,3)).toBe(true);
 });
 it('transitions exactly at 1894, blocks old actions and replaces stale social choices',()=>{
  const s=fixture(42,'nobi');s.year=1893;s.people[s.head].born=1868;s.event='social-free';s.society!.focus='livelihood';const next=choose(s,1);
  expect(next.year).toBe(1894);expect(next.event).toBe('h1894');expect(next.society!.standing).toBe('citizen');expect(next.society!.office).toBe('none');expect(next.society!.achievements).toContain('abolished');
  const stale=continueStory(next);stale.event='social-politics';expect(currentEvent(stale).id).toBe('social-modern');expect(choiceAvailable(stale,0)).toBe(true);expect(socialLockReason(stale,{title:'',description:'',effects:{},socialAction:'founder'})).not.toBeNull();
 });
 it('wraps subsequent history as a reference after divergence and makes reform a common fictional rule',()=>{
  const s=fixture();s.society!.alternate=true;s.event='h1592';expect(currentEvent(s).kind).toBe('alternate');expect(currentEvent(s).description).toContain('실제 사건이 그대로');s.year=1894;s.event='h1894';expect(currentEvent(s).description).toContain('공통 게임 규칙');societyAnnual(s);expect(s.log.at(-1)!.text).toContain('대체역사 공통 규칙');
 });
 it('shows a three-year career pace and checks legacy saves without assigning rank from past score',()=>{
  const s=fixture();expect(turnYears(s)).toEqual({min:3,max:3});const next=choose(s,0);expect(next.report!.to-next.report!.from).toBe(3);
  delete s.society;s.stats.status=100;const old=decodeSave(JSON.stringify(s))!;expect(old).not.toBeNull();expect(societyState(old).standing).toBe('commoner');expect(societyState(old).focus).toBe('livelihood');old.year=1900;expect(societyState(old).standing).toBe('citizen');
 });
 it('rejects invalid society saves',()=>{
  const s=fixture();for(const patch of [{standing:'king'},{support:101},{risk:-1},{examPerson:'missing'},{achievements:['exam','exam']},{lastEventTurn:999},{origin:'royal'}])expect(decodeSave(JSON.stringify({...s,society:{...s.society,...patch}}))).toBeNull();
 });
 it('separates legal status from social household standing',()=>{
  expect(legalStatus(fixture(1,'commoner'))).toBe('양인');expect(legalStatus(fixture(1,'yangban'))).toBe('양인');expect(legalStatus(fixture(1,'specialist'))).toBe('양인');expect(legalStatus(fixture(1,'nobi'))).toBe('천인(노비)');expect(societyLabel(fixture(1,'yangban'))).toBe('양반 가문');const modern=fixture();modern.year=1900;expect(legalStatus(modern)).toBe('신분제 폐지');
 });
 it('assigns technical work to an eligible relative and never to a minor or female sponsor',()=>{
  const s=fixture(42,'specialist');s.event='social-technical';s.people[s.head].sex='여';s.people[s.head].job='학인';expect(choiceAvailable(s,1)).toBe(false);
  const p={...structuredClone(s.people[s.head]),id:'relative',sex:'남' as const,born:1590};s.people[p.id]=p;expect(choiceAvailable(s,1)).toBe(false);p.born=1570;expect(choiceAvailable(s,1)).toBe(true);applySocialAction(s,'technical',()=>0);expect(s.society!.examPerson).toBe(p.id);expect(p.job).toBe('기술·실무 관원');expect(s.people[s.head].job).toBe('학인');
 });
 it('ends personal office and income on death or retirement while keeping household achievements',()=>{
  const s=fixture();applySocialAction(s,'exam',()=>0);applySocialAction(s,'appointment',()=>0);applySocialAction(s,'court',()=>0);const p=s.people[s.head];expect(p.job).toBe('조정 관원');p.alive=false;p.died=s.year;retireOffice(s);expect(s.society!.office).toBe('none');expect(s.society!.examPassed).toBe(false);expect(s.society!.examPerson).toBeNull();expect(s.society!.achievements).toContain('court');
  const retired=fixture(42,'specialist');applySocialAction(retired,'technical',()=>0);retired.people[retired.head].born=1525;societyAnnual(retired);expect(retired.society!.office).toBe('none');expect(retired.people[retired.head].job).toBe('전직 관원');
 });
 it('cannot appoint a deceased exam winner and keeps modern minors in preparation',()=>{
  const s=fixture();applySocialAction(s,'exam',()=>0);s.people[s.head].alive=false;s.people[s.head].died=s.year;expect(choiceAvailable(s,2)).toBe(false);
  const minor=fixture();minor.year=1900;minor.people[minor.head].born=1890;applySocialAction(minor,'modern-study',()=>0);expect(minor.people[minor.head].job).toBe('미성년');expect(minor.people[minor.head].intendedJob).toBe('study');
 });
 it('keeps a focused career chain on three-year decisions and returns to family life at its milestone',()=>{
  const s=fixture();let next=continueStory(choose(s,0));expect(next.event).toBe('social-career');expect(turnYears(next)).toEqual({min:3,max:3});
  next.society!.examPassed=true;next.society!.examPerson=next.head;next=continueStory(choose(next,2));expect(next.event).toBe('social-court');expect(next.society!.office).toBe('local');
  next.society!.recognition=2;next.stats.education=80;next.stats.connections=80;next.stats.reputation=80;next=choose(next,2);expect(next.society!.standing).toBe('yangban');expect(next.society!.focus).toBe('livelihood');expect(next.event.startsWith('social-')).toBe(false);
 });
 it('keeps political focus through court appointment and opens support preparation immediately',()=>{
  const s=fixture(42,'yangban');s.society!.focus='politics';s.society!.examPassed=true;s.society!.examPerson=s.head;s.society!.office='local';s.event='social-court';const next=continueStory(choose(s,1));expect(next.society!.focus).toBe('politics');expect(next.event).toBe('social-politics');expect(choiceAvailable(next,0)).toBe(true);
  const support=continueStory(choose(next,0));expect(support.event).toBe('social-politics');expect(support.year-next.year).toBe(3);
 });
 it('always leaves an available preparation or rebuilding choice on reachable social screens',()=>{
  for(const origin of ['nobi','commoner','specialist','yangban'] as StartingStanding[]){const s=fixture(42,origin);for(const id of ['social-free','social-career','social-technical','social-court','social-politics','social-exile']){s.event=id;s.stats.wealth=0;s.stats.education=0;s.stats.connections=0;s.stats.reputation=0;expect(currentEvent(s).choices.some((_,i)=>choiceAvailable(s,i))).toBe(true);}}
 });
 it('prioritizes debt recovery over a focused career while preserving exile recovery priority',()=>{
  const s=fixture();s.society!.focus='advancement';s.debt=60;s.stats.wealth=0;const next=choose(s,0);expect(next.event).toBe('life8');const exile=fixture();exile.event='social-exile';exile.society!.political='exile';exile.debt=60;exile.stats.wealth=0;expect(choose(exile,0).event).toBe('social-exile');
 });
 it('clears active office titles on reform and failed political action',()=>{
  const s=fixture();applySocialAction(s,'exam',()=>0);applySocialAction(s,'appointment',()=>0);applySocialAction(s,'court',()=>0);s.year=1894;societyAnnual(s);expect(s.people[s.head].job).toBe('전직 관원');expect(s.society!.office).toBe('none');
  const failed=fixture();applySocialAction(failed,'exam',()=>0);applySocialAction(failed,'appointment',()=>0);applySocialAction(failed,'court',()=>0);applySocialAction(failed,'founder',()=>1);expect(failed.people[failed.head].job).toBe('유배된 전직 관원');expect(failed.log.at(-1)!.kind).toBe('alternate');applySocialAction(failed,'restore',()=>0);expect(failed.people[failed.head].job).toBe('전직 관원');
 });
});
