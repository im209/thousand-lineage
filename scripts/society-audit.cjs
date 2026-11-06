/* Bounded natural-play reachability probe, not a perfect-play or retention test. */
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText,file);
const e=require('../src/engine.ts'),{decodeSave}=require('../src/save.ts');
const starts=['commoner','specialist','yangban','nobi'],goals=['kingmaker','founder'];
const results=[];
function pick(s,goal){
 const event=e.currentEvent(s),a=e.societyState(s);
 const options=event.choices.map((c,i)=>({c,i})).filter(({i})=>e.choiceAvailable(s,i));
 if(!options.length)throw Error('No enabled choice '+event.id+' '+JSON.stringify(a));
 const order=['free','restore',goal,'court','appointment','technical','exam','recognize'];
 for(const action of order){const found=options.find(({c})=>c.socialAction===action);if(found)return found.i}
 const target=goal==='founder'?75:60;
 if(a.support<target){const build=options.find(({c})=>c.socialAction==='organize');if(build)return build.i}
 const weights={wealth:s.stats.wealth<40?2:1,health:s.stats.health<45?2:.5,stability:s.stats.stability<45?1.5:.5,cohesion:s.stats.cohesion<50?2:.7,education:s.stats.education<65?1:.2,connections:s.stats.connections<65?1.2:.25,reputation:s.stats.reputation<65?1.2:.25,status:.1};
 return options.map(o=>({...o,score:Object.entries(o.c.effects).reduce((sum,[k,v])=>sum+Math.max(-s.stats[k],Math.min(100-s.stats[k],v))*weights[k],0)+Math.min(30,s.debt*(o.c.debtRelief||0)*.7)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0].i;
}
for(const origin of starts)for(let seed=1;seed<=10;seed++){
 const goal=seed%2?'kingmaker':'founder';
 let s=e.selectSocialFocus(e.create(seed,0,origin),'politics'),steps=0,achieved=null;const trace=[];
 while(s.phase!=='ended'&&steps++<350){
  s=e.continueStory(s);if(s.phase==='succession'){s=e.succeed(s,e.candidates(s)[0].id);continue}
  // A milestone returns the UI to livelihood. The policy explicitly resumes
  // its chosen political goal; it does not rely on perpetual automatic focus.
  s=e.selectSocialFocus(s,e.societyState(s).achievements.includes(goal)||s.year>=1894?'livelihood':'politics');
  const index=pick(s,goal),event=e.currentEvent(s),action=event.choices[index].socialAction;
  if(action)trace.push({year:s.year,event:event.id,action,office:e.societyState(s).office,examPerson:e.societyState(s).examPerson,support:e.societyState(s).support});
  s=e.choose(s,index);if(achieved===null&&e.societyState(s).achievements.includes(goal))achieved=s.report?.from??s.year;const errors=e.validate(s);if(errors.length)throw Error(`${origin}/${goal}/${seed}: ${errors}`);
  if(!decodeSave(JSON.stringify(s)))throw Error(`Save invalid ${origin}/${goal}/${seed} ${s.year}`);
 }
 if(s.phase!=='ended')throw Error('Not terminated');
 results.push({origin,goal,seed,years:s.year-1392,achieved,achievements:e.societyState(s).achievements,trace});
}
const summary=starts.flatMap(origin=>goals.map(goal=>{const r=results.filter(r=>r.origin===origin&&r.goal===goal);return {origin,goal,runs:r.length,success:r.filter(r=>r.achieved!==null).length,attempted:r.filter(r=>r.trace.some(t=>t.action===goal)).length,exam:r.filter(r=>r.achievements.includes('exam')).length,court:r.filter(r=>r.achievements.includes('court')).length,freed:r.filter(r=>r.achievements.includes('freed')).length,restored:r.filter(r=>r.achievements.includes('restored')).length,yangban:r.filter(r=>r.achievements.includes('yangban')).length,abolished:r.filter(r=>r.achievements.includes('abolished')).length,averageYears:r.reduce((n,r)=>n+r.years,0)/r.length}}));
fs.writeFileSync('docs/society-audit-results.json',JSON.stringify({scope:'Seeds1–10 for each of four starting backgrounds; odd seeds pursue kingmaker and even seeds pursue founder. Heuristic policies explicitly resume political focus after intermediate milestones; no outcome guarantee or human playtest evidence. Existing genealogy and JSON save/reload validity checked at every step.',summary,results},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
