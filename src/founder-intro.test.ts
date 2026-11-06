import {describe,it,expect} from 'vitest';
import {create,beginStory,choose,selectProject,selectSocialFocus,type State} from './engine';
import {selectChronicle} from './chronicles';
import {decodeSave} from './save';

const pending=():State=>({...create(42),introPending:true});
describe('founder introduction gate',()=>{
 it('keeps time, choices and directions paused until the founder is accepted',()=>{
  const s=pending();
  expect(choose(s,0)).toBe(s);expect(selectProject(s,'care')).toBe(s);
  expect(selectSocialFocus(s,'politics')).toBe(s);expect(selectChronicle(s,'archives')).toBe(s);
 });
 it('preserves the exact reveal across save reload and starts without rerolling or advancing time',()=>{
  const s=pending(),restored=decodeSave(JSON.stringify(s));expect(restored).toEqual(s);
  const started=beginStory(restored!);expect(started).toEqual({...s,introPending:false});
  expect(s.introPending).toBe(true);expect(beginStory(started)).toBe(started);
  expect(choose(started,0).turn).toBe(1);expect(choose(started,0).year).toBeGreaterThan(1392);
 });
 it('keeps legacy saves playable and rejects invalid pending introductions',()=>{
  const legacy=create(42);expect(decodeSave(JSON.stringify(legacy))).toEqual(legacy);
  expect(beginStory(legacy)).toBe(legacy);expect(choose(legacy,0)).not.toBe(legacy);
  for(const change of [{introPending:'yes'},{year:1393},{turn:1},{phase:'ended'},{event:'life0'}])expect(decodeSave(JSON.stringify({...pending(),...change}))).toBeNull();
 });
});
