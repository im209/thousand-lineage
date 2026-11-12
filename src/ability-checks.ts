export type AbilityCheck={actor:string;label:string;chance:number;success:boolean;factors:{label:string;value:number}[]};
export function validChecks(value:unknown,people:Record<string,unknown>):boolean{
 if(value===undefined)return true;
 return Array.isArray(value)&&value.length<=2&&value.every(c=>c&&typeof c==='object'&&typeof c.actor==='string'&&Object.hasOwn(people,c.actor)&&typeof c.label==='string'&&c.label.length<=80&&typeof c.chance==='number'&&Number.isFinite(c.chance)&&c.chance>=0&&c.chance<=1&&typeof c.success==='boolean'&&Array.isArray(c.factors)&&c.factors.length<=4&&c.factors.every((f:any)=>f&&typeof f.label==='string'&&f.label.length<=40&&typeof f.value==='number'&&Number.isFinite(f.value)));
}
