import {useMemo} from 'react';
import {clans} from './data';
import {create,backgrounds,type State} from './engine';
import {Avatar} from './game-panels';
import type {ChallengeRead,FamilyChallenge} from './share-links';

export function ChallengeLanding({invite,game,onStart,onReturn,onNew}:{invite:ChallengeRead;game:State|null;onStart:(data:FamilyChallenge)=>void;onReturn:()=>void;onNew:()=>void}){
 const data=invite.kind==='ready'?invite.data:null;
 const preview=useMemo(()=>data&&invite.kind==='ready'&&invite.compatible?create(data.seed,data.clan,data.origin):null,[data]);
 if(!data)return <main className="challenge-screen"><section className="challenge-card" role="region" aria-label="친구의 가문 도전"><p className="eyebrow">친구에게서 온 도전</p><h1>도전 링크를<br/>읽지 못했어요.</h1><p>링크가 잘렸거나 지원하지 않는 형식입니다. 친구에게 다시 보내 달라고 해주세요.</p><p className="challenge-save-note">링크를 여는 동안 저장된 게임은 바뀌지 않았습니다.</p><button className="primary" onClick={onReturn}>{game?'내 기록 이어가기 →':'처음 화면으로 →'}</button><button className="challenge-secondary" onClick={onNew}>새 가문 찾아보기</button></section></main>;
 const background=backgrounds.find(b=>b.id===data.origin)!;
 return <main className="challenge-screen"><section className="challenge-card" role="region" aria-label="친구의 가문 도전">
  <p className="eyebrow">같은 출발, 다른 선택</p><h1>친구의 가문은<br/><em>{data.years}년</em>을 이어왔어요.</h1>
  <div className="challenge-score"><div><b>{data.generations}</b><span>계보 세대</span></div><div><b>{data.years}</b><span>살아남은 해</span></div></div>
  <p className="challenge-clan">{clans[data.clan].label} · {background.title}</p>
  {preview&&<div className="challenge-person"><Avatar person={preview.people[preview.founder]} size={62}/><div><small>당신도 이 사람에게서 시작합니다</small><strong>{preview.people[preview.founder].name}</strong><span>{preview.year-preview.people[preview.founder].born}세 · {preview.people[preview.founder].sex==='남'?'남성':'여성'} · {preview.people[preview.founder].region}</span></div></div>}
  <p>가문·출발 신분·시드는 같습니다.<br/>어떤 선택을 하느냐에 따라 이후 가족과 사건은 달라집니다.</p>
  {invite.kind==='ready'&&!invite.compatible?<p className="save-warning" role="alert">이 링크는 이전 게임 규칙으로 만들어졌습니다. 기록은 볼 수 있지만 같은 조건의 도전은 시작할 수 없습니다. 친구에게 새 도전 링크를 받아주세요.</p>:<>{game&&<p className="save-warning">도전을 시작하면 이 브라우저의 현재 자동 저장이 새 가문으로 바뀝니다. 수집한 결말과 최고 기록은 유지됩니다.</p>}<button className="primary challenge-start" onClick={()=>onStart(data)}>{game?'현재 저장을 바꾸고 도전하기 →':'같은 운명으로 도전하기 →'}</button></>}
  <button className="challenge-secondary" onClick={onReturn}>{game?'내 기록 이어가기 →':'처음 화면으로 →'}</button>
  <p className="challenge-save-note">친구가 공유한 기록입니다. 결말 이름과 공략은 공개하지 않습니다.</p>
 </section></main>;
}
