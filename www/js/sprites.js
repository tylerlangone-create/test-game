/* DEADLINK — pixel-art sprite generator.
   Every creature is painted into a symmetric material grid by an archetype
   painter, then lit, outlined and dithered into a small canvas. */
"use strict";
const PX=(function(){
const BAY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const bayer=(x,y)=>BAY[y&3][x&3]/16;
function hex(c){c=c.replace("#","");if(c.length===3)c=c.split("").map(x=>x+x).join("");const n=parseInt(c,16);return [n>>16&255,n>>8&255,n&255]}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function light(c,t){return t>=0?mix(c,[255,248,230],Math.min(1,t)):mix(c,[8,5,14],Math.min(1,-t))}
function css(c){return "rgb("+(c[0]|0)+","+(c[1]|0)+","+(c[2]|0)+")"}

/* ---------- material grid + mirrored painting helpers ---------- */
function Painter(w,h,s,oy){
 oy=oy||0;const d=new Uint8Array(w*h);
 const put=(x,y,v,mir)=>{if(x<0||y<0||x>=w||y>=h)return;d[y*w+x]=v;if(mir){const m=w-1-x;d[y*w+m]=v}};
 const Y=y=>(y+oy)*s;
 const o={w,h,s,d,
  get(x,y){return x<0||y<0||x>=w||y>=h?0:d[y*w+x]},
  /* grid lookup in design space */
  at(x,y){return o.get(Math.floor(x*s),Math.floor(Y(y)))},
  /* mirrored pixel / rect / ellipse / line in 32-unit design space */
  p(x,y,v){put(Math.floor(x*s),Math.floor(Y(y)),v,1)},
  q(x,y,v){put(Math.floor(x*s),Math.floor(Y(y)),v,0)},
  r(x,y,ww,hh,v){const x0=Math.floor(x*s),y0=Math.floor(Y(y)),x1=Math.max(x0+1,Math.ceil((x+ww)*s)),y1=Math.max(y0+1,Math.ceil(Y(y+hh)));for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++)put(xx,yy,v,1)},
  e(cx,cy,rx,ry,v,only){cx*=s;cy=Y(cy);rx*=s;ry*=s;for(let yy=Math.floor(cy-ry);yy<=Math.ceil(cy+ry);yy++)for(let xx=Math.floor(cx-rx);xx<=Math.ceil(cx+rx);xx++){const dx=(xx+.5-cx)/rx,dy=(yy+.5-cy)/ry;if(dx*dx+dy*dy<=1&&(!only||o.get(xx,yy)===only))put(xx,yy,v,1)}},
  l(x0,y0,x1,y1,v,th){const tp=Math.max(1,Math.round((th||1)*s)),n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*s)+1;for(let i=0;i<=n;i++){const t=i/n,px=Math.floor((x0+(x1-x0)*t)*s)-(tp>>1),py=Math.floor(Y(y0+(y1-y0)*t))-(tp>>1);for(let a=0;a<tp;a++)for(let b=0;b<tp;b++)put(px+a,py+b,v,1)}},
  /* repaint cells of material a with b inside a rect */
  sw(x,y,ww,hh,a,b){const x0=Math.floor(x*s),y0=Math.floor(Y(y)),x1=Math.ceil((x+ww)*s),y1=Math.ceil(Y(y+hh));for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++)if(o.get(xx,yy)===a)put(xx,yy,b,1)},
 };
 return o;
}

/* ---------- archetype painters (design space 32x32, centre x=16) ---------- */
const ARCH={
 human(o,f,rng){
  const fat=f.fat,rb=f.robe;
  if(!rb){o.r(11,22,4,8,2);o.r(10,29,5,3,5);o.r(15,22,1,8,0)}
  if(fat)o.e(16,19,10,7.5,2);
  o.r(9,11,7,13,2);o.e(16,12.5,7.5,3,2);
  if(rb){o.r(8,11,8,18,2);o.e(16,29,9.5,3,2);for(let i=0;i<5;i++)o.p(8+i*2,31,0)}
  o.r(14,11,2,5,7);o.p(14,11,6);if(f.tie)o.r(15,12,1,9,3);
  if(f.badge)o.r(11,15,2,2,7);
  o.r(6,12,3,11,2);o.r(6,23,3,2,6);
  if(f.claws){o.r(5,25,1,3,7);o.r(7,25,1,3,7);o.p(6,26,7)}
  if(f.clip){o.q(3,17,7);o.q(4,17,7);o.q(3,18,7);o.q(4,18,7);o.q(3,19,7);o.q(4,19,7);o.q(3,20,7);o.q(4,20,7);o.q(3,16,5);o.q(4,16,5)}
  o.r(14,9,2,2,6);o.r(13,10,3,1,5);
  o.e(16,5.5,f.bigHead?5.5:4.6,5,f.faceless?5:6);
  if(f.hair){o.e(16,2.2,4.8,2.4,5);o.r(11,2,2,4,5)}
  if(f.hood){o.e(16,5,6.5,6.2,2);o.e(16,6.5,4,4.2,5)}
  if(f.hat){o.r(9,1,14,1,5);o.r(12,-2,8,3,5);o.r(12,0,8,1,3)}
  if(f.tophat){o.r(12,-5,8,6,5);o.r(10,0,12,1,5);o.r(12,-1,8,1,3)}
  if(f.faceless||f.hood){o.p(14,6,4)}else{o.r(13,5,2,2,5);o.p(14,6,4);o.r(14,8,2,1,5);o.p(15,8,7)}
  if(f.glasses){o.r(12,5,3,3,7);o.p(13,6,4);o.p(14,6,5);o.r(15,6,1,1,7)}
  if(f.eyes3){o.p(15,3,4);o.p(12,8,4)}
  if(f.fat)o.e(16,19,5,4,7,2);
 },
 bot(o,f){
  const wide=f.wide?3:0,slim=f.slim;
  if(!f.hover&&!f.robe){o.r(10-wide/2,21,4+wide/2,9,2);o.r(9-wide,28,6+wide,4,5);o.r(12,24,1,2,7)}
  if(f.hover){o.e(16,27,5,3,2);o.r(14,29,2,2,3)}
  if(f.robe){o.r(8,17,8,15,2);o.e(16,31,9,2,2);o.r(15,17,1,15,3)}
  o.r(slim?11:8-wide,11,slim?5:8+wide,11,1);
  o.r(slim?12:10-wide,13,slim?2:4+wide,6,7);
  o.e(16,16,2.2,2.2,3);o.e(16,16,1,1,4);
  o.e(slim?10:7-wide,12,3.2+wide/2,3,1);o.r(slim?9:6-wide,11,3,1,7);
  if(f.blades){o.l(6,14,2,28,7,2);o.l(7,14,4,26,5,1)}
  else if(f.saws){o.r(4-wide,14,3,8,2);o.e(4,25,4,4,7);o.e(4,25,1.5,1.5,5);for(let a=0;a<8;a++)o.p(4+Math.cos(a*.8)*4.5,25+Math.sin(a*.8)*4.5,5)}
  else{o.r(3-wide,14,4,9,2);o.r(2-wide,22,5+(wide?1:0),4,1);o.r(3-wide,25,1,1,5)}
  if(f.hardhat){o.r(11,4,10,6,1);o.e(16,4,6,3,3);o.r(9,5,14,1,3)}
  else o.r(12,4,8,7,1);
  o.r(12,7,8,1,4);o.r(13,7,1,1,5);
  if(f.visorWide)o.r(11,6,10,3,4);
  if(f.siren){o.r(14,1,4,3,3);o.q(14,1,4);o.q(15,1,4)}
  else if(!f.hardhat){o.p(13,1,7);o.p(13,2,7);o.p(13,0,3)}
  if(f.halo){for(let a=0;a<24;a++)o.p(16+Math.cos(a/24*6.283)*8,1+Math.sin(a/24*6.283)*2.2,3)}
 },
 worm(o,f){
  const fw=f.fat?1.5:1;
  o.e(16,29,12*fw,3,1);o.e(16,27,9*fw,3,2);
  for(let i=0;i<6;i++){const y=25-i*3.2,rx=(6.5-i*.4)*fw;o.e(16,y,rx,2.4,i%2?2:1)}
  if(f.spots)for(let i=0;i<5;i++)o.p(12+i%2*2,22-i*3,3);
  o.e(16,7,7.5*fw,6.5,1);o.e(16,8,5,4.5,5);
  for(let a=0;a<12;a++)o.p(16+Math.cos(a/12*6.283)*4.2,8+Math.sin(a/12*6.283)*3.7,7);
  o.e(16,8.5,2,2,3);
  o.p(9,4,4);o.p(10,3,4);o.p(9,7,4);
  o.r(10,1,1,2,7);o.p(10,0,3);
 },
 beast(o,f){
  o.e(16,20,10,6,1);o.r(7,22,3,8,2);o.r(11,23,2,7,2);o.r(6,29,4,2,5);o.r(10,29,3,2,5);
  o.r(9,17,2,3,7);o.r(12,16,2,3,7);
  o.e(16,13,6.5,5,1);o.e(16,15,4,2.5,6);
  o.l(10,9,8,3,1,2);o.p(8,2,3);
  o.p(13,12,4);o.p(12,12,4);o.r(13,16,1,1,7);o.r(15,16,1,1,7);o.r(14,17,2,1,5);
  o.l(5,20,1,15,5,1);o.p(1,14,3);
 },
 eye(o,f){
  for(let i=0;i<3;i++)o.l(11+i*2,18,8+i*3+Math.sin(i)*2,30-i,2,1);
  o.e(16,12,10,10,1);o.e(16,12,7.5,7.5,5);o.e(16,12,5,5,7);o.e(16,12,3.4,3.4,4);o.e(16,12,1.4,1.4,5);
  o.q(14,10,7);o.q(13,10,7);o.q(14,9,7);
  o.r(9,1,1,3,7);o.r(4,1,5,1,2);o.r(6,4,4,1,2);
  o.p(6,12,3);o.p(6,13,3);
 },
 turret(o,f){
  o.r(8,26,8,6,2);o.r(6,30,10,2,5);o.r(11,22,5,5,1);
  o.r(6,10,10,12,1);o.r(7,11,8,2,7);o.r(6,19,10,1,5);
  o.e(10.5,15.5,3,3,5);o.e(10.5,15.5,1.6,1.6,2);o.r(9,12,3,1,7);
  o.r(14,4,2,6,2);o.e(16,4,2.5,2,4);
  o.r(6,22,1,1,3);o.r(8,22,1,1,3);
 },
 bug(o,f){
  for(let i=0;i<3;i++)o.l(8,18+i*3,1,20+i*4,5,1);
  o.e(16,19,13,9,1);o.r(15,11,1,17,5);
  for(let i=0;i<3;i++)o.sw(3,13+i*4,13,1,1,2);
  o.e(16,26,6,4,2);o.p(13,26,4);o.p(14,25,4);
  o.l(12,29,10,31,7,1);o.l(14,29,13,31,7,1);
  o.p(9,15,3);o.p(10,15,3);
 },
 ghost(o,f){
  o.e(16,11,10,10,1);o.r(6,11,10,15,1);
  for(let i=0;i<5;i++){o.e(7.5+i*2,26,1.2,2+((i%2)*1.5),1)}
  o.e(12.5,11,2.4,3,5);o.p(12,11,4);o.p(13,11,4);
  o.e(16,18,3,2,5);
  o.r(15,0,1,2,7);o.r(14,-1,2,1,3);
  if(f.nozzles){o.r(4,6,2,2,7);o.p(4,5,3);o.r(26,6,2,2,7)}
  o.sw(6,14,2,6,1,2);
 },
 blob(o,f){
  o.e(16,24,13,8,1);o.e(10,17,6,6,1);o.e(20,13,6.5,7,1);o.e(16,19,9,8,2);
  for(let i=0;i<6;i++)o.l(6+i*2,24,9+i*1.5,16+i%3*2,3,1);
  if(f.racks){o.r(12,17,8,9,7);for(let i=0;i<4;i++){o.r(12,18+i*2,8,1,5);o.p(13,18+i*2,4)}}
  const n=f.eyes||2;for(let i=0;i<n;i++){const x=9+((i*7)%9),y=10+((i*5)%9);o.e(x,y,1.6,1.6,6);o.p(x,y,4)}
 },
 node(o,f){
  for(let y=0;y<24;y++){const hw=y<12?y*.75:(24-y)*.75;o.r(16-hw,2+y,hw,1,1)}
  for(let y=4;y<22;y++){const hw=(y<12?(y-2)*.55:(24-y-2)*.55);if(hw>0)o.r(16-hw,2+y,hw,1,2)}
  o.e(16,13,3,3,6);o.e(16,13,1.8,1.8,4);
  o.r(15,0,1,4,3);
  for(let i=0;i<4;i++){o.p(4+i,10+i*2,7);o.p(3,11+i*3,3)}
  if(f.speakers)for(let i=0;i<3;i++)for(let j=0;j<3;j++)o.p(9+j*2,18+i*2,5);
  if(f.crown)for(let i=0;i<4;i++){o.r(9+i*2,-1+Math.abs(1.5-i),1,3,3)}
  if(f.wings)for(let i=0;i<5;i++)o.l(8,12,0,4+i*4,3,1);
  if(f.halo)for(let a=0;a<28;a++)o.p(16+Math.cos(a/28*6.283)*13,13+Math.sin(a/28*6.283)*13,3);
  o.e(16,30,6,1.5,2);
 },
 /* class portraits: 24x24 busts */
 bust(o,f){
  o.e(16,31,14,7,2);o.r(4,26,24,6,2);
  o.r(14,19,4,4,6);
  o.e(16,13,6.5,7.5,6);
  o.p(13,13,4);o.p(12,13,4);o.r(15,18,2,1,5);
 },
};

/* ---------- lighting / outline pass ---------- */
function shade(o,pal,opt){
 opt=opt||{};
 const W=o.w,H=o.h,cv=document.createElement("canvas");cv.width=W;cv.height=H;
 const ctx=cv.getContext("2d"),img=ctx.createImageData(W,H),D=img.data;
 const C={};for(const k in pal)if(/^\d$/.test(k))C[k]=hex(pal[k]);
 const out=hex(pal.o||"#07050c");
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const v=o.get(x,y),i=(y*W+x)*4;
  if(!v){if(o.get(x-1,y)||o.get(x+1,y)||o.get(x,y-1)||o.get(x,y+1)){D[i]=out[0];D[i+1]=out[1];D[i+2]=out[2];D[i+3]=255}continue}
  let c=C[v]||C[1];
  if(v===3||v===4){c=v===4&&(o.get(x-1,y)===4&&o.get(x+1,y)===4)?light(c,.35):c}
  else{
   let t=.1-(y/H)*.32;
   if(!o.get(x,y-1))t+=.24;else if(!o.get(x-1,y))t+=.12;
   if(!o.get(x,y+1))t-=.22;else if(!o.get(x+1,y))t-=.1;
   const up=o.get(x,y-1);if(up&&up!==v&&up!==3&&up!==4)t-=.16;
   if(v===1&&bayer(x,y)>.82)t-=.07;
   if(v===7)t+=.08;
   t=Math.round(t*8)/8;c=light(c,t);
  }
  let a=255;
  if(opt.ghost){const fy=(y/H-.55)/.45;if(fy>0&&bayer(x,y)<fy)continue;a=v===4?255:215}
  D[i]=c[0];D[i+1]=c[1];D[i+2]=c[2];D[i+3]=a;
 }
 ctx.putImageData(img,0,0);
 return cv;
}
function silhouette(cv,col){
 const c=document.createElement("canvas");c.width=cv.width;c.height=cv.height;
 const x=c.getContext("2d");x.drawImage(cv,0,0);x.globalCompositeOperation="source-in";x.fillStyle=col||"#fff";x.fillRect(0,0,c.width,c.height);return c;
}

/* ---------- enemy specs ---------- */
const PAL={
 rust:{1:"#8a5a3c",2:"#b8683a",3:"#ffd84d",4:"#ff4d3d",5:"#2a1414",6:"#d9a066",7:"#e8dcc0"},
 scrap:{1:"#6d6a5f",2:"#8f7e5a",3:"#ffd84d",4:"#ff4d3d",5:"#1e1a16",6:"#b8ad90",7:"#dcd6c6"},
 office:{1:"#3b3f58",2:"#40455f",3:"#4de8e0",4:"#fffbe0",5:"#16131f",6:"#c7c3b0",7:"#e0e0e0"},
 cop:{1:"#3a4a6b",2:"#2a3550",3:"#ff4040",4:"#9ff3ff",5:"#11141f",6:"#8a96b0",7:"#c6d4ea"},
 roach:{1:"#5b3a26",2:"#7a4a2c",3:"#ff9a3d",4:"#ffe14d",5:"#1c100a",6:"#a0764e",7:"#d8c09a"},
 copper:{1:"#9a5a2a",2:"#6b3c1d",3:"#ffcf4d",4:"#7fffd4",5:"#1f110a",6:"#c98a4a",7:"#f0c890"},
 choir:{1:"#4a3a6a",2:"#6a4a9a",3:"#c98df5",4:"#fff4c0",5:"#150f24",6:"#d8c8f0",7:"#b8a8e0"},
 black:{1:"#2a2a33",2:"#1e1e26",3:"#ffd84d",4:"#ff3030",5:"#0a0a0e",6:"#6a6a78",7:"#9a9aa8"},
 halon:{1:"#9fd8e8",2:"#6fb0c8",3:"#ff7a3d",4:"#10203a",5:"#12203a",6:"#e0f8ff",7:"#ffffff"},
 debt:{1:"#2c2a24",2:"#3a3428",3:"#b6ff2e",4:"#ffe14d",5:"#0e0c08",6:"#b0a890",7:"#d0c8b0"},
 meat:{1:"#a8485a",2:"#7a2c3e",3:"#ff9ab0",4:"#ffe14d",5:"#2a0a12",6:"#f0c0c8",7:"#8a90a0"},
 mall:{1:"#5a6070",2:"#454a58",3:"#ffd84d",4:"#ff4040",5:"#15171c",6:"#9aa0b0",7:"#c8ccd8"},
 audit:{1:"#3a3040",2:"#4a3a50",3:"#ffd700",4:"#9fe8ff",5:"#120e16",6:"#c8b8b0",7:"#e8e0d8"},
 null:{1:"#3a1a4a",2:"#5a2a6a",3:"#e04dff",4:"#b6ff2e",5:"#10061a",6:"#c890e0",7:"#a070c0"},
 exec:{1:"#1e1e28",2:"#262634",3:"#ff4040",4:"#ff4040",5:"#08080c",6:"#d8d0c8",7:"#f0f0f0"},
 eclipse:{1:"#18181f",2:"#101016",3:"#c98df5",4:"#ffffff",5:"#050508",6:"#44445a",7:"#b0b0d0"},
 hr:{1:"#8a8a90",2:"#5a5a64",3:"#ff4040",4:"#ff4040",5:"#1a1a1e",6:"#c8c8d0",7:"#f0f0f0"},
 tenant:{1:"#2a2430",2:"#3a3040",3:"#c98df5",4:"#ffffff",5:"#050308",6:"#5a5060",7:"#8a8090"},
 larva:{1:"#c8b8a0",2:"#a89880",3:"#b6ff2e",4:"#ff4040",5:"#2a2018",6:"#e8dcc8",7:"#f8f0e0"},
 land:{1:"#3a2a1a",2:"#4a2a2a",3:"#ffd700",4:"#ff6a4d",5:"#120a06",6:"#d8b890",7:"#e8d0a0"},
 believer:{1:"#5a1a1a",2:"#7a1e2a",3:"#ffd84d",4:"#ffffff",5:"#140406",6:"#d8c0b0",7:"#e8d0a0"},
 prime:{1:"#101018",2:"#1a1a2a",3:"#4de8e0",4:"#ffffff",5:"#040408",6:"#8af0ff",7:"#4a4a6a"},
 vasska:{1:"#4a2a3a",2:"#5a2a40",3:"#ff4d9d",4:"#ffe14d",5:"#14080e",6:"#e0c8b8",7:"#f0e8e0"},
 abbot:{1:"#a8a8b8",2:"#3a3048",3:"#ffd700",4:"#ff4040",5:"#10101a",6:"#d8d8e8",7:"#ffffff"},
 foreman:{1:"#c86a1e",2:"#5a4030",3:"#ffd84d",4:"#ff4020",5:"#1a0c04",6:"#e8a060",7:"#f0d0a0"},
 admin:{1:"#e8e8f0",2:"#b8b8d0",3:"#ff2a6a",4:"#000000",5:"#1a0a20",6:"#ffffff",7:"#ffd0e0"},
};
const ESPR={
 wireworm:["worm","rust"],scrapjack:["beast","scrap"],intern:["human","office",{tie:1,hair:1,badge:1}],
 lamprey:["eye","black"],rentasec:["bot","cop",{siren:1}],roachrig:["bug","roach"],copperhead:["turret","copper"],
 choir:["node","choir",{speakers:1}],enforcer:["bot","black",{visorWide:1}],halon:["ghost","halon",{},{ghost:1}],
 debtcol:["human","debt",{hat:1,tie:1}],meatserver:["blob","meat",{racks:1}],mallgolem:["bot","mall",{wide:1}],
 auditor:["human","audit",{glasses:1,tie:1,hair:1}],nullbirth:["blob","null",{eyes:5}],exec:["human","exec",{tie:1,claws:1,hair:1}],
 eclipse:["bot","eclipse",{slim:1,blades:1,hover:1}],hr7:["bot","hr",{saws:1}],tenant:["human","tenant",{faceless:1,robe:1}],
 larva:["worm","larva",{fat:1,spots:1}],landlord:["human","land",{fat:1,tophat:1}],believer:["human","believer",{robe:1,hood:1}],
 dlprime:["node","prime",{crown:1}],
 vasska:["human","vasska",{tie:1,hair:1,clip:1,bigHead:1}],abbot:["bot","abbot",{halo:1,robe:1}],mhalon:["ghost","halon",{nozzles:1},{ghost:1}],
 auditp:["human","audit",{eyes3:1,glasses:1,tie:1,claws:1}],foreman:["bot","foreman",{hardhat:1,wide:1}],admin:["node","admin",{wings:1,halo:1,crown:1}],
};
const cache={};
function enemySprite(id,boss,elite){
 const key=id+(boss?"B":"")+(elite?"E":"");if(cache[key])return cache[key];
 const sp=ESPR[id]||["blob","null",{}];
 const pal=Object.assign({},PAL[sp[1]]);
 if(elite){pal[3]="#ff3a3a";pal[4]="#ffe14d"}
 const s=boss?1.5:1,pad=6,N=Math.round(32*s)+2;
 const top=Painter(N,Math.round((32+pad)*s),s,pad);
 ARCH[sp[0]](top,sp[2]||{});
 const cv=shade(top,pal,sp[3]);
 const res={cv,flash:silhouette(cv,"#ffffff"),red:silhouette(cv,"#ff3030"),w:cv.width,h:cv.height,accent:pal[3]};
 cache[key]=res;return res;
}

/* ---------- class portraits ---------- */
const PORT={
 cutter:{pal:{1:"#2a2a38",2:"#262434",3:"#ffb347",4:"#ffb347",5:"#0c0a12",6:"#c8a888",7:"#e0e0f0"},f(o){o.e(16,12,8,9,2);o.e(16,14,6,6.5,6);o.r(10,12,12,3,5);o.r(11,13,10,1,4);o.l(24,2,28,26,7,1);o.r(26,24,3,1,3);o.q(24,2,7);o.q(25,4,7);o.q(26,8,7);o.q(27,14,7);o.q(28,20,7)}},
 bulwark:{pal:{1:"#5a6478",2:"#3a4254",3:"#4de8e0",4:"#4de8e0",5:"#0c0e14",6:"#8a94a8",7:"#c8d0e0"},f(o){o.e(16,30,16,8,1);o.e(4,24,5,5,1);o.e(16,12,8,9,1);o.r(9,12,14,2,5);o.r(10,12,12,1,4);o.r(15,3,2,6,7);o.r(10,17,12,5,2)}},
 hexcode:{pal:{1:"#2a2040",2:"#1f3040",3:"#4de8e0",4:"#b6ff2e",5:"#0a0a12",6:"#d0b8a0",7:"#80ffe0"},f(o){o.e(16,5,9,5,5);o.r(7,5,3,9,5);o.r(10,11,5,4,3);o.r(11,12,3,2,4);o.r(15,12,2,1,3);o.l(6,20,2,30,3,1);o.q(20,4,5);o.q(22,3,5);o.q(12,2,5)}},
 glitcher:{pal:{1:"#3a2a50",2:"#502a60",3:"#ffd84d",4:"#ff4d9d",5:"#0e0816",6:"#f0e8f0",7:"#4de8e0"},f(o){o.e(16,5,8,4,2);o.r(8,4,2,6,2);for(let y=6;y<21;y++)for(let x=16;x<23;x++)if(o.at(x,y)===6)o.q(x,y,5);o.q(19,13,7);o.q(20,13,7);o.q(12,13,4);o.q(13,13,4);o.r(8,1,2,3,3);o.p(9,0,3)}},
 paleware:{pal:{1:"#1a1020",2:"#2a1830",3:"#c98df5",4:"#c98df5",5:"#08040c",6:"#e8e0f0",7:"#ffffff"},f(o){o.e(16,8,9,7,5);o.r(7,8,3,20,5);o.r(8,20,3,8,5);o.p(13,13,4);o.p(12,13,4);o.p(13,14,3);o.r(15,18,2,1,5);o.r(12,1,1,3,3);o.r(15,0,2,3,7);o.p(15,-1,3)}},
};
function portrait(cls){
 const k="P_"+cls;if(cache[k])return cache[k];
 const P=PORT[cls],o=Painter(32,32,1);
 ARCH.bust(o,{});P.f(o);
 const cv=shade(o,P.pal);cache[k]=cv;return cv;
}

/* ---------- 10x10 UI icons ---------- */
const ICONS={
 sword:["........##",".......###","......###.",".#...###..","..#.###...","...###....","...##.....","..#..#....",".#........","#........."],
 star:["....##....","....##....","...####...","##########",".########.","..######..","..######..",".###..###.",".##....##.","#........#"],
 chest:["..........",".########.","#########G","#GGGGGGGG#","##########","#####YY###","####Y..Y##","#####YY###","##########",".########."],
 cart:["##........","#.........",".#########",".#.#.#.#.#",".#########",".#.#.#.#.#",".#########","..#....#..",".###..###.","..#....#.."],
 chip:[".#.#..#.#.","##########",".#......#.","##.####.##",".#.#YY#.#.","##.#YY#.##",".#.####.#.","##......##","##########",".#.#..#.#."],
 wrench:[".....###..","....#...#.","....#..##.","...###..#.","..###.##..",".###......","###.......","##........","#.........",".........."],
 quest:["..######..",".##....##.","##......##","......###.",".....##...","....##....","....##....","..........","....##....","....##...."],
 dice:["##########","#........#","#.##..##.#","#.##..##.#","#........#","#........#","#.##..##.#","#.##..##.#","#........#","##########"],
 skull:["..######..",".########.","##########","##..##..##","##..##..##","##########",".####.###.","..######..","..#.##.#..","..#.##.#.."],
 flame:["....#.....","....##....","...###.#..","..#####...","..######..",".###YY###.",".##YYYY##.",".##YYYY##.","..##YY##..","...####..."],
 bolt:["......###.",".....###..","....###...","...###....","..#######.",".......##.","......##..",".....##...","....##....","...#......"],
 snow:["....##....",".#..##..#.","..#.##.#..","...####...","##########","##########","...####...","..#.##.#..",".#..##..#.","....##...."],
 void:["...####...","..#....#..",".#..##..#.","#..#..#..#","#.#.##.#.#","#.#.##.#.#","#..#..#..#",".#..##..#.","..#....#..","...####..."],
 kin:["........##",".......###","......###.",".#...###..","..#.###...","...###....","...##.....","..#..#....",".#........","#........."],
 eye:["..........","...####...",".##....##.","#...##...#","#..####..#","#..####..#","#...##...#",".##....##.","...####...",".........."],
 heart:[".##...##..","####.####.","#########.","#########.",".#######..","..#####...","...###....","....#.....","..........",".........."],
 shield:["##########","#........#","#.######.#","#.######.#","#.######.#",".#.####.#.",".#.####.#.","..#.##.#..","...#..#...","....##...."],
 up:["....##....","...####...","..######..",".###..###.","###....###","....##....","....##....","....##....","....##....","....##...."],
 snd:["....#.....","...##..#..","..###...#.","####..#.#.","####..#.#.","####..#.#.","..###...#.","...##..#..","....#.....",".........."],
 mute:["....#.....","...##.....","..###.#..#","####...##.","####...##.","####..#..#","..###.....","...##.....","....#.....",".........."],
};
const icache={};
function icon(name,col,col2){
 const k=name+col+(col2||"");if(icache[k])return icache[k];
 const g=ICONS[name]||ICONS.quest,c=document.createElement("canvas");c.width=10;c.height=10;const x=c.getContext("2d");
 for(let y=0;y<10;y++)for(let i=0;i<10;i++){const ch=g[y][i];if(ch==="#"){x.fillStyle=col;x.fillRect(i,y,1,1)}else if(ch==="Y"||ch==="G"){x.fillStyle=col2||"#ffe14d";x.fillRect(i,y,1,1)}}
 const url=c.toDataURL();icache[k]=url;return url;
}
function iconHTML(name,col,cls,col2){return '<img class="pxi '+(cls||"")+'" src="'+icon(name,col||"#ffb347",col2)+'" alt="">'}

return {hex,mix,light,css,bayer,enemySprite,portrait,icon,iconHTML,silhouette,ESPR};
})();
