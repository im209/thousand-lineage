import fs from 'node:fs';
// Input: unmodified EUC-KR CSV from KOSIS bulk download DT_1IN15SD.
const input=process.argv[2];
if(!input)throw Error('Pass the official 101_DT_1IN15SD_F_2015.csv path');
const text=new TextDecoder('euc-kr',{fatal:true}).decode(fs.readFileSync(input));
const surnames=[];const entries=[];let current;
for(const line of text.split(/\r?\n/)){
 const row=line.match(/^'(\d+),"([^"]+)",2015,([\d.]+)$/);
 if(!row)continue;
 const [,code,raw]=row;const name=raw.trim();
 if(code.length===4){
  current=undefined;if(code==='0000'||code==='8888')continue;
  const match=name.match(/^(.+)\((.*)\)$/);if(!match)throw Error(`Unexpected surname ${name}`);
  current={code,surname:match[1],hanja:match[2],origins:0};surnames.push(current);
 }else if(code.length===8&&current){
  if(!code.startsWith(current.code))throw Error('Hierarchy mismatch');
  if(['기타','불상','미상'].includes(name)||code.endsWith('8888'))continue;
  entries.push([code,name,current.surname,current.hanja]);current.origins++;
 }
}
// A surname with no published named origin remains selectable without inventing a clan.
for(const s of surnames)if(!s.origins)entries.push([s.code,'',s.surname,s.hanja]);
if(surnames.length!==532)throw Error(`Unexpected coverage ${surnames.length}`);
fs.writeFileSync('src/clan-census.json',JSON.stringify({year:2015,surnameCount:surnames.length,namedCount:entries.filter(e=>e[1]).length,entries})+'\n');
console.log({surnames:surnames.length,entries:entries.length,named:entries.filter(e=>e[1]).length});
