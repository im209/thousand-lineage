import type {State} from './engine';

const definitions=[
 {id:'extinct',title:'계보 단절',description:'살아 있는 후손이 더는 남지 않았습니다. 가족이 남긴 선택과 이름을 마지막 기록으로 보존합니다.',category:'생존',requirement:'생존한 후손 없이 이야기 종료',hint:'부와 지위가 남아 있어도 이어 갈 후손이 없으면 이 결말을 맞습니다.'},
 {id:'founder',title:'새 왕조의 후손',description:'가문이 새 왕조를 세우는 길에 나섰고, 후손들이 그 선택 이후의 시대를 살아갑니다. 게임에서 만든 가상 역사의 결말입니다.',category:'정치·신분',requirement:'왕조 창업 성공 · 후손 생존',hint:'조정에서 기반을 쌓고 충분한 지지를 모아 왕조 창업에 도전하세요.'},
 {id:'restored',title:'유배를 넘어선 가문',description:'정치적 몰락과 유배를 겪은 뒤 다시 삶의 기반을 세웠습니다. 후손에게 남긴 것은 지위만이 아니라 돌아온 경험입니다.',category:'정치·신분',requirement:'유배 후 복귀 성공 · 후손 생존',hint:'정치적 도전에 실패했다면 생업과 관계를 회복해 돌아올 길을 찾으세요.'},
 {id:'kingmaker',title:'왕을 세운 가문',description:'왕을 세우는 정치적 선택에 성공하고 후손에게 그 기억을 남겼습니다. 게임에서 만든 가상 역사의 결말입니다.',category:'정치·신분',requirement:'공신 도전 성공 · 후손 생존',hint:'정치적 지지와 인맥을 모아 새 권력의 공신이 되는 길에 도전하세요.'},
 {id:'gentry',title:'벼슬과 학문의 명가',description:'게임 속 신분 상승이나 조정 진출의 성취를 쌓아 가문의 이름을 이어 왔습니다. 출발 신분만으로 얻는 결말은 아닙니다.',category:'정치·신분',requirement:'양반 인정 또는 조정 요직 진출 · 후손 생존',hint:'양반으로 시작하는 것만으로는 충분하지 않습니다. 실제로 신분 상승이나 조정 진출을 이루세요.'},
 {id:'trade',title:'상업 명가',description:'꾸준한 거래와 신뢰로 상업의 기반을 완성했습니다. 후손은 가문이 쌓은 생업과 연결을 이어 갑니다.',category:'가문 과업',requirement:'신뢰받는 상가 완성 · 후손 생존',hint:'상업 선택을 이어 가고 가문의 연결을 높여 과업을 완성하세요.'},
 {id:'learning',title:'배움을 이어 온 가문',description:'배움의 집을 완성하고 다음 세대의 교육에 길을 열었습니다. 후손에게 남긴 지식과 기회를 기록합니다.',category:'가문 과업',requirement:'배움의 집 완성 · 후손 생존',hint:'배움을 지원하는 선택을 모으고 가문의 교육 기반을 다지세요.'},
 {id:'survivor',title:'시대를 건넌 가문',description:'크고 작은 선택을 거듭하며 가족의 삶을 이어 왔습니다. 살아 있는 후손들이 가문의 다음 이야기를 써 내려갑니다.',category:'생존',requirement:'다른 특별 결말 없이 후손 생존',hint:'특별한 성취가 없어도 가족의 삶을 끝까지 이어 가면 얻는 결말입니다.'},
 {id:'school',title:'마을의 스승이 된 가문',description:'모아 둔 서책과 준비한 공간으로 가족과 이웃이 함께 배우는 자리를 마련했습니다.',category:'가문 연대기',requirement:'조선의 삶 → 배움과 기록 → 배움터 · 후손 생존',hint:'‘배움과 기록’을 준비한 뒤 ‘가족과 이웃에게 배움터를 연다’를 고르세요. 교육 30이 필요합니다.'},
 {id:'books',title:'책을 지켜 낸 가문',description:'집안의 서책과 생활 문서를 필사해 나누어 보관했습니다. 국가의 실록을 보전한 공적과는 별개의 이야기입니다.',category:'가문 연대기',requirement:'조선의 삶 → 배움과 기록 → 문서 보관 · 후손 생존',hint:'‘배움과 기록’을 준비한 뒤 ‘사가의 문서를 필사하고 나누어 보관한다’를 고르세요. 교육 40이 필요합니다.'},
 {id:'relief',title:'흉년을 함께 넘은 가문',description:'비축한 곡식을 상환 요구 없이 나누어 어려운 이웃의 끼니를 도왔습니다.',category:'가문 연대기',requirement:'조선의 삶 → 곡식과 돌봄 → 무상 구호 · 후손 생존',hint:'‘곡식과 돌봄’을 준비한 뒤 ‘비축한 곡식을 이웃에게 무상으로 나눈다’를 고르세요.'},
 {id:'medicine',title:'생명을 돌본 가문',description:'준비한 물자로 가족과 이웃을 돌보고 의술과 돌봄의 지식을 전했습니다. 치료나 생존을 보장하는 업적은 아닙니다.',category:'가문 연대기',requirement:'조선의 삶 → 곡식과 돌봄 → 의술 전수 · 후손 생존',hint:'‘곡식과 돌봄’을 준비한 뒤 ‘돌봄 경험과 의술 지식을 다음 사람에게 전한다’를 고르세요. 교육 35가 필요합니다.'},
 {id:'market',title:'장터를 키운 가문',description:'준비한 물품을 약속대로 전달해 장시에서 다음 거래로 이어질 신뢰를 쌓았습니다.',category:'가문 연대기',requirement:'조선의 삶 → 장시와 교역 → 장시의 신뢰 · 후손 생존',hint:'1500~1893년에 ‘장시와 교역’을 준비하고 ‘약속한 물품을 전달해 장시의 신뢰를 지킨다’를 고르세요.'},
 {id:'caravan',title:'먼 길을 잇는 가문',description:'준비한 물품과 운송 비용으로 다른 고장의 거래 상대를 연결했습니다.',category:'가문 연대기',requirement:'조선의 삶 → 장시와 교역 → 먼 고장 거래망 · 후손 생존',hint:'1500~1893년에 ‘장시와 교역’을 준비하고 ‘운송 비용을 들여 먼 고장의 거래망을 잇는다’를 고르세요. 연결 45가 필요합니다.'},
 {id:'refuge',title:'피란길의 안식처',description:'터전을 잃고 떠나온 이웃에게 잠시 머물 곳과 식량을 내어 주었습니다.',category:'가문 연대기',requirement:'조선의 삶 → 전란과 재건 → 피란 이웃 돕기 · 후손 생존',hint:'1592~1660년에 ‘전란과 재건’을 준비하고 ‘떠나온 이웃에게 머물 곳과 식량을 내어 준다’를 고르세요.'},
 {id:'reconstruction',title:'폐허 위에 다시 선 가문',description:'가족과 이웃의 일손을 모아 피해 집터와 생업의 기반을 복구했습니다.',category:'가문 연대기',requirement:'조선의 삶 → 전란과 재건 → 집터와 생업 복구 · 후손 생존',hint:'1592~1660년에 ‘전란과 재건’을 준비하고 ‘흩어진 일손을 모아 집터와 생업을 복구한다’를 고르세요.'},
 {id:'petition',title:'뜻을 모아 변화를 만든 가문',description:'생활 문제의 근거 문서를 모아 민원을 내고 가상의 조정안을 남겼습니다. 모든 요구가 받아들여졌다는 뜻은 아닙니다.',category:'가문 연대기',requirement:'조선의 삶 → 문서와 가족의 몫 → 민원 조정 · 후손 생존',hint:'‘문서와 가족의 몫’을 준비한 뒤 ‘근거 문서로 생활 문제를 호소하고 조정을 구한다’를 고르세요. 연결 30이 필요합니다.'},
 {id:'inheritance',title:'함께 나눈 유산',description:'가족이 재산과 돌봄의 몫을 함께 의논하고 합의한 약속을 문서로 남겼습니다.',category:'가문 연대기',requirement:'조선의 삶 → 문서와 가족의 몫 → 가족의 합의 · 후손 생존',hint:'‘문서와 가족의 몫’을 준비한 뒤 ‘가족의 몫을 함께 논의하고 약속을 문서로 남긴다’를 고르세요.'},
 {id:'artisan',title:'손끝으로 이름을 남긴 가문',description:'준비한 재료로 함께 작업하며 가문의 손기술을 다음 일손에게 전했습니다.',category:'가문 연대기',requirement:'조선의 삶 → 손기술의 전승 → 기술 전수 · 후손 생존',hint:'‘손기술의 전승’을 준비한 뒤 ‘손기술을 다음 일손에게 차근차근 전한다’를 고르세요.'},
 {id:'innovation',title:'새 기술의 선구자',description:'재료를 써 가며 제작 방법을 다듬고 다음 사람이 참고할 기록을 남겼습니다.',category:'가문 연대기',requirement:'조선의 삶 → 손기술의 전승 → 제작법 개선 · 후손 생존',hint:'‘손기술의 전승’을 준비한 뒤 ‘재료를 써 가며 제작법을 개선하고 기록한다’를 고르세요. 교육 40이 필요합니다.'},
 {id:'care',title:'돌봄을 이어 온 가문',description:'함께 사는 집을 완성하고 가족이 서로 돌볼 수 있는 생활의 기반을 남겼습니다.',category:'가문 과업',requirement:'함께 사는 집 완성 · 후손 생존',hint:'돌봄의 선택을 이어 가며 가족의 결속을 높이세요.'},
 {id:'freed',title:'자유를 되찾은 가문',description:'예속된 신분에서 벗어나 생업과 배움의 기회를 스스로 만들어 갔습니다.',category:'정치·신분',requirement:'면천 성공 · 후손 생존',hint:'노비 신분으로 출발해 자원과 연결을 모으고 면천을 이루세요.'},
 {id:'freed_founder',title:'속박에서 왕조의 시작으로',description:'면천을 이룬 가문이 가상의 왕조 창업에도 성공했습니다. 여러 세대의 선택이 만든 대체역사의 결말입니다.',category:'복합 성취',requirement:'면천과 왕조 창업 모두 성공 · 후손 생존',hint:'면천 이후에도 정치적 도전을 이어 가 왕조 창업까지 이루세요.'},
 {id:'freed_gentry',title:'신분의 벽을 넘은 명가',description:'면천 뒤 배움과 관직의 길을 이어 가며 양반 가문으로 인정받았습니다.',category:'복합 성취',requirement:'면천과 양반 인정 모두 성공 · 후손 생존',hint:'자유를 얻은 뒤 과거·관직·향촌 신뢰를 쌓아 양반 인정을 받으세요.'},
 {id:'healing_community',title:'마을을 살린 가문',description:'곡식을 무상으로 나누고 의술과 돌봄의 지식도 전하며 이웃의 생활에 힘을 보탰습니다.',category:'복합 성취',requirement:'곡식과 돌봄의 무상 구호 + 의술 전수 · 후손 생존',hint:'‘조선의 삶 → 곡식과 돌봄’을 두 번 준비해 두 가지 마무리를 각각 완수하세요.'},
 {id:'knowledge_road',title:'지식과 교역의 길',description:'집안의 책과 문서를 보관하고 장시나 먼 고장의 거래를 통해 가문 밖의 연결도 쌓았습니다.',category:'복합 성취',requirement:'배움과 기록의 문서 보관 + 장시와 교역 한 갈래 · 후손 생존',hint:'‘배움과 기록’에서 문서 보관을 완수하고, ‘장시와 교역’을 새로 준비해 두 마무리 중 하나를 완수하세요.'},
] as const;
export type EndingId=typeof definitions[number]['id'];
export type Ending=Readonly<{id:EndingId;title:string;description:string;category:string;requirement:string;hint:string}>;
export const endings:readonly Ending[]=Object.freeze(definitions.map(ending=>Object.freeze(ending)));
const arcIds:readonly EndingId[]=['school','books','relief','medicine','market','caravan','refuge','reconstruction','petition','inheritance','artisan','innovation'];
const lookup=(id:EndingId)=>endings.find(ending=>ending.id===id)!;

// Qualifying achievements are shown in primary-ending priority order. The
// collection records only endingFor(), so one run earns one ending badge.
export function eligibleEndings(s:State):Ending[]{
 if(!Object.values(s.people).some(person=>person.lineage&&person.alive))return [lookup('extinct')];
 const society=s.society;
 const earned=(achievement:string)=>society?.achievements.some(id=>id===achievement)??false;
 const completed=(s as State&{chronicles?:{completed:readonly string[]}}).chronicles?.completed??[];
 const arc=(id:string)=>completed.includes(id);
 const ids:EndingId[]=[];
 if(earned('freed')&&earned('founder'))ids.push('freed_founder');
 if(earned('freed')&&earned('yangban'))ids.push('freed_gentry');
 if(arc('relief')&&arc('medicine'))ids.push('healing_community');
 if(arc('books')&&(arc('market')||arc('caravan')))ids.push('knowledge_road');
 if(earned('founder'))ids.push('founder');
 if(earned('restored'))ids.push('restored');
 if(earned('kingmaker'))ids.push('kingmaker');
 for(const id of [...completed].reverse())if(arcIds.includes(id as EndingId)&&!ids.includes(id as EndingId))ids.push(id as EndingId);
 if(earned('yangban')||earned('court')||society?.office==='court')ids.push('gentry');
 if(earned('freed'))ids.push('freed');
 for(const id of ['care','trade','learning'] as const)if(s.projects?.completed.includes(id))ids.push(id);
 return (ids.length?ids:['survivor'] as EndingId[]).map(lookup);
}
// Classification never changes the phase, history, resources, or achievements.
export function endingFor(s:State):Ending{return eligibleEndings(s)[0]}
