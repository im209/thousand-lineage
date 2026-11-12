import {memo} from 'react';

// A hand-composed, deterministic 192 × 112 village. Pixels are merged into
// horizontal runs once, keeping the scene small and the simulation RNG untouched.
const W=192,H=112;
const palette={sky:'#d6e9df',haze:'#e9eee0',cloud:'#faf9e9',far:'#b5d1bb',farDark:'#a3c3ac',mountain:'#86ad93',mountainDark:'#749881',pine:'#527b66',pineLight:'#668c6b',grass:'#91a16b',grassLight:'#b2b47a',grassDark:'#7c925e',field:'#c0bc7e',fieldDark:'#a6a16c',water:'#91bcba',waterLight:'#cee0cd',earth:'#d5bf8a',earthDark:'#bea572',path:'#e8d8aa',stone:'#9a9f88',stoneLight:'#c3c4a6',wall:'#eee0b4',wallShade:'#d5c396',wood:'#785a42',woodLight:'#a78156',door:'#584b3d',paper:'#faf0ca',roof:'#c3954d',roofLight:'#dab46a',roofDark:'#9c7541',tile:'#66766e',tileLight:'#8b9990',tileDark:'#475d56',leaf:'#64835a',leafLight:'#859456',leafDark:'#4c7054',fruit:'#c67242',pot:'#8e6148',potLight:'#b1805c',pink:'#dcae95',flower:'#f1cfaa',hair:'#45453b',skin:'#e7bd8b',blue:'#547c84',red:'#af6251',cream:'#eedaa1'};
type Color=keyof typeof palette;
function drawVillage(){
  const pixels:Color[][]=Array.from({length:H},()=>Array<Color>(W).fill('sky'));
  const dot=(x:number,y:number,c:Color)=>{if(x>=0&&x<W&&y>=0&&y<H)pixels[Math.floor(y)][Math.floor(x)]=c};
  const rect=(x:number,y:number,w:number,h:number,c:Color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)dot(xx,yy,c)};
  const oval=(cx:number,cy:number,rx:number,ry:number,c:Color,light?:Color)=>{for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)dot(x,y,light&&(x*7+y*13)%17<3?light:c)};
  rect(0,27,W,H-27,'haze');
  oval(151,21,9,9,'cream');
  // Quiet ridgelines, rice terraces and a stream behind the village.
  for(let x=0;x<W;x++){
    const far=Math.round(39+7*Math.sin(x/19)+4*Math.sin(x/8));
    rect(x,far,1,H-far,x%8===0?'farDark':'far');
    const near=Math.round(52+8*Math.sin(x/27+1)+3*Math.sin(x/9));
    rect(x,near,1,H-near,x%12<2?'mountainDark':'mountain');
  }
  for(const [x,y,size] of [[8,49,9],[19,54,7],[173,47,8],[181,53,10],[161,52,6]]){
    rect(x,y,1,size+7,'wood');for(let row=0;row<size;row++)rect(x-Math.floor(row/2),y+row,row+1,2,row%3?'pine':'pineLight');
  }
  rect(0,66,W,46,'grass');
  for(let y=66;y<83;y++){const x=150-(y-66)*4;rect(x,y,35+(y-66)*2,1,'field');if(y%4===0)rect(x,y,35+(y-66)*2,1,'fieldDark')}
  for(let y=67;y<112;y++){const x=185-Math.floor((y-67)*.52);rect(x,y,9,1,'water');if(y%5===0)rect(x+2,y,5,1,'waterLight')}
  rect(0,86,158,26,'earth');
  for(let y=84;y<H;y++)for(let x=0;x<166;x++){if((x*13+y*7)%79===0)dot(x,y,'earthDark');if(x<10&&y%3===0)dot(x,y,'grassLight')}
  for(let y=80;y<H;y++){const x=94+Math.floor((y-80)*.18);rect(x-5,y,13+Math.floor((y-80)/5),1,'path')}
  // Distant tiled-roof house, intentionally quieter than the family home.
  rect(136,59,25,16,'wallShade');rect(136,75,29,3,'stone');
  for(let row=0;row<9;row++)rect(148-row*2,51+row,row*4+1,1,row%3===0?'tileLight':'tile');
  rect(129,60,39,2,'tileDark');rect(144,65,6,10,'door');rect(155,65,4,5,'paper');
  // Foreground family home: stone foundation, wooden beams, paper lattice windows.
  rect(53,81,78,5,'stone');rect(55,82,74,2,'stoneLight');
  for(let x=55;x<130;x+=7)rect(x,84,1,2,'stone');
  rect(58,59,68,22,'wall');rect(58,59,68,3,'wallShade');
  for(const x of [58,80,101,125])rect(x,59,2,23,'wood');
  rect(58,79,68,2,'wood');
  for(const x of [64,106]){rect(x,65,14,11,'wood');rect(x+1,66,12,9,'paper');for(let k=4;k<13;k+=4)rect(x+k,66,1,9,'woodLight');rect(x+1,70,12,1,'woodLight')}
  rect(86,64,12,17,'door');rect(92,64,1,17,'woodLight');dot(90,73,'roofLight');dot(94,73,'roofLight');
  rect(84,82,17,3,'stoneLight');rect(82,85,21,2,'stone');
  // Straw roof: deliberately irregular stepped eaves and individual straw stitches.
  for(let row=0;row<19;row++){
    const half=Math.round(Math.sqrt(1-((18-row)/20)**2)*44);
    for(let x=91-half;x<=91+half;x++)dot(x,41+row,row%4===0?'roofDark':(x*7+row*11)%23<4?'roofLight':'roof');
  }
  rect(47,59,89,2,'roofDark');rect(75,40,31,2,'roofDark');rect(78,39,25,1,'roofLight');
  for(let x=49;x<136;x+=5)rect(x,61,2,x%2?2:1,'roof');
  // A persimmon tree and a smaller flowering tree frame the yard.
  rect(27,51,4,36,'wood');rect(24,62,3,2,'wood');rect(30,58,6,2,'wood');
  oval(27,44,23,19,'leafDark');oval(20,39,16,13,'leaf','leafLight');oval(37,40,14,12,'leaf','leafLight');oval(29,53,18,10,'leaf','leafLight');
  for(const [x,y] of [[12,38],[21,30],[36,34],[43,44],[22,48],[32,55],[11,49],[29,40]]){rect(x,y,3,3,'fruit');dot(x+1,y-1,'leafDark')}
  rect(153,76,2,14,'wood');oval(153,71,12,11,'pink','flower');oval(146,68,7,6,'flower');
  // Store jars, stacked firewood, vegetable beds, laundry and low fences.
  for(const [x,y,size] of [[117,87,5],[126,88,4],[135,87,5]]){oval(x,y,size,size,'pot','potLight');rect(x-size,y-size,size*2,2,'door')}
  rect(58,87,14,5,'wood');for(let y=88;y<92;y+=2)for(let x=59;x<71;x+=4)rect(x,y,3,1,'woodLight');
  rect(9,95,30,10,'fieldDark');for(let y=96;y<105;y+=3)for(let x=11;x<38;x+=5){rect(x,y,3,1,'leafDark');dot(x+1,y-1,'leafLight')}
  rect(139,81,1,14,'wood');rect(167,81,1,14,'wood');rect(139,83,28,1,'woodLight');
  rect(143,84,7,7,'cream');rect(155,84,7,6,'blue');
  for(const [start,end] of [[0,49],[123,150]]){rect(start,102,end-start,1,'woodLight');for(let x=start;x<end;x+=4)rect(x,98,1,9,'wood')}
  const person=(x:number,y:number,coat:Color,child=false)=>{rect(x,y,4,2,'hair');rect(x,y+2,4,3,'skin');rect(x-1,y+5,6,child?5:7,coat);rect(x,y+5,4,1,'cream');rect(x,y+(child?10:12),1,2,'hair');rect(x+3,y+(child?10:12),1,2,'hair')};
  person(83,89,'blue');person(107,88,'red');person(96,95,'cream',true);
  // Grass tufts and tiny petals avoid a flat, empty foreground.
  for(let x=2;x<190;x+=11){if(x>55&&x<137)continue;dot(x,109,'grassDark');dot(x+1,108,'grassDark');dot(x+2,109,'grassDark')}
  for(const [x,y] of [[144,93],[151,98],[161,95],[139,105]])rect(x,y,2,1,'flower');
  return pixels;
}
const grid=drawVillage();
const runs:{x:number;y:number;w:number;fill:string}[]=[];
for(let y=0;y<H;y++){let x=0;while(x<W){const color=grid[y][x];let w=1;while(x+w<W&&grid[y][x+w]===color)w++;runs.push({x,y,w,fill:palette[color]});x+=w}}

export const PixelVillage=memo(function PixelVillage(){
  return <svg className="pixel-village" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="산과 논 사이 초가집, 감나무와 장독대 곁에 모인 가족의 도트 풍경" shapeRendering="crispEdges">
    {runs.map((r,i)=><rect key={i} x={r.x} y={r.y} width={r.w} height={1.01} fill={r.fill}/>)}
    <g className="village-cloud" fill={palette.cloud}><path d="M18 17h24v3H18zM23 14h13v3H23zM119 12h16v2h-16zM122 10h8v2h-8z"/></g>
    <g className="village-birds" fill={palette.pine}><path d="M76 18h2v1h2v1h2v-1h2v-1h2v1h-2v1h-2v1h-2v-1h-2v-1h-2zM90 14h2v1h2v-1h2v1h-2v1h-2v-1h-2z"/></g>
  </svg>;
});
