/* DEADLINK — pixel scene renderer.
   A low-res one-point-perspective corridor is ray-cast per pixel (so the
   camera can walk forward), then enemies, particles and hit effects are
   composited on top and the whole frame is upscaled with hard pixels. */
"use strict";
const Scene=(function(){
const {hex,mix,bayer}=PX;
function ramp(a,b,n){a=hex(a);b=hex(b);const r=[];for(let i=0;i<n;i++)r.push(mix(a,b,i/(n-1)));return r}
const BIOMES=[
 {n:"MAINTENANCE SHAFT",wall:ramp("#170f0c","#a06a40",9),floor:ramp("#0f0b0a","#7a6450",9),ceil:ramp("#0c0808","#5a4436",6),acc:"#ffb347",lamp:"#ffd28a",feat:"pipes",pt:"dust",sky:"#0d0908"},
 {n:"SERVER CATACOMBS",wall:ramp("#070d12","#3a7080",9),floor:ramp("#05080b","#3a5a66",9),ceil:ramp("#040608","#26404c",6),acc:"#4de8e0",lamp:"#a8f6ff",feat:"servers",pt:"dust",sky:"#05080b"},
 {n:"COOLANT FLOOD",wall:ramp("#06101c","#4a86a8",9),floor:ramp("#040c16","#4aa0c8",9),ceil:ramp("#040a12","#2a5068",6),acc:"#7fd8e8",lamp:"#d8f8ff",feat:"water",pt:"drip",sky:"#040a12"},
 {n:"AUDIT VAULTS",wall:ramp("#100a16","#7a6890",9),floor:ramp("#0c0810","#6a5878",9),ceil:ramp("#08060c","#3a2e48",6),acc:"#ffd700",lamp:"#ff7070",feat:"vault",pt:"dust",sky:"#08060c"},
 {n:"THE FOUNDRY",wall:ramp("#120604","#8a3c1a",9),floor:ramp("#0c0403","#6a2c16",9),ceil:ramp("#080302","#40180c",6),acc:"#ff6a2a",lamp:"#ffb060",feat:"lava",pt:"ember",sky:"#0c0403"},
 {n:"THE ROOT",wall:ramp("#07040c","#46205a",9),floor:ramp("#050308","#34184a",9),ceil:ramp("#030206","#22103a",6),acc:"#ff4d9d",lamp:"#c98df5",feat:"servers",pt:"data",sky:"#030206"},
];
function biomeFor(f){return BIOMES[Math.min(BIOMES.length-1,Math.floor((Math.max(1,f)-1)/5))]}

let cv,out,lo,lx,W=128,H=110,P=3,img=null,biome=BIOMES[0],running=false,last=0,T=0;
let camZ=0,walkV=0,walkLeft=0,bob=0,fade=0,fadeTo=0,shake=0,redF=0,whiteF=0,idleWalk=0;
let enemy=null;const parts=[],fxs=[];
const accC=()=>hex(biome.acc),lampC=()=>hex(biome.lamp);

function init(canvas){cv=canvas;out=cv.getContext("2d");lo=document.createElement("canvas");lx=lo.getContext("2d");resize();window.addEventListener("resize",resize)}
function resize(){
 if(!cv)return;const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;
 const dpr=Math.min(3,window.devicePixelRatio||1),cw=Math.round(r.width*dpr),ch=Math.round(r.height*dpr);
 P=Math.max(2,Math.round(cw/132));W=Math.ceil(cw/P);H=Math.ceil(ch/P);
 cv.width=cw;cv.height=ch;lo.width=W;lo.height=H;img=lx.createImageData(W,H);
}
function mount(canvas){if(!lo){init(canvas)}else if(cv!==canvas){cv=canvas;out=cv.getContext("2d")}resize();start()}
function start(){if(running)return;running=true;last=performance.now();requestAnimationFrame(loop)}
function stop(){running=false}

/* ---------- corridor ray-caster ---------- */
const XW=1,YF=-.62,YC=.78,ZB=10,LSP=2.6;
function h2(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296}
function renderBG(){
 const D=img.data,vx=W/2,vy=Math.round(H*.4),f=W*.55,A=accC(),L=lampC(),feat=biome.feat,t=T;
 const flick=(Math.sin(t*23)>.97||Math.sin(t*7.3+1)>.995)?.55:1;
 for(let y=0;y<H;y++){
  const dy=(vy-(y+.5)+bob)/f;
  for(let x=0;x<W;x++){
   const dx=(x+.5-vx)/f;
   let z=ZB,surf=3;
   const zw=dx!==0?XW/Math.abs(dx):1e9;if(zw<z){z=zw;surf=0}
   if(dy<0){const zf=YF/dy;if(zf<z){z=zf;surf=1}}
   else if(dy>0){const zc=YC/dy;if(zc<z){z=zc;surf=2}}
   const X=dx*z,Y=dy*z,Z=z+camZ;
   let I=.16+.55*Math.exp(-z*.55),em=null,R=biome.wall;
   const lk=Math.round(Z/LSP)*LSP;
   for(let k=-1;k<=1;k++){const lz=lk+k*LSP-camZ;if(lz<.3)continue;const d2=X*X*.8+(Y-YC)*(Y-YC)*1.4+(lz-z)*(lz-z);I+=1.25*flick/(1+d2*2.2)}
   if(surf===1){R=biome.floor;const fu=(X+1)*2,fv=Z*2;const gl=Math.min(fu%1,fv%1);
    if(Math.abs(X)<.28){const gv=(Z*8)%1;if(gv<.35)I*=.55}else if(gl<.07)I*=.62;
    if(feat==="water"){const w=Math.sin(Z*9+t*3+Math.sin(X*7+t*2)*1.2);I*=.85+.2*w;if(w>.93&&h2(x,y)>.6)em=L}
    if(feat==="lava"&&Math.abs(X)>.35){const c=Math.sin(X*13+Z*3.7)+Math.sin(Z*5.1-X*6);if(c>1.55)em=mix(A,[255,230,120],.4+.3*Math.sin(t*4+Z))}
    if(feat==="vault"&&((Math.floor(fu)+Math.floor(fv))&1))I*=.8;
   }else if(surf===0){const zs=Z%1;
    if(zs<.05)I*=.5;
    if(Y>.25&&Y<.35){I*=Y>.32?1.25:.85;R=biome.ceil}
    else if(Y>.4&&Y<.44)I*=.6;
    if(Y<YF+.06){em=mix(A,[0,0,0],.25+.2*Math.sin(Z*2-t*2))}
    if(feat==="servers"&&Y>-.35&&Y<.18&&zs>.12&&zs<.88){I*=.55;const r=Math.floor((Y+.35)*22),c=Math.floor(Z*8);if(h2(r,c)>.72&&((r&1)===0)){const on=Math.sin(t*(2+h2(c,r)*6)+c)>.2;if(on)em=h2(c,r+7)>.5?A:mix(A,[160,255,120],.7)}}
    if(feat==="vault"&&Y>-.3&&Y<.18&&zs>.2&&zs<.8){I*=.8;if(Math.abs(Y+.06)<.012||Math.abs(zs-.5)<.012)em=mix(A,[0,0,0],.45)}
    if(feat==="pipes"&&Y>-.1&&Y<-.02)I*=1.2;
   }else if(surf===2){R=biome.ceil;const zs=(Z/LSP)%1;
    if(Math.abs(X)<.22&&(zs<.08||zs>.94))em=mix(L,[0,0,0],1-flick);
    else if((Z%1)<.08)I*=.6;
   }else{R=biome.wall;
    if(Math.abs(X)<.4&&Y<.3){I*=.25;if(Math.abs(X)>.34||Y>.24)I=.5}
    if(Math.abs(X)<.3&&Y>.4&&Y<.5)em=A;
   }
   const fog=Math.min(1,Math.exp(-z*.2)*1.15);
   const i4=(y*W+x)*4;let c;
   if(em){c=mix(hex(biome.sky),em,Math.max(.35,fog))}
   else{const n=R.length-1;let v=I*fog*n+(bayer(x,y)-.5)*.38;v=Math.max(0,Math.min(n,Math.floor(v+.5)));c=R[v]}
   D[i4]=c[0];D[i4+1]=c[1];D[i4+2]=c[2];D[i4+3]=255;
  }
 }
 lx.putImageData(img,0,0);
}
function floorY(z){return Math.round(H*.4-YF*W*.55/z)}

/* ---------- particles ---------- */
function part(o){parts.push(Object.assign({x:0,y:0,vx:0,vy:0,g:0,life:1,max:1,c:[255,255,255],sz:1,drag:1},o));if(parts.length>1400)parts.splice(0,parts.length-1400)}
function burst(x,y,n,col,spd,o){const C=typeof col==="string"?hex(col):col;for(let i=0;i<n;i++){const a=Math.random()*6.283,s=spd*(.3+Math.random());part(Object.assign({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.5,max:.9,c:C},o||{}))}}
function ambient(dt){
 const pt=biome.pt,r=Math.random();
 if(pt==="dust"&&r<dt*14)part({x:Math.random()*W,y:Math.random()*H*.8,vx:(Math.random()-.5)*2,vy:1+Math.random()*2,life:3,max:3,c:mix(lampC(),[40,30,30],.5)});
 if(pt==="drip"&&r<dt*10)part({x:W*.1+Math.random()*W*.8,y:H*.08,vy:30,g:120,life:1.2,max:1.2,c:mix(lampC(),[255,255,255],.3)});
 if(pt==="ember"&&r<dt*22)part({x:Math.random()*W,y:H,vx:(Math.random()-.5)*8,vy:-12-Math.random()*16,life:2.5,max:2.5,c:hex(Math.random()<.5?"#ffb060":"#ff5a20")});
 if(pt==="data"&&r<dt*26)part({x:Math.floor(Math.random()*W/3)*3,y:0,vy:30+Math.random()*30,life:2.5,max:2.5,c:mix(accC(),[255,255,255],.2),sz:1,trail:1});
 if(biome.feat==="water"&&r<dt*3)part({x:Math.random()*W,y:H*.7+Math.random()*H*.3,vx:4,life:4,max:4,c:[160,200,220],sz:2,fog:1});
}

/* ---------- enemy ---------- */
function setEnemy(e){
 if(!e){enemy=null;return}
 const spr=PX.enemySprite(e.id,e.boss,e.kind==="e");
 enemy={spr,e,spawn:0,flash:0,kb:0,lunge:0,dead:0,alpha:1,z:e.boss?2.2:2.25};
}
function enemyPos(){
 if(!enemy)return{x:W/2,y:H*.5,cx:W/2,cy:H*.5,k:1};
 const s=enemy.spr,feet=Math.min(Math.round(H*.86),H-6);
 /* draw at 2x when the monster still fits under the HUD, like a proper dungeon-crawler close-up */
 const k=feet-s.h*2>=H*.2?2:1,w=s.w*k,h=s.h*k;
 return {x:Math.round(W/2-w/2),y:feet-h+2*k,cx:W/2,cy:feet-h*.55,top:feet-h,feet,k,w,h};
}
function drawEnemy(){
 if(!enemy||enemy.dead>=1)return;const en=enemy,s=en.spr;
 const p=enemyPos(),k=p.k;let x=p.x,y=p.y+Math.round(Math.sin(T*2.2)*1.2)*k;
 if(en.kb>0)x+=Math.round((Math.random()-.5)*6*en.kb/.3)*k;
 /* shadow */
 lx.fillStyle="rgba(0,0,0,.55)";const sw=Math.round(p.w*.4);
 for(let i=-sw;i<=sw;i++){const hh=Math.round(Math.sqrt(1-(i/sw)**2)*2.2*k);for(let j=-hh;j<=hh;j++)if(bayer(p.cx+i|0,p.feet+j)<.7)lx.fillRect(Math.round(p.cx+i),p.feet+j,1,1)}
 let img=en.flash>0?s.flash:s.cv;
 if(en.spawn<1){ /* materialise row by row with glitch */
  const rows=Math.floor(s.h*en.spawn);
  for(let r=0;r<s.h;r++){if(r>rows)break;const off=r>rows-4?Math.round((Math.random()-.5)*8):0;lx.drawImage(r>rows-2?s.flash:img,0,r,s.w,1,x+off*k,y+r*k,p.w,k)}
  return;
 }
 if(en.lunge>0){const m=1+Math.sin(en.lunge/.35*Math.PI)*.3,w=Math.round(p.w*m),h=Math.round(p.h*m);lx.drawImage(img,Math.round(p.cx-w/2),Math.round(p.feet-h+2*k+(m-1)*h*.5),w,h)}
 else lx.drawImage(img,x,y,p.w,p.h);
 /* status dressing */
 const st=en.e.sts||{};
 if(st.burn&&Math.random()<.6)part({x:x+Math.random()*p.w,y:y+p.h*.4+Math.random()*p.h*.5,vy:-18*k,life:.5,max:.5,c:hex(Math.random()<.5?"#ffb060":"#ff5a20"),sz:k});
 if(st.bleed&&Math.random()<.15)part({x:x+p.w*.3+Math.random()*p.w*.4,y:y+p.h*.5,vy:6,g:80*k,life:.8,max:.8,c:[200,20,30],sz:k});
 if(st.corrupt&&Math.random()<.4){lx.fillStyle=Math.random()<.5?"#c98df5":"#ff4d9d";lx.fillRect(x+Math.random()*p.w|0,y+Math.random()*p.h|0,(2+Math.random()*5|0)*k,k)}
 if(st.stun){for(let i=0;i<3;i++){const a=T*5+i*2.1;lx.fillStyle="#ffe14d";lx.fillRect(Math.round(p.cx+Math.cos(a)*p.w*.35),Math.round(p.top+2+Math.sin(a)*2*k),k,k)}}
 if(st.regen&&Math.random()<.12)part({x:x+Math.random()*p.w,y:y+p.h,vy:-14*k,life:.9,max:.9,c:[125,255,106],sz:k});
 if(st.guard||st.barrier){lx.fillStyle="rgba(127,216,232,"+(.3+.15*Math.sin(T*6))+")";for(let i=0;i<p.h;i+=3)lx.fillRect(x-2,y+i,1,1),lx.fillRect(x+p.w+1,y+i,1,1)}
}
function enemyDie(){
 if(!enemy)return;const en=enemy,s=en.spr,p=enemyPos();
 const d=s.cv.getContext("2d").getImageData(0,0,s.w,s.h).data,k=p.k;
 for(let yy=0;yy<s.h;yy++)for(let xx=0;xx<s.w;xx++){const i=(yy*s.w+xx)*4;if(d[i+3]<10)continue;
  const dx=xx-s.w/2,dy=yy-s.h;part({x:p.x+xx*k,y:p.y+yy*k,vx:(dx*(1.5+Math.random()*2)+(Math.random()-.5)*10)*k,vy:(-10-Math.random()*40+dy*.3)*k,g:70*k,life:.5+Math.random()*1.1+yy/s.h*.4,max:1.6,c:[d[i],d[i+1],d[i+2]],drag:.985,sz:k})}
 en.dead=1;whiteF=.35;shake=.4;
}

/* ---------- effects ---------- */
function fx(type,o){
 o=o||{};const p=enemyPos();const col=o.col?hex(o.col):[255,255,255];
 if(type==="slash"){const n=o.n||1;for(let i=0;i<n;i++)fxs.push({t:-i*.07,dur:.28,type,col,ang:(i%2?-1:1)*(.6+Math.random()*.3),cx:p.cx+(Math.random()-.5)*8,cy:p.cy+(Math.random()-.5)*8,len:Math.max(26,p.h?p.h*.9:30)})}
 if(type==="fire"){for(let i=0;i<60;i++){const a=Math.random()*6.283,s=10+Math.random()*40;part({x:p.cx,y:p.cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,g:-20,life:.3+Math.random()*.6,max:.9,c:hex(pick3("#ffe14d","#ff9a3d","#ff4a20")),sz:Math.random()<.3?2:1})}}
 if(type==="bolt"){fxs.push({t:0,dur:.35,type,col:hex("#fff6a0"),x:p.cx,y:p.cy,seed:Math.random()*1e3});whiteF=Math.max(whiteF,.12)}
 if(type==="ice"){for(let i=0;i<40;i++){const a=Math.random()*6.283,r=30+Math.random()*20;part({x:p.cx+Math.cos(a)*r,y:p.cy+Math.sin(a)*r,vx:-Math.cos(a)*r*3,vy:-Math.sin(a)*r*3,life:.32,max:.32,c:hex(Math.random()<.5?"#e0fbff":"#7fd8e8"),drag:.9})}setTimeout(()=>burst(p.cx,p.cy,30,"#c8f4ff",45,{g:60}),300)}
 if(type==="void"){fxs.push({t:0,dur:.5,type:"ring",col:hex("#c98df5"),x:p.cx,y:p.cy,r0:34,r1:2});for(let i=0;i<30;i++){const a=Math.random()*6.283;part({x:p.cx+Math.cos(a)*30,y:p.cy+Math.sin(a)*30,vx:-Math.cos(a)*50+Math.sin(a)*30,vy:-Math.sin(a)*50-Math.cos(a)*30,life:.55,max:.55,c:hex(Math.random()<.5?"#c98df5":"#ff4d9d"),drag:.95})}}
 if(type==="hit"){if(!enemy)return;enemy.flash=.09;enemy.kb=.3;burst(p.cx,p.cy,o.crit?26:12,o.col||"#ffffff",o.crit?60:36,{g:60});if(o.crit){shake=Math.max(shake,.3);whiteF=Math.max(whiteF,.15)}}
 if(type==="claw"){for(let i=0;i<3;i++)fxs.push({t:-i*.05,dur:.35,type:"claw",col:hex("#ff3a3a"),x:W*.25+i*W*.18,y:H*.15});redF=.45;shake=Math.max(shake,o.big?.45:.28)}
 if(type==="heal"){for(let i=0;i<24;i++)part({x:W*.2+Math.random()*W*.6,y:H-2-Math.random()*10,vy:-20-Math.random()*25,life:.9,max:.9,c:[125,255,106],plus:Math.random()<.3})}
 if(type==="shield"){fxs.push({t:0,dur:.6,type:"ring",col:hex("#7fd8e8"),x:W/2,y:H+10,r0:10,r1:W*.6})}
 if(type==="buff"){for(let i=0;i<20;i++)part({x:W*.15+Math.random()*W*.7,y:H-2,vy:-30-Math.random()*20,life:.7,max:.7,c:hex(o.col||"#ffb347")})}
 if(type==="lunge"){if(enemy)enemy.lunge=.35}
 if(type==="spark"){burst(o.x!=null?o.x:p.cx,o.y!=null?o.y:p.cy,o.n||20,o.col||"#ffe14d",o.s||40,{g:40})}
 if(type==="shake"){shake=Math.max(shake,o.a||.3)}
 if(type==="flash"){whiteF=Math.max(whiteF,o.a||.3)}
}
function pick3(a,b,c){const r=Math.random();return r<.33?a:r<.66?b:c}
function drawFx(dt){
 for(let i=fxs.length-1;i>=0;i--){const f=fxs[i];f.t+=dt;if(f.t<0)continue;const k=f.t/f.dur;if(k>=1){fxs.splice(i,1);continue}
  const c="rgb("+f.col.join(",")+")";lx.fillStyle=c;
  if(f.type==="slash"){const grow=Math.min(1,k*3),vis=1-Math.max(0,(k-.4)/.6);const L=f.len,ca=Math.cos(f.ang),sa=Math.sin(f.ang);
   for(let s=-L/2;s<-L/2+L*grow;s+=.5){const w=Math.round(Math.sin((s+L/2)/L*Math.PI)*2.5*vis);const x=Math.round(f.cx+ca*s),y=Math.round(f.cy+sa*s);if(bayer(x,y)>vis)continue;lx.fillRect(x-w/2,y,Math.max(1,w),1)}}
  else if(f.type==="claw"){const L=H*.8,grow=Math.min(1,k*4),vis=1-Math.max(0,(k-.3)/.7);for(let s=0;s<L*grow;s++){const x=Math.round(f.x+s*.35),y=Math.round(f.y+s);if(bayer(x,y)>vis)continue;lx.fillRect(x-1,y,3,1)}}
  else if(f.type==="bolt"){let x=f.x,y=0,sd=f.seed;const vis=1-k;while(y<f.y){const nx=x+(h2(sd|0,y|0)-.5)*10,ny=y+4;for(let s=0;s<4;s++){const px=Math.round(x+(nx-x)*s/4),py=Math.round(y+s);if(bayer(px,py)<vis+.2)lx.fillRect(px-1,py,3,1)}x=nx;y=ny;sd++}f.x=f.x;burst(f.x,f.y,2,f.col,30)}
  else if(f.type==="ring"){const r=f.r0+(f.r1-f.r0)*k,vis=1-k;for(let a=0;a<6.283;a+=1/Math.max(4,r)){const x=Math.round(f.x+Math.cos(a)*r),y=Math.round(f.y+Math.sin(a)*r*.7);if(bayer(x,y)<vis+.2)lx.fillRect(x,y,1,1)}}
 }
}
function drawParts(dt){
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}
  p.vy+=p.g*dt;p.vx*=p.drag;p.vy*=p.drag;p.x+=p.vx*dt;p.y+=p.vy*dt;
  const a=p.life/p.max,x=Math.round(p.x),y=Math.round(p.y);if(bayer(x,y)>a+.15)continue;
  lx.fillStyle="rgb("+(p.c[0]|0)+","+(p.c[1]|0)+","+(p.c[2]|0)+")";
  if(p.plus){lx.fillRect(x-1,y,3,1);lx.fillRect(x,y-1,1,3)}else lx.fillRect(x,y,p.sz,p.trail?3:p.sz);
 }
}
function overlays(){
 if(redF>0){lx.fillStyle="#ff2020";for(let y=0;y<H;y++)for(let x=(y&1);x<W;x+=2)if(bayer(x,y)<redF*.7)lx.fillRect(x,y,1,1)}
 if(whiteF>0){lx.fillStyle="#fff8e8";for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(bayer(x,y)<whiteF)lx.fillRect(x,y,1,1)}
 if(fade>0){lx.fillStyle="#000";const f=Math.min(1,fade);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(bayer(x,y)<f)lx.fillRect(x,y,1,1)}
 /* vignette */
 lx.fillStyle="rgba(0,0,0,.5)";for(let y=0;y<H;y++){const e=Math.abs(y/H-.5)*2;for(let x=0;x<W;x++){const d=Math.max(e,Math.abs(x/W-.5)*2);if(d>.78&&bayer(x,y)<(d-.78)*3)lx.fillRect(x,y,1,1)}}
}
function loop(now){
 if(!running)return;
 const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
 if(walkLeft>0){const s=Math.min(walkLeft,dt*walkV);camZ+=s;walkLeft-=s;bob=Math.sin(camZ*7)*1.4}else bob*=.8;
 if(idleWalk){camZ+=dt*idleWalk}
 if(enemy){if(enemy.spawn<1)enemy.spawn=Math.min(1,enemy.spawn+dt*1.8);enemy.flash-=dt;enemy.kb-=dt;enemy.lunge=Math.max(0,enemy.lunge-dt)}
 fade+=(fadeTo-fade)*Math.min(1,dt*6);
 shake=Math.max(0,shake-dt);redF=Math.max(0,redF-dt*1.6);whiteF=Math.max(0,whiteF-dt*2.5);
 renderBG();ambient(dt);drawEnemy();drawFx(dt);drawParts(dt);overlays();
 const sx=shake>0?Math.round((Math.random()-.5)*shake*14)*P/2:0,sy=shake>0?Math.round((Math.random()-.5)*shake*10)*P/2:0;
 out.imageSmoothingEnabled=false;out.fillStyle="#000";out.fillRect(0,0,cv.width,cv.height);
 out.drawImage(lo,0,0,W,H,sx,sy,W*P,H*P);
 requestAnimationFrame(loop);
}
function walk(dist,speed){walkLeft=dist;walkV=speed||3;return new Promise(r=>{const chk=()=>walkLeft<=0.001?r():setTimeout(chk,30);chk()})}
/* map a scene point to % of the canvas box, for DOM overlays */
function toPct(x,y){return {x:x/W*100,y:y/H*100}}
function enemyAnchor(){const p=enemyPos();return toPct(p.cx,p.cy)}
return {init,mount,start,stop,resize,setBiome(f){biome=biomeFor(f)},biomeName:f=>biomeFor(f).n,setEnemy,enemyDie,fx,walk,
 setFade(v,now){fadeTo=v;if(now)fade=v},setIdleWalk(v){idleWalk=v},enemyAnchor,get hasEnemy(){return !!enemy&&enemy.dead<1}};
})();
