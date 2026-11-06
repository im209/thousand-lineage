import {describe,it,expect} from 'vitest';
import {clans} from './data';
import {create,choose,continueStory} from './engine';
import {decodeSave} from './save';
import {CHALLENGE_RULES,challengeFor,challengeUrl,readChallenge,copyMessage,randomClanIndex,validBenchmark,type FamilyChallenge} from './share-links';
const sample:FamilyChallenge={version:1,rules:CHALLENGE_RULES,seed:42,clan:0,origin:'commoner',years:312,generations:12};
const unsafe=(value:unknown)=>'#challenge='+btoa(JSON.stringify(value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

describe('portable family challenges',()=>{
 it('round-trips all backgrounds and boundary seeds and clans at the project subpath',()=>{
  for(const origin of ['commoner','specialist','yangban','nobi'] as const)for(const seed of [0,0xffffffff]){
   const data={...sample,origin,seed,clan:clans.length-1},url=challengeUrl(data,'https://im209.github.io/thousand-lineage/?tracking=old#private');
   expect(url).toMatch(/^https:\/\/im209.github.io\/thousand-lineage\/#challenge=/);
   expect(readChallenge(new URL(url).hash)).toEqual({kind:'ready',data,compatible:true});
   expect(url.length).toBeLessThan(2048);
  }
 });
 it('rejects malformed, oversized, duplicated and out-of-range links',()=>{
  expect(readChallenge('')).toEqual({kind:'none'});
  for(const hash of ['#challenge=bad!','#challenge=','#challenge=e30&challenge=e30','#challenge='+('a'.repeat(2049))])expect(readChallenge(hash).kind).toBe('invalid');
  for(const patch of [{version:2},{seed:-1},{seed:0x100000000},{clan:clans.length},{years:635},{generations:0},{origin:'king'},{rules:'<script>'}])expect(readChallenge(unsafe({...sample,...patch})).kind).toBe('invalid');
 });
 it('keeps old-rule records readable but prevents silently offering an equivalent run',()=>{
  const data={...sample,rules:'older-rules'};expect(readChallenge(unsafe(data))).toEqual({kind:'ready',data,compatible:false});
 });
 it('shares only bounded scores and starting conditions, without ending names or the save',()=>{
  const s=create(42,0,'nobi');const data=challengeFor(s,312,12);const message=copyMessage(data,challengeUrl(data,'https://example.com/game/'));
  expect(message).toContain('312년 생존 · 12세대');expect(message).toContain('#challenge=');
  expect(Object.keys(data).sort()).toEqual(['clan','generations','origin','rules','seed','version','years']);
  expect(message).not.toContain('runId');expect(message).not.toContain('people');
 });
 it('preserves benchmark saves without changing simulation RNG or family outcomes',()=>{
  let plain=create(42,0,'commoner'),challenged={...plain,challenge:{rules:CHALLENGE_RULES,years:312,generations:12}};
  for(let turn=0;turn<5&&plain.phase==='play';turn++){
   plain=continueStory(choose(plain,0));challenged=continueStory(choose(challenged,0)) as typeof challenged;
   const {challenge,...rest}=challenged;expect(rest).toEqual(plain);expect(decodeSave(JSON.stringify(challenged))).toEqual(challenged);
  }
  expect(validBenchmark({rules:CHALLENGE_RULES,years:0,generations:1})).toBe(true);
  expect(decodeSave(JSON.stringify({...plain,challenge:{...sample,years:-1}}))).toBeNull();
 });
 it('uses rejection sampling and rejects invalid random inputs',()=>{
  const values=[0xffffffff,5];expect(randomClanIndex(3,()=>values.shift()!)).toBe(2);
  expect(randomClanIndex(1,()=>123)).toBe(0);expect(()=>randomClanIndex(0)).toThrow();expect(()=>randomClanIndex(3,()=>-1)).toThrow();
 });
});
