import {openGameTab} from './navigation';
import {test,expect,type Page} from '@playwright/test';

const key='thousand-lineage-v1';
type Mode='fresh'|'locked-books'|'modern'|'ended'|'combined-ended';

// Fixtures use actual game actions from a fresh seed. No completed flags,
// dates, family members, resources or random state are injected.
async function install(page:Page,mode:Mode='fresh'){
 await page.goto('/');
 await page.evaluate(async mode=>{
  const enginePath='/src/engine.ts',arcPath='/src/chronicles.ts',savePath='/src/save.ts',endingPath='/src/endings.ts';
  const e=await import(enginePath),arcs=await import(arcPath),save=await import(savePath),endings=await import(endingPath);
  let s=e.selectSocialFocus(e.create(1,0,'commoner'),'livelihood');
  const checked=(next:any)=>{
   if(e.validate(next).length)throw Error('Natural fixture has invalid genealogy');
   const restored=save.decodeSave(JSON.stringify(next));if(!restored)throw Error('Natural fixture does not round-trip');return restored;
  };
  if(mode==='locked-books'){
   s=arcs.selectChronicle(s,'archives');
   s=checked(e.continueStory(e.choose(s,2)));
   if(e.currentEvent(s).id!=='chronicle-archives-prepare')throw Error('Archives preparation not reached');
   s=checked(e.continueStory(e.choose(s,0)));
   if(e.currentEvent(s).id!=='chronicle-archives-finish'||e.choiceAvailable(s,1))throw Error('Expected a naturally locked books decision');
  }
  if(mode==='modern'||mode==='ended'||mode==='combined-ended'){
   const balanced=(state:any)=>{
    const weights:any={wealth:state.stats.wealth<35?2.8:1,health:state.stats.health<55?3:1.2,stability:state.stats.stability<45?2:1,cohesion:state.stats.cohesion<65?2.2:1,education:state.stats.education<60?1.4:.3,connections:state.stats.connections<60?1.2:.3,reputation:state.stats.reputation<55?.9:.2,status:.1};
    return e.currentEvent(state).choices.map((choice:any,index:number)=>({choice,index})).filter(({index}:any)=>e.choiceAvailable(state,index)).map((option:any)=>{
     let score=Object.entries(option.choice.effects).reduce((sum:number,[stat,value]:any)=>sum+Math.max(-state.stats[stat],Math.min(100-state.stats[stat],value))*weights[stat],0);
     const borrowing=Math.max(0,-(option.choice.effects.wealth||0)-state.stats.wealth);
     score-=borrowing*.7;score+=Math.min(30,(state.debt+borrowing)*(option.choice.debtRelief||0)*.7);
     return {...option,score};
    }).sort((a:any,b:any)=>b.score-a.score||a.index-b.index)[0].index;
   };
   // Natural play from real seeds. Random family events (including 돌발 사건) change which seed
   // reaches a given ending, so search a few seeds instead of depending on one.
   const attempt=(seed:number)=>{
   let s=e.selectSocialFocus(e.create(seed,0,'commoner'),'livelihood');
   for(let steps=0;steps<450&&s.phase!=='ended';steps++){
    s=checked(e.continueStory(s));
    if(mode==='modern'&&s.year>=1894)break;
    if(s.phase==='succession'){s=checked(e.succeed(s,e.candidates(s)[0].id));continue;}
    s=e.selectSocialFocus(s,'livelihood');
    const desired=mode==='combined-ended'&&s.chronicles?.completed.includes('relief')?'medicine':'relief';
    if(!s.chronicles?.completed.includes(desired)&&!s.chronicles?.selected&&!s.chronicles?.active&&s.year<1894)s=arcs.selectChronicle(s,'care');
    const event=e.currentEvent(s);let index=balanced(s);
    if(event.id==='chronicle-care-prepare')index=e.choiceAvailable(s,0)?0:1;
    if(event.id==='chronicle-care-finish'){const outcome=desired==='medicine'?1:0;index=e.choiceAvailable(s,outcome)?outcome:2;}
    s=checked(e.choose(s,index));
   }
   s=checked(e.continueStory(s));
   if(!s.chronicles?.completed.includes('relief'))return null;
   if(mode==='ended'&&(s.phase!=='ended'||endings.endingFor(s).id!=='relief'))return null;
   if(mode==='combined-ended'&&(s.phase!=='ended'||endings.endingFor(s).id!=='healing_community'))return null;
   if(mode==='modern'&&(s.year<1894||s.phase==='ended'))return null;
   return s;
   };
   let found:any=null;
   for(let seed=1;seed<=80&&!found;seed++)found=attempt(seed);
   if(!found)throw Error(mode==='modern'?'Natural modern transition not reached':mode==='ended'?'Natural relief ending not reached':'Natural combined care ending not reached');
   s=found;
  }
  s.runId='chronicles-e2e-'+mode;
  localStorage.setItem('thousand-lineage-v1',JSON.stringify(checked(s)));
 },mode);
 await page.reload();
}
async function state(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
async function hiddenEndings(page:Page,discovered:string[]=[]){
 const gallery=page.getByRole('region',{name:'가문 결말 도감'}),locked=gallery.locator('.ending-card.locked');
 const definitions=await page.evaluate(async()=>{const path='/src/endings.ts';return (await import(path)).endings as {id:string;title:string;description:string;category:string;requirement:string;hint:string}[]});
 await expect(locked).toHaveCount(definitions.length-discovered.length);
 await expect(locked.locator('[data-ending-id]')).toHaveCount(0);
 await expect(gallery.locator('.ending-card.locked[data-ending-id]')).toHaveCount(0);
 await expect(gallery.locator('.gallery-filters')).toHaveCount(0);
 const lockedMarkup=await locked.evaluateAll(cards=>cards.map(card=>card.outerHTML).join('\n'));
 const galleryText=await gallery.textContent(),accessibility=await gallery.ariaSnapshot();
 for(const ending of definitions){
  for(const secret of [ending.title,ending.description,ending.category,ending.requirement,ending.hint])expect(lockedMarkup).not.toContain(secret);
  if(!discovered.includes(ending.id))for(const secret of [ending.title,ending.description,ending.requirement,ending.hint]){
   expect(galleryText).not.toContain(secret);expect(accessibility).not.toContain(secret);
  }
 }
}

test('a selected life arc persists and preparation leads to an earned result through actual choices',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await install(page);await openGameTab(page,'조선의 삶');
 const panel=page.getByRole('region',{name:'조선의 삶',exact:true});
 await expect(panel.locator('.life-card')).toHaveCount(6);
 await expect(panel.locator('.life-card.trade button')).toBeDisabled();
 await expect(panel.locator('.life-card.trade button')).toContainText('1500');
 await expect(panel.locator('.life-card.war button')).toBeDisabled();
 await panel.locator('.life-card.care').getByRole('button',{name:'이 이야기 준비하기 →'}).click();
 expect((await state(page)).chronicles.selected).toBe('care');
 await page.reload();await openGameTab(page,'조선의 삶');
 await expect(panel.locator('.active-chronicle')).toContainText('곡식과 돌봄');
 await page.screenshot({path:`test-results/${info.project.name}-joseon-lives.png`,fullPage:true});await noOverflow(page);
 await panel.getByRole('button',{name:'이야기에서 계속하기 →'}).click();
 await page.getByRole('button',{name:/가족의 생활을 먼저 지킨다/}).click();
 await page.locator('.continue-button').click();
 await expect(page.locator('.event h2')).toContainText('곡식과 돌봄 · 준비할 것들');
 await page.getByRole('button',{name:/자원과 시간을 들여 준비한다/}).click();
 expect((await state(page)).chronicles.active.arc).toBe('care');
 expect((await state(page)).chronicles.completed).toEqual([]);
 await page.locator('.continue-button').click();
 await expect(page.locator('.event h2')).toContainText('곡식과 돌봄 · 무엇을 남길까요?');
 await page.getByRole('button',{name:/비축한 곡식을 이웃에게 무상으로 나눈다/}).click();
 const result=page.getByRole('region',{name:'선택 결과'});
 await expect(result.locator('.chronicle-result')).toContainText('곡식과 돌봄 완수');
 const after=await state(page);expect(after.chronicles.completed).toEqual(['relief']);expect(after.chronicles.history).toHaveLength(1);expect(after.chronicles.active).toBeNull();
 expect(after.report.immediate.wealth).toBe(-5);
 await page.reload();await expect(result.locator('.chronicle-result')).toContainText('곡식과 돌봄 완수');
 const restored=await state(page);expect(restored.chronicles.history).toEqual(after.chronicles.history);expect(restored.report.entries).toEqual(after.report.entries);
 await page.screenshot({path:`test-results/${info.project.name}-joseon-result.png`,fullPage:true});
 await openGameTab(page,'결말 도감');
 await hiddenEndings(page);
 await expect(page.locator('.ending-card.discovered')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')??'null')?.endings??[])).toEqual([]);
 await openGameTab(page,'연대기');
 await expect(page.locator('.chronicle')).toContainText('조선의 삶 · 사료에서 착안한 창작 사건');
 await noOverflow(page);expect(errors).toEqual([]);
});

test('a real unmet requirement disables the outcome and pausing preserves the paid preparation',async({page})=>{
 await install(page,'locked-books');
 const books=page.getByRole('button',{name:/사가의 문서를 필사하고 나누어 보관한다/});
 await expect(books).toBeDisabled();await expect(books).toContainText('교육 40 필요');
 const before=await state(page);
 expect(await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);const s=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);return JSON.stringify(e.choose(s,1))===JSON.stringify(s)})).toBe(true);
 await page.getByRole('button',{name:/마무리를 잠시 미루고 생활을 돌본다/}).click();
 const paused=await state(page);expect(paused.chronicles.active.startedYear).toBe(before.chronicles.active.startedYear);expect(paused.chronicles.completed).toEqual([]);
 await page.reload();expect((await state(page)).chronicles.active).toEqual(paused.chronicles.active);
 await page.locator('.continue-button').click();await openGameTab(page,'조선의 삶');
 const panel=page.getByRole('region',{name:'조선의 삶',exact:true});
 await expect(panel.locator('.active-chronicle')).toContainText('배움과 기록');
 await expect(panel.locator('.life-card.care button')).toBeDisabled();
 await expect(panel.locator('.life-card.care button')).toContainText('진행 중인 준비');await noOverflow(page);
});

test('undiscovered endings expose no spoilers in the catalogue DOM or accessibility tree',async({page},info)=>{
 await install(page);await openGameTab(page,'결말 도감');
 const gallery=page.getByRole('region',{name:'가문 결말 도감'});
 await expect(gallery.getByRole('heading',{name:'26가지 가문의 결말'})).toBeVisible();
 await expect(gallery.locator('.ending-card')).toHaveCount(26);
 await expect(gallery.locator('.ending-card.discovered')).toHaveCount(0);
 await expect(gallery.getByRole('heading',{name:'아직 밝혀지지 않은 결말',exact:true})).toHaveCount(26);
 await hiddenEndings(page);
 await gallery.getByLabel('발견한 결말만').check();
 await expect(gallery.locator('.ending-card')).toHaveCount(0);await expect(gallery.locator('.gallery-empty')).toBeVisible();
 await gallery.getByLabel('발견한 결말만').uncheck();
 await expect(gallery.locator('.ending-card')).toHaveCount(26);
 await page.screenshot({path:`test-results/${info.project.name}-ending-catalogue.png`,fullPage:true});await noOverflow(page);
});

test('a naturally reached ending is collected once and replay resets the arc but retains the collection',async({page},info)=>{
 await install(page,'ended');
 await expect(page.locator('.ending > .eyebrow')).toContainText('흉년을 함께 넘은 가문');
 const fixtureSeed=(await state(page)).seed;
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!));
 expect(records.endings).toEqual(['relief']);expect(records.recent).toHaveLength(1);
 await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!).recent.length)).toBe(1);
 await openGameTab(page,'결말 도감');
 const gallery=page.getByRole('region',{name:'가문 결말 도감'});
 await expect(gallery.locator('.ending-card.discovered')).toHaveCount(1);
 await expect(gallery.locator('[data-ending-id="relief"]')).toContainText('이번 결말');
 await expect(gallery.locator('[data-ending-id="relief"]')).toContainText('흉년을 함께 넘은 가문');
 await expect(gallery.locator('[data-ending-id="relief"]')).toContainText('조선의 삶 → 곡식과 돌봄 → 무상 구호 · 후손 생존');
 await hiddenEndings(page,['relief']);
 await page.screenshot({path:`test-results/${info.project.name}-ending-discovered.png`,fullPage:true});
 await page.getByRole('button',{name:'이야기',exact:true}).click();
 await page.getByRole('button',{name:/같은 운명, 다른 선택으로 재도전/}).click();await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 const replay=await state(page);expect(replay.year).toBe(1392);expect(replay.seed).toBe(fixtureSeed);expect(replay.chronicles?.completed??[]).toEqual([]);expect(replay.chronicles?.active??null).toBeNull();expect(replay.runId).not.toBe('chronicles-e2e-ended');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!))).toEqual(records);
 await openGameTab(page,'결말 도감');
 await expect(gallery.locator('[data-ending-id="relief"]')).toContainText('발견 ✓');
 await hiddenEndings(page,['relief']);
 await gallery.getByLabel('발견한 결말만').check();await expect(gallery.locator('.ending-card')).toHaveCount(1);await noOverflow(page);
});

test('combined achievements reveal only the earned ending and subsequent runs unlock one more',async({page})=>{
 await install(page,'combined-ended');
 await expect(page.locator('.ending > .eyebrow')).toContainText('마을을 살린 가문');
 expect((await state(page)).chronicles.completed).toEqual(['relief','medicine']);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!).endings)).toEqual(['healing_community']);
 for(const title of ['흉년을 함께 넘은 가문','생명을 돌본 가문'])await expect(page.locator('body')).not.toContainText(title);
 await openGameTab(page,'결말 도감');await hiddenEndings(page,['healing_community']);
 await install(page,'ended');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!).endings)).toEqual(['healing_community','relief']);
 await openGameTab(page,'결말 도감');await hiddenEndings(page,['healing_community','relief']);
 expect(await page.locator('.ending-card.discovered').evaluateAll(cards=>cards.map(card=>card.getAttribute('data-ending-id')))).toEqual(['relief','healing_community']);
 await page.reload();
 await openGameTab(page,'결말 도감');await hiddenEndings(page,['healing_community','relief']);
 await install(page,'combined-ended');
 await expect(page.locator('.ending-companions')).toContainText('흉년을 함께 넘은 가문');
 await expect(page.locator('body')).not.toContainText('생명을 돌본 가문');await noOverflow(page);
});

test('a natural modern transition closes new Joseon arcs while preserving completed history',async({page})=>{
 await install(page,'modern');await openGameTab(page,'조선의 삶');
 const panel=page.getByRole('region',{name:'조선의 삶',exact:true});
 await expect(panel).toContainText('근대에 들어 새 조선 이야기는 시작할 수 없습니다');
 await expect(panel.locator('.life-card button:disabled')).toHaveCount(6);
 await expect(panel.locator('.life-achievements')).toContainText('비축한 곡식을 이웃에게 무상으로 나눈다');
 expect((await state(page)).chronicles.completed).toEqual(['relief']);
 await page.reload();expect((await state(page)).chronicles.completed).toEqual(['relief']);await noOverflow(page);
});
