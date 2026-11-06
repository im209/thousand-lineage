import {clans} from './data';
import type {StartingStanding,State} from './engine';

// Bump when initial-life or simulation rules change. Old links remain readable,
// but must not silently claim to offer the same rules after an update.
export const CHALLENGE_RULES='family-20261106-3';
export type ChallengeBenchmark={rules:string;years:number;generations:number};
export type FamilyChallenge=ChallengeBenchmark&{version:1;seed:number;clan:number;origin:StartingStanding};
export type ChallengeRead={kind:'none'}|{kind:'invalid'}|{kind:'ready';data:FamilyChallenge;compatible:boolean};
const origins=['commoner','specialist','yangban','nobi'];
const integer=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validBenchmark(v:unknown):v is ChallengeBenchmark{return record(v)&&typeof v.rules==='string'&&/^[a-z0-9-]{1,40}$/.test(v.rules)&&integer(v.years,0,Number.MAX_SAFE_INTEGER-1392)&&integer(v.generations,1,Number.MAX_SAFE_INTEGER)}
function validChallenge(v:unknown):v is FamilyChallenge{return record(v)&&v.version===1&&integer(v.seed,0,0xffffffff)&&integer(v.clan,0,clans.length-1)&&typeof v.origin==='string'&&origins.includes(v.origin)&&validBenchmark(v)}

export function readChallenge(hash:string):ChallengeRead{
 try{
  if(hash.length>2048)return {kind:'invalid'};
  const params=new URLSearchParams(hash.replace(/^#/,''));
  if(!params.has('challenge'))return {kind:'none'};
  if(params.getAll('challenge').length!==1)return {kind:'invalid'};
  const encoded=params.get('challenge')!;
  if(!encoded||!/^[A-Za-z0-9_-]+$/.test(encoded))return {kind:'invalid'};
  const text=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
  const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(text,c=>c.charCodeAt(0))));
  if(!validChallenge(value))return {kind:'invalid'};
  const data:FamilyChallenge={version:1,rules:value.rules,seed:value.seed,clan:value.clan,origin:value.origin,years:value.years,generations:value.generations};
  return {kind:'ready',data,compatible:data.rules===CHALLENGE_RULES};
 }catch{return {kind:'invalid'}}
}

export function challengeUrl(data:FamilyChallenge,pageUrl:string):string{
 if(!validChallenge(data))throw Error('Invalid challenge');
 const url=new URL('.',pageUrl),bytes=new TextEncoder().encode(JSON.stringify(data));
 const encoded=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 url.hash=new URLSearchParams({challenge:encoded}).toString();return url.href;
}
export function challengeFor(s:State,years:number,generations:number):FamilyChallenge{
 return {version:1,rules:CHALLENGE_RULES,seed:s.seed,clan:s.clan,origin:s.society?.origin??'commoner',years,generations};
}
export function shareCaption(data:FamilyChallenge){return `🏡 천년가문 · ${clans[data.clan].label}\n${data.years}년 생존 · ${data.generations}세대의 기록\n나는 여기까지 이어왔어. 같은 출발에서 너는 몇 대까지?`}
export function copyMessage(data:FamilyChallenge,url:string){return `${shareCaption(data)}\n👉 같은 운명으로 도전하기\n${url}`}
export function isShareCancelled(error:unknown){return typeof error==='object'&&error!==null&&'name' in error&&error.name==='AbortError'}

// Uniform over published surname/clan combinations, not population weighted.
export function randomClanIndex(count:number,draw=()=>crypto.getRandomValues(new Uint32Array(1))[0]):number{
 if(!Number.isInteger(count)||count<1||count>0x100000000)throw Error('Invalid clan count');
 const limit=0x100000000-(0x100000000%count);
 for(let attempts=0;attempts<100;attempts++){
  const value=draw();if(!integer(value,0,0xffffffff))throw Error('Invalid random value');
  if(value<limit)return value%count;
 }
 throw Error('Could not draw a clan');
}
