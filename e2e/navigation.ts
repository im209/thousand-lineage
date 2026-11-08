import {expect,type Page} from '@playwright/test';

export async function openGameTab(page:Page,name:string){
 const target=page.getByRole('button',{name,exact:true});
 if(!await target.isVisible())await page.getByRole('button',{name:/가문 살펴보기/}).click();
 await expect(target).toBeVisible();
 await target.click();
}

export async function openStoryTools(page:Page){
 const tools=page.locator('details.goal-picker');
 if(await tools.getAttribute('open')===null)await tools.locator('summary').click();
 await expect(tools).toHaveAttribute('open','');
}
