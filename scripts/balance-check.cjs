/* Reproducible, deterministic policy audit; this is not human playtesting.
 * Run: node scripts/balance-check.cjs [seeds=30]
 * No dependencies beyond this project's installed TypeScript.
 */
const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
require.extensions['.ts']=(module,filename)=>{const source=fs.readFileSync(filename,'utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;module._compile(output,filename)};
const engine=require('../src/engine.ts');const {projects}=require('../src/projects.ts');
const seeds=Math.max(1,Math.min(30,Number(process.argv[2])||30));
const policies=['rotating','balanced','learning','trade','care'];
function chooseIndex(s,policy){
 const event=engine.currentEvent(s);const available=event.choices.map((c,i)=>({c,i})).filter(({i})=>engine.choiceAvailable(s,i));
 if(policy==='rotating')return available[s.turn%Math.min(3,available.length)].i;
 const project=projects.find(p=>p.id===policy);const completed=project&&engine.projectComplete(s,project.id);
 const weights={wealth:s.stats.wealth<25?2.4:.9,health:s.stats.health<45?2.8:1.2,stability:s.stats.stability<40?2:1,cohesion:s.stats.cohesion<55?2:1,education:.6,connections:.4,reputation:.2,status:.1};
 const score=c=>{
  let n=Object.entries(c.effects).reduce((sum,[stat,v])=>sum+Math.max(-s.stats[stat],Math.min(100-s.stats[stat],v))*weights[stat],0);
  n-=Math.max(0,-(c.effects.wealth||0)-s.stats.wealth)*.5;
  // Recovery is a real decision benefit; cap its weight so debt does not erase
  // every resource tradeoff. This scoring change prevents a causal A/B claim.
  const borrowing=Math.max(0,-(c.effects.wealth||0)-s.stats.wealth);
  n+=Math.min(30,(s.debt+borrowing)*(c.debtRelief||0)*.7);
  if(project&&!completed){
   if(engine.projectProgress(s,project.id)<3&&project.keys.includes(c.legacy))n+=18;
   if(s.stats[project.stat]<project.threshold)n+=Math.min(project.threshold-s.stats[project.stat],Math.max(0,c.effects[project.stat]||0))*2;
  }
  if(c.unlock&&c.unlock===policy)n+=4;
  return n;
 };
 return available.map(option=>({...option,score:score(option.c)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0].i;
}
function run(seed,policy){
 let s=engine.create(seed);let completion=null;let unlockChoices=0;let actions=0;
 if(projects.some(p=>p.id===policy))s=engine.selectProject(s,policy);
 while(s.phase!=='ended'&&actions++<300){
  s=engine.continueStory(s);
  if(s.phase==='succession'){s=engine.succeed(s,engine.candidates(s)[0].id);continue}
  const index=chooseIndex(s,policy);if(engine.currentEvent(s).choices[index].unlock)unlockChoices++;
  s=engine.choose(s,index);
  if(!completion&&projects.some(p=>p.id===policy)&&engine.projectComplete(s,policy))completion={turn:s.turn,year:s.report.from};
  const invalid=engine.validate(s);if(invalid.length)throw Error(`Invalid ${policy}/${seed}: ${invalid}`);
 }
 if(s.phase!=='ended')throw Error(`Did not terminate ${policy}/${seed}`);
 const summary=engine.summary(s);
 return {seed,years:summary.years,turns:s.turn,fullSurvival:s.year===2026&&summary.living>0,completion,unlockChoices,descendants:summary.descendants,finalDebt:Number(s.debt.toFixed(2)),finalHealth:Number(s.stats.health.toFixed(2))};
}
const mean=xs=>Number((xs.reduce((a,b)=>a+b,0)/(xs.length||1)).toFixed(2));
const median=xs=>{const a=[...xs].sort((a,b)=>a-b),middle=Math.floor(a.length/2);return a.length%2?a[middle]:(a[middle-1]+a[middle])/2};
const results=policies.map(policy=>{
 const runs=Array.from({length:seeds},(_,i)=>run(i+1,policy));const completed=runs.filter(r=>r.completion);
 return {policy,seeds,meanYears:mean(runs.map(r=>r.years)),medianYears:median(runs.map(r=>r.years)),fullSurvival:runs.filter(r=>r.fullSurvival).length,meanTurns:mean(runs.map(r=>r.turns)),completedByTurn10:completed.filter(r=>r.completion.turn<=10).length,completedByEnding:completed.length,medianCompletionTurn:completed.length?median(completed.map(r=>r.completion.turn)):null,medianCompletionYear:completed.length?median(completed.map(r=>r.completion.year)):null,noDescendantEndings:runs.filter(r=>r.descendants===0).length,meanUnlockChoices:mean(runs.map(r=>r.unlockChoices)),meanFinalDebt:mean(runs.map(r=>r.finalDebt)),meanFinalHealth:mean(runs.map(r=>r.finalHealth)),runs};
});
const document={scope:'Seeds 1..N; deterministic policies, no human retention evidence. Rotating uses first three options; balanced is resource-aware without selecting a project. Project policies use the same resource scoring plus project progress/threshold preference. Completed project remains the sole target; no switching to other projects. First engine candidate chosen: adults before minors, then education and health. Debt-recovery choices now receive expected relief times 0.7, capped at 30 score points. This policy change and the new recovery event both differ from balance-before-recovery.json, so before/after differences are not a causal A/B estimate.',results};
fs.mkdirSync(path.join(__dirname,'../docs'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../docs/balance-results.json'),JSON.stringify(document,null,2)+'\n');
console.log(JSON.stringify(results.map(({runs,...summary})=>summary),null,2));
