import {test,expect} from '@playwright/test';
test('an existing surviving family can continue into the future and reload with its milestone preserved',async({page},info)=>{
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/engine.ts',e=await import(path),s=e.create(42);s.year=2026;s.people[s.head].born=1990;s.phase='ended';s.endReason='2026년까지 존속';s.runId='future-browser-fixture';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!));
 await expect(page.getByRole('button',{name:'이 가문으로 미래까지 이어가기 →',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'이 가문으로 미래까지 이어가기 →',exact:true}).click();
 await expect(page.locator('.future-banner')).toContainText('연도 제한 없이');await expect(page.locator('.choice').first()).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!))).toEqual(before);
 await page.locator('.choice').first().click();await expect(page.locator('.turn-result')).toBeVisible();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!));expect(state.year).toBeGreaterThan(2026);expect(state.endless).toBe(true);
 await page.reload();await expect(page.locator('.game-heading')).toContainText('가상의 미래');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!))).toEqual(state);
 await page.screenshot({path:`test-results/${info.project.name}-future-continuation.png`,fullPage:true});
});
