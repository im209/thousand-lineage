/* Natural-play reachability probe, not a retention study or a guarantee.
 * Run: node scripts/chronicle-audit.cjs [seeds-per-outcome=10]
 * Only public game actions create progress. No year, family, stats, RNG or
 * completed flags are injected. Every action is saved and decoded again.
 */
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText,filename);
const engine=require('../src/engine.ts');
const {chronicles,selectChronicle}=require('../src/chronicles.ts');
const {decodeSave}=require('../src/save.ts');
const {endingFor}=require('../src/endings.ts');
const seedCount=Math.max(1,Math.min(50,Math.floor(Number(process.argv[2])||10)));

function balancedChoice(s,requirements={}){
 const event=engine.currentEvent(s);
 const available=event.choices.map((choice,index)=>({choice,index})).filter(({index})=>engine.choiceAvailable(s,index));
 if(!available.length)throw Error(`No available choice at ${s.year}/${event.id}`);
 const weights={wealth:s.stats.wealth<35?2.8:1,health:s.stats.health<55?3:1.2,stability:s.stats.stability<45?2:1,cohesion:s.stats.cohesion<65?2.2:1,education:s.stats.education<60?1.4:.3,connections:s.stats.connections<60?1.2:.3,reputation:s.stats.reputation<55?.9:.2,status:.1};
 return available.map(option=>{
  const effects=option.choice.effects;
  let score=Object.entries(effects).reduce((sum,[stat,value])=>sum+Math.max(-s.stats[stat],Math.min(100-s.stats[stat],value))*weights[stat],0);
  const borrowing=Math.max(0,-(effects.wealth||0)-s.stats.wealth);
  score-=borrowing*.7;
  score+=Math.min(30,(s.debt+borrowing)*(option.choice.debtRelief||0)*.7);
  // Read the displayed target requirements just as a player planning that
  // branch can. General survival scoring alone can avoid all study costs.
  for(const [stat,threshold] of Object.entries(requirements))score+=Math.min(Math.max(0,threshold-s.stats[stat]),Math.max(0,effects[stat]||0))*3.5;
  return {...option,score};
 }).sort((a,b)=>b.score-a.score||a.index-b.index)[0].index;
}

function run(arc,outcome,index,seed){
 let s=engine.create(seed,0,'commoner');
 let actionCount=0,checks=0,acquired=null,selectionAfter=-1;
 const trace=[];
 function check(next,action){
  const errors=engine.validate(next);
  if(errors.length)throw Error(`${arc.id}/${outcome.id}/${seed} ${action}: ${errors.join(',')}`);
  const restored=decodeSave(JSON.stringify(next));
  if(!restored)throw Error(`Invalid save ${arc.id}/${outcome.id}/${seed} ${action}/${next.year}`);
  if(JSON.stringify(restored.chronicles)!==JSON.stringify(next.chronicles))throw Error(`Chronicle changed on reload ${arc.id}/${outcome.id}/${seed} ${action}`);
  if(engine.validate(restored).length)throw Error(`Invalid restored genealogy ${arc.id}/${outcome.id}/${seed}`);
  checks++;return restored;
 }
 s=check(engine.selectSocialFocus(s,'livelihood'),'focus');
 while(s.phase!=='ended'&&actionCount++<450){
  if(s.report)s=check(engine.continueStory(s),'continue');
  if(s.phase==='ended')break;
  if(s.phase==='succession'){
   const next=engine.candidates(s)[0];if(!next)throw Error('Succession has no candidate');
   s=check(engine.succeed(s,next.id),'succeed');continue;
  }
  // Focus selection and arc selection are player actions, without forcing an
  // event. Historical events and pending decisions retain engine priority.
  s=check(engine.selectSocialFocus(s,'livelihood'),'focus');
  const already=(s.chronicles?.completed||[]).includes(outcome.id);
  if(!already&&!s.chronicles?.active&&!s.chronicles?.selected&&s.year>=arc.min&&s.year<=arc.max&&s.turn>=selectionAfter){
   const before=s;
   s=check(selectChronicle(s,arc.id),'select');
   if(s!==before&&s.event!==before.event)trace.push({year:s.year,event:s.event,action:'select'});
  }
  const event=engine.currentEvent(s);let choice;
  if(event.id===`chronicle-${arc.id}-prepare`){
   choice=engine.choiceAvailable(s,0)?0:1;
   if(choice===1)selectionAfter=s.turn+2;
  }else if(event.id===`chronicle-${arc.id}-finish`){
   choice=engine.choiceAvailable(s,index)?index:engine.choiceAvailable(s,2)?2:3;
   if(choice===2)selectionAfter=s.turn+3;
  }else if(event.id.startsWith('chronicle-')){
   // A historical boundary may present the engine's pending arc. Take its
   // explicit pause/abandon fallback rather than claim an unrelated outcome.
   const candidates=event.choices.map((_,i)=>i).filter(i=>engine.choiceAvailable(s,i));
   choice=candidates.at(-1);
  }else choice=balancedChoice(s,already||s.year>arc.max?{}:outcome.requirements);
  if(choice===undefined||!engine.choiceAvailable(s,choice))throw Error(`No legal policy action ${event.id}`);
  if(event.id.startsWith('chronicle-'))trace.push({year:s.year,event:event.id,index:choice,decision:event.choices[choice].title,wealth:Number(s.stats.wealth.toFixed(2))});
  s=check(engine.choose(s,choice),'choose');
  if(acquired===null&&(s.chronicles?.completed||[]).includes(outcome.id))acquired={year:s.report?.from??s.year,turn:s.turn};
 }
 if(s.phase!=='ended')throw Error(`Run did not terminate ${arc.id}/${outcome.id}/${seed}`);
 const ending=endingFor(s),summary=engine.summary(s);
 return {arc:arc.id,target:outcome.id,seed,acquired,ending:ending.id,endingTitle:ending.title,year:s.year,years:summary.years,living:summary.living,completed:s.chronicles?.completed||[],checks,trace};
}

const results=[];
for(const arc of chronicles){
 if(arc.outcomes.length!==2)throw Error(`Expected two distinct outcomes for ${arc.id}`);
 for(let index=0;index<arc.outcomes.length;index++)for(let seed=1;seed<=seedCount;seed++)results.push(run(arc,arc.outcomes[index],index,seed));
}
const summary=chronicles.flatMap(arc=>arc.outcomes.map(outcome=>{
 const runs=results.filter(run=>run.target===outcome.id);
 const endingCounts={};for(const run of runs)endingCounts[run.ending]=(endingCounts[run.ending]||0)+1;
 return {arc:arc.id,target:outcome.id,runs:runs.length,acquired:runs.filter(run=>run.acquired).length,finishedAsTarget:runs.filter(run=>run.ending===outcome.id).length,earliestAcquiredYear:Math.min(...runs.filter(run=>run.acquired).map(run=>run.acquired.year))||null,exampleSeed:runs.find(run=>run.ending===outcome.id)?.seed??null,endingCounts};
}));
for(const row of summary)if(!Number.isFinite(row.earliestAcquiredYear))row.earliestAcquiredYear=null;
const report={scope:`Natural starts: commoner, clan 0, seeds 1–${seedCount} for each of 12 intended outcomes. A deterministic resource-aware policy targets one outcome per run, uses only public game actions, respects locked decisions and date gates, selects the first legal heir, and continues to an actual ending. No completed flag, year, family, stat or RNG edits. Every action is checked by genealogy validation and JSON save/decode round-trip. These are bounded scripted observations, not measured player engagement or exhaustive reachability proofs.`,summary,checks:results.reduce((sum,run)=>sum+run.checks,0),results};
const destination=path.join(__dirname,'../docs/chronicle-audit-results.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary,checks:report.checks,report:destination},null,2));
