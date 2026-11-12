import {test,expect,type Page} from '@playwright/test';

async function recordedFamily(page:Page,phase:'memory'|'succession') {
  await page.goto('/');
  await page.evaluate(async phase=>{
    const enginePath='/src/engine.ts',memoryPath='/src/family-memory.ts';
    const e=await import(enginePath),m=await import(memoryPath);
    for(let seed=1;seed<=15;seed++){
      let s=e.create(seed);
      for(let i=0;i<100&&s.phase!=='ended';i++){
        s=e.continueStory(s);
        if(phase==='succession'&&s.phase==='succession'){
          localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));return;
        }
        if(s.phase==='succession')s=e.succeed(s,e.candidates(s)[0].id);
        if(s.phase==='play')s=e.choose(s,0);
        if(phase==='memory'&&m.featuredMemory(s)){
          localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));return;
        }
      }
    }
    throw new Error('Could not generate a real family milestone');
  },phase);
  await page.reload();
}

test('family memories open the correct biography without progressing or losing the report',async({page},info)=>{
  await recordedFamily(page,'memory');
  const before=await page.evaluate(()=>localStorage.getItem('thousand-lineage-v1'));
  const memory=page.getByRole('region',{name:'가족의 중요한 순간'});
  await expect(memory).toBeVisible();
  const portrait=memory.getByRole('button').first();
  const name=await portrait.locator('span').textContent();
  await portrait.click();
  await expect(page.getByRole('dialog').getByRole('heading',{level:2})).toHaveText(name!);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(portrait).toBeFocused();
  expect(await page.evaluate(()=>localStorage.getItem('thousand-lineage-v1'))).toBe(before);
  await page.reload();await expect(memory).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/${info.project.name}-heirloom-memory.png`,fullPage:true});
});

test('succession remembers the old representative and only advances after a confirmed heir',async({page},info)=>{
  await recordedFamily(page,'succession');
  const memory=page.locator('.representative-memory');await expect(memory).toBeVisible();
  await memory.getByRole('button',{name:'함께한 삶 돌아보기 ↗'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!));
  await page.locator('.heir-pick').first().click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!).head)).toBe(before.head);
  await page.screenshot({path:`test-results/${info.project.name}-heirloom-succession.png`,fullPage:true});
  await page.locator('.succession .continue-button').click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('thousand-lineage-v1')!));
  expect(after.head).not.toBe(before.head);expect(after.year).toBe(before.year);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('village artwork respects reduced motion and fits a narrow screen',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('.pixel-village')).toBeVisible();
  await expect(page.locator('.village-cloud')).toHaveCSS('animation-name','none');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/${info.project.name}-heirloom-home.png`,fullPage:true});
});
