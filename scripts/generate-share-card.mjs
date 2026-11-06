// Rebuild the committed social-preview PNG from local, CC0 vector portraits.
// Requires the existing Playwright Chromium install; no remote asset requests.
import fs from 'node:fs';
import {chromium} from '@playwright/test';
import {Style,Avatar} from '@dicebear/core';
import definition from '@dicebear/styles/pixel-art.json' with {type:'json'};
const style=new Style(definition);
const face=seed=>new Avatar(style,{seed,size:128,borderRadius:10,backgroundColor:['d9eee3','f7e9d1','e7e1f2'],hairColor:['28150a','40302a'],clothingColor:['428b83','84936d','bb8762'],hatProbability:0,beardProbability:0,glassesProbability:0,accessoriesProbability:0}).toDataUri();
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#faf8f1"/><rect x="45" y="45" width="1110" height="540" rx="35" fill="#e7f3ec"/><circle cx="1025" cy="110" r="95" fill="#f8e4bd"/><g font-family="Malgun Gothic,Arial,sans-serif"><text x="100" y="145" font-size="34" font-weight="700" fill="#487468">千年家門</text><text x="95" y="260" font-size="86" font-weight="800" fill="#264e54">천년가문</text><text x="100" y="350" font-size="38" font-weight="700" fill="#397c6a">내 가문은 몇 대까지 살아남을까?</text><text x="100" y="415" font-size="24" fill="#668173">한 사람에서 시작하는 가상의 가족 이야기</text><text x="100" y="517" font-size="26" font-weight="700" fill="#287b76">같은 출발, 다른 선택. 친구에게 도전해 보세요 →</text></g><path d="M947 275v45m-75 0h150m-150 0v35m150-35v35" stroke="#98b8a5" stroke-width="7" fill="none"/><image href="${face('gamun-founder')}" x="879" y="132" width="136" height="136"/><image href="${face('gamun-child-a')}" x="808" y="355" width="128" height="128"/><image href="${face('gamun-child-b')}" x="958" y="355" width="128" height="128"/></svg>`;
fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/share-card.svg',svg);
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'public/share-card.png'});}finally{await browser.close();}
console.log('Generated public/share-card.svg and public/share-card.png');
