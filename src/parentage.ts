import type {State,Person} from './engine';
export function parentNames(s:State,p:Person):string{
 return p.parents.map(id=>s.people[id]).filter((parent):parent is Person=>!!parent)
  .sort((a,b)=>Number(a.sex==='여')-Number(b.sex==='여'))
  .map(parent=>`${parent.sex==='남'?'아버지':'어머니'} ${parent.name}`).join(' · ')||'기록의 시작';
}
