import {test,expect} from '@playwright/test';

test('a fatal exam journey preserves its story through reload and succession',async({page},info)=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const enginePath='/src/engine.ts',journeyPath='/src/journeys.ts',surprisePath='/src/surprises.ts';
  const e=await import(enginePath),j=await import(journeyPath),r=await import(surprisePath);
  const s=e.create(1,0,'commoner');s.year=1600;s.turn=5;s.event='journey-tiger';s.introPending=false;
  const p=s.people[s.head];p.born=1570;p.sex='남';p.trait='다정함';
  s.people.child={...structuredClone(p),id:'child',name:'김후손',born:1590,generation:2,parents:[p.id],spouses:[],children:[],life:[],job:'미성년'};p.children.push('child');
  s.journey={id:'journey-tiger',candidate:p.id,startedYear:1600};
  while(r.surpriseRoll(s,22)>=j.journeyRisk(s))s.seed++;
  localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));
 });
 await page.reload();
 await expect(page.getByRole('region',{name:'과거길의 응시자와 위험'})).toBeVisible();
 await expect(page.locator('.journey-stakes')).toContainText('35%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/${info.project.name}-journey.png`,fullPage:true});
 await page.locator('.choice').nth(1).click();
 await expect(page.locator('.result-headline')).toContainText('호환');
 await expect(page.locator('.result-year')).toHaveText('1600년');
 await expect(page.locator('.memory-copy h3')).not.toContainText('호환');
 await page.reload();await expect(page.locator('.result-headline')).toContainText('호환');
 await page.getByRole('button',{name:'다음 대표 선택하기 →'}).click();
 await expect(page.locator('.representative-memory')).toBeVisible();
 await page.locator('.heir-pick').first().click();await page.locator('.succession .continue-button').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!).head)).toBe('child');
});
