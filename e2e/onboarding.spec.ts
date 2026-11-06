import {test,expect,type Page} from '@playwright/test';
import {openGameTab,openStoryTools} from './navigation';

const saveKey='thousand-lineage-v1';
async function saved(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),saveKey)}
async function start(page:Page){
 await page.goto('/');
 await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 await page.getByLabel('성씨 본관 검색').fill('김해 김씨');
 await page.locator('.search-results button').filter({hasText:'김해 김씨'}).first().click();
 await page.getByRole('button',{name:'김해 김씨의 이야기 시작'}).click();
 await expect(page.getByRole('region',{name:'가문의 첫 인물'})).toBeVisible();
 await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}

test('first play presents an actionable choice before optional systems, which remain accessible',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 const before=await saved(page),tools=page.locator('details.story-tools');
 await expect(page.locator('.first-choice-guide')).toBeVisible();
 await expect(page.locator('.choice').first()).toBeInViewport({ratio:1});
 await expect(page.getByRole('button',{name:'신분·권력',exact:true})).toBeHidden();
 await expect(page.locator('.quick-stats')).toBeHidden();
 expect(await tools.getAttribute('open')).toBeNull();
 await expect(page.getByRole('region',{name:'가문 과업'})).toBeHidden();
 const positions=await page.evaluate(()=>({choice:document.querySelector('.choice')!.getBoundingClientRect().top,tools:document.querySelector('.story-tools')!.getBoundingClientRect().top}));
 expect(positions.tools).toBeGreaterThan(positions.choice);
 await expect(page.locator('.event')).toHaveCSS('opacity','1');
 await page.screenshot({path:`test-results/${info.project.name}-focused-first-choice.png`,fullPage:true});
 await noOverflow(page);

 await openStoryTools(page);
 const project=page.getByRole('region',{name:'가문 과업'});
 await expect(project.getByRole('button',{name:/배움의 집/})).toBeVisible();
 expect(await saved(page)).toEqual(before);
 await project.getByRole('button',{name:/배움의 집/}).click();
 expect((await saved(page)).projects.active).toBe('learning');
 expect((await saved(page)).year).toBe(before.year);
 expect((await saved(page)).turn).toBe(before.turn);
 await openGameTab(page,'신분·권력');
 await expect(page.getByRole('region',{name:'신분과 권력'})).toBeVisible();
 await openGameTab(page,'가계도');
 await expect(page.getByRole('button',{name:'가까운 가족',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'이야기',exact:true}).click();
 await expect(page.locator('.choice').first()).toBeVisible();
 await noOverflow(page);expect(errors).toEqual([]);
});

test('a decision leads to a readable result and continuing returns to the new event start',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 const before=await saved(page);
 await page.getByRole('button',{name:/가족의 생활을 먼저 지킨다/}).click();
 const result=page.getByRole('region',{name:'선택 결과'}),after=await saved(page);
 await expect(result).toBeVisible();
 await expect(result.getByRole('heading',{level:2})).toBeInViewport({ratio:1});
 await expect(page.locator('.story-stage')).toBeFocused();
 await expect(page.locator('.choice')).toHaveCount(0);
 expect(after.turn).toBe(before.turn+1);
 expect(after.report.decision).toBe('가족의 생활을 먼저 지킨다');
 expect(after.year).toBe(after.report.to);
 const layout=await result.evaluate(root=>{
  const highlights=root.querySelector('.turn-highlights')!,stats=root.querySelector('.delta-grid')!,next=root.querySelector('.continue-button')!;
  return {highlightsBeforeStats:!!(highlights.compareDocumentPosition(stats)&Node.DOCUMENT_POSITION_FOLLOWING),buttonPosition:getComputedStyle(next).position,buttonAfterHighlights:!!(highlights.compareDocumentPosition(next)&Node.DOCUMENT_POSITION_FOLLOWING)};
 });
 expect(layout.highlightsBeforeStats).toBe(true);
 expect(layout.buttonAfterHighlights).toBe(true);
 expect(layout.buttonPosition).not.toBe('fixed');
 expect(layout.buttonPosition).not.toBe('sticky');
 await page.screenshot({path:`test-results/${info.project.name}-focused-result.png`,fullPage:true});
 await page.reload();
 await expect(result).toBeVisible();
 expect(await saved(page)).toEqual(after);
 await expect(result.getByRole('heading',{level:2})).toBeInViewport({ratio:1});
 await result.locator('.continue-button').click();
 await expect(result).toHaveCount(0);
 const continued=await saved(page);
 expect(continued.year).toBe(after.year);
 expect(continued.turn).toBe(after.turn);
 expect(continued.report).toBeUndefined();
 await expect(page.locator('.story-stage')).toBeFocused();
 await expect(page.locator('.story-stage .event h2').first()).toBeInViewport({ratio:1});
 await noOverflow(page);expect(errors).toEqual([]);
});
