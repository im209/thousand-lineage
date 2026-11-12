import type {Person, State} from './engine';
import type {DeathCause} from './family-events';

export type FamilyMemory = {
  kind: 'birth' | 'marriage' | 'farewell' | 'growth';
  year: number;
  text: string;
  people: Person[];
  cause?: DeathCause;
};

// Match the engine's recorded events, not name substrings or the current living
// family. A person who was born and died in this turn still has both memories.
export function familyMemories(s: State): FamilyMemory[] {
  if (!s.report) return [];
  const known = new Map<string, Omit<FamilyMemory, 'year' | 'text'> | null>();
  const key = (year: number, text: string) => `${year}|${text}`;
  const inPeriod = (year: number) => year >= s.report!.from && year <= s.report!.to;
  const remember = (year: number, text: string, memory: Omit<FamilyMemory, 'year' | 'text'>) => {
    if (!inPeriod(year)) return;
    const id = key(year,text), previous = known.get(id);
    // Old logs carry names, not IDs. If two people fit, keep the original text
    // in the timeline rather than attach a potentially incorrect portrait.
    if (known.has(id) && (!previous || previous.people.map(p=>p.id).join('|') !== memory.people.map(p=>p.id).join('|'))) known.set(id,null);
    else known.set(id,memory);
  };
  const people = Object.values(s.people);
  for (const p of people) {
    if (p.parents.length) remember(p.born, `${p.name}, ${p.generation}대 자녀가 태어나다.`, {kind: 'birth', people: [p]});
    if (p.died !== null) remember(p.died, `${p.name}, ${p.died-p.born}세에 생을 마치다.`, {kind: 'farewell', people: [p]});
    for (const life of p.life) {
      if (!inPeriod(life.year)) continue;
      for (const id of p.spouses) {
        const spouse = s.people[id];
        if (spouse && life.text === `${spouse.name}와 혼인`) {
          remember(life.year, `${p.name}와 ${spouse.name}, 혼인하다.`, {kind: 'marriage', people: [p, spouse]});
        }
      }
      if (life.text.startsWith('성년이 되어 ') && life.text.endsWith('의 길을 시작함')) {
        remember(life.year, `${p.name}, ${life.text.slice(0,-1)}하다.`, {kind: 'growth', people: [p]});
      }
    }
  }
  // Twins share one engine log entry but retain two stable person identities.
  const twins = people.filter(p => inPeriod(p.born) && p.life.some(l => l.year === p.born && l.text.endsWith('의 쌍둥이로 태어남')));
  for (const p of twins) for (const q of twins) {
    if (p.id === q.id || p.born !== q.born || p.parents.length !== q.parents.length || !p.parents.every(id => q.parents.includes(id))) continue;
    remember(p.born, `${p.name}와 ${q.name}, 쌍둥이로 태어나다.`, {kind: 'birth', people: [p,q]});
  }
  return s.report.entries.flatMap(entry => {
    if(entry.family){
      const members=entry.family.people.map(id=>s.people[id]);
      return members.every(Boolean)?[{kind:entry.family.type,people:members,year:entry.year,text:entry.text,...(entry.family.cause?{cause:entry.family.cause}:{})}]:[];
    }
    const memory = known.get(key(entry.year, entry.text));
    return memory ? [{...memory, year: entry.year, text: entry.text}] : [];
  });
}

export function featuredMemory(s: State): FamilyMemory | undefined {
  const memories = familyMemories(s);
  return memories.find(m => m.kind === 'farewell' && m.people.some(p => p.id === s.head))
    ?? memories.find(m => m.kind === 'farewell' && m.cause)
    ?? memories.find(m => m.kind === 'birth')
    ?? memories.find(m => m.kind === 'marriage')
    ?? memories[0];
}

export function reportHeadline(s:State):string {
 const memories=familyMemories(s);
 const loss=memories.find(m=>m.kind==='farewell'&&(m.cause||m.people.some(p=>p.id===s.head)));
 return loss?.text??s.report?.outcome??featuredMemory(s)?.text??`${s.people[s.head].name}, 가족과 함께 시간을 지나왔습니다.`;
}

export function closeFamily(s: State): Person[] {
  const head = s.people[s.head];
  return [...new Set([head.id, ...head.spouses, ...head.children])]
    .map(id => s.people[id]).filter((p): p is Person => !!p && p.alive);
}
