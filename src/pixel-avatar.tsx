import {memo} from 'react';
import {Style,Avatar as DiceBearAvatar} from '@dicebear/core';
import definition from '@dicebear/styles/pixel-art.json';
import type {Person} from './engine';

const style=new Style(definition),cache=new Map<string,string>();
export function avatarDataUrl(person:Person):string{
 // Identity only: birthdays, job changes and the game RNG never change a face.
 const seed=[person.id,person.clan,person.born,person.name,person.sex].join('|');
 const existing=cache.get(seed);if(existing)return existing;
 const data=new DiceBearAvatar(style,{seed,size:64,borderRadius:12,
  backgroundColor:['e2f1e9','f6ecd8','e9e5f5','f7e5e3'],
  hairColor:['28150a','40302a','705b4d'],clothingColor:['428b83','547b9c','bb8762','84936d','b58c9e'],
  hatProbability:0,beardProbability:0,glassesProbability:0,accessoriesProbability:0,
 }).toDataUri();
 if(cache.size>=400)cache.delete(cache.keys().next().value!);cache.set(seed,data);return data;
}
export const PixelAvatar=memo(function PixelAvatar({person,size=64}:{person:Person;size?:number}){
 return <svg className="pixel-avatar" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${person.name}의 인물 아이콘`} style={{imageRendering:'pixelated'}}><image href={avatarDataUrl(person)} width="64" height="64"/></svg>;
});
