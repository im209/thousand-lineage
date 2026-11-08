// Procedural pixel-art landscape: a thatched house (초가집) under a persimmon tree.
// Drawn on a small grid and emitted as run-length <rect>s, so it stays crisp at any size
// and needs no image assets.
import {memo} from 'react';

const W=96,H=64;
const C={
 sky0:'#bfe6e2',sky1:'#d6efe6',sky2:'#eef5df',cloud:'#ffffff',cloudShade:'#e3f1ee',
 sun:'#ffb36b',sunRim:'#ffd59a',
 far:'#9ccfc0',farShade:'#8cc2b3',near:'#6fb59d',nearShade:'#5ea38b',
 grass:'#7cba6a',grassDark:'#5f9f52',yard:'#ecd7a0',yardDark:'#dfc488',path:'#f5e6bd',
 wall:'#f6ead0',post:'#8a5a3a',door:'#6b4228',paper:'#fff8e8',
 thatch:'#dcaa48',thatchDark:'#b9832e',ridge:'#a8702a',stone:'#b8b0a0',stoneDark:'#9d9584',
 trunk:'#7a4b2b',leaf:'#3f8f5f',leafLight:'#5aa874',persimmon:'#e8743b',
 fence:'#a8814f',skin:'#f2c7a0',hair:'#2b2a33',
 red:'#e0605a',blue:'#5f8fd6',yellow:'#efc04a',white:'#fbf7ee',
};
type Color=keyof typeof C;

function paint(){
 const g:Color[][]=Array.from({length:H},()=>Array<Color>(W).fill('sky0'));
 const set=(x:number,y:number,c:Color)=>{if(x>=0&&x<W&&y>=0&&y<H)g[y][x]=c};
 const rect=(x:number,y:number,w:number,h:number,c:Color)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,c)};
 // Sky bands with a checkerboard dither between them.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const band=y<12?'sky0':y<24?'sky1':'sky2';
  const edge=(y===11||y===23)&&(x+y)%2===0;
  g[y][x]=edge?(y===11?'sky1':'sky2'):band;
 }
 // Sun.
 for(let y=4;y<24;y++)for(let x=64;x<86;x++){const d=Math.hypot(x-75,y-13);if(d<=7.2)set(x,y,d>6?'sunRim':'sun')}
 // Clouds.
 rect(8,8,12,2,'cloud');rect(10,6,7,2,'cloud');rect(8,10,12,1,'cloudShade');
 rect(44,12,10,2,'cloud');rect(46,10,5,2,'cloud');rect(44,14,10,1,'cloudShade');
 // Far mountains, then near hills.
 for(let x=0;x<W;x++){
  const far=Math.round(30+5*Math.sin(x/9)+3*Math.sin(x/4.3+1));
  for(let y=far;y<H;y++)set(x,y,y===far||(y===far+1&&x%3===0)?'farShade':'far');
  const near=Math.round(40+3*Math.sin(x/7+2)+2*Math.sin(x/3.1));
  for(let y=near;y<H;y++)set(x,y,y===near?'nearShade':'near');
 }
 // Ground: grass edge, then the yard, with a path to the door.
 rect(0,46,W,18,'grass');
 for(let x=0;x<W;x+=3)set(x,46,'grassDark');
 rect(0,49,W,15,'yard');
 for(let y=49;y<H;y++)for(let x=0;x<W;x++)if((x*7+y*3)%23===0)set(x,y,'yardDark');
 for(let y=50;y<H;y++){const half=2+Math.floor((y-50)/3);rect(46-half,y,half*2+1,1,'path')}
 // Stone base (기단).
 rect(27,47,39,3,'stone');rect(27,49,39,1,'stoneDark');
 // Walls, posts, paper windows and the door.
 rect(30,36,33,11,'wall');
 for(const px of [30,46,62])rect(px,35,1,12,'post');
 rect(30,36,33,1,'post');
 for(const wx of [33,51]){rect(wx,39,8,5,'paper');rect(wx,39,8,1,'post');rect(wx,43,8,1,'post');rect(wx,39,1,5,'post');rect(wx+7,39,1,5,'post');rect(wx+3,39,1,5,'post');rect(wx,41,8,1,'post')}
 rect(43,39,7,8,'door');rect(46,39,1,8,'post');
 // Thatched roof: a rounded mound with darker straw rows and a ridge rope.
 for(let r=0;r<11;r++){
  const curve=Math.round(Math.sqrt(1-((10-r)/11)**2)*20);
  const x0=46-curve-2,x1=46+curve+2;
  for(let x=x0;x<=x1;x++)set(x,25+r,r===0?'ridge':r%3===0?'thatchDark':'thatch');
 }
 rect(24,35,45,1,'thatchDark');
 for(let x=26;x<67;x+=4)set(x,36,'thatchDark');
 // Persimmon tree on the left.
 rect(14,34,3,13,'trunk');rect(12,40,2,1,'trunk');rect(17,38,2,1,'trunk');
 for(let y=18;y<38;y++)for(let x=3;x<28;x++){const d=Math.hypot((x-15)/1.15,y-28);if(d<=9.5)set(x,y,d<6.5&&(x+y)%5===0?'leafLight':d>8.6&&(x+y)%2===0?'leafLight':'leaf')}
 for(const [x,y] of [[9,25],[19,23],[14,30],[22,29],[7,31],[17,34],[11,21]] as const){set(x,y,'persimmon');set(x+1,y,'persimmon');set(x,y+1,'persimmon');set(x+1,y+1,'persimmon')}
 // Brushwood fences (싸리 울타리).
 for(const [x0,x1] of [[0,24],[69,96]] as const){rect(x0,51,x1-x0,1,'fence');for(let x=x0;x<x1;x+=2)rect(x,48,1,6,'fence')}
 // A small family in front of the house: two parents and a child.
 const person=(x:number,y:number,body:Color,tall:number)=>{rect(x,y,3,1,'hair');rect(x,y+1,3,2,'skin');set(x+1,y+2,'skin');rect(x-1,y+3,5,tall,body);rect(x,y+3,3,1,'white');rect(x,y+3+tall,1,1,'hair');rect(x+2,y+3+tall,1,1,'hair')};
 person(38,51,'blue',5);person(52,51,'red',5);person(45,54,'yellow',3);
 return g;
}

const grid=paint();
const runs:{x:number;y:number;w:number;c:string}[]=[];
for(let y=0;y<H;y++){let x=0;while(x<W){const c=grid[y][x];let w=1;while(x+w<W&&grid[y][x+w]===c)w++;runs.push({x,y,w,c:C[c]});x+=w}}

export const PixelLandscape=memo(function PixelLandscape({label}:{label:string}){
 return <svg className="pixel-landscape" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice">
  {runs.map((r,i)=><rect key={i} x={r.x} y={r.y} width={r.w} height={1.03} fill={r.c}/>)}
 </svg>;
});
