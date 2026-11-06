import {test,expect,type Page} from '@playwright/test';
const key='thousand-lineage-v1';
async function state(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}

test('a real new family has a visible goal and three family decisions, without a fixture changing its direction',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 await page.getByLabel('성씨 본관 검색').fill('김해 김씨');
 await page.locator('.search-results button').filter({hasText:'김해 김씨'}).first().click();
 await page.getByRole('button',{name:'김해 김씨의 이야기 시작'}).click();
 await expect(page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true})).toBeInViewport({ratio:1});
 await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 await expect(page.locator('.choice').first()).toBeInViewport({ratio:1});
 await page.getByRole('button',{name:'함께 사는 집을 목표로 →',exact:true}).click();
 await expect(page.getByLabel('현재 목표 진행')).toContainText('관련 선택 0/3');
 for(let turn=0;turn<3;turn++){
  const before=await state(page);expect(before.society.focus).toBe('livelihood');
  expect(before.event).not.toMatch(/^social-/);
  await page.locator('.choice:not([disabled])').first().click();
  const after=await state(page);
  await expect(page.locator('.result-headline')).toHaveText(after.report.outcome);
  await expect(page.getByLabel('선택 직후 변화')).toBeVisible();
  expect(after.report.to-after.report.from).toBe(5);
  if(turn===0){await expect(page.locator('.goal-result')).toContainText('관련 선택 1/3');await page.screenshot({path:`test-results/${info.project.name}-growth-result.png`,fullPage:true});}
  await page.locator('.continue-button').click();
  const continued=await state(page);
  if(continued.phase!=='play')break;
  await expect(page.locator('.first-choice-guide')).toContainText(continued.people[continued.head].name);
 }
 if((await state(page)).phase==='play'){
  await page.screenshot({path:`test-results/${info.project.name}-growth-goal.png`,fullPage:true});
  await page.reload();await expect(page.getByLabel('현재 목표 진행')).toContainText('함께 사는 집');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('trade trust reveals a real cost benefit and study advances an existing goal',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);let s=e.create(1,0,'commoner');s.stats.connections=59;s.event='life1';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();await page.getByRole('button',{name:/품을 나누며 관계를 쌓는다/}).click();
 await expect(page.locator('.benefit-result')).toContainText('8에서 3');
 await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);let s=e.continueStory(JSON.parse(localStorage.getItem('thousand-lineage-v1')!));s.event='life3';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();await expect(page.getByRole('button',{name:/밑천을 들여 거래를 넓힌다/})).toContainText('연결 60 이상 혜택');
 await expect(page.locator('.trade-benefit.ready')).toContainText('8 → 3');
 await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);let s=e.selectProject(e.create(1,0,'commoner'),'learning');s.event='social-career';s.society.focus='advancement';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();await expect(page.getByRole('button',{name:/배움과 향촌의 신뢰를 쌓는다/})).toContainText('가문 과업 진행 +1');
 await page.getByRole('button',{name:/배움과 향촌의 신뢰를 쌓는다/}).click();
 await expect(page.locator('.goal-result')).toContainText('배움의 집 · 관련 선택 1/3');
 await page.reload();expect((await state(page)).projects.progress.learning).toBe(1);
});
