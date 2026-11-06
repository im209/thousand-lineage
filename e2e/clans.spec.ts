import {test,expect} from '@playwright/test';
test('large directory is bounded, searchable, and supports unpublished origin',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 const input=page.getByLabel('성씨 본관 검색');await input.fill('김');
 await expect(page.locator('.search-results button:not(.load-more)')).toHaveCount(40);
 await page.getByRole('button',{name:'40개 더 보기'}).click();
 await expect(page.locator('.search-results button:not(.load-more)')).toHaveCount(80);
 await input.fill('皇甫');await expect(page.locator('.search-results')).toContainText('영천 황보씨');
 await input.fill('후씨');await page.locator('.search-results button').filter({hasText:'본관 미공개'}).first().click();
 await page.getByRole('button',{name:/후씨 · 본관 미공개의 이야기 시작/}).click();await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 await expect(page.getByText('새로운 왕조, 새로운 시작',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
