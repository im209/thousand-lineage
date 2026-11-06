// Original, local 48px sprites for Thousand Lineage. No external art or game RNG.
const palettes=[
 {coat:'#8bbdb2',shade:'#659d94',ribbon:'#e6a179',back:'#edf5e9'},
 {coat:'#efb6a2',shade:'#d99585',ribbon:'#7ba9a0',back:'#fcf0df'},
 {coat:'#a6bedb',shade:'#7e9fbf',ribbon:'#e7b77b',back:'#edf2fa'},
 {coat:'#c1b0d5',shade:'#a08db7',ribbon:'#e1ad79',back:'#f5edf7'},
 {coat:'#e2c37f',shade:'#c4a25f',ribbon:'#83b3a2',back:'#f8f3e3'},
 {coat:'#aec398',shade:'#8da574',ribbon:'#d7a0a2',back:'#eef4e8'},
];
const skins=[['#f8d5b7','#eab695'],['#f1c7a4','#dba787'],['#fbe0c5','#edc5a5']];
const hairs=[['#51413b','#6c5548'],['#674d3e','#87634c'],['#413b39','#60514a']];
function hash(text){let value=2166136261;for(let i=0;i<text.length;i++)value=Math.imul(value^text.charCodeAt(i),16777619);return value>>>0;}
const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const path=(d,color)=>`<path d="${d}" fill="${color}"/>`;

export function portraitSvg(seed,sex){
 const h=hash(seed),p=palettes[h%palettes.length],[skin,skinShade]=skins[(h>>>5)%skins.length],
  [hair,hairLight]=hairs[(h>>>9)%hairs.length],variant=(h>>>13)%3,female=sex==='여';
 let art='';
 // A light tile, a tiny spring petal, and a floor shadow keep small icons calm.
 art+=`<rect width="48" height="48" rx="10" fill="${p.back}"/>`;
 art+=rect(7,10,2,2,'#fffdf7')+rect(6,11,4,2,'#fffdf7')+rect(7,13,2,1,'#fffdf7');
 art+=rect(16,43,16,1,'#d7dfce')+rect(13,42,22,1,'#d7dfce');
 // Hair behind the round head. Long hair is tied low rather than left ragged.
 if(female){
  art+=path('M16 10h16v3h2v17h-4v2H18v-2h-4V13h2z',hair);
  if(variant===1)art+=rect(12,22,4,7,hair)+rect(32,22,4,7,hair)+rect(12,24,4,2,p.ribbon)+rect(32,24,4,2,p.ribbon);
  else art+=rect(19,5,10,5,hair)+rect(20,4,8,2,hair)+rect(21,5,3,1,hairLight)+rect(18,8,12,2,p.ribbon);
 }else{
  art+=rect(21,4,6,5,hair)+rect(22,3,4,2,hair)+rect(22,4,2,1,hairLight)+rect(20,8,8,2,p.ribbon);
 }
 // Little slippers, roomy hanbok sleeves, and a folded white collar.
 art+=rect(18,39,5,3,'#65534a')+rect(25,39,5,3,'#65534a')+rect(18,39,5,1,'#faf2df')+rect(25,39,5,1,'#faf2df');
 art+=path(female?'M18 29h12v3h2v4h2v4H14v-4h2v-4h2z':'M17 28h14v2h2v8h-3v2H18v-2h-3v-8h2z',p.shade);
 art+=path(female?'M19 29h10v3h2v4h1v3H16v-3h1v-4h2z':'M18 28h12v3h2v6H16v-6h2z',p.coat);
 art+=rect(12,30,5,6,p.coat)+rect(31,30,5,6,p.coat)+rect(12,35,5,2,'#fff6df')+rect(31,35,5,2,'#fff6df');
 art+=rect(12,37,4,2,skin)+rect(32,37,4,2,skin);
 art+=path('M20 27h8v2h-2v2h-2v-1h-2v-1h-2z','#fffaf0');
 art+=rect(25,30,2,6,p.ribbon)+rect(27,31,3,2,p.ribbon)+rect(25,30,1,1,'#fff0ca');
 // Ears and a soft, stepped face; no large whites of eyes, teeth or heavy brows.
 art+=rect(13,17,3,5,skinShade)+rect(32,17,3,5,skinShade);
 art+=path('M18 10h12v2h3v11h-2v3h-3v2h-8v-2h-3v-3h-2V12h3z',skinShade);
 art+=path('M18 11h12v2h2v10h-2v2h-3v1h-7v-2h-3V14h1z',skin);
 // Soft brown hair with tidy fringe and one highlight, kept above the eyes.
 art+=path('M18 8h12v2h3v3h1v5h-3v-5h-4v-1h-7v2h-3v4h-3v-5h1v-3h3z',hair);
 art+=rect(18,9,9,1,hairLight)+rect(16,11,3,1,hairLight);
 if(variant===0)art+=rect(20,12,3,2,hair)+rect(27,12,3,2,hair);
 if(variant===1)art+=rect(18,12,5,2,hair)+rect(23,12,3,1,hair);
 if(variant===2)art+=rect(27,12,4,2,hair)+rect(25,12,3,1,hair);
 art+=rect(19,18,2,2,'#51433d')+rect(27,18,2,2,'#51433d');
 art+=rect(17,21,3,1,'#eca7a0')+rect(28,21,3,1,'#eca7a0');
 art+=rect(23,22,2,1,'#b77c68');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48" shape-rendering="crispEdges">${art}</svg>`;
}
export function portraitDataUrl(seed,sex){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(portraitSvg(seed,sex));}
