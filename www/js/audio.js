/* DEADLINK — synthesized audio. */
"use strict";
/* ================= audio ================= */
const SND={ctx:null,master:null,drone:null};
function ac(){if(!SND.ctx){try{SND.ctx=new (window.AudioContext||window.webkitAudioContext)();SND.master=SND.ctx.createGain();SND.master.gain.value=.9;SND.master.connect(SND.ctx.destination)}catch(e){}}if(SND.ctx&&SND.ctx.state==="suspended")SND.ctx.resume();return SND.ctx}
function tone(f,d,type,vol,slide,when){const c=ac();if(!c||!META.snd)return;const t=when||c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type=type||"square";o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);g.gain.setValueAtTime(vol||.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(SND.master);o.start(t);o.stop(t+d+.02)}
function noiseB(d,vol,hp,when){const c=ac();if(!c||!META.snd)return;const t=when||c.currentTime;const n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),dt=b.getChannelData(0);for(let i=0;i<n;i++)dt[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.setValueAtTime(vol||.09,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);const f=c.createBiquadFilter();f.type=hp?"highpass":"lowpass";f.frequency.value=hp||800;s.connect(f).connect(g).connect(SND.master);s.start(t)}
const SFX={tap:()=>tone(760,.05,"square",.035),use:()=>{tone(340,.09,"square",.05);noiseB(.05,.04,1200)},hit:()=>{noiseB(.09,.09);tone(120,.1,"square",.05,-40)},crit:()=>{noiseB(.14,.12,900);tone(90,.16,"sawtooth",.07,-50);tone(1200,.08,"square",.04)},hurt:()=>{noiseB(.1,.1);tone(80,.14,"sawtooth",.06,-30)},heal:()=>{tone(520,.1,"triangle",.05);tone(700,.12,"triangle",.04)},buff:()=>{tone(440,.08,"triangle",.05);tone(660,.1,"triangle",.04)},coin:()=>{tone(980,.06,"square",.045);tone(1320,.08,"square",.04)},oc:()=>tone(160,.18,"sawtooth",.08,90),die:()=>tone(220,.5,"sawtooth",.09,-180),win:()=>[440,554,659,880].forEach((f,i)=>setTimeout(()=>tone(f,.14,"triangle",.06),i*90)),lvl:()=>[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.12,"square",.05),i*80)),boss:()=>{tone(60,.7,"sawtooth",.1,-20);noiseB(.4,.05)}};
function droneStart(){const c=ac();if(!c||SND.drone||!META.snd)return;const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type="sawtooth";o.frequency.value=55;o2.type="sawtooth";o2.frequency.value=55.6;f.type="lowpass";f.frequency.value=180;g.gain.value=.018;o.connect(f);o2.connect(f);f.connect(g).connect(SND.master);o.start();o2.start();SND.drone={stop(){try{g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.4);o.stop(c.currentTime+.5);o2.stop(c.currentTime+.5)}catch(e){}}}}
function droneStop(){if(SND.drone){SND.drone.stop();SND.drone=null}}

/* extra cues for the pixel remake */
Object.assign(SFX,{
 step:()=>{noiseB(.05,.05,300);tone(70,.06,"sine",.06,-20)},
 door:()=>{noiseB(.35,.06,200);tone(90,.3,"sawtooth",.04,-40)},
 slash:()=>{noiseB(.08,.08,2400);tone(900,.06,"square",.03,-600)},
 fire:()=>{noiseB(.3,.09,500);tone(140,.2,"sawtooth",.04,-60)},
 zap:()=>{tone(1400,.05,"square",.05,-900);tone(700,.12,"square",.05,600);noiseB(.1,.06,3000)},
 ice:()=>{tone(2200,.08,"triangle",.05,-400);tone(1600,.12,"triangle",.04,300);noiseB(.08,.04,5000)},
 voidfx:()=>{tone(300,.3,"sine",.07,-250);tone(80,.35,"sawtooth",.04,40)},
 claw:()=>{noiseB(.12,.12,700);tone(110,.14,"sawtooth",.07,-60)},
 death:()=>{noiseB(.5,.1,400);[600,450,300,160].forEach((f,i)=>setTimeout(()=>tone(f,.1,"square",.05),i*70))},
 warn:()=>{[0,1,2].forEach(i=>setTimeout(()=>{tone(440,.16,"square",.06);tone(330,.16,"square",.05,0,undefined)},i*260))},
 loot:()=>[660,880,1320].forEach((f,i)=>setTimeout(()=>tone(f,.09,"square",.045),i*60)),
});
function introScore(c,g0){
 const t0=c.currentTime+.1;
 {
  const g=c.createGain();g.gain.value=1;g.connect(g0||SND.master);
  const o1=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),dg=c.createGain();
  o1.type="sawtooth";o1.frequency.value=55;o2.type="sawtooth";o2.frequency.value=55.7;
  lp.type="lowpass";lp.frequency.setValueAtTime(120,t0);lp.frequency.exponentialRampToValueAtTime(900,t0+14);
  dg.gain.setValueAtTime(.001,t0);dg.gain.exponentialRampToValueAtTime(.06,t0+2);
  o1.connect(lp);o2.connect(lp);lp.connect(dg).connect(g);
  o1.start(t0);o2.start(t0);introNodes.push({stop(){try{o1.stop();o2.stop()}catch(e){}}});
  // heartbeat kicks, accelerating
  let bt=3.2;for(let i=0;i<22&&bt<15.2;i++){const tt=t0+bt;
   const o=c.createOscillator(),kg=c.createGain();o.type="sine";o.frequency.setValueAtTime(95,tt);o.frequency.exponentialRampToValueAtTime(38,tt+.16);
   kg.gain.setValueAtTime(.16,tt);kg.gain.exponentialRampToValueAtTime(.001,tt+.2);
   o.connect(kg).connect(g);o.start(tt);o.stop(tt+.25);introNodes.push({stop(){try{o.stop()}catch(e){}}});
   bt+=Math.max(.28,1.1-i*.04);}
  // riser
  const n=Math.floor(c.sampleRate*3.4),nb=c.createBuffer(1,n,c.sampleRate),nd=nb.getChannelData(0);
  for(let i=0;i<n;i++)nd[i]=(Math.random()*2-1);
  const ns=c.createBufferSource(),bp=c.createBiquadFilter(),ng=c.createGain();ns.buffer=nb;bp.type="bandpass";bp.Q.value=1.2;
  bp.frequency.setValueAtTime(200,t0+12.2);bp.frequency.exponentialRampToValueAtTime(6000,t0+15.4);
  ng.gain.setValueAtTime(.001,t0+12.2);ng.gain.exponentialRampToValueAtTime(.12,t0+15.3);ng.gain.exponentialRampToValueAtTime(.001,t0+15.9);
  ns.connect(bp).connect(ng).connect(g);ns.start(t0+12.2);introNodes.push({stop(){try{ns.stop()}catch(e){}}});
  // DROP
  const dt=t0+15.6;
  const sub=c.createOscillator(),sg=c.createGain();sub.type="sine";sub.frequency.setValueAtTime(170,dt);sub.frequency.exponentialRampToValueAtTime(28,dt+.9);
  sg.gain.setValueAtTime(.4,dt);sg.gain.exponentialRampToValueAtTime(.001,dt+1.6);
  sub.connect(sg).connect(g);sub.start(dt);sub.stop(dt+1.7);introNodes.push({stop(){try{sub.stop()}catch(e){}}});
  const cn=Math.floor(c.sampleRate*.7),cb=c.createBuffer(1,cn,c.sampleRate),cd2=cb.getChannelData(0);
  for(let i=0;i<cn;i++)cd2[i]=(Math.random()*2-1)*(1-i/cn);
  const cs=c.createBufferSource(),cg=c.createGain(),cf=c.createBiquadFilter();cs.buffer=cb;cf.type="lowpass";cf.frequency.value=150;cg.gain.value=.5;
  cs.connect(cf).connect(cg).connect(g);cs.start(dt);introNodes.push({stop(){try{cs.stop()}catch(e){}}});
  // post-drop pulse
  for(let i=0;i<8;i++){const tt=dt+.5+i*.55;
   const o=c.createOscillator(),kg=c.createGain();o.type="sine";o.frequency.setValueAtTime(80,tt);o.frequency.exponentialRampToValueAtTime(40,tt+.3);
   kg.gain.setValueAtTime(.22,tt);kg.gain.exponentialRampToValueAtTime(.001,tt+.35);
   o.connect(kg).connect(g);o.start(tt);o.stop(tt+.4);introNodes.push({stop(){try{o.stop()}catch(e){}}});
   if(i%2===0){const b2=c.createOscillator(),bg2=c.createGain();b2.type="sawtooth";b2.frequency.value=55;bg2.gain.setValueAtTime(.06,tt);bg2.gain.exponentialRampToValueAtTime(.001,tt+.4);b2.connect(bg2).connect(g);b2.start(tt);b2.stop(tt+.45);introNodes.push({stop(){try{b2.stop()}catch(e){}}})}}
 }
}
