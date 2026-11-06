import {test,expect,type Page} from '@playwright/test';
import {openGameTab} from './navigation';
const key='thousand-lineage-v1';
async function state(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}
async function ended(page:Page){
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);const s=e.create(42,0,'commoner');s.year=2026;s.people[s.head].born=1990;s.phase='ended';s.endReason='2026년까지 존속';s.runId='share-fixture';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();await expect(page.getByRole('region',{name:'친구에게 가문 도전 보내기'})).toBeVisible();
}

test('random clan selection stays on confirmation and can start any published family',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 await page.getByRole('button',{name:'운명에 맡기기 · 랜덤 가문 ↻',exact:true}).click();
 const label=await page.locator('.selected-clan strong').innerText();
 await expect(page.getByRole('status')).toContainText(label);
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
 await expect(page.getByRole('region',{name:'가문의 첫 인물'})).toHaveCount(0);
 await page.screenshot({path:`test-results/${info.project.name}-random-clan.png`,fullPage:true});
 await page.locator('.setup > button.primary').click();
 const saved=await state(page);expect(saved.introPending).toBe(true);expect(saved.turn).toBe(0);
 await expect(page.locator('.founder-clan')).toHaveText(label);
});

test('copied challenge preserves the old game until accepted and keeps comparison through reload',async({page},info)=>{
 await ended(page);
 const ending=await page.locator('.ending > .eyebrow').innerText(),before=await state(page);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as any).__copied=text;}}}));
 await page.getByRole('button',{name:'결과 복사 ↗',exact:true}).click();
 const copied=await page.evaluate(()=>(window as any).__copied as string),link=copied.trim().split('\n').at(-1)!;
 expect(copied).toContain('634년 생존');expect(copied).not.toContain(ending.replace('終章 · ',''));expect(link).toContain('#challenge=');
 await page.goto(link);const invitation=page.getByRole('region',{name:'친구의 가문 도전'});
 await expect(invitation).toContainText('634');await expect(invitation).toContainText('상민 가문');
 expect(await state(page)).toEqual(before);
 await page.screenshot({path:`test-results/${info.project.name}-challenge-invitation.png`,fullPage:true});
 await page.getByRole('button',{name:'현재 저장을 바꾸고 도전하기 →',exact:true}).click();
 let next=await state(page);expect(next.seed).toBe(before.seed);expect(next.clan).toBe(before.clan);expect(next.society.origin).toBe(before.society.origin);expect(next.introPending).toBe(true);expect(next.challenge.years).toBe(634);expect(next.year).toBe(1392);expect(page.url()).not.toContain('#challenge');
 const intro=next;await page.reload();expect(await state(page)).toEqual(intro);
 await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);s.year=2026;s.people[s.head].born=1990;s.phase='ended';s.endReason='2026년까지 존속';localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));});
 await page.reload();await expect(page.locator('.challenge-comparison')).toContainText('친구');await expect(page.locator('.challenge-comparison')).toContainText('같은 시간만큼');
 await page.getByRole('button',{name:/같은 운명, 다른 선택으로 재도전/}).click();next=await state(page);expect(next.challenge).toEqual(intro.challenge);
});

test('native link and PNG sharing work and cancellation does not copy or download',async({page})=>{
 await ended(page);
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
  Object.defineProperty(navigator,'share',{configurable:true,value:async(data:any)=>{(window as any).__shared={title:data.title,text:data.text,url:data.url,files:data.files?.map((f:File)=>({name:f.name,size:f.size,type:f.type}))};if(data.files){const bitmap=await createImageBitmap(data.files[0]);(window as any).__imageSize=[bitmap.width,bitmap.height];bitmap.close();}}});
 });
 await page.getByRole('button',{name:'친구에게 도전 보내기 ↗',exact:true}).click();
 expect((await page.evaluate(()=>(window as any).__shared)).url).toContain('#challenge=');
 await page.getByRole('button',{name:'이미지 바로 공유 ↗',exact:true}).click();
 await expect(page.locator('.share-notice')).toContainText('이미지 공유창');
 const image=await page.evaluate(()=>({shared:(window as any).__shared,size:(window as any).__imageSize}));
 expect(image.shared.files[0].type).toBe('image/png');expect(image.shared.files[0].size).toBeGreaterThan(1000);expect(image.size).toEqual([1200,720]);expect(image.shared.text).toContain('#challenge=');
 await page.evaluate(()=>{
  (window as any).__copied=false;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{(window as any).__copied=true}}});
  Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError')}});
 });
 await page.getByRole('button',{name:'친구에게 도전 보내기 ↗',exact:true}).click();
 await expect(page.locator('.share-notice')).toContainText('공유를 취소했습니다.');
 expect(await page.evaluate(()=>(window as any).__copied)).toBe(false);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'이미지 저장 ↓',exact:true}).click();expect((await download).suggestedFilename()).toBe('천년가문-도전기록.png');
});

test('blocked clipboard provides selectable text and unsupported share falls back without losing the game',async({page})=>{
 await ended(page);const before=await state(page);
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked')}}});});
 await page.getByRole('button',{name:'친구에게 도전 보내기 ↗',exact:true}).click();
 await expect(page.getByLabel('친구에게 보낼 내용')).toHaveValue(/#challenge=/);
 await page.getByRole('button',{name:'내용 선택',exact:true}).click();
 expect(await page.getByLabel('친구에게 보낼 내용').evaluate((el:HTMLTextAreaElement)=>el.selectionEnd-el.selectionStart)).toBeGreaterThan(100);
 expect(await state(page)).toEqual(before);
});

test('invalid and older-rule links never replace an existing family',async({page})=>{
 await ended(page);const before=await state(page);
 await page.goto('/#challenge=not-valid!');await expect(page.getByRole('heading',{level:1})).toContainText(/도전 링크를\s*읽지 못했어요/);expect(await state(page)).toEqual(before);
 const old=await page.evaluate(async()=>{const path='/src/share-links.ts';const e=await import(path);return e.challengeUrl({version:1,rules:'older-rules',seed:42,clan:0,origin:'commoner',years:300,generations:12},location.href);});
 await page.goto(old);await expect(page.getByRole('alert')).toContainText('이전 게임 규칙');await expect(page.locator('.challenge-start')).toHaveCount(0);expect(await state(page)).toEqual(before);
 await page.getByRole('button',{name:'내 기록 이어가기 →',exact:true}).click();expect(page.url()).not.toContain('#challenge');expect(await state(page)).toEqual(before);
});

test('father and mother are labelled by sex even when the mother has a traditionally masculine name',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{
  const path='/src/engine.ts';const e=await import(path);const s=e.create(42,9,'commoner');s.year=1400;
  const mother=s.people[s.head];mother.name='한덕수';mother.sex='여';mother.born=1370;mother.spouses=['father'];mother.children=['daughter'];
  const father={...structuredClone(mother),id:'father',name:'김성준',surname:'김',clan:0,sex:'남',lineage:false,spouses:[mother.id],children:['daughter']};
  const child={...structuredClone(mother),id:'daughter',name:'김순이',surname:'김',clan:0,born:1392,generation:2,parents:[mother.id,father.id],children:[],spouses:[],job:'미성년'};
  s.people[father.id]=father;s.people[child.id]=child;localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));
 });
 await page.reload();await expect(page.locator('.first-choice-guide')).toContainText('여성');await openGameTab(page,'가계도');
 await page.getByLabel('가계도 이름 검색').fill('김순이');await page.getByRole('button',{name:'김순이 · 1392년생 · 2세대',exact:true}).click();
 const node=page.locator('.mobile-family-list article').filter({hasText:'김순이'}).first();
 if(await node.isVisible())await node.getByRole('button').first().click();else await page.locator('.react-flow__node').filter({hasText:'김순이'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toContainText('아버지 김성준 · 어머니 한덕수');await expect(dialog).toContainText('여성');
});
