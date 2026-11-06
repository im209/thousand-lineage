import {describe,it,expect} from 'vitest';
import {clans,searchClans} from './data';
import census from './clan-census.json';
import {create} from './engine';
import {decodeSave} from './save';
describe('official surname directory',()=>{
 it('retains legacy saved clan indices',()=>{
  expect(clans.slice(0,30).map(c=>c.label)).toEqual(['김해 김씨','밀양 박씨','전주 이씨','경주 김씨','경주 이씨','진주 강씨','경주 최씨','광산 김씨','파평 윤씨','청주 한씨','안동 권씨','인동 장씨','평산 신씨','순흥 안씨','안동 김씨','남양 홍씨','동래 정씨','해주 오씨','전주 최씨','남평 문씨','한산 이씨','청송 심씨','선산 김씨','수원 백씨','의성 김씨','은진 송씨','덕수 이씨','여흥 민씨','풍산 류씨','여산 송씨']);
  expect(clans.every((c,i)=>c.id===i)).toBe(true);
 });
 it('includes every published row and never invents aggregate origins',()=>{
  const key=(o:string,s:string,h:string)=>[o,s,h.includes('?')?'한자 미표기':h].join('|').normalize('NFKC');
  const actual=new Set(clans.map(c=>key(c.origin,c.surname,c.hanja)));
  expect(census.namedCount).toBe(13997);
  expect(new Set(census.entries.map(e=>e[0].slice(0,4))).size).toBe(532);
  for(const [,o,s,h] of census.entries)expect(actual.has(key(o,s,h))).toBe(true);
  expect(clans.some(c=>['기타','불상','미상'].includes(c.origin))).toBe(false);
 });
 it('searches compound surnames, Hanja and spaced labels and restores a new surname',()=>{
  expect(searchClans('')).toEqual([]);
  expect(searchClans('김해 김씨')[0].id).toBe(0);
  expect(searchClans('皇甫').some(c=>c.surname==='황보')).toBe(true);
  const c=searchClans('후씨').find(c=>c.origin==='')!;
  expect(c).toBeDefined();
  const game=create(42,c.id);
  expect(decodeSave(JSON.stringify(game))?.clan).toBe(c.id);
  expect(game.people[game.founder].surname).toBe('후');
 });
});
