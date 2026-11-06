import {useRef,useState} from 'react';
import {clans} from './data';
import {summary,type State} from './engine';
import {CHALLENGE_RULES,challengeFor,challengeUrl,copyMessage,shareCaption,isShareCancelled} from './share-links';
import {avatarDataUrl} from './pixel-avatar';

function download(blob:Blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='천년가문-도전기록.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function resultImage(s:State):Promise<Blob>{
 const result=summary(s),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;
 const c=canvas.getContext('2d');if(!c)return Promise.reject(Error('Canvas unavailable'));
 c.fillStyle='#f7f8f2';c.fillRect(0,0,1200,720);c.fillStyle='#e2f2eb';c.fillRect(50,50,1100,620);c.fillStyle='#257b74';c.font='bold 30px sans-serif';c.fillText('千年家門  천년가문',100,120);
 let size=58;c.fillStyle='#264e54';do{c.font=`bold ${size}px sans-serif`;size-=2}while(c.measureText(clans[s.clan].label).width>760&&size>20);c.fillText(clans[s.clan].label,100,245);
 c.font='bold 83px sans-serif';c.fillText(`${result.years}년 · ${result.generations}세대`,100,365);c.font='28px sans-serif';c.fillText(`기록된 가족 ${result.people}명 · 생존 후손 ${result.living}명`,100,435);
 c.fillStyle='#52786c';c.font='31px sans-serif';c.fillText('같은 출발에서, 너는 몇 대까지?',100,548);c.font='21px sans-serif';c.fillText(new URL('.',location.href).href,100,603);
 const portrait=new Image();await new Promise<void>((resolve,reject)=>{portrait.onload=()=>resolve();portrait.onerror=()=>reject(Error('Portrait failed'));portrait.src=avatarDataUrl(s.people[s.founder]);});
 c.imageSmoothingEnabled=false;c.drawImage(portrait,945,100,150,150);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image encoding failed')),'image/png'));
}

export function ResultShare({s}:{s:State}){
 const result=summary(s),data=challengeFor(s,result.years,result.generations),url=challengeUrl(data,location.href),message=copyMessage(data,url);
 const [notice,setNotice]=useState(''),[manual,setManual]=useState(''),[busy,setBusy]=useState(false),field=useRef<HTMLTextAreaElement>(null);
 const copy=async()=>{try{await navigator.clipboard.writeText(message);setManual('');setNotice('도전 링크와 결과를 복사했습니다. 채팅방에 붙여넣어 보내세요.')}catch{setManual(message);setNotice('아래 내용을 직접 복사해서 친구에게 보내세요.')}};
 const share=async()=>{
  setNotice('');setBusy(true);
  try{
   const shareData={title:'천년가문 · 같은 운명 도전',text:shareCaption(data),url};
   if(navigator.share&&(!navigator.canShare||navigator.canShare(shareData))){await navigator.share(shareData);setNotice('공유창을 열었습니다. 선택한 앱에서 전송을 확인하세요.');}
   else await copy();
  }catch(error){if(isShareCancelled(error))setNotice('공유를 취소했습니다.');else await copy();}finally{setBusy(false)}
 };
 const image=async(saveOnly=false)=>{
  setNotice('');setBusy(true);
  try{
   const blob=await resultImage(s);
   if(saveOnly){download(blob);setNotice('결말 이름이 없는 기록 이미지를 저장했습니다.');return;}
   const file=new File([blob],'천년가문-도전기록.png',{type:'image/png'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'천년가문 · 나의 가문 기록',text:message});setNotice('이미지 공유창을 열었습니다. 선택한 앱에서 전송을 확인하세요.');}
   else setNotice('이 브라우저에서는 이미지 바로 공유를 지원하지 않습니다. 이미지 저장이나 도전 링크를 이용해 주세요.');
  }catch(error){setNotice(isShareCancelled(error)?'공유를 취소했습니다.':'이미지를 공유하지 못했습니다. 도전 링크나 결과 복사를 이용해 주세요.');}finally{setBusy(false)}
 };
 const opponent=s.challenge?.rules===CHALLENGE_RULES?s.challenge:null;
 return <section className="result-share" aria-label="친구에게 가문 도전 보내기">
  {opponent&&<div className="challenge-comparison"><small>같은 출발에서 나온 두 기록</small><p>친구 <b>{opponent.years}년 · {opponent.generations}세대</b><br/>나 <b>{result.years}년 · {result.generations}세대</b></p><strong>{result.years>opponent.years?`${result.years-opponent.years}년 더 이어왔어요!`:result.years===opponent.years?'같은 시간만큼 가문을 이어왔어요.':`친구의 기록까지 ${opponent.years-result.years}년이 남았어요.`}</strong></div>}
  <div className="share-heading"><small>친구의 선택은 다를까?</small><h3>같은 운명으로 도전해 보세요.</h3><p>기록과 출발 조건만 공유합니다. 결말 이름과 내용은 비밀로 남습니다.</p></div>
  <div className="share-preview"><strong>{clans[s.clan].label}</strong><span>{result.years}년 생존 · {result.generations}세대</span><p>나는 여기까지 이어왔어. 너는 몇 대까지?</p></div>
  <button className="primary share-challenge" disabled={busy} onClick={share}>친구에게 도전 보내기 ↗</button>
  <div className="share-options"><button disabled={busy} onClick={copy}>결과 복사 ↗</button><button disabled={busy} onClick={()=>image()}>이미지 바로 공유 ↗</button><button disabled={busy} onClick={()=>image(true)}>이미지 저장 ↓</button></div>
  {notice&&<p className="share-notice" role="status">{notice}</p>}
  {manual&&<div className="manual-share"><label htmlFor="manual-share-text">친구에게 보낼 내용</label><textarea id="manual-share-text" ref={field} readOnly value={manual} onFocus={event=>event.currentTarget.select()}/><button onClick={()=>{field.current?.focus();field.current?.select()}}>내용 선택</button></div>}
 </section>;
}
