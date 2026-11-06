import type {Choice,Event} from './data';

const stories:Record<string,string[]>={
 life0:['지출을 줄여 다음 선택에 쓸 밑천을 남겼습니다.','먹거리와 휴식에 투자해 가족의 생활 기반을 돌봤습니다.','밑천으로 작은 장사를 열고 거래를 시작했습니다.'],
 life1:['이웃의 일손을 돕고 서로 의지할 관계를 쌓았습니다.','우리 집의 일을 먼저 마쳐 살림에 보탰습니다.','이웃에게 배운 지식을 가족에게 가져왔습니다.'],
 life2:['아이의 학업에 시간과 비용을 충분히 보탰습니다.','일상에서 아이가 배울 시간을 마련했습니다.','이번에는 생활에 필요한 밑천을 먼저 남겼습니다.'],
 life3:['밑천을 들여 거래를 넓히고 새 인연을 만들었습니다.','작은 거래로 수입과 경험을 함께 쌓았습니다.','장사를 넓히는 대신 새 기술을 익혔습니다.'],
 life4:['비용을 들여 가족이 오래 머물 집을 고쳤습니다.','급한 곳을 수리해 집의 생활환경을 보완했습니다.','수리를 미뤄 돈을 남겼지만 집의 환경은 나빠졌습니다.'],
 life5:['일에 쓰던 시간을 돌려 가족을 함께 돌봤습니다.','서로의 일을 존중하고 돌봄의 역할을 나눴습니다.','수입을 늘렸지만 가족이 함께할 여유는 줄었습니다.'],
 life6:['마을의 일을 맡아 가문의 평판을 쌓았습니다.','살림이 허락하는 만큼 이웃을 도왔습니다.','마을의 부탁보다 가족의 생활을 우선했습니다.'],
 life7:['비축한 재산을 풀어 어려운 살림을 버텼습니다.','이웃과 물자를 나누며 생계와 관계를 함께 챙겼습니다.','지출을 줄여 돈은 남겼지만 가족의 부담이 늘었습니다.'],
 life8:['거래망과 재산 일부를 정리해 빚을 조정했습니다.','살림을 줄이는 부담을 감수하고 빚 일부를 줄였습니다.','빚 조정 대신 당장의 생계와 생활환경을 챙겼습니다.'],
};

// Describe the chosen action, without attributing random births or survival to it.
export function decisionFeedback(event:Event,choice:Choice,index:number):string{
 if(choice.unlock)return '완성한 가문의 유산을 활용해 이번 일을 해결했습니다.';
 if(stories[event.id]?.[index])return stories[event.id][index];
 if(choice.move)return '살던 곳을 떠나 가족의 새 터전을 마련했습니다.';
 if(choice.legacy==='learning')return '지금의 살림 일부를 배움과 다음 세대의 기회에 보탰습니다.';
 if(choice.legacy==='trade')return '새 생업과 거래에 힘을 실어 가문의 밑천을 쌓았습니다.';
 if(choice.legacy==='care')return '가족의 생활을 우선하며 함께 버틸 기반을 다졌습니다.';
 if(choice.legacy==='community')return '이웃과 힘을 나누며 가문의 신뢰와 관계를 쌓았습니다.';
 return '가족은 고른 길에 자원을 보태고 다음 시기를 준비했습니다.';
}
