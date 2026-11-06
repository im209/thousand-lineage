import {openStoryTools} from './navigation';
import {test,expect,type Page} from '@playwright/test';

const saveKey='thousand-lineage-v1';
async function fixture(page:Page,mode:'fresh'|'locked'|'reward'|'ended'='fresh'){
 await page.goto('/');
 await page.evaluate(async mode=>{
  const path='/src/engine.ts';const engine=await import(path);const s=engine.create(42,0);
  s.runId='progression-fixture';if(s.society)s.society.focus='livelihood';
  if(mode==='locked')s.event='life0';
  if(mode==='reward'){
   s.projects={active:'care',progress:{learning:0,trade:0,care:2},completed:[]};
   s.stats.cohesion=70;
  }
  if(mode==='ended'){
   s.year=1432;s.phase='ended';s.endReason='후계자 부재';
   s.people[s.head].alive=false;s.people[s.head].died=1432;
   s.projects={active:null,progress:{learning:0,trade:3,care:0},completed:['trade']};
  }
  localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));
 },mode);
 await page.reload();
}
async function saved(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey)}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}

test('project selection persists, marks matching choices, and first three turns advance five years',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await fixture(page);
 await openStoryTools(page);
 const board=page.getByRole('region',{name:'가문 과업'});
 await board.getByRole('button',{name:/배움의 집/}).click();
 await expect(board.getByRole('heading',{name:'배움의 집'})).toBeVisible();
 await page.reload();await openStoryTools(page);
 await expect(board.getByRole('heading',{name:'배움의 집'})).toBeVisible();
 const learningChoice=page.getByRole('button',{name:/배움에 미래를 건다/});
 await expect(learningChoice).toContainText('가문 과업 진행 +1');
 await expect(page.locator('.event')).toContainText('이번 선택 후 5년을 진행합니다');
 await expect(page.locator('.event')).toHaveCSS('opacity','1');
 await page.screenshot({path:`test-results/${info.project.name}-projects.png`,fullPage:true});
 await noOverflow(page);
 for(let turn=0;turn<3;turn++){
  const before=await saved(page);
  if(turn===0)await learningChoice.click();else await page.locator('.choice:not([disabled])').first().click();
  await expect(page.getByRole('region',{name:'선택 결과'})).toBeVisible();
  const after=await saved(page);
  expect(after.year-before.year).toBe(5);expect(after.report.to-after.report.from).toBe(5);
  if(turn===0)expect(after.projects.progress.learning).toBe(1);
  await page.locator('.continue-button').click();
 }
 await expect(page.locator('.event')).toContainText('이번 선택 후 10–15년을 진행합니다');
 await noOverflow(page);expect(errors).toEqual([]);
});

test('locked legacy choice is disabled and cannot advance the saved game',async({page})=>{
 await fixture(page,'locked');
 const special=page.getByRole('button',{name:/단골 거래를 꾸준히 이어 간다/});
 await expect(special).toBeDisabled();await expect(special).toContainText('신뢰받는 상가 완성 필요');
 const before=await saved(page);
 const rejected=await page.evaluate(async()=>{const path='/src/engine.ts';const engine=await import(path);const state=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);return JSON.stringify(engine.choose(state,3))===JSON.stringify(state)});
 expect(rejected).toBe(true);expect(await saved(page)).toEqual(before);
 await noOverflow(page);
});

test('project reward is visible in the result and survives reload exactly once',async({page},info)=>{
 await fixture(page,'reward');
 await page.getByRole('button',{name:/가족의 생활을 먼저 지킨다/}).click();
 const result=page.getByRole('region',{name:'선택 결과'});
 await expect(result.locator('.project-result')).toContainText('함께 사는 집 완성!');
 await expect(result.locator('.project-result')).toContainText('생활환경 +8');
 const after=await saved(page);expect(after.projects.completed).toEqual(['care']);expect(after.projects.active).toBeNull();
 expect(after.log.filter((entry:{kind:string})=>entry.kind==='project')).toHaveLength(1);
 await page.reload();
 await expect(result.locator('.project-result')).toContainText('함께 사는 집 완성!');
 expect((await saved(page)).log.filter((entry:{kind:string})=>entry.kind==='project')).toHaveLength(1);
 await page.screenshot({path:`test-results/${info.project.name}-project-complete.png`,fullPage:true});
 await noOverflow(page);
});

test('completed run records survive a same-seed replay while the new run resets',async({page})=>{
 await fixture(page,'ended');
 await expect(page.getByRole('region',{name:'나의 가문 기록'})).toContainText('40');
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!));
 expect(records.bestYears).toBe(40);expect(records.projects).toEqual(['trade']);expect(records.recent).toHaveLength(1);
 await page.reload();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!).recent.length)).toBe(1);
 await page.getByRole('button',{name:/같은 운명, 다른 선택으로 재도전/}).click();await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 const replay=await saved(page);
 expect(replay.seed).toBe(42);expect(replay.clan).toBe(0);expect(replay.year).toBe(1392);expect(replay.turn).toBe(0);
 expect(replay.runId).not.toBe('progression-fixture');expect(typeof replay.runId).toBe('string');
 expect(replay.projects?.completed??[]).toEqual([]);expect(replay.projects?.active??null).toBeNull();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!))).toEqual(records);
 await openStoryTools(page);
 await expect(page.getByRole('region',{name:'가문 과업'}).getByRole('button',{name:/신뢰받는 상가/})).toBeEnabled();
 await noOverflow(page);
});

test('debt recovery shows the sacrifice and records the actual reduction',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);const s=e.create(42);s.event='life8';s.debt=60;s.stats.wealth=30;localStorage.setItem('thousand-lineage-v1',JSON.stringify(s))});
 await page.reload();
 await expect(page.getByText('빚을 줄일 새로운 약속',{exact:true})).toBeVisible();
 await expect(page.locator('.event-description')).toContainText('60.0');
 await page.getByRole('button',{name:/재산과 거래망을 정리한다/}).click();
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('부채 30.0점을 조정');
 expect((await saved(page)).debt).toBeLessThan(60);
 await noOverflow(page);
});
