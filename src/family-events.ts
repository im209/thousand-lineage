export type DeathCause='tiger'|'flood'|'bandits';
export type FamilyEvent={type:'birth'|'marriage'|'farewell'|'growth';people:string[];cause?:DeathCause};
export type LogEntry={year:number;text:string;kind:string;family?:FamilyEvent};

/** Metadata is optional on v1 saves. When present, it must refer to real people. */
export function validFamilyEvent(value:unknown,people:Record<string,unknown>):boolean {
 if(value===undefined)return true;
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 if(!['birth','marriage','farewell','growth'].includes(v.type as string)||!Array.isArray(v.people)||v.people.length<1||v.people.length>2||new Set(v.people).size!==v.people.length||!v.people.every(id=>typeof id==='string'&&Object.hasOwn(people,id)))return false;
 if(v.type==='marriage'&&v.people.length!==2||['farewell','growth'].includes(v.type as string)&&v.people.length!==1)return false;
 return v.cause===undefined||v.type==='farewell'&&['tiger','flood','bandits'].includes(v.cause as string);
}
