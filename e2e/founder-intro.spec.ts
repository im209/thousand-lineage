import {test,expect,type Page} from '@playwright/test';

const key='thousand-lineage-v1';
async function generateFounder(page:Page){
 await page.goto('/');await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 await page.getByLabel('성씨 본관 검색').fill('김해 김씨');
 await page.locator('.search-results button').filter({hasText:'김해 김씨'}).first().click();
 await page.getByRole('button',{name:'김해 김씨의 이야기 시작'}).click();
}
async function state(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}

test('meet the generated founder before the first decision, with identity preserved on reload',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await generateFounder(page);
 const intro=page.getByRole('region',{name:'가문의 첫 인물'}),before=await state(page),founder=before.people[before.founder];
 expect(before.introPending).toBe(true);expect(before.year).toBe(1392);expect(before.turn).toBe(0);expect(before.event).toBe('h1392');
 await expect(intro).toBeVisible();await expect(intro.getByRole('heading',{level:2})).toContainText(/당신의 가문은\s*이 사람에게서 시작됩니다\./);
 await expect(intro.getByRole('heading',{level:1})).toContainText(founder.name);
 const bio=intro.locator('.founder-bio'),facts=intro.locator('.founder-facts');
 for(const text of [`${before.year-founder.born}세`,founder.sex==='여'?'여성':'남성',`${founder.born}년생`])await expect(bio).toContainText(text);
 for(const text of [founder.region,founder.trait,founder.job])await expect(facts).toContainText(text);
 const labels:Record<string,string>={wealth:'재산',stability:'생계',status:'사회적 영향력',education:'교육',health:'생활환경',reputation:'명성',connections:'연결',cohesion:'결속'};
 const stats=intro.locator('.founder-stats');
 for(const [key,label] of Object.entries(labels)){await expect(stats).toContainText(label);await expect(stats.getByText(String(Math.round(before.stats[key])),{exact:true}).first()).toBeVisible();}
 const titles:Record<string,string>={commoner:'상민 가문',specialist:'기술·실무 가문',yangban:'양반 가문',nobi:'노비 신분의 가문'};
 await expect(intro.getByRole('region',{name:'배정된 출발 신분'})).toContainText(titles[before.society.origin]);
 await expect(page.locator('.event')).toHaveCount(0);await expect(page.locator('.choice')).toHaveCount(0);
 expect(await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);const s=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);return JSON.stringify(e.choose(s,0))===JSON.stringify(s)})).toBe(true);
 await page.reload();await expect(intro).toBeVisible();expect(await state(page)).toEqual(before);
 await page.screenshot({path:`test-results/${info.project.name}-founder-intro.png`,fullPage:true});await noOverflow(page);
 await intro.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 const after=await state(page);expect(after.introPending).toBe(false);expect({...after,introPending:true}).toEqual(before);
 await expect(intro).toHaveCount(0);await expect(page.getByText('새로운 왕조, 새로운 시작',{exact:true})).toBeVisible();
 await page.reload();expect(await state(page)).toEqual(after);await expect(intro).toHaveCount(0);await noOverflow(page);expect(errors).toEqual([]);
});

test('home and about navigation return to the same unconfirmed founder',async({page})=>{
 await generateFounder(page);const before=await state(page),intro=page.getByRole('region',{name:'가문의 첫 인물'});
 await page.locator('.brand').click();await page.getByRole('button',{name:'기록 이어가기 →',exact:true}).click();
 await expect(intro).toBeVisible();await expect(page.locator('.event')).toHaveCount(0);expect(await state(page)).toEqual(before);
 await page.getByRole('button',{name:'게임 안내 · 출처',exact:true}).click();
 await page.getByRole('button',{name:'이야기로 돌아가기 →',exact:true}).click();
 await expect(intro).toBeVisible();await expect(page.locator('.event')).toHaveCount(0);expect(await state(page)).toEqual(before);
 await page.reload();await expect(intro).toBeVisible();expect(await state(page)).toEqual(before);await noOverflow(page);
});
