import {test,expect,type Page} from '@playwright/test';
const key='thousand-lineage-v1';
async function state(page:Page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key)}

// Real engine play (first choice each turn) until a decision is interrupted by a plague surprise.
async function interruptedTurn(page:Page){
 await page.goto('/');
 const seed=await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);
  for(let seed=1;seed<300;seed++){let s=e.create(seed,0,'commoner');s.introPending=false;
   for(let i=0;i<200&&s.phase!=='ended';i++){
    if(s.phase==='succession'){s=e.succeed(s,e.candidates(s)[0].id);continue}
    const next=e.choose(s,0);
    if(next.surprise?.id==='surprise-plague'){localStorage.setItem('thousand-lineage-v1',JSON.stringify(next));return seed}
    s=e.continueStory(next);}}
  return 0;});
 expect(seed).toBeGreaterThan(0);
 await page.reload();
}

test('a surprise interrupts the years, asks for a response, then finishes the remaining span',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await interruptedTurn(page);
 const before=await state(page),result=page.getByRole('region',{name:'선택 결과'});
 await expect(result.locator('.surprise-notice')).toContainText(`그런데 ${before.year}년, 뜻밖의 일이 생겼습니다.`);
 await expect(result.locator('.surprise-notice')).toContainText(`남은 ${before.surprise.remaining}년`);
 await result.getByRole('button',{name:'무슨 일인지 보기 →'}).click();

 const event=page.locator('.event.surprise-event');
 await expect(event).toBeVisible();
 await expect(event.locator('.eyebrow')).toContainText('돌발 사건');
 const target=before.people[before.surprise.target];
 await expect(event.locator('.event-description')).toContainText(target.name);
 await expect(event.getByRole('button',{name:/집안에서 정성껏 간병한다/})).toContainText('회복 확률 75%');
 await expect(event.getByRole('button',{name:/집안에서 정성껏 간병한다/})).toBeInViewport();
 await page.screenshot({path:`test-results/${info.project.name}-surprise.png`,fullPage:true});

 // Reload keeps the pending surprise.
 await page.reload();await expect(page.locator('.event.surprise-event')).toBeVisible();

 await page.getByRole('button',{name:/마을과 함께 병자를 격리한다/}).click();
 const after=await state(page);
 expect(after.surprise).toBeUndefined();
 expect(after.year-before.year).toBeLessThanOrEqual(before.surprise.remaining);
 expect(after.people[before.head].alive||after.people[before.head].died!==before.year).toBe(true);
 await expect(page.getByRole('region',{name:'선택 결과'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
