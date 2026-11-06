import {openGameTab} from './navigation';
import {test,expect,type Page} from '@playwright/test';

const key='thousand-lineage-v1';
type Fixture='exam-locked'|'exam-family'|'transition'|'legacy-modern'|'politics-win'|'politics-loss'|'ending';
async function install(page:Page,kind:Fixture){
 await page.goto('/');
 await page.evaluate(async kind=>{
  const path='/src/engine.ts';const e=await import(path);
  let s=e.create(42,0,kind==='ending'?'nobi':'commoner');s.runId='society-fixture';
  const head=s.people[s.head];head.health=100;head.sex='여';head.born=1370;
  s.stats={wealth:80,stability:80,status:50,education:80,health:100,reputation:80,connections:80,cohesion:80};
  if(kind==='exam-locked'||kind==='exam-family')s.event='social-career';
  if(kind==='exam-family'){
   head.born=1352;
   const child={...structuredClone(head),id:'p2',name:'김수험',sex:'남',born:1372,generation:2,parents:[head.id],children:[],spouses:[],education:90,ability:90,life:[]};
   s.people.p2=child;head.children=['p2'];
   let matched=false;
   for(let rng=0;rng<10000;rng+=100){s.rng=rng;const out=e.choose(s,1);if(out.society.examPassed&&out.phase==='play'){matched=true;break}}
   if(!matched)throw Error('No deterministic exam success fixture');
  }
  if(kind==='transition'){
   s.year=1893;head.born=1870;s.event='life0';s.society.origin='yangban';s.society.standing='yangban';s.society.office='court';s.society.achievements=['court'];
   head.sex='남';s.society.examPassed=true;s.society.examPerson=head.id;
  }
  if(kind==='legacy-modern'){s.year=1894;head.born=1870;s.event='social-career';delete s.society;}
  if(kind==='politics-win'||kind==='politics-loss'){
   s.event='social-politics';s.society.office='court';s.society.focus='politics';s.society.support=85;s.society.risk=10;
   head.sex='남';s.society.examPassed=true;s.society.examPerson=head.id;
   let matched=false;
   for(let rng=0;rng<10000;rng+=100){s.rng=rng;const out=e.choose(s,2);if(out.society.political===(kind==='politics-win'?'founder':'exile')&&out.phase==='play'){matched=true;break}}
   if(!matched)throw Error('No deterministic politics fixture');
  }
  if(kind==='ending'){
   s.year=2026;head.born=1990;s.phase='ended';s.endReason='2026년까지 존속';
   s.society.standing='citizen';s.society.office='none';s.society.political='founder';s.society.alternate=true;s.society.achievements=['freed','founder','abolished'];
  }
  const savePath='/src/save.ts';const save=await import(savePath);
  if(!save.decodeSave(JSON.stringify(s)))throw Error('Invalid fixture '+kind);
  localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));
 },kind);
 await page.reload();
}
async function state(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}

test('starting background is assigned without a picker and persists across reload',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'새로운 가문 시작하기'}).click();
 await page.getByLabel('성씨 본관 검색').fill('김해 김씨');await page.locator('.search-results button').first().click();
 await expect(page.getByText('출발 신분은 운명이 정합니다',{exact:true})).toBeVisible();
 await expect(page.locator('.background-picker')).toHaveCount(0);
 await expect(page.getByRole('button',{name:/노비 신분의 가문|양반 가문|상민 가문|기술·실무 가문/})).toHaveCount(0);
 await page.getByRole('button',{name:'김해 김씨의 이야기 시작'}).click();
 const assigned=await state(page),origin=assigned.society.origin;
 const titles:Record<string,string>={commoner:'상민 가문',specialist:'기술·실무 가문',yangban:'양반 가문',nobi:'노비 신분의 가문'};
 expect(Object.keys(titles)).toContain(origin);expect(assigned.society.standing).toBe(origin);
 const badge=page.getByRole('region',{name:'배정된 출발 신분'});
 await expect(badge).toContainText(titles[origin]);
 await page.screenshot({path:`test-results/${info.project.name}-assigned-background.png`,fullPage:true});await noOverflow(page);
 expect(await page.evaluate(async()=>{const path='/src/engine.ts';const e=await import(path);const s=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);return e.create(s.seed,s.clan).society.origin===s.society.origin})).toBe(true);
 await page.reload();expect(await state(page)).toEqual(assigned);await expect(badge).toContainText(titles[origin]);
 await page.getByRole('button',{name:'이 인물로 시작하기 →',exact:true}).click();
 await openGameTab(page,'신분·권력');
 const panel=page.getByRole('region',{name:'신분과 권력'});
 await expect(panel.locator('.society-facts > div').filter({hasText:'법적 구분'})).toContainText(origin==='nobi'?'천인':'양인');
 const positions:Record<string,string>={...titles,specialist:'기술·실무층(중인 경로)'};
 await expect(panel.locator('.society-facts > div').filter({hasText:'가문의 사회적 기반'})).toContainText(positions[origin]);
 await expect(panel.getByRole('heading').first()).not.toContainText('<br/>');
 if(origin==='nobi')await expect(panel).toContainText('1801년에 모든 노비가 해방된 것으로 처리하지 않습니다');
 await page.screenshot({path:`test-results/${info.project.name}-society-panel.png`,fullPage:true});await noOverflow(page);
});

test('female representative can sponsor an adult son but cannot sit an exam without a candidate',async({page})=>{
 await install(page,'exam-locked');
 const exam=page.getByRole('button',{name:/가족의 과거 응시를 지원한다/});
 await expect(exam).toBeDisabled();await expect(exam).toContainText('성인 남성 후손이 필요');
 await install(page,'exam-family');
 await expect(page.locator('.event-description')).toContainText('김수험');
 await expect(exam).toBeEnabled();await exam.click();
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('김수험, 과거 합격');
 const s=await state(page);expect(s.people[s.head].sex).toBe('여');expect(s.society.examPerson).toBe('p2');
 expect(s.society.standing).toBe('commoner');expect(s.society.office).toBe('none');
 await page.reload();expect((await state(page)).society.examPerson).toBe('p2');await noOverflow(page);
});

test('1894 boundary ends old routes and restores old-format saves into modern opportunities',async({page})=>{
 await install(page,'transition');await page.getByRole('button',{name:/살림을 정비하고 지출을 줄인다/}).click();
 let s=await state(page);expect(s.year).toBe(1894);expect(s.society.standing).toBe('citizen');expect(s.society.office).toBe('none');expect(s.society.origin).toBe('yangban');expect(s.society.achievements).toContain('court');
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('1894년');
 await page.locator('.continue-button').click();await expect(page.getByText('신분의 경계가 사라지는 전환',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/새 교육으로 다음 세대를 준비한다/}).click();expect((await state(page)).people[s.head].job).toBe('새 기술을 익히는 사람');
 await install(page,'legacy-modern');
 await expect(page.getByText('새 시대에 여는 진로',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/가족의 과거 응시를 지원한다/})).toHaveCount(0);
 await openGameTab(page,'신분·권력');
 await expect(page.getByRole('region',{name:'신분과 권력'}).locator('.society-facts > div').filter({hasText:'법적 구분'})).toContainText('신분제 폐지');await noOverflow(page);
});

test('successful political branch persists and labels subsequent historical references as fiction',async({page},info)=>{
 await install(page,'politics-win');await page.getByRole('button',{name:/새 왕조를 세우는 도전에 나선다/}).click();
 await expect(page.locator('.alternate-banner')).toContainText('대체역사');
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('새로운 왕조의 창업 가문');
 expect((await state(page)).society.political).toBe('founder');
 await page.screenshot({path:`test-results/${info.project.name}-political-outcome.png`,fullPage:true});
 await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('thousand-lineage-v1')!);const delta=1592-s.year;
  for(const p of Object.values(s.people) as any[]){p.born+=delta;if(p.died!==null)p.died+=delta;}
  s.year=1592;s.event='h1592';delete s.report;localStorage.setItem('thousand-lineage-v1',JSON.stringify(s));
 });
 await page.reload();await expect(page.locator('.alternate-banner')).toBeVisible();
 await expect(page.locator('.event h2')).toContainText('역사 참고');
 await expect(page.locator('.event-description')).toContainText('실제 사건이 그대로 일어났다는 뜻은 아닙니다');
 await page.locator('.choice:not([disabled])').first().click();
 await openGameTab(page,'연대기');
 await expect(page.locator('.chronicle')).toContainText('대체역사 · 창작 사건');await noOverflow(page);
});

test('political failure leads to exile, rebuilding and return without restoring the old office',async({page})=>{
 await install(page,'politics-loss');await page.getByRole('button',{name:/새 왕조를 세우는 도전에 나선다/}).click();
 let s=await state(page);expect(s.society.political).toBe('exile');expect(s.society.office).toBe('none');expect(s.society.alternate).toBe(true);
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('유배');
 await page.locator('.continue-button').click();await expect(page.getByText('유배지에서 다시 쓰는 가족의 삶',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/생업을 일으켜 밑천과 관계를 회복한다/}).click();
 await expect(page.getByRole('region',{name:'선택 결과'})).toContainText('이웃 관계를 다시 쌓았습니다');
 await page.locator('.continue-button').click();await page.getByRole('button',{name:/자원을 들여 복귀를 청한다/}).click();
 s=await state(page);expect(s.society.political).toBe('quiet');expect(s.society.office).toBe('none');expect(s.society.achievements).toContain('restored');expect(s.society.alternate).toBe(true);await noOverflow(page);
});

test('ending title reflects earned political history and replay retains only the starting background',async({page})=>{
 await install(page,'ending');await expect(page.locator('.ending > .eyebrow')).toContainText('속박에서 왕조의 시작으로');
 const records=await page.evaluate(()=>localStorage.getItem('thousand-lineage-records-v1'));
 await page.getByRole('button',{name:/같은 운명, 다른 선택으로 재도전/}).click();
 const s=await state(page);expect(s.seed).toBe(42);expect(s.clan).toBe(0);expect(s.year).toBe(1392);
 expect(s.society.origin).toBe('nobi');expect(s.society.standing).toBe('nobi');expect(s.society.office).toBe('none');expect(s.society.political).toBe('quiet');expect(s.society.alternate).toBe(false);expect(s.society.achievements).toEqual([]);
 expect(s.runId).not.toBe('society-fixture');expect(await page.evaluate(()=>localStorage.getItem('thousand-lineage-records-v1'))).toBe(records);
 await expect(page.locator('.alternate-banner')).toHaveCount(0);await noOverflow(page);
});
