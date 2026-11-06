import type {State,Person} from './engine';
import type {Choice,Event} from './data';
export type StartingStanding='commoner'|'specialist'|'yangban'|'nobi';
// A separate seed mix keeps the family's existing RNG stream unchanged.
// Odd multipliers and xor shifts preserve a uniform 32-bit seed distribution.
// Keep this pool ordered: same-seed replays must retain the same starting life.
const startingPool:readonly StartingStanding[]=['commoner','specialist','yangban','nobi'];
export function randomStartingStanding(seed:number):StartingStanding{
 let value=(seed>>>0)^0x9e3779b9;
 value=Math.imul(value^(value>>>16),0x7feb352d);
 value=Math.imul(value^(value>>>15),0x846ca68b);
 value=(value^(value>>>16))>>>0;
 return startingPool[value>>>30];
}
export type SocialFocus='livelihood'|'advancement'|'politics';
export type SocialAction='free'|'study'|'exam'|'technical'|'appointment'|'recognize'|'court'|'organize'|'kingmaker'|'founder'|'restore'|'rebuild'|'livelihood'|'modern-study'|'civic';
export type Society={origin:StartingStanding;standing:StartingStanding|'citizen';focus:SocialFocus;office:'none'|'technical'|'local'|'court';examPassed:boolean;examPerson:string|null;recognition:number;support:number;risk:number;political:'quiet'|'exile'|'kingmaker'|'founder';alternate:boolean;achievements:('freed'|'exam'|'yangban'|'court'|'kingmaker'|'founder'|'restored'|'abolished')[];lastEventTurn:number};
export const backgrounds:{id:StartingStanding;title:string;description:string;effect:string}[]=[
 {id:'commoner',title:'상민 가문',description:'농사와 생업에서 출발해 배움과 신뢰로 길을 넓힙니다.',effect:'교육 +0 · 재산 +0 · 생업 부담 연 −0.1'},
 {id:'specialist',title:'기술·실무 가문',description:'기술과 실무를 익혀 관청의 전문 직역으로 나아갑니다. 중인 경로를 단순화한 설정입니다.',effect:'교육 +12 · 연결 +8 · 기술직 경로'},
 {id:'yangban',title:'양반 가문',description:'가문의 기반은 있지만 관직과 권력은 직접 얻어야 합니다.',effect:'교육 +18 · 명성 +12 · 지위 +20 · 관직 없음'},
 {id:'nobi',title:'노비 신분의 가문',description:'제약 속에서 자원을 모아 면천과 새로운 생업을 꿈꿉니다.',effect:'재산 −10 · 교육 −8 · 생업 부담 연 −0.35 · 면천 필요'},
];
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function newSociety(origin:StartingStanding='commoner',year=1392):Society{return {origin,standing:year>=1894?'citizen':origin,focus:'livelihood',office:'none',examPassed:false,examPerson:null,recognition:0,support:0,risk:0,political:'quiet',alternate:false,achievements:year>=1894?['abolished']:[],lastEventTurn:-2}}
export function societyState(s:Pick<State,'society'|'year'>):Society{return s.society??newSociety('commoner',s.year)}
export function legalStatus(s:State){return s.year>=1894?'신분제 폐지':societyState(s).standing==='nobi'?'천인(노비)':'양인'}
export function societyLabel(s:State){const a=societyState(s);return a.political==='exile'?'유배 중인 가문':a.political==='founder'?'가상 왕조의 창업 가문':a.political==='kingmaker'?'가상 정변의 공신 가문':({commoner:'상민 가문',specialist:'기술·실무층(중인 경로)',yangban:'양반 가문',nobi:'노비 신분의 가문',citizen:'근대 시민 가문'}[s.year>=1894?'citizen':a.standing])}
export function officeLabel(s:State){return s.year>=1894?'근대 이후 · 옛 관직 종료':({none:'관직 없음',technical:'기술·실무직',local:'관직 진출',court:'조정의 요직'}[societyState(s).office])}
export function socialHint(s:State){const a=societyState(s);if(s.year>=1894)return '옛 신분과 과거 응시 제한이 사라졌습니다. 교육·직업과 시민 참여로 새 길을 찾습니다.';const income={none:0,technical:.35,local:.5,court:.8}[a.office];return `가문 전체의 사회적 위치를 단순화한 게임 규칙입니다. ${a.standing==='nobi'?'생업 부담으로 재산 연 −0.35.':a.standing==='commoner'?'생업 부담으로 재산 연 −0.1.':'신분만으로 관직이 생기지 않습니다.'}${income?` 관직 수입 재산 연 +${income}.`:''} 개인의 관직·응시 자격은 사망 또는 75세에 끝나는 게임 규칙이며 세습되지 않습니다.`}
export function initializeSociety(s:State,origin:StartingStanding){s.society=newSociety(origin);const a=origin==='specialist'?{education:12,connections:8}:origin==='yangban'?{education:18,reputation:12,status:20}:origin==='nobi'?{wealth:-10,education:-8,status:-15}:{};for(const [k,v] of Object.entries(a))s.stats[k as keyof State['stats']]=clamp(s.stats[k as keyof State['stats']]+v!);const p=s.people[s.head];p.education=s.stats.education;p.job=origin==='nobi'?'예속된 생업':origin==='specialist'?'기술·실무 수련':origin==='yangban'?'학인':p.job}
export function selectSocialFocus(state:State,focus:SocialFocus):State{if(state.introPending||state.phase!=='play'||state.report||!['livelihood','advancement','politics'].includes(focus)||societyState(state).focus===focus)return state;const s=structuredClone(state);s.society=structuredClone(societyState(s));s.society.focus=focus;return s}
export function examCandidate(s:State):Person|undefined{return Object.values(s.people).filter(p=>p.alive&&p.lineage&&p.sex==='남'&&s.year-p.born>=18&&s.year-p.born<75).sort((a,b)=>b.education+b.ability*.25-(a.education+a.ability*.25))[0]}
export function examChance(s:State){const p=examCandidate(s);return p?Math.max(.08,Math.min(.8,.08+p.education*.004+p.ability*.002+s.stats.education*.002)):0}
export function coupChance(s:State){const a=societyState(s);return Math.max(.1,Math.min(.8,.12+a.support*.005+s.stats.connections*.002+s.stats.reputation*.001-a.risk*.003))}
function write(s:State,text:string,kind='society'){s.log.push({year:s.year,text,kind})}
function grant(a:Society,key:Society['achievements'][number]){if(!a.achievements.includes(key))a.achievements.push(key)}
function officePerson(s:State){const id=societyState(s).examPerson,p=id?s.people[id]:undefined;return p?.alive&&s.year-p.born>=18&&s.year-p.born<75?p:undefined}
export function retireOffice(s:State){const a=s.society;if(!a?.examPerson)return;const p=s.people[a.examPerson];if(p?.alive&&s.year-p.born<75)return;const held=a.office!=='none';a.office='none';a.examPassed=false;a.examPerson=null;if(p?.alive&&held)p.job='전직 관원';write(s,`${p?.name??'이전 응시자'}의 ${p?.alive?'고령 은퇴':'생애 종료'}로 ${held?'관직과 수입':'개인 과거 자격'}이 끝났습니다. 가문의 성취 기록은 남고, 다음 사람이 새 길을 준비합니다.`)}
export function societyAnnual(s:State){
 s.society=structuredClone(societyState(s));const a=s.society;
 if(s.year>=1894){if(a.standing!=='citizen'){const holder=a.examPerson?s.people[a.examPerson]:undefined;if(holder?.alive&&a.office!=='none')holder.job='전직 관원';a.standing='citizen';a.office='none';a.political=a.political==='exile'?'quiet':a.political;grant(a,'abolished');write(s,a.alternate?'대체역사 공통 규칙: 1894년 가상의 신분 개혁을 적용합니다. 옛 신분·과거·관직 제한이 끝났습니다.':'1894년 신분제 폐지를 반영해 가문의 옛 신분·과거·관직 제한이 끝났습니다.',a.alternate?'alternate':'society');}return;}
 retireOffice(s);
 const burden=a.standing==='nobi'?.35:a.standing==='commoner'?.1:0;const income={none:0,technical:.35,local:.5,court:.8}[a.office];s.stats.wealth=clamp(s.stats.wealth-burden+income);
}
export function socialLockReason(s:State,c:Choice):string|null{
 const action=c.socialAction;if(!action)return null;const a=societyState(s);
 if(s.year>=1894&&!['modern-study','civic'].includes(action))return '1894년 이후에는 옛 신분·과거·정변 경로를 사용할 수 없습니다.';
 if(s.year<1894&&['modern-study','civic'].includes(action))return '근대 이후에 열리는 선택입니다.';
 if(a.political==='exile'&&!['restore','rebuild','modern-study','civic'].includes(action))return '유배 이후 생활 기반을 먼저 회복해야 합니다.';
 if(action==='free'){if(a.standing!=='nobi')return '면천이 필요한 신분이 아닙니다.';if(s.stats.wealth<25||s.stats.connections<40)return '재산 25 · 연결 40 필요';}
 if(action==='exam'){if(!['commoner','yangban'].includes(a.standing))return a.standing==='nobi'?'면천 후 응시를 준비할 수 있습니다.':'이 경로는 기술·실무직 진출을 우선합니다.';if(a.examPassed)return '이미 과거에 합격한 가문입니다.';if(!examCandidate(s))return '응시할 생존 성인 남성 후손이 필요합니다. 여성 대표는 친족의 응시를 지원할 수 있습니다.';if(s.stats.education<45||s.stats.wealth<8)return '가문 교육 45 · 재산 8 필요';}
 if(action==='technical'&&(a.standing!=='specialist'||a.office!=='none'||s.stats.education<45||s.stats.wealth<8||!examCandidate(s)))return '기술·실무 가문 · 생존 성인 남성 후손 · 교육 45 · 재산 8 · 관직 없음 필요';
 if(action==='appointment'&&(!a.examPassed||a.office!=='none'||s.stats.reputation<40||!officePerson(s)))return '생존한 75세 미만 성인 합격자 · 명성 40 · 관직 없음 필요';
 if(action==='recognize'&&(a.standing!=='commoner'||!a.examPassed||a.office==='none'||a.recognition<2||s.stats.reputation<55||s.stats.connections<50||s.stats.education<55))return '상민 가문 · 과거 합격 · 관직 · 신뢰 활동 2회 · 명성 55 · 연결 50 · 교육 55 필요';
 if(action==='court'&&(!['local','technical'].includes(a.office)||!officePerson(s)||s.stats.reputation<65||s.stats.connections<65||s.stats.wealth<12))return '생존한 75세 미만 성인 관원 · 명성 65 · 연결 65 · 재산 12 필요';
 if(action==='organize'&&(a.office!=='court'||s.stats.wealth<10||a.political!=='quiet'))return '조정 요직 · 재산 10 · 평상 상태 필요';
 if(['kingmaker','founder'].includes(action)&&(a.office!=='court'||a.support<(action==='founder'?75:60)||s.stats.connections<65||s.stats.wealth<(action==='founder'?20:15)||a.political!=='quiet'))return `조정 요직 · 지지 ${action==='founder'?75:60} · 연결 65 · 재산 ${action==='founder'?20:15} 필요`;
 if(action==='restore'&&(a.political!=='exile'||s.stats.wealth<12||s.stats.connections<30))return '유배 상태 · 재산 12 · 연결 30 필요';
 return null;
}
export function applySocialAction(s:State,action:SocialAction,random:()=>number){
 s.society=structuredClone(societyState(s));const a=s.society;a.lastEventTurn=s.turn+1;
 if(action==='livelihood'){a.focus='livelihood';write(s,'출세를 향한 도전을 잠시 내려놓고 생업과 가족의 이야기로 돌아갑니다. 원할 때 진로를 다시 선택할 수 있습니다.');}
 if(['free','recognize','technical','kingmaker','founder','restore'].includes(action)||(action==='court'&&a.focus==='advancement'))a.focus='livelihood';
 if(action==='free'){a.standing='commoner';grant(a,'freed');s.people[s.head].job='농민';write(s,'자원과 사람들의 도움을 모아 면천했습니다. 가문은 상민의 생업과 배움에 도전합니다.');}
 if(action==='study'){const p=examCandidate(s)??s.people[s.head];p.education=clamp(p.education+10);a.recognition=Math.min(10,a.recognition+1);write(s,`${p.name}의 교육 +10. 가문의 배움과 신뢰 활동이 쌓였습니다.`);}
 if(action==='exam'){const p=examCandidate(s)!;const chance=examChance(s);if(random()<chance){a.examPassed=true;a.examPerson=p.id;grant(a,'exam');s.stats.status=clamp(s.stats.status+10);write(s,`${p.name}, 과거 합격! 관직 진출의 기회가 열렸습니다. 합격만으로 가문의 신분이 바뀌지는 않습니다.`);}else write(s,`${p.name}, 이번 과거에는 합격하지 못했습니다. 준비를 이어 다시 응시할 수 있습니다.`);}
 if(action==='technical'){const p=examCandidate(s)!;a.office='technical';a.examPerson=p.id;p.job='기술·실무 관원';write(s,`${p.name}, 기술과 실무를 인정받아 전문 직역에 진출했습니다. 문과 합격과는 별개의 경로입니다.`);}
 if(action==='appointment'){const p=officePerson(s)!;a.office='local';p.job='관원';write(s,`${p.name}, 과거 합격과 평판을 바탕으로 관직에 진출했습니다.`);}
 if(action==='recognize'){a.standing='yangban';grant(a,'yangban');write(s,'여러 해의 관직·학업·향촌 활동을 거쳐 양반 가문으로 인정받았습니다. 게임에서 단순화한 사회적 이동입니다.');}
 if(action==='court'){const p=officePerson(s)!;a.office='court';p.job='조정 관원';grant(a,'court');write(s,`${p.name}, 관직 경험과 인맥을 바탕으로 조정의 요직에 진출했습니다.`);}
 if(action==='organize'){a.support=clamp(a.support+25);a.risk=clamp(a.risk+12);write(s,`정치적 지지 ${a.support} · 경계 ${a.risk}. 세력이 커질수록 위험도 함께 커집니다.`);}
 if(action==='kingmaker'||action==='founder'){a.alternate=true;const chance=Math.max(.08,coupChance(s)-(action==='founder'?.1:0));if(random()<chance){a.political=action;grant(a,action);s.stats.status=clamp(s.stats.status+25);s.stats.reputation=clamp(s.stats.reputation+10);write(s,action==='founder'?'대체역사: 가상의 정변이 성공하여 새로운 왕조의 창업 가문이 되었습니다. 이후 역사는 실제 연표를 참고한 가상 전개입니다.':'대체역사: 가상의 정변이 성공하여 새 권력의 공신 가문이 되었습니다. 이후 역사는 실제 연표를 참고한 가상 전개입니다.','alternate');}else{a.political='exile';const holder=a.examPerson?s.people[a.examPerson]:undefined;if(holder?.alive)holder.job='유배된 전직 관원';a.office='none';a.support=0;a.risk=0;s.stats.wealth*=.35;s.stats.connections=Math.max(15,s.stats.connections-25);s.stats.reputation=clamp(s.stats.reputation-25);s.stats.status=clamp(s.stats.status-25);write(s,'대체역사: 정변에 실패해 재산을 몰수당하고 유배되었습니다. 가족은 생존하며 생업을 재건하고 복귀할 길을 찾습니다.','alternate');}}
 if(action==='rebuild'){a.risk=Math.max(0,a.risk-10);write(s,a.political==='exile'?'유배지에서 생업과 이웃 관계를 다시 쌓았습니다. 가족의 이야기는 계속됩니다.':'생업을 돌보고 이웃 관계를 쌓아 가문의 기반을 다졌습니다.');}
 if(action==='restore'){a.political='quiet';a.support=0;a.risk=0;const holder=a.examPerson?s.people[a.examPerson]:undefined;if(holder?.alive&&holder.job==='유배된 전직 관원')holder.job='전직 관원';grant(a,'restored');write(s,'생업과 관계를 회복해 유배에서 돌아왔습니다. 예전 관직은 자동 복원되지 않습니다.');}
 if(action==='modern-study'){const p=s.people[s.head];p.education=clamp(p.education+10);p.intendedJob='study';p.job=s.year-p.born<18?'미성년':'새 기술을 익히는 사람';write(s,`${p.name}, 신분 대신 배움과 새 직업으로 진로를 넓힙니다.`);}
 if(action==='civic')write(s,'가족이 지역의 교육과 공공 활동에 참여하며 시민으로서의 신뢰를 쌓았습니다.');
}
const choice=(title:string,description:string,effects:Choice['effects'],socialAction?:SocialAction):Choice=>({title,description,effects,...(socialAction?{socialAction}:{}),...(['study','modern-study'].includes(socialAction??'')?{legacy:'learning'}:{})});
export const societyEvents:Event[]=[
 {id:'social-free',title:'새 삶을 위한 면천의 길',description:'예속된 신분을 벗어나기 위해 재산과 사람들의 도움이 필요합니다. 시대·지역마다 달랐던 면천을 단순화한 가상 사건입니다.',choices:[choice('자원을 모아 면천을 청한다','재산 −25 · 연결 40 필요',{wealth:-25},'free'),choice('일하며 밑천과 인연을 모은다','재산 +8 · 연결 +8 · 생계 −3',{wealth:8,connections:8,stability:-3},'rebuild'),choice('가족의 배움을 이어간다','재산 −3 · 교육 +6 · 개인 교육 +10',{wealth:-3,education:6},'study')]},
 {id:'social-career',title:'배움으로 여는 관직의 길',description:'응시 준비와 합격, 실제 관직 진출은 서로 다른 단계입니다.',choices:[choice('배움과 향촌의 신뢰를 쌓는다','재산 −5 · 교육 +8 · 명성 +8 · 연결 +6 · 개인 교육 +10',{wealth:-5,education:8,reputation:8,connections:6},'study'),choice('가족의 과거 응시를 지원한다','재산 −8 · 가문 교육 45 필요',{wealth:-8},'exam'),choice('합격과 평판을 바탕으로 관직을 구한다','명성 40 필요 · 연결 +5',{connections:5},'appointment'),choice('양반 가문으로 인정받을 기반을 다진다','관직과 지속적인 학업·향촌 신뢰 필요 · 영향력 +12',{status:12},'recognize'),choice('생업을 돌보며 다음 도전을 준비한다','재산 +6 · 생계 +3 · 가족 이야기로 돌아감',{wealth:6,stability:3},'livelihood')]},
 {id:'social-technical',title:'기술과 실무를 인정받는 길',description:'역관·의관 등 전문 직역을 게임에서 하나의 기술·실무 경로로 단순화했습니다. 모든 문과 응시 자격을 뜻하지 않습니다.',choices:[choice('전문 기술과 인맥을 익힌다','재산 −5 · 교육 +8 · 명성 +8 · 연결 +8 · 개인 교육 +10',{wealth:-5,education:8,reputation:8,connections:8},'study'),choice('관청의 기술·실무직에 도전한다','재산 −8 · 교육 45 필요',{wealth:-8},'technical'),choice('경험을 쌓아 조정의 요직을 구한다','재산 −12 · 명성 65 · 연결 65 필요',{wealth:-12},'court'),choice('생업을 돌보며 다음 도전을 준비한다','재산 +6 · 생계 +3 · 가족 이야기로 돌아감',{wealth:6,stability:3},'livelihood')]},
 {id:'social-court',title:'조정으로 향하는 가문의 길',description:'관직의 경험과 가문의 신뢰를 바탕으로 영향력을 넓힙니다.',choices:[choice('학업과 사람들의 신뢰를 다진다','재산 −5 · 교육 +8 · 명성 +8 · 연결 +8',{wealth:-5,education:8,reputation:8,connections:8},'study'),choice('조정의 요직에 도전한다','재산 −12 · 명성 65 · 연결 65 필요',{wealth:-12},'court'),choice('양반 가문으로 인정받을 기반을 다진다','관직과 학업·향촌 활동 필요 · 영향력 +12',{status:12},'recognize'),choice('생업을 돌보며 다음 도전을 준비한다','재산 +6 · 생계 +3 · 가족 이야기로 돌아감',{wealth:6,stability:3},'livelihood')]},
 {id:'social-politics',title:'권력의 갈림길',description:'실제 정변을 재현하지 않는 가상의 정치 사건입니다. 세력을 모은 뒤 권력에 도전할 수 있으며 실패하면 몰수와 유배를 겪습니다.',choices:[choice('자원을 들여 정치적 지지를 모은다','재산 −10 · 지지 +25 · 경계 +12',{wealth:-10},'organize'),choice('새 권력을 세우는 공신에 도전한다','재산 −15 · 지지 60 · 연결 65 필요',{wealth:-15},'kingmaker'),choice('새 왕조를 세우는 도전에 나선다','재산 −20 · 지지 75 · 연결 65 필요 · 성공률 추가 −10%p',{wealth:-20},'founder'),choice('사람들의 신뢰와 생활 기반을 돌본다','재산 +8 · 명성 +4 · 결속 +3',{wealth:8,reputation:4,cohesion:3},'rebuild')]},
 {id:'social-exile',title:'유배지에서 다시 쓰는 가족의 삶',description:'정변의 실패가 가족 이야기의 끝은 아닙니다. 생업을 재건하고 도움을 청하며 돌아갈 길을 마련합니다.',choices:[choice('생업을 일으켜 밑천과 관계를 회복한다','재산 +10 · 연결 +8 · 생계 +5',{wealth:10,connections:8,stability:5},'rebuild'),choice('자원을 들여 복귀를 청한다','재산 −12 · 연결 30 필요 · 유배 종료',{wealth:-12},'restore'),choice('배움을 이어 다음 세대를 준비한다','재산 +4 · 교육 +6 · 결속 +4',{wealth:4,education:6,cohesion:4},'rebuild')]},
 {id:'social-modern',title:'새 시대에 여는 진로',description:'옛 신분과 과거 대신 교육과 직업을 통해 가족의 기회를 넓힙니다.',choices:[choice('새 교육과 기술을 배운다','재산 −6 · 교육 +10 · 개인 교육 +10',{wealth:-6,education:10},'modern-study'),choice('지역의 교육과 공공 활동에 참여한다','재산 −4 · 명성 +8 · 연결 +10',{wealth:-4,reputation:8,connections:10},'civic'),choice('생활 기반을 먼저 마련한다','재산 +8 · 생계 +4',{wealth:8,stability:4},'civic')]},
].map(e=>({...e,min:1392,max:Number.MAX_SAFE_INTEGER,kind:'society' as const}));
export function nextSocietyEvent(s:State):Event|undefined{const a=societyState(s);if(a.political==='exile'&&s.year<1894)return societyEvents.find(e=>e.id==='social-exile');if(a.focus==='livelihood')return;const id=s.year>=1894?'social-modern':a.standing==='nobi'?'social-free':a.focus==='politics'&&a.office==='court'?'social-politics':a.standing==='specialist'&&a.office!=='court'?'social-technical':a.office!=='none'?'social-court':'social-career';return societyEvents.find(e=>e.id===id)}
export function prepareSocialEvent(s:State,e:Event):Event{const a=societyState(s);return {...e,description:e.id==='social-career'?`${e.description} ${examCandidate(s)?`이번 응시 후보: ${examCandidate(s)!.name}.`:'현재 응시할 성인 남성 후손이 없습니다. 가족의 배움을 준비할 수 있습니다.'}`:e.description,choices:e.choices.map(c=>({...c,lockedReason:socialLockReason(s,c)??undefined,chanceLabel:c.socialAction==='exam'?`게임 합격 확률 ${Math.round(examChance(s)*100)}%`:c.socialAction==='kingmaker'||c.socialAction==='founder'?`게임 성공 확률 ${Math.round(Math.max(.08,coupChance(s)-(c.socialAction==='founder'?.1:0))*100)}%`:undefined}))}}
export function wrapAlternateHistory(s:State,e:Event):Event{if(!societyState(s).alternate||e.kind!=='history')return e;return {...e,kind:'alternate',title:'역사 참고 · '+e.title,description:`대체역사 진행 중입니다. 다음은 실제 연표를 참고한 가상 상황이며, 이 세계에서 실제 사건이 그대로 일어났다는 뜻은 아닙니다. ${e.id==='h1894'?'1894년 신분 개혁은 이후 플레이를 위한 공통 게임 규칙입니다.':e.description}`}}
