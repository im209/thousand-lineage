import {describe,it,expect} from 'vitest';
import {create,choose} from './engine';
import {avatarDataUrl} from './pixel-avatar';

describe('stable local pixel portraits',()=>{
 it('keeps each face stable through reload-equivalent copies and job changes without consuming the game RNG',()=>{
  const state=create(42),person=state.people[state.founder],before=JSON.stringify(state);
  const first=avatarDataUrl(person);
  expect(first).toMatch(/^data:image\/svg\+xml/);
  expect(avatarDataUrl({...person,job:'관원'})).toBe(first);
  expect(avatarDataUrl(JSON.parse(JSON.stringify(person)))).toBe(first);
  expect(JSON.stringify(state)).toBe(before);
  const next=choose(state,0);expect(avatarDataUrl(next.people[person.id])).toBe(first);
 });
 it('distinguishes family members with the same name and does not load remote portraits',()=>{
  const state=create(42),person=state.people[state.founder];
  const first=avatarDataUrl(person),other=avatarDataUrl({...person,id:'another-person'});
  expect(other).not.toBe(first);expect(first.startsWith('https:')).toBe(false);
 });
});
