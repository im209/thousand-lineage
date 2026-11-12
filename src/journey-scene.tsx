import type {State} from './engine';
import {PixelAvatar} from './pixel-avatar';
import {journeyRisk} from './journeys';

export function JourneyScene({s}:{s:State}){
 const trip=s.journey;if(!trip)return null;
 const person=s.people[trip.candidate],tiger=trip.id==='journey-tiger',flood=trip.id==='journey-flood';
 return <section className="journey-scene" aria-label="과거길의 응시자와 위험">
  <div className="journey-landscape" aria-hidden="true">
   <svg viewBox="0 0 160 64" shapeRendering="crispEdges" focusable="false">
    <path fill="#dce1ca" d="M0 0h160v64H0z"/><path fill="#b5bd98" d="M0 27h8v-6h9v-8h10v7h9v8h12v-4h11v-8h13v9h12v7h16v-9h10v-8h10v7h13v9h27v33H0z"/>
    <path fill="#798b68" d="M0 38h19v-7h17v-6h13v9h18v6h20v-7h21v-7h12v9h20v6h20v23H0z"/>
    <path fill="#b0a174" d="M0 49h160v15H0z"/><path fill="#d3bc86" d="M33 64h42v-7H64v-6h11v-6h9v-6h-6v5H65v6H51v7H33z"/>
    <path fill="#52674e" d="M9 12h4v7h4v7h4v7h-8v18H9V33H1v-7h4v-7h4zM138 18h4v7h4v7h4v7h-8v16h-4V39h-8v-7h4v-7h4z"/>
    {tiger?<g><path fill="#b97d3c" d="M101 38h22v12h-4v7h-5v-7h-8v7h-5V38zM94 33h13v12H94zM94 30h4v4h-4zM103 30h4v4h-4zM123 39h9v4h-9zM130 34h3v8h-3z"/><path fill="#403e31" d="M108 38h3v7h-3zM115 38h3v7h-3zM101 46h7v3h-7zM116 46h7v3h-7z"/><path fill="#f3dda6" d="M94 40h10v5H94z"/><path fill="#302e25" d="M95 36h2v2h-2zM102 36h2v2h-2zM98 41h3v2h-3z"/></g>:flood?<g><path fill="#638a89" d="M85 46h75v18H78v-8h7z"/><path fill="#b6d3c1" d="M88 49h14v2H88zM112 54h16v2h-16zM89 60h19v2H89zM141 48h15v2h-15z"/><path fill="#6d5942" d="M110 42h26v3h-26zM117 40h3v9h-3zM129 40h3v9h-3z"/></g>:<g><path fill="#4d5042" d="M108 31h8v6h-8zM120 34h7v5h-7z"/><path fill="#b7946c" d="M108 37h8v5h-8zM120 39h7v4h-7z"/><path fill="#745545" d="M106 42h12v11h-12zM119 43h10v10h-10z"/><path fill="#343c35" d="M108 53h3v7h-3zM114 53h3v7h-3zM121 53h3v6h-3zM126 53h3v6h-3zM133 35h2v22h-2z"/></g>}
   </svg>
   <div className="journey-traveler"><PixelAvatar person={person} size={48}/></div>
   <span className="journey-scene-label">{tiger?'고갯길':flood?'불어난 나루':'외진 산길'}</span>
  </div>
  <div className="journey-person"><div><span>한양으로 향하는 사람</span><strong>{person.name}</strong><small>{s.year-person.born}세 · {person.trait} · {person.id===s.head?'가문의 현재 대표':'가문이 지원하는 응시자'}</small></div><div className="journey-stakes"><span>홀로 강행할 때</span><b>사망 {Math.round(journeyRisk(s)*100)}%</b><small>실제 통계가 아닌 게임 확률</small></div></div>
  <p className="journey-note">과거 준비비 8은 이미 사용했습니다. 지금은 이 사람의 길을 결정합니다.</p>
 </section>;
}
