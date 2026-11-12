import {describe,it,expect} from 'vitest';
import {create,choose,continueStory,candidates,succeed,type Person,type State} from './engine';
import {closeFamily,familyMemories,featuredMemory} from './family-memory';

function fixture() {
  const s=create(42);
  s.report={from:1392,to:1397,title:'기록',decision:'돌봄',changes:{},immediate:{},borrowed:0,debtBefore:0,debtAfter:0,entries:[]};
  return s;
}
function child(s:State,id:string,name:string):Person {
  const p={...structuredClone(s.people[s.head]),id,name,born:1393,died:null,alive:true,generation:2,parents:[s.head],spouses:[],children:[],life:[]};
  s.people[id]=p;s.people[s.head].children.push(id);return p;
}
describe('family memories derived from recorded events',()=>{
  it('preserves birth and farewell even if the child dies within one turn',()=>{
    const s=fixture(),p=child(s,'child','김아이');p.died=1395;p.alive=false;
    s.report!.entries=[{year:1393,text:'김아이, 2대 자녀가 태어나다.',kind:'family'},{year:1395,text:'김아이, 2세에 생을 마치다.',kind:'family'}];
    expect(familyMemories(s).map(m=>[m.kind,m.people[0].id])).toEqual([['birth','child'],['farewell','child']]);
    expect(closeFamily(s).map(p=>p.id)).not.toContain('child');
    expect(familyMemories(JSON.parse(JSON.stringify(s)))).toEqual(familyMemories(s));
  });
  it('only surfaces events actually in this report, not earlier or future family milestones',()=>{
    const s=fixture();child(s,'child','김아이');
    s.report!.entries=[{year:1395,text:'김아이의 배움을 돕다.',kind:'growth'},{year:1394,text:'김아이, 2대 자녀가 태어나다.',kind:'family'}];
    expect(familyMemories(s)).toEqual([]);
    s.report=undefined;expect(featuredMemory(s)).toBeUndefined();
  });
  it('does not guess which portrait belongs to an ambiguous namesake log',()=>{
    const s=fixture();child(s,'first','김아이');child(s,'second','김아이');
    s.report!.entries=[{year:1393,text:'김아이, 2대 자녀가 태어나다.',kind:'family'}];
    expect(familyMemories(s)).toEqual([]);
  });
  it('includes same-year twins in a zero-year report without inventing parent relationships',()=>{
    const s=fixture(),a=child(s,'a','김하나'),b=child(s,'b','김둘');
    for(const p of [a,b])p.life=[{year:p.born,text:'부모의 쌍둥이로 태어남'}];
    s.report!.from=s.report!.to=1393;
    s.report!.entries=[{year:1393,text:'김하나와 김둘, 쌍둥이로 태어나다.',kind:'family'}];
    expect(familyMemories(s)[0].people.map(p=>p.id)).toEqual(['a','b']);
    b.parents=['someone-else'];expect(familyMemories(s)).toEqual([]);
  });
  it('uses the recorded partner rather than a later living spouse',()=>{
    const s=fixture(),head=s.people[s.head],spouse=child(s,'spouse','이연');
    head.spouses=[spouse.id];head.life.push({year:1393,text:'이연와 혼인'});
    spouse.alive=false;spouse.died=1395;
    s.report!.entries=[{year:1393,text:`${head.name}와 이연, 혼인하다.`,kind:'family'}];
    expect(familyMemories(s)[0].people.map(p=>p.id)).toEqual([head.id,spouse.id]);
  });
  it('prioritizes a deceased representative and does not mutate game state',()=>{
    const s=fixture(),p=s.people[s.head];p.died=1397;p.alive=false;
    const c=child(s,'child','김아이');
    s.report!.entries=[{year:c.born,text:'김아이, 2대 자녀가 태어나다.',kind:'family'},{year:p.died,text:`${p.name}, ${p.died-p.born}세에 생을 마치다.`,kind:'family'}];
    const before=JSON.stringify(s);
    expect(featuredMemory(s)?.people[0].id).toBe(p.id);expect(featuredMemory(s)?.kind).toBe('farewell');
    expect(JSON.stringify(s)).toBe(before);
  });
  it('recognizes births, marriages, coming of age and farewells from actual engine play',()=>{
    const kinds=new Set<string>();
    for(let seed=1;seed<=5&&kinds.size<4;seed++){
      let s=create(seed);
      for(let turn=0;turn<40&&s.phase!=='ended'&&kinds.size<4;turn++){
        s=continueStory(s);
        if(s.phase==='succession')s=succeed(s,candidates(s)[0].id);
        if(s.phase==='play')s=choose(s,0);
        familyMemories(s).forEach(m=>kinds.add(m.kind));
      }
    }
    expect([...kinds].sort()).toEqual(['birth','farewell','growth','marriage']);
  });
});
