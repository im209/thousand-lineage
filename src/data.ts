import {lifeEvents} from './life-events';
import {societyEvents} from './society';
import {chronicleEvents} from './chronicles';
import {surpriseEvents} from './surprises';
import census from './clan-census.json';
export const clanSource='https://kosis.kr/statisticsList/mass/mass_list.jsp?org_id=101&tbl_id=DT_1IN15SD';
export const clanCoverage={year:census.year,surnameCount:census.surnameCount,namedCount:census.namedCount};
export const censusSource='https://www.kostat.go.kr/boardDownload.es?bid=203&list_no=356061&seq=8';
export const historySource='https://contents.history.go.kr/front/ta/view.do?levelId=ta_h71_0040';
// Verified combinations in table 22; no rounded population values presented as exact counts.
export const clans=['김해 김 金','밀양 박 朴','전주 이 李','경주 김 金','경주 이 李','진주 강 姜','경주 최 崔','광산 김 金','파평 윤 尹','청주 한 韓','안동 권 權','인동 장 張','평산 신 申','순흥 안 安','안동 김 金','남양 홍 洪','동래 정 鄭','해주 오 吳','전주 최 崔','남평 문 文'].map((s,i)=>{const [origin,surname,hanja]=s.split(' ');return {id:i,origin,surname,hanja,label:`${origin} ${surname}씨`,population:null,source:censusSource}});
export type Stat='wealth'|'stability'|'status'|'education'|'health'|'reputation'|'connections'|'cohesion';
// Additional attested combinations; source confirms only name and clan, not population.
const additional=[
 ['한산','이','李','https://encykorea.aks.ac.kr/Article/E0043502'],
 ['청송','심','沈','https://encykorea.aks.ac.kr/Article/E0033785'],
 ['선산','김','金','https://db.history.go.kr/id/sa_085r_0180_0030'],
 ['수원','백','白','https://www.hampyeong.go.kr/upload/gunsa/04.pdf'],
 ['의성','김','金','https://db.history.go.kr/diachronic/level.do?levelId=sa_085r_0020_0010'],
 ['은진','송','宋','https://encykorea.aks.ac.kr/Article/E0030900'],
 ['덕수','이','李','https://encykorea.aks.ac.kr/Article/E0045546'],
 ['여흥','민','閔','https://encykorea.aks.ac.kr/Article/E0020253'],
 ['풍산','류','柳','https://www.gbmg.go.kr/tour/contents.do?mId=0101020300'],
 ['여산','송','宋','https://dh.aks.ac.kr/hanyang/wiki/index.php/민제']
];
additional.forEach(([origin,surname,hanja,source])=>clans.push({id:clans.length,origin,surname,hanja,label:`${origin} ${surname}씨`,population:null,source}));
// Never reorder the first 30 IDs: browser saves persist these array indices.
const clanKey=(origin:string,surname:string,hanja:string)=>[origin,surname,hanja].join('|').normalize('NFKC');
const knownClans=new Set(clans.map(c=>clanKey(c.origin,c.surname,c.hanja)));
for(const [,origin,surname,hanja] of census.entries){
 const key=clanKey(origin,surname,hanja);if(knownClans.has(key))continue;
 knownClans.add(key);
 clans.push({id:clans.length,origin,surname,hanja:hanja.includes('?')?'한자 미표기':hanja,label:origin?`${origin} ${surname}씨`:`${surname}씨 · 본관 미공개`,population:null,source:clanSource});
}
export function searchClans(query:string){
 const q=query.normalize('NFKC').replace(/\s/g,'');if(!q)return [];
 return clans.filter(c=>`${c.label}${c.hanja}`.normalize('NFKC').replace(/\s/g,'').includes(q));
}
export const labels:Record<Stat,string>={wealth:'재산',stability:'생계 안정',status:'사회적 영향력',education:'교육·지식',health:'생활환경',reputation:'명성',connections:'사회적 연결',cohesion:'가족 결속'};
export type Choice={title:string;description:string;effects:Partial<Record<Stat,number>>;legacy?:string;move?:boolean;job?:'trade'|'study';adopt?:boolean;personalEducation?:number;target?:string;unlock?:import('./projects').ProjectId;debtRelief?:number;socialAction?:import('./society').SocialAction;chronicleAction?:import('./chronicles').ChronicleAction;lockedReason?:string;chanceLabel?:string;surpriseAction?:import('./surprises').SurpriseAction};
export type Event={id:string;title:string;description:string;min:number;max:number;year?:number;source?:string;kind:'history'|'life'|'legacy'|'arcade'|'society'|'alternate'|'chronicle'|'surprise';requires?:string;choices:Choice[]};
const choices:Choice[]=[{title:'가족의 생활을 먼저 지킨다',description:'생계 +8 · 결속 +5 · 재산 −4',effects:{stability:8,cohesion:5,wealth:-4},legacy:'care'},{title:'배움에 미래를 건다',description:'교육 +12 · 재산 −8 · 후대 교육 기회',effects:{education:12,wealth:-8},legacy:'learning',job:'study'},{title:'새로운 생업을 개척한다',description:'재산 +8 · 생계 −5 · 상업 경험을 전승',effects:{wealth:8,stability:-5,connections:4},legacy:'trade',job:'trade'}];
const war:Choice[]=[{title:'가족과 함께 피난한다',description:'거주지 이동 · 재산 −15 · 건강 +8',effects:{wealth:-15,health:8,cohesion:5},move:true,legacy:'migration'},{title:'고향에서 생계를 지킨다',description:'재산 +4 · 지역에 따라 생활환경 손실',effects:{wealth:4,health:-12,stability:-10},legacy:'land'},{title:'이웃과 구호를 함께한다',description:'재산 −8 · 연결 +14 · 명성 +8',effects:{wealth:-8,connections:14,reputation:8},legacy:'community'}];
export const events:Event[]=[
 ...societyEvents,
 ...chronicleEvents,...surpriseEvents,
 {id:'h1894',year:1894,min:1894,max:1894,title:'신분의 경계가 사라지는 전환',description:'갑오개혁의 신분제 폐지를 반영합니다. 옛 신분·과거·관직 경로는 끝나고 새로운 교육과 생업의 길이 열립니다. 사회적 차별이 즉시 사라졌다는 뜻은 아닙니다.',kind:'history',source:'https://contents.history.go.kr/front/hm/view.do?levelId=hm_118_0020',choices:[{title:'새 교육으로 다음 세대를 준비한다',description:'재산 −6 · 교육 +10',effects:{wealth:-6,education:10},socialAction:'modern-study'},{title:'새로운 생업의 기회를 찾는다',description:'재산 +8 · 연결 +5',effects:{wealth:8,connections:5},socialAction:'civic'},{title:'이웃과 변화의 길을 함께한다',description:'명성 +8 · 연결 +10 · 재산 −4',effects:{reputation:8,connections:10,wealth:-4},socialAction:'civic'}]},
 {id:'h1950',year:1950,min:1950,max:1950,title:'전쟁, 가족의 안부를 묻다',description:'6·25 전쟁이 시작되었습니다. 살던 곳과 생활의 기반이 흔들리는 가운데 가족의 안전을 결정합니다.',kind:'history',source:'https://theme.archives.go.kr/next/625/background/overview.do',choices:war},
 {id:'h1953',year:1953,min:1953,max:1953,title:'멈춘 포성 뒤의 삶',description:'정전협정이 체결되었습니다. 남겨진 삶의 터전을 다시 세워야 합니다.',kind:'history',source:'https://theme.archives.go.kr/next/625/background/overview.do',choices},
 {id:'h1987',year:1987,min:1987,max:1987,title:'변화하는 사회 속에서',description:'6월 민주항쟁의 해입니다. 변화의 시대에 가족과 지역사회의 내일을 생각합니다.',kind:'history',source:'https://contents.history.go.kr/front/hm/view.do?levelId=hm_151_0040',choices},
 {id:'h1997',year:1997,min:1997,max:1997,title:'경제 위기가 찾아오다',description:'외환위기로 일자리와 가계가 불안정해졌습니다. 가족의 생활 기반을 다시 점검합니다.',kind:'history',source:'https://www.bok.or.kr/portal/main/contents.do?menuNo=201688',choices:[{title:'지출을 줄여 생활을 지킨다',description:'재산 +5 · 결속 −5 · 안정 +5',effects:{wealth:5,cohesion:-5,stability:5},legacy:'care'},{title:'새로운 직업을 준비한다',description:'재산 −10 · 교육 +10 · 미래 생업을 준비',effects:{wealth:-10,education:10},legacy:'learning',job:'study'},{title:'함께 쓸 자원을 모은다',description:'재산 −5 · 연결 +10 · 결속 +10',effects:{wealth:-5,connections:10,cohesion:10},legacy:'community'}]},
 ...([[1392,'새로운 왕조, 새로운 시작','조선이 건국되었습니다. 변화하는 세상 속에서 가족이 의지할 터전을 정해야 합니다.'],[1592,'전쟁이 일상을 흔들다','임진왜란이 시작되었습니다. 가족의 거처와 생계를 어떻게 지킬까요?'],[1636,'다시 찾아온 전란','병자호란이 일어났습니다. 지역에 따라 위험과 부담이 다르게 다가옵니다.'],[1876,'열리는 항구, 달라지는 세상','강화도 조약 이후 개항이 시작됩니다. 가족의 다음 생업을 고민합니다.'],[1910,'주권을 빼앗긴 시대','일제강점기가 시작되었습니다. 어려운 시대 속에서 가족의 일상을 이어갑니다.'],[1919,'거리에서 들려오는 목소리','3·1 운동이 일어났습니다. 가족과 지역사회의 관계를 돌아봅니다.'],[1945,'해방, 그리고 새로운 삶','광복을 맞았습니다. 달라진 사회 속에서 가족의 생활 기반을 세웁니다.']] as [number,string,string][]).map(([year,title,description])=>({id:`h${year}`,year,min:year,max:year,title,description,source:historySource,kind:'history' as const,choices:[1592,1636].includes(year)?war:choices})),
 ...(['먹고사는 일의 무게','이웃과 함께하는 품앗이','아이에게 남길 배움','작은 장사의 기회','집을 고쳐 쓸 때','가족 사이의 약속','마을의 신뢰를 얻다','좋지 않은 수확','새로운 기술을 배우다','먼 곳에서 온 소식','노년의 생활을 준비하다','다음 세대를 위한 밑천','흩어진 가족의 안부','일과 돌봄 사이','변화하는 시장','새 출발의 기회'].map((title,i)=>({id:`life${i}`,title,description:'한정된 살림으로 모든 것을 지킬 수는 없습니다. 지금의 선택이 가족의 생활과 후손의 기회를 바꿉니다.',min:i>12?1900:1392,max:Number.MAX_SAFE_INTEGER,kind:'life' as const,choices}))),
 ...(['learning','migration','trade','community','care'].map((key,i)=>({id:`legacy-${key}`,title:['오래된 책이 열어 준 길','낯선 땅이 고향이 되다','이어받은 장사의 경험','이웃이 기억하는 도움','돌봄이 남긴 힘'][i],description:'2대 전의 선택이 지금의 가족에게 기회로 돌아왔습니다. 이 유산을 어떻게 이어갈까요?',min:1392,max:Number.MAX_SAFE_INTEGER,kind:'legacy' as const,requires:key,choices})))
];
for(const event of lifeEvents){const i=events.findIndex(e=>e.id===event.id);events[i]=event;}
export const regions=['경상도','전라도','충청도','경기도','강원도'];
export function era(y:number){return y>2026?'가상의 미래':y<1592?'조선 전기':y<1636?'전란과 복구':y<1801?'조선 후기':y<1876?'변화의 조선':y<1910?'개항과 근대화':y<1945?'일제강점기':y<1953?'해방과 전쟁':y<1987?'복구와 산업화':y<1997?'민주화 이후':y<2020?'현대사회':'오늘의 대한민국'}
export function jobFor(y:number,educated:boolean,trade:boolean){return educated?(y<1895?'학인':y<1953?'교원':'연구원'):trade?(y<1900?'상인':'자영업자'):(y<1953?'농민':'기술직')}
