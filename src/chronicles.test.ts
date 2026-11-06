import {describe,it,expect} from 'vitest';
import {create,type State,type Person} from './engine';
import {chronicles,chronicleState,selectChronicle,chronicleAvailability,nextChronicleEvent,prepareChronicleEvent,chronicleLockReason,applyChronicleAction,chronicleEvents,type ArcId,type OutcomeId} from './chronicles';
import {decodeSave} from './save';
function fixture(year=1600){const s=create(42);s.year=year;s.people[s.head].born=year-25;s.society!.focus='livelihood';s.stats={wealth:90,education:70,status:50,connections:70,reputation:60,cohesion:70,health:70,stability:70};return s}
function act(s:State,index:number){const event=nextChronicleEvent(s)!;expect(event).toBeDefined();const choice=prepareChronicleEvent(s,event).choices[index];expect(chronicleLockReason(s,choice)).toBeNull();for(const [stat,value] of Object.entries(choice.effects))s.stats[stat as keyof State['stats']]=Math.max(0,Math.min(100,s.stats[stat as keyof State['stats']]+value!));applyChronicleAction(s,choice.chronicleAction!);s.turn++;s.year+=3;}
describe('two-stage Joseon family chronicles',()=>{
 it('offers six arcs and twelve distinct durable outcomes',()=>{
  expect(chronicles).toHaveLength(6);expect(new Set(chronicles.flatMap(c=>c.outcomes.map(o=>o.id))).size).toBe(12);expect(chronicleEvents).toHaveLength(13);
  for(const arc of chronicles){for(let i=0;i<2;i++){let s=selectChronicle(fixture(),arc.id);const initial=s.stats.wealth;act(s,0);expect(s.chronicles!.completed).toEqual([]);expect(s.stats.wealth).toBe(initial-arc.preparationCost);act(s,i);expect(s.chronicles!.completed).toEqual([arc.outcomes[i].id]);expect(s.chronicles!.active).toBeNull();expect(s.chronicles!.selected).toBeNull();expect(s.chronicles!.history).toEqual([{arc:arc.id,outcome:arc.outcomes[i].id,year:1603,actor:s.head}]);expect(s.log.filter(l=>l.kind==='chronicle')).toHaveLength(2);}}
 });
 it('never grants an outcome without preparation or repeats a completed result',()=>{
  let s=fixture();applyChronicleAction(s,{type:'complete',outcome:'books'});expect(chronicleState(s).completed).toEqual([]);
  s=selectChronicle(s,'archives');act(s,0);act(s,1);const logs=s.log.length;applyChronicleAction(s,{type:'complete',outcome:'books'});expect(s.log).toHaveLength(logs);expect(s.chronicles!.completed).toEqual(['books']);
  s=selectChronicle(s,'archives');act(s,0);expect(chronicleLockReason(s,nextChronicleEvent(s)!.choices[1])).toContain('이미');act(s,0);expect(s.chronicles!.completed).toEqual(['books','school']);expect(chronicleAvailability(s,'archives')).toContain('두 이야기');
 });
 it('enforces dates, preparation and completion costs, and applicable stat requirements',()=>{
  expect(chronicleAvailability(fixture(1499),'trade')).not.toBeNull();expect(chronicleAvailability(fixture(1500),'trade')).toBeNull();expect(chronicleAvailability(fixture(1591),'war')).not.toBeNull();expect(chronicleAvailability(fixture(1661),'war')).not.toBeNull();expect(chronicleAvailability(fixture(1894),'archives')).not.toBeNull();
  const s=selectChronicle(fixture(),'archives');s.stats.wealth=7;expect(chronicleLockReason(s,nextChronicleEvent(s)!.choices[0])).toContain('재산 8');expect(chronicleLockReason(s,nextChronicleEvent(s)!.choices[1])).toBeNull();s.stats.wealth=20;act(s,0);s.stats.wealth=5;expect(chronicleLockReason(s,nextChronicleEvent(s)!.choices[1])).toContain('재산 6');s.stats.wealth=20;s.stats.education=39;expect(chronicleLockReason(s,nextChronicleEvent(s)!.choices[1])).toContain('교육 40');
 });
 it('rejects report/transition selection and switching to a different active arc',()=>{
  const s=selectChronicle(fixture(),'craft');act(s,0);expect(selectChronicle(s,'care')).toBe(s);expect(chronicleAvailability(s,'care')).toContain('진행 중');const changing={...s,phase:'succession' as const};expect(selectChronicle(changing,'craft')).toBe(changing);const report={...s,report:{} as State['report']};expect(selectChronicle(report,'craft')).toBe(report);
 });
 it('pauses without awarding resources, resumes after two other decisions, and can abandon',()=>{
  const s=selectChronicle(fixture(),'care');act(s,0);const wealth=s.stats.wealth;act(s,2);expect(s.stats.wealth).toBe(wealth);expect(nextChronicleEvent(s)).toBeUndefined();s.turn++;expect(nextChronicleEvent(s)).toBeUndefined();s.turn++;expect(nextChronicleEvent(s)?.id).toBe('chronicle-care-finish');act(s,3);expect(s.chronicles!.active).toBeNull();expect(s.chronicles!.completed).toEqual([]);
 });
 it('closes expired preparation without claiming success and without mutating while reading',()=>{
  const s=selectChronicle(fixture(1660),'war');act(s,0);const snapshot=JSON.stringify(s);expect(nextChronicleEvent(s)?.id).toBe('chronicle-expired');const stale=chronicleEvents.find(e=>e.id==='chronicle-war-finish')!;expect(prepareChronicleEvent(s,stale).id).toBe('chronicle-expired');expect(JSON.stringify(s)).toBe(snapshot);applyChronicleAction(s,{type:'complete',outcome:'refuge'});expect(s.chronicles!.completed).toEqual([]);act(s,0);expect(s.chronicles!.active).toBeNull();expect(s.chronicles!.completed).toEqual([]);
 });
 it('allows the next living representative to complete inherited preparation',()=>{
  const s=selectChronicle(fixture(),'justice');act(s,0);const first=s.people[s.head];first.alive=false;first.died=s.year;const heir:Person={...structuredClone(first),id:'heir',name:'후계자',alive:true,died:null,born:s.year-22,children:[],parents:[],spouses:[],life:[]};s.people.heir=heir;s.head='heir';act(s,1);expect(s.chronicles!.history[0].actor).toBe('heir');expect(heir.life[0].text).toContain('가족의 몫');expect(first.life.some(l=>l.text.includes('가족의 몫'))).toBe(false);
 });
 it('keeps pure defaults and serialized intermediate state deterministic',()=>{
  const old=fixture();delete old.chronicles;const before=JSON.stringify(old);expect(chronicleState(old)).toEqual({selected:null,active:null,completed:[],history:[]});expect(JSON.stringify(old)).toBe(before);
  const a=selectChronicle(old,'trade');act(a,0);const b=decodeSave(JSON.stringify(a));expect(b).not.toBeNull();expect(nextChronicleEvent(a)).toEqual(nextChronicleEvent(b!));act(a,1);act(b!,1);expect(b).toEqual(a);expect(a.rng).toBe(old.rng);
 });
 it('refreshes a stale preparation card when the user changes the selected arc',()=>{
  let s=selectChronicle(fixture(),'archives');const old=nextChronicleEvent(s)!;s.event=old.id;s=selectChronicle(s,'craft');const shown=prepareChronicleEvent(s,old);expect(shown.id).toBe('chronicle-craft-prepare');expect(shown.choices[0].chronicleAction).toEqual({type:'prepare',arc:'craft'});expect(chronicleLockReason(s,shown.choices[0])).toBeNull();expect(shown.choices[0].effects.wealth).toBe(-7);
 });
 it('round-trips paused active preparation with bounded due turn and resumes identically',()=>{
  const s=selectChronicle(fixture(),'trade');act(s,0);act(s,2);const restored=decodeSave(JSON.stringify(s));expect(restored).not.toBeNull();expect(restored!.chronicles).toEqual(s.chronicles);expect(s.chronicles!.active!.dueTurn-s.turn).toBe(2);expect(nextChronicleEvent(restored!)).toBeUndefined();restored!.turn+=2;s.turn+=2;expect(nextChronicleEvent(restored!)).toEqual(nextChronicleEvent(s));
 });
 it('rejects malformed outcome histories and accepts missing legacy chronicle state',()=>{
  const s=selectChronicle(fixture(),'archives');act(s,0);act(s,0);expect(decodeSave(JSON.stringify(s))).not.toBeNull();
  const invalids=[
   {...s.chronicles,completed:['unknown']},
   {...s.chronicles,history:[{...s.chronicles!.history[0],arc:'care'}]},
   {...s.chronicles,completed:['school','school'],history:[...s.chronicles!.history,...s.chronicles!.history]},
   {...s.chronicles,history:[{...s.chronicles!.history[0],year:s.year+1}]},
   {...s.chronicles,history:[{...s.chronicles!.history[0],actor:'missing'}]},
  ];
  for(const chronicles of invalids)expect(decodeSave(JSON.stringify({...s,chronicles}))).toBeNull();
  const active=selectChronicle(fixture(),'care');act(active,0);for(const dueTurn of [-1,.5,active.turn+1000])expect(decodeSave(JSON.stringify({...active,chronicles:{...active.chronicles,active:{...active.chronicles!.active,dueTurn}}}))).toBeNull();
  const old=fixture();delete old.chronicles;expect(decodeSave(JSON.stringify(old))).not.toBeNull();
 });
});
