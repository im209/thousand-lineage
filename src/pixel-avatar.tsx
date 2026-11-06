import {memo} from 'react';
import {portraitDataUrl} from './portrait-art.mjs';
import type {Person} from './engine';

const cache=new Map<string,string>();
export function avatarDataUrl(person:Person):string{
 // Identity only: birthdays, job changes and the game RNG never change a face.
 const seed=[person.id,person.clan,person.born,person.name,person.sex].join('|');
 const existing=cache.get(seed);if(existing)return existing;
 const data=portraitDataUrl(seed,person.sex);
 if(cache.size>=400)cache.delete(cache.keys().next().value!);cache.set(seed,data);return data;
}
export const PixelAvatar=memo(function PixelAvatar({person,size=64}:{person:Person;size?:number}){
 return <svg className="pixel-avatar" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${person.name}의 인물 아이콘`} style={{imageRendering:'pixelated'}}><image href={avatarDataUrl(person)} width="64" height="64"/></svg>;
});
