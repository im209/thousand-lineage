import {describe,it,expect} from 'vitest';
import {create,societyState} from './engine';
import {backgrounds,randomStartingStanding} from './society';
import {decodeSave} from './save';

describe('random starting social backgrounds',()=>{
 it('offers all four backgrounds from new seeds independently of clan',()=>{
  const counts=new Map(backgrounds.map(b=>[b.id,0]));
  for(let seed=0;seed<4096;seed++){const origin=randomStartingStanding(seed);counts.set(origin,counts.get(origin)!+1);}
  // Wide bounds catch an accidentally fixed or heavily weighted starting life.
  for(const count of counts.values()){expect(count).toBeGreaterThan(800);expect(count).toBeLessThan(1250);}
  for(let seed=0;seed<20;seed++)expect(create(seed,0).society!.origin).toBe(create(seed,500).society!.origin);
 });
 it('reproduces the assigned background and complete starting state with the same seed',()=>{
  for(let seed=0;seed<20;seed++){
   const s=create(seed);expect(create(seed)).toEqual(s);
   expect(create(s.seed,s.clan,s.society!.origin)).toEqual(s);
  }
 });
 it('preserves explicit previous backgrounds and the original family RNG stream',()=>{
  for(const background of backgrounds){
   const original=create(42,0,background.id),random=create(42);
   expect(original.society!.origin).toBe(background.id);expect(original.society!.standing).toBe(background.id);
   expect(original.rng).toBe(random.rng);expect(original.people[original.head].name).toBe(random.people[random.head].name);
   expect(original.people[original.head].born).toBe(random.people[random.head].born);
   expect(original.people[original.head].sex).toBe(random.people[random.head].sex);
   expect(create(original.seed,original.clan,original.society!.origin)).toEqual(original);
  }
 });
 it('never rerolls saved social standing or infers an old missing background from the seed',()=>{
  const s=create(42,0,'nobi');s.society!.standing='commoner';s.society!.achievements=['freed'];
  expect(decodeSave(JSON.stringify(s))).toEqual(s);
  const old=create(42);delete old.society;const restored=decodeSave(JSON.stringify(old))!;
  expect(restored.society).toBeUndefined();expect(societyState(restored).origin).toBe('commoner');
 });
});
