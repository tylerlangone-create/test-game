/* DEADLINK — game flow, battle engine and UI. */
"use strict";
/* ================= utils ================= */
const $=s=>document.querySelector(s);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const R_=(a,b)=>a+Math.random()*(b-a);
const RI=(a,b)=>Math.floor(R_(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let introNodes=[];
const CAP=()=>window.Capacitor&&window.Capacitor.Plugins||{};
function buzz(p){
 const H=CAP().Haptics;
 if(H){const ms=Array.isArray(p)?p.reduce((a,b)=>a+b,0):p;try{if(ms<=12)H.impact({style:"LIGHT"});else if(ms<=40)H.impact({style:"MEDIUM"});else H.vibrate({duration:Math.min(400,ms)})}catch(e){}return}
 if(navigator.vibrate){try{navigator.vibrate(p)}catch(e){}}
}
let toastT=null;
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),1800)}
function setMode(m){$("#app").className="mode-"+m;requestAnimationFrame(()=>Scene.resize())}
function pane(id){document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("on",p.id===id))}
function openScr(id){document.querySelectorAll(".scr").forEach(s=>s.classList.toggle("on",s.id===id))}
function closeScr(){document.querySelectorAll(".scr").forEach(s=>s.classList.remove("on"))}
function banner(big,small,cls){const b=$("#banner");b.className="";b.innerHTML="<div class='bw'>"+small+"</div><div class='bn'>"+big+"</div><div class='bw'>"+small+"</div>";void b.offsetWidth;b.className="on "+(cls||"")}

/* ================= icons ================= */
const EL_ICON={KIN:"kin",PLASMA:"flame",VOLTAIC:"bolt",CRYO:"snow",VOID:"void"};
const NODE_ICON={"i-swd":"sword","i-star":"star","i-box":"chest","i-cart":"cart","i-chip":"chip","i-wrench":"wrench","i-quest":"quest","i-dice":"dice"};
function elIc(el,cls){return PX.iconHTML(EL_ICON[el],ELS[el].c,cls)}
function skIcon(sk){
 if(sk.healPct&&!sk.p)return PX.iconHTML("heart","#7dff6a");
 if(!sk.dmg&&!sk.fx&&!sk.inf&&!sk.doomT)return PX.iconHTML("shield","#7fd8e8");
 if(sk.fx==="jackpot"||sk.fx==="chaos"||sk.fx==="fiddle"||sk.rand)return PX.iconHTML("dice",ELS[sk.el].c);
 return PX.iconHTML(EL_ICON[sk.el]||"kin",ELS[sk.el]?ELS[sk.el].c:"#fff");
}
function slotIcon(it){return PX.iconHTML(it.slot==="w"?"sword":it.slot==="f"?"shield":"chip",RC[it.tier])}
function drawPort(cv,cls){const x=cv.getContext("2d");x.imageSmoothingEnabled=false;x.clearRect(0,0,cv.width,cv.height);x.drawImage(PX.portrait(cls),0,0,cv.width,cv.height)}

/* ================= persistence ================= */
let META={shards:0,unlocks:[],perks:{},codex:{},runs:0,best:0,kills:0,snd:1,introSeen:0};
function saveMeta(){try{localStorage.setItem("dl_meta",JSON.stringify(META))}catch(e){}}
function loadMeta(){try{const m=localStorage.getItem("dl_meta");if(m)META=Object.assign(META,JSON.parse(m))}catch(e){}}
let R=null,S=null;
function saveRun(){if(R&&!R.over){try{localStorage.setItem("dl_run",JSON.stringify(R))}catch(e){}}}
function loadRun(){try{const r=localStorage.getItem("dl_run");return r?JSON.parse(r):null}catch(e){return null}}
function wipeRun(){try{localStorage.removeItem("dl_run")}catch(e){}}
function computeStats(){
 const c=CLASSES[R.cls],L=R.lvl-1,p=META.perks;
 let s={hp:c.base.hp+c.g.hp*L,sp:c.base.sp+c.g.sp*L,atk:c.base.atk+c.g.atk*L,def:c.base.def+c.g.def*L,
  mag:c.base.mag+c.g.mag*L,res:c.base.res+c.g.res*L,spd:c.base.spd+c.g.spd*L,
  crit:c.base.crit,luk:c.base.luk,spreg:5,leech:0,thorn:0,critd:0,ocost:0,maxsp:0,eldmg:{}};
 s.hp=(s.hp+R.bonus.hp)*(1+(p.vit||0)*.08);s.atk=(s.atk+R.bonus.atk)*(1+(p.off||0)*.06);
 s.mag=(s.mag+(R.bonus.mag||0))*(1+(p.off||0)*.06);s.def*=(1+(p.def||0)*.06);s.res*=(1+(p.def||0)*.06);s.spreg+=(p.port||0);
 ["w","f","m"].forEach(sl=>{const it=R.equip[sl];if(!it)return;
  if(it.base.atk)s.atk+=it.base.atk;if(it.base.def)s.def+=it.base.def;if(it.base.hp)s.hp+=it.base.hp;
  it.affs.forEach(a=>{const v=AFFS.find(x=>x.id===a.id).t[a.t];
   if(a.id==="atk")s.atk*=1+v/100;else if(a.id==="def")s.def*=1+v/100;else if(a.id==="mag")s.mag*=1+v/100;
   else if(a.id==="res")s.res*=1+v/100;else if(a.id==="hp")s.hp+=v;
   else s[a.id]=(s[a.id]||0)+v;});});
 Object.keys(s).forEach(k=>{if(k!=="eldmg")s[k]=Math.round(s[k]*10)/10});
 s.hp=Math.max(20,Math.round(s.hp));s.spMax=Math.round(s.sp+s.maxsp);s.crit=Math.min(75,s.crit);
 S=s;
}
function xpNeed(l){return Math.round(30*Math.pow(l,1.18))}
function levelCheck(){let n=0;while(R.xp>=xpNeed(R.lvl)){R.xp-=xpNeed(R.lvl);R.lvl++;n++}if(n){computeStats();R.hp=Math.min(S.hp,R.hp+n*Math.round(S.hp*.08))}return n}
function newRun(cls){
 R={cls,lvl:1,xp:0,chips:40,floor:1,inv:[],equip:{w:null,f:null,m:null},
  skills:SKC[cls].slice(),loadout:SKC[cls].slice(),kills:0,bossKills:0,
  hp:0,sp:0,bonus:{hp:0,atk:0,mag:0},flags:{},nodes:null,cleared:false,won:false,over:false};
 computeStats();R.hp=S.hp;R.sp=S.spMax;
 META.runs++;saveMeta();
}

/* ================= modal ================= */
let modalOpen=false;
function modal(o){return new Promise(res=>{
 const b=$("#mbox");let h="<h3>"+o.title+"</h3>";
 if(o.body)h+='<div class="mtxt">'+o.body+"</div>";
 (o.choices||[]).forEach((c,i)=>h+='<button class="mchoice" data-i="'+i+'"><div class="mct">'+c.t+'</div>'+(c.s?'<div class="mcs">'+c.s+"</div>":"")+"</button>");
 if(!o.choices||!o.choices.length)h+='<button class="mchoice" data-i="-1"><div class="mct">CONTINUE &gt;</div></button>';
 b.innerHTML=h;b.scrollTop=0;modalOpen=true;
 b.querySelectorAll(".mchoice").forEach(el=>el.addEventListener("click",()=>{SFX.tap();buzz(8);$("#modal").classList.remove("on");modalOpen=false;const i=+el.dataset.i;if(i>=0&&o.choices[i].f)o.choices[i].f();res(i>=0?o.choices[i]:null)}));
 $("#modal").classList.add("on");
})}

/* ================= HUD ================= */
function renderHud(){
 if(!R)return;
 drawPort($("#hudPort"),R.cls);
 $("#hudCls").textContent=CLASSES[R.cls].n+" "+R.lvl;
 $("#hudXp").style.width=Math.min(100,R.xp/xpNeed(R.lvl)*100)+"%";
 $("#hudFloor").textContent="B"+R.floor+"F";
 $("#hudBiome").textContent=Scene.biomeName(R.floor);
 $("#hudChips").innerHTML=R.chips+" <span class='dim'>CH</span>";
}

/* ================= battle engine ================= */
let B=null,P=null,E=null,_inp=null;
function awaitInput(){return new Promise(r=>_inp=r)}
function submit(a){if(_inp){const f=_inp;_inp=null;f(a)}}
function nameOf(u){return u.isP?"YOU":u.n}
function hpMax(u){return u.isP?S.hp:u.hpMax}
function statOf(u,k){
 if(k==="atk"){let v=u.isP?S.atk:u.atk;if(u.sts.might)v*=1.3;return v}
 if(k==="mag"){let v=u.isP?S.mag:u.mag;if(u.sts.ward)v*=1.3;return v}
 if(k==="def"){let v=u.isP?S.def:u.def;if(u.sts.guard)v*=1.4;return v}
 if(k==="res"){let v=u.isP?S.res:u.res;if(u.sts.guard)v*=1.2;return v}
 if(k==="spd"){let v=u.isP?S.spd:u.spd;if(u.sts.haste)v*=1.4;if(u.sts.slow)v*=.6;return v}
 return u.isP?S[k]:(u[k]||0);
}
function critOf(u){return u.isP?S.crit:4+u.luk*.4}
/* SILENCE blocks magic, JAM blocks anything with a cooldown. */
function blockedBy(u,sk){if(u.sts.silence&&sk.k==="mag")return "SILENCED";if(u.sts.jam&&sk.cd>0)return "JAMMED";return null}
function log(h,cls){
 const b=$("#blog"),d=document.createElement("div");d.className=cls||"s";d.innerHTML=h;b.appendChild(d);while(b.children.length>120)b.removeChild(b.firstChild);
 const t=$("#ticker"),e=d.cloneNode(true);t.appendChild(e);while(t.children.length>3)t.removeChild(t.firstChild);
}
function floatx(u,txt,cls){
 const L=$("#fxLayer"),d=document.createElement("div");d.className="dmg "+(cls||"");d.textContent=txt;
 if(u.isP){d.style.left=(50+R_(-18,18))+"%";d.style.top=(80+R_(-4,4))+"%"}
 else{const a=Scene.enemyAnchor();d.style.left=(a.x+R_(-14,14))+"%";d.style.top=(a.y+R_(-10,6))+"%"}
 L.appendChild(d);setTimeout(()=>d.remove(),950);
}
function hurtP(){const p=$("#pStrip");p.classList.remove("hurt");void p.offsetWidth;p.classList.add("hurt")}
function addSts(u,k,o){
 o=o||{};const s=u.sts;
 if(!u.isP&&((k==="stun"&&u.noStun)||(k==="jam"&&u.noJam))){log(":: "+nameOf(u)+" is immune to "+k.toUpperCase()+".","s");return}
 if(k==="corrupt"){s.corrupt=s.corrupt||{stacks:0,mag:0};s.corrupt.stacks=Math.min(12,s.corrupt.stacks+(o.stacks||1));if(o.mag)s.corrupt.mag=Math.max(s.corrupt.mag,o.mag)}
 else if(k==="dodge"){s.dodge=s.dodge||{n:0,t:99};s.dodge.n+=o.n||1}
 else if(k==="doom"){s.doom={t:o.t||3,val:Math.max(5,Math.round(o.val||0))}}
 else if(k==="edge"){s.edge=s.edge||{n:0,t:99};s.edge.n=Math.min(5,s.edge.n+(o.n||1))}
 else if(k==="thorns"){let v=o.val||0;if(o.atk)v=statOf(u,"atk")*o.val;if(o.deff)v=statOf(u,"def")*o.val;if(o.dmag)v=statOf(u,"mag")*o.val;s.thorns={t:o.t||3,val:Math.max(1,Math.round(v))}}
 else{s[k]=s[k]||{};s[k].t=Math.max(s[k].t||0,o.t||2);if(o.val!==undefined)s[k].val=o.val;
  /* damage-over-time values are stored as ratios of the caster's stat: resolve them now */
  if((k==="bleed"||k==="burn")&&o.src){s[k].val=Math.max(1,Math.round((o.mag?statOf(o.src,"mag"):statOf(o.src,"atk"))*o.val))}}
 if(STSM[k]&&STSM[k].b)floatx(u,STSM[k].n,"info");
 renderSts();
}
function cleanse(u){["bleed","burn","corrupt","stun","silence","jam","blind","weak","frail","slow","doom"].forEach(k=>delete u.sts[k]);renderSts()}
function gainShield(u,amt){amt=Math.round(amt);u.shield=(u.shield||0)+amt;floatx(u,"+"+amt+" SH","shield");if(u.isP)Scene.fx("shield");renderBars()}
function heal(u,amt,silent){if(u.hp<=0)return;amt=Math.round(amt);if(amt<=0)return;const b=u.hp;u.hp=Math.min(hpMax(u),u.hp+amt);const g=u.hp-b;if(g>0){floatx(u,"+"+g,"heal");if(u.isP)Scene.fx("heal");if(!silent){log("> "+nameOf(u)+" repairs <span class='grn'>"+g+"</span> HP.","p");SFX.heal()}}renderBars()}
function applyDamage(u,amt){let rem=Math.round(amt);if(u.shield){const ab=Math.min(u.shield,rem);u.shield-=ab;rem-=ab}u.hp=Math.max(0,u.hp-rem);checkDeaths();return rem}
function hit(src,tgt,o){
 if(B.over)return 0;o=o||{};
 if(tgt.sts.dodge&&tgt.sts.dodge.n>0){tgt.sts.dodge.n--;if(tgt.sts.dodge.n<=0)delete tgt.sts.dodge;log(":: "+nameOf(tgt)+" phases out — MISS.","s");floatx(tgt,"MISS","miss");renderSts();return 0}
 if(src.sts.blind&&Math.random()<.35){log(":: "+nameOf(src)+" loses its lock — MISS.","s");floatx(tgt,"MISS","miss");return 0}
 const kind=o.k||"phys";
 const atk=kind==="phys"?statOf(src,"atk"):statOf(src,"mag");
 const def=kind==="phys"?statOf(tgt,"def"):statOf(tgt,"res");
 let d=(o.p||1)*atk*(100/(100+def*2.35));let note="";
 if(o.el&&tgt.weak===o.el){d*=1.45;note="WEAK!"}
 else if(o.el&&tgt.res===o.el){d*=.55;note="RESIST"}
 if(tgt.sts.frail)d*=1.35;if(src.sts.weak)d*=.65;if(tgt.sts.barrier)d*=.62;
 let crit=false;
 if(src.sts.surecrit||Math.random()*100<critOf(src)){d*=1.65+(src.isP?S.critd/100:0);crit=true}
 d*=.9+Math.random()*.2;d=Math.max(1,Math.round(d));
 const rem=applyDamage(tgt,d);
 floatx(tgt,d+(crit?"!":""),crit?"crit":tgt.isP?"hurt":"");
 if(note)setTimeout(()=>floatx(tgt,note,"info"),120);
 if(tgt.isP){Scene.fx("claw",{big:crit});hurtP();SFX.claw();buzz(crit?[20,30,40]:25)}
 else{Scene.fx("hit",{crit,col:o.el?ELS[o.el].c:"#fff"});if(crit){SFX.crit();buzz([15,30,20])}else{SFX.hit();buzz(12)}}
 log((src.isP?"> ":"! ")+nameOf(src)+" "+(o.vn||"hits")+" "+nameOf(tgt)+" for <b>"+d+"</b>"+(note?" <span class='amb'>"+note+"</span>":"")+(crit?" <span class='amb'>CRIT</span>":""),src.isP?"p":"f");
 if(kind==="phys"&&tgt.sts.thorns){applyDamage(src,tgt.sts.thorns.val);floatx(src,tgt.sts.thorns.val,src.isP?"hurt":"");log("! "+nameOf(tgt)+"'s plating bites back.","f")}
 if(kind==="phys"&&tgt.isP){let rv=S.thorn||0;if(R.cls==="bulwark")rv+=Math.round(statOf(tgt,"def")*.18);if(rv>0){applyDamage(src,rv);floatx(src,rv)}}
 renderBars();renderSts();
 return rem;
}
function checkDeaths(){
 if(!B||B.over)return;
 if(E.hp<=0){B.over=true;B.win=true;return}
 if(P.hp<=0){
  if(P.sts.undying){P.sts.undying.t--;if(P.sts.undying.t<=0)delete P.sts.undying;P.hp=1;log(":: <span class='amb'>UNBREAKABLE</span> — the chassis refuses to fall.","s");floatx(P,"UNBREAKABLE","info");renderSts();return}
  B.over=true;B.win=false;}
}
async function endTurn(u){
 if(B.over)return;
 const s=u.sts;
 if(s.bleed){applyDamage(u,s.bleed.val);floatx(u,s.bleed.val,u.isP?"hurt":"");log(":: "+nameOf(u)+" bleeds "+s.bleed.val+".","s");if(B.over)return}
 if(s.burn){applyDamage(u,s.burn.val);floatx(u,s.burn.val,u.isP?"hurt":"");log(":: "+nameOf(u)+" burns "+s.burn.val+".","s");if(B.over)return}
 if(s.corrupt){const dm=Math.round(s.corrupt.stacks*(4+s.corrupt.mag*.1));applyDamage(u,dm);floatx(u,dm,"info");log(":: CORRUPT eats "+nameOf(u)+" for "+dm+".","s");if(B.over)return}
 if(s.regen)heal(u,hpMax(u)*s.regen.val,true);
 if(s.doom){s.doom.t--;if(s.doom.t<=0){log(":: <span class='red'>DOOM DETONATES</span> in "+nameOf(u)+".","s");applyDamage(u,s.doom.val);floatx(u,s.doom.val,"crit");Scene.fx(u.isP?"claw":"void",{big:1});delete s.doom;if(B.over)return}}
 ["bleed","burn","stun","silence","jam","blind","weak","frail","slow","haste","might","ward","guard","barrier","thorns","undying","surecrit","regen"].forEach(k=>{if(s[k]){s[k].t--;if(s[k].t<=0)delete s[k]}});
 renderSts();renderBars();
}
/* per-cast visual for the player's attack */
function castFx(sk){
 if(!sk.dmg&&!sk.fx)return;
 const el=sk.el||"KIN";
 if(el==="PLASMA"){Scene.fx("fire");SFX.fire()}
 else if(el==="VOLTAIC"){Scene.fx("bolt");SFX.zap()}
 else if(el==="CRYO"){Scene.fx("ice");SFX.ice()}
 else if(el==="VOID"){Scene.fx("void");SFX.voidfx()}
 else{Scene.fx("slash",{n:sk.hits||1+(sk.p>1?1:0)});SFX.slash()}
}
function castSkill(src,tgt,sk){
 if(sk.hpCost){const c=Math.round(hpMax(src)*sk.hpCost);src.hp=Math.max(1,src.hp-c);floatx(src,"-"+c,"hurt");log(":: "+nameOf(src)+" pays "+c+" HP.","s")}
 let p=sk.p;
 if(sk.rand&&sk.pf)p=sk.pf();
 if(sk.edgeScale&&src.sts.edge){const e=src.sts.edge.n;p+=e*sk.edgeScale;log(":: "+e+" EDGE released.","s");delete src.sts.edge}
 if(sk.defScale&&src.isP)p+=S.def*sk.defScale;
 if(sk.exec&&tgt.hp/hpMax(tgt)<sk.exec.h){p*=sk.exec.m;log(":: <span class='amb'>EXECUTE</span>.","s");floatx(tgt,"EXECUTE","info")}
 if(src.isP)castFx(sk);
 let dealt=0;const hits=sk.dmg?(sk.hits||1):0;
 for(let i=0;i<hits;i++){if(B.over)break;dealt+=hit(src,tgt,{p,el:sk.el,k:sk.k})}
 const leech=(src.isP?S.leech/100:0)+(sk.drain||0);
 if(leech>0&&dealt>0)heal(src,dealt*leech,true);
 if(sk.healPct)heal(src,hpMax(src)*sk.healPct);
 if(sk.shSelf)gainShield(src,hpMax(src)*sk.shSelf);
 if(sk.shPct)gainShield(src,hpMax(src)*sk.shPct);
 if(sk.self){sk.self.forEach(x=>addSts(src,x[0],x[1]||{}));if(src.isP){Scene.fx("buff",{col:"#ffb347"});SFX.buff()}}
 if(sk.inf)sk.inf.forEach(x=>{const o=Object.assign({},x[1]);let ch=o.c===undefined?1:o.c;delete o.c;
  if(src.isP&&R.cls==="glitcher")ch+=S.luk*.004;
  if(o.atk||o.mag)o.src=src;
  if(Math.random()<ch)addSts(tgt,x[0],o)});
 if(sk.corrupt)addSts(tgt,"corrupt",{stacks:sk.corrupt,mag:src.isP?statOf(src,"mag"):0});
 if(sk.doomT)addSts(tgt,"doom",{t:sk.doomT,val:statOf(src,"atk")*sk.doomValM});
 if(sk.edge)addSts(src,"edge",{n:sk.edge});
 if(sk.spg&&src.isP){P.sp=Math.min(S.spMax,P.sp+sk.spg);floatx(P,"+"+sk.spg+" SP","shield")}
 if(sk.cleanse)cleanse(src);
 renderBars();renderSts();
 return dealt;
}
const FX={
forkbomb(s,t){const c=t.sts.corrupt?t.sts.corrupt.stacks:0;Scene.fx("void");SFX.voidfx();if(c)floatx(t,"x"+c+" DETONATE","info");const d=hit(s,t,{p:.45+c*.3,el:"VOID",k:"mag"});delete t.sts.corrupt;renderSts();return d},
seven(s,t){let m=1;if(Math.random()<(7+S.luk*.5)/100){m=2.5;log(":: <span class='amb'>SEVENS! JACKPOT.</span>","s");floatx(t,"777","crit")}Scene.fx("bolt");SFX.zap();return hit(s,t,{p:1.5*m,el:"VOLTAIC"})},
forkc(s,t){if(Math.random()<.55+S.luk*.005){addSts(t,"stun",{t:1});Scene.fx("bolt");log(":: The foe's thread hangs. STUNNED.","s");return 0}const c=Math.round(hpMax(s)*.06);s.hp=Math.max(1,s.hp-c);floatx(s,"-"+c,"hurt");log(":: Your own thread frays. -"+c+" HP.","s");return 0},
rebuild(s,t){heal(s,hpMax(s)*(.12+Math.random()*.28));return 0},
jackpot(s,t){const r=Math.random();Scene.fx("flash",{a:.3});
 if(r<.4){log(":: <span class='amb'>GRAND PRIZE — DAMAGE.</span>","s");Scene.fx("bolt");return hit(s,t,{p:2.2,el:"VOLTAIC"})}
 if(r<.6){log(":: <span class='grn'>GRAND PRIZE — REPAIR.</span>","s");heal(s,hpMax(s)*.4);return 0}
 if(r<.75){log(":: <span class='amb'>GRAND PRIZE — CRASH.</span>","s");addSts(t,"stun",{t:2});addSts(t,"weak",{t:3});return 0}
 if(r<.9){const c=Math.round((20+R.floor*5)*R_(.8,1.6));R.chips+=c;floatx(s,"+"+c+" CH","info");log(":: <span class='amb'>GRAND PRIZE — +"+c+" CHIPS.</span>","s");SFX.coin();renderHud();return 0}
 log(":: <span class='red'>HOUSE EDGE. Backfire.</span>","s");applyDamage(s,Math.round(hpMax(s)*.1));Scene.fx("claw");return 0},
chaos(s,t){addSts(s,"haste",{t:3});addSts(s,"dodge",{n:1});const r=pick([["might",{t:3}],["ward",{t:3}],["regen",{t:3,val:.06}],["barrier",{t:2}]]);addSts(s,r[0],r[1]);Scene.fx("buff",{col:"#ffd84d"});log(":: Reality coughs up a gift.","s");return 0},
fiddle(s,t){const r=Math.random();if(r<.34){P.sp=Math.min(S.spMax,P.sp+9);floatx(P,"+9 SP","shield");log(":: You find 9 loose SYNAPSE.","s")}else if(r<.67){Scene.fx("bolt");SFX.zap();hit(s,t,{p:.7,el:"VOLTAIC"})}else{heal(s,hpMax(s)*.06);log(":: A stray packet of vitality.","s")}return 0},
steal(s,t){const c=Math.min(R.chips,Math.round(6+R.floor*1.5));if(c>0){R.chips-=c;floatx(P,"-"+c+" CH","info");log("! "+nameOf(s)+" pockets <span class='red'>"+c+"</span> of your chips.","f");renderHud()}return hit(s,t,{p:.6})},
drainsp(s,t){const v=Math.min(P.sp,8);P.sp-=v;if(v>0){floatx(P,"-"+v+" SP","shield");log("! "+nameOf(s)+" siphons "+v+" SYNAPSE.","f")}return hit(s,t,{p:.6})},
};
function runFx(src,tgt,sk){if(sk.fx&&FX[sk.fx]){const d=FX[sk.fx](src,tgt);const leech=(src.isP?S.leech/100:0)+(sk.drain||0);if(leech>0&&d>0)heal(src,d*leech,true);return true}return false}
function ocCost(cd){return Math.max(5,Math.ceil(S.hp*.05*cd*(1-Math.min(60,S.ocost)/100)))}
async function doPlayerAction(a){
 const c=CLASSES[R.cls];
 if(a.type==="focus"){
  const f=c.focus;SFX.use();log("> "+f.n,"p");
  if(f.fx)runFx(P,E,f);
  else if(f.p>0)castSkill(P,E,f);
  else{if(f.sh)gainShield(P,S.hp*f.sh);if(f.th)addSts(P,"thorns",{t:1,val:statOf(P,"def")*.8});if(f.spg){P.sp=Math.min(S.spMax,P.sp+f.spg);floatx(P,"+"+f.spg+" SP","shield")}}
  renderAll();await wait(420);
 }else{
  const sk=SK[a.id];
  if(a.oc){const cost=ocCost(P.cds[a.id]);P.hp=Math.max(1,P.hp-cost);floatx(P,"-"+cost+" OC","hurt");SFX.oc();buzz([10,30,10]);Scene.fx("flash",{a:.2});log(":: <span class='amb'>OVERCLOCK</span> — burns through cooldown. -"+cost+" HP.","s")}
  else{P.sp-=sk.sp;SFX.use()}
  P.cds[a.id]=sk.cd;log("> "+sk.n,"p");
  if(sk.fx)runFx(P,E,sk);else castSkill(P,E,sk);
  renderAll();await wait(480);
 }
 checkDeaths();
}
/* the foe telegraphs its next move; `ahead` accounts for the cooldown tick that happens first */
function aiPick(ahead){
 const d=ahead?1:0;
 const elig=E.moves.filter(m=>(m._cd||0)-d<=0&&!blockedBy(E,m));
 if(!elig.length)return null;
 if(E.hp<E.hpMax*.55){const h=elig.find(m=>m.healPct);if(h&&Math.random()<.7)return h}
 const weighted=[];elig.forEach(m=>{let w=m.w||10;if(m.healPct)w=2;if(m.self)w=4;for(let i=0;i<w;i++)weighted.push(m)});
 return pick(weighted);
}
function planFoe(){E.next=aiPick(true);renderIntent()}
function renderIntent(){const n=E&&E.next;$("#foeIntent").innerHTML=n?"NEXT &gt; <span style='color:#fff'>"+n.n+"</span>":""}
async function foeAction(){
 E.moves.forEach(m=>{if(m._cd>0)m._cd--});
 let mv=E.next;if(!mv||(mv._cd||0)>0||blockedBy(E,mv))mv=aiPick();
 if(!mv){log("! "+E.n+" cycles idle...","f");floatx(E,blockedBy(E,E.moves[0])||"IDLE","info");await wait(450);return}
 mv._cd=mv.cd||0;
 log("! <b>"+E.n+"</b> &gt; "+mv.n,"f");floatx(E,mv.n,"info");
 const offensive=mv.dmg||mv.fx;
 if(offensive){Scene.fx("lunge");await wait(230)}else{SFX.use();await wait(200)}
 if(mv.fx)runFx(E,P,mv);else castSkill(E,P,mv);
 if(mv.self||mv.healPct||mv.shPct)SFX.buff();
 renderAll();await wait(470);
}
async function runBattle(){
 B={over:false,win:false,round:0};
 log(":: UPLINK — B"+R.floor+"F","s");
 log("! "+E.n+" de-cloaks. <i>\""+E.flav+"\"</i>","f");
 if(R.flags.startShield){gainShield(P,S.hp*.15);log(":: Blessing active — shield pre-charged.","s");delete R.flags.startShield}
 if(R.flags.startBleed){addSts(P,"bleed",{t:2,val:Math.round(S.atk*.3)});log(":: Contagion blooms. You start BLEEDING.","s");delete R.flags.startBleed}
 if(R.flags.startBleedN){addSts(E,"frail",{t:3});log(":: The payphone's curse: "+E.n+" arrives FRAGILE.","s");delete R.flags.startBleedN}
 planFoe();renderAll();await wait(E.boss?1900:900);
 while(!B.over){
  B.round++;
  const ps=statOf(P,"spd"),es=statOf(E,"spd");
  const order=ps+Math.random()*ps*.5>=es+Math.random()*es*.5?["P","E"]:["E","P"];
  for(const side of order){
   if(B.over)break;
   const u=side==="P"?P:E;
   if(u.sts.stun&&u.sts.stun.t>0){log(":: "+nameOf(u)+" is <span class='red'>STUNNED</span>.","s");floatx(u,"STUNNED","info");u.sts.stun.t--;if(u.sts.stun.t<=0)delete u.sts.stun;renderSts();await wait(550);await endTurn(u);if(!u.isP&&!B.over)planFoe();continue}
   if(u.isP){
    Object.keys(P.cds).forEach(k=>{if(P.cds[k]>0)P.cds[k]--});
    P.sp=Math.min(S.spMax,P.sp+S.spreg);
    setTurnUI(true);
    const a=await awaitInput();
    setTurnUI(false);$("#turnlab").textContent="· · ·";
    await doPlayerAction(a);
   }else{
    $("#turnlab").textContent=E.n+" ACTS";
    await foeAction();
   }
   if(B.over)break;
   await endTurn(u);
   if(!u.isP&&!B.over)planFoe();
  }
  if(B.round>60)break;
 }
 await wait(350);
 if(B.win){Scene.enemyDie();SFX.death();buzz([30,40,60]);floatx(E,"DELETED","crit");await wait(1100);victory()}else defeat();
}

/* ================= battle UI ================= */
function setBar(el,v,max,txt){const k=clamp(v/max,0,1);el.querySelector(".fill").style.transform="scaleX("+k+")";const tr=el.querySelector(".trail");if(tr)tr.style.transform="scaleX("+k+")";el.querySelector("b").textContent=txt}
function renderBars(){
 if(!E||!P)return;
 setBar($("#foeBar"),E.hp,E.hpMax,Math.max(0,Math.round(E.hp))+"/"+E.hpMax+(E.shield>0?" +"+Math.round(E.shield):""));
 setBar($("#pHpBar"),P.hp,S.hp,Math.max(0,Math.round(P.hp))+"/"+S.hp+(P.shield>0?" +"+Math.round(P.shield)+"SH":""));
 $("#pHpBar").classList.toggle("low",P.hp<S.hp*.3);
 setBar($("#pSpBar"),P.sp,S.spMax,Math.round(P.sp)+"/"+S.spMax+" SP");
}
function stChip(k,st){
 const m=STSM[k];let extra="";
 if(k==="corrupt")extra="x"+st.stacks;else if(k==="dodge")extra="x"+st.n;else if(k==="doom")extra=st.t;else if(k==="edge")extra=st.n;else if(k==="thorns")extra=st.val;else if(st.t!==undefined&&st.t<90)extra=st.t;
 return '<span class="st '+(m.b?"bad":m.g?"good":"")+'">'+m.n+(extra!==""?" "+extra:"")+"</span>";
}
function renderSts(){
 if(!E||!P)return;
 const vis=s=>Object.keys(s).filter(k=>s[k]&&STSM[k]&&(k==="corrupt"||k==="dodge"||k==="edge"||s[k].t===undefined||(s[k].t>0&&s[k].t<90)));
 $("#foeSts").innerHTML=vis(E.sts).map(k=>stChip(k,E.sts[k])).join("");
 $("#pSts").innerHTML=vis(P.sts).map(k=>stChip(k,P.sts[k])).join("");
}
let cardEls={};
function buildSkillGrid(){
 const g=$("#skillgrid");g.innerHTML="";cardEls={};
 const mk=(id,sk,focus)=>{
  const b=document.createElement("button");b.className="sk"+(focus?" focus":"");
  const elc=sk.el?ELS[sk.el].c:"#6e675c";
  b.innerHTML='<span class="skel" style="background:'+elc+'"></span>'+skIcon(sk)+'<span class="skt"><span class="skname">'+sk.n+'</span><span class="skmeta">'+(focus?"FREE · "+(sk.d||""):(sk.sp?'<span class="spc">'+sk.sp+" SP</span> · ":"FREE · ")+"CD "+sk.cd)+'</span></span><span class="cdov"></span><span class="occhip" style="display:none"></span>';
  g.appendChild(b);cardEls[id]=b;
 };
 mk("FOCUS",Object.assign({cd:0},CLASSES[R.cls].focus),true);
 R.loadout.forEach(id=>mk(id,SK[id]));
 const inf=document.createElement("button");inf.className="sk scan";inf.innerHTML=PX.iconHTML("eye","#8c80a0")+" ANALYZE";inf.id="scanBtn";g.appendChild(inf);
}
function renderSkills(){
 if(!B)return;
 Object.keys(cardEls).forEach(id=>{
  const card=cardEls[id];
  if(id==="FOCUS"){card.classList.remove("cool","nosp");return}
  const sk=SK[id],cd=P.cds[id]||0,bl=blockedBy(P,sk);
  card.querySelector(".cdov").textContent=cd>0?cd:"";
  card.classList.toggle("cool",cd>0);
  card.classList.toggle("nosp",cd<=0&&P.sp<sk.sp);
  card.classList.toggle("blocked",!!bl);
  const meta=card.querySelector(".skmeta");meta.innerHTML=bl?bl:(sk.sp?'<span class="spc">'+sk.sp+" SP</span> · ":"FREE · ")+"CD "+sk.cd;
  const oc=card.querySelector(".occhip");
  if(cd>0&&!bl){oc.style.display="block";oc.classList.remove("arm");oc.textContent="OC -"+ocCost(cd)+"HP"}else oc.style.display="none";
 });
}
function setTurnUI(on){
 $("#turnlab").innerHTML=on?"&gt; YOUR MOVE &lt;":"";
 $("#turnlab").classList.toggle("mine",on);
 $("#skillgrid").classList.toggle("waiting",!on);
 renderSkills();
}
function renderAll(){renderBars();renderSts();renderSkills();renderIntent()}
function showSkillInfo(id,sk){modal({title:sk.n,body:"<span class='itag'>"+(sk.k==="mag"?"MAGIC":"PHYSICAL")+"</span> "+(sk.el?"<span class='itag' style='color:"+ELS[sk.el].c+"'>"+sk.el+"</span>":"")+"<br><br>"+(sk.d||"—")+"<br><br><span class='dim'>CD "+sk.cd+(sk.sp?" · "+sk.sp+" SP":"")+"</span>"})}
function showScan(){
 const moves=E.moves.map(m=>"<span class='amb'>"+m.n+"</span>"+(m._cd>0?" <span class='dim'>("+m._cd+")</span>":"")).join(" · ");
 modal({title:"ANALYZE // "+E.n,body:"<span class='itag' style='color:"+(E.boss?"var(--red)":E.kind==="e"?"var(--amber)":"var(--dim)")+"'>"+(E.boss?"BOSS":E.kind==="e"?"ELITE":"ENTITY")+"</span>"+
 "<div class='statgrid'>"+[["HP",E.hpMax],["ATK",Math.round(E.atk)],["DEF",Math.round(E.def)],["MAG",Math.round(E.mag)],["RES",Math.round(E.res)],["SPD",Math.round(E.spd)]].map(p=>"<div class='cell'><div class='k'>"+p[0]+"</div><div class='v'>"+p[1]+"</div></div>").join("")+"</div>"+
 (E.weak?"WEAK TO: "+elIc(E.weak)+" "+E.weak+"<br>":"")+(E.res?"RESISTS: "+elIc(E.res)+" "+E.res+"<br>":"")+
 "<br><span class='dim'>ARSENAL:</span> "+moves+"<br><br><i class='dim'>"+E.flav+"</i>"});
}

/* ================= battle start / end ================= */
function mkEnemy(def,f,kind){
 const em=kind==="e"?1.25:1;
 const e={id:def.id,n:def.n,kind:kind||"n",flav:def.flav,weak:def.weak||null,res:def.res||null,boss:kind==="b",
  hp:Math.round((28+f*16.5)*def.hpM*(kind==="e"?1.55:1)*(f>30?1+(f-30)*.1:1)),
  atk:Math.round((6+f*1.15)*def.atkM*em*10)/10,def:(3+f*1.35)*(def.defM||1),mag:5+f*1.1,res:2+f*1.1,
  spd:def.spd,luk:5,moves:JSON.parse(JSON.stringify(def.moves)),sts:{},shield:0,noStun:def.noStun,noJam:def.noJam};
 e.moves.forEach(m=>m._cd=0);e.hpMax=e.hp;return e;
}
function pickBoss(f){return f>=30?BOSSES[5]:BOSSES[Math.max(0,Math.floor(f/5)-1)]}
async function startBattle(foe){
 computeStats();
 P={isP:true,hp:R.hp,sp:R.sp,shield:0,sts:{},cds:{}};
 R.loadout.forEach(id=>P.cds[id]=0);
 E=foe;
 $("#foeName").textContent=E.n;
 const tg=$("#foeTag");tg.className="tag"+(E.kind!=="n"?" on":"")+(E.kind==="e"?" elite":"");tg.textContent=E.boss?"BOSS":"ELITE";
 let eh="";Object.keys(ELS).forEach(el=>{if(E.weak===el)eh+=elIc(el,"wk");else if(E.res===el)eh+=elIc(el,"rs")});
 $("#foeEl").innerHTML=eh;
 $("#blog").innerHTML="";$("#ticker").innerHTML="";$("#fxLayer").innerHTML="";
 drawPort($("#pPort"),R.cls);
 buildSkillGrid();
 droneStop();setMode("battle");pane("paneBattle");renderHud();
 Scene.setEnemy(E);
 if(E.boss){SFX.warn();buzz([40,60,40]);banner(E.n,"!! WARNING !! BREACH DETECTED !!");setTimeout(()=>SFX.boss(),800)}
 else if(E.kind==="e"){SFX.boss();banner(E.n,"ELITE SIGNATURE","info")}
 else SFX.tap();
 setTurnUI(false);
 await runBattle();
}
function victory(){
 SFX.win();buzz([20,60,20,60,40]);
 META.codex[E.id]=(META.codex[E.id]||0)+1;META.kills++;R.kills++;if(E.boss)R.bossKills++;
 R.hp=Math.max(1,Math.round(P.hp));R.sp=Math.round(P.sp);
 const f=R.floor;
 let xp=Math.round((16+f*6+(f>10?(f-10)*6:0))*(E.kind==="e"?2.4:E.boss?6:1));
 let ch=Math.round((8+f*2.5)*(E.kind==="e"?2.2:E.boss?3.5:1)*R_(.8,1.2));
 R.chips+=ch;
 const drops=[];
 if(E.kind==="n"&&Math.random()<.45)drops.push(genItem(f));
 if(E.kind==="e")drops.push(genItem(f,1));
 if(E.boss){drops.push(genItem(f,2));drops.push(genItem(f,1))}
 R.xp+=xp;const lvls=levelCheck();
 const offer=E.boss?genOffer(3):null;
 saveMeta();saveRun();renderHud();
 if(lvls){SFX.lvl();banner("LEVEL "+R.lvl,"LEVEL UP! LEVEL UP! LEVEL UP!","lv")}
 setTimeout(()=>showReward({xp,ch,drops,lvls,offer}),lvls?900:0);
}
function genOffer(n){
 const c=CLASSES[R.cls];
 const pool=c.pool.filter(id=>!R.skills.includes(id)&&(SK[id].lvl||1)<=R.lvl);
 const out=[];while(out.length<n&&pool.length){out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
 return out.length?out:null;
}
function itemCard(it,btns){
 return "<div class='item pp' style='color:"+RC[it.tier]+"'><div class='ii'>"+slotIcon(it)+"</div><div style='flex:1;min-width:0'><div class='in'>"+it.name+"</div><div class='il'>"+itemLines(it).join(" · ")+"</div><div class='ir'>"+RNAMES[it.tier]+"</div></div>"+(btns?"<div class='ib'>"+btns+"</div>":"")+"</div>";
}
function learnSkill(id){R.skills.push(id);if(R.loadout.length<6)R.loadout.push(id)}
function showReward(o){
 const ov=$("#ovlReward");
 let h='<div class="bigword amb">SIGNAL CLEARED</div><div style="max-width:440px;width:100%;margin:0 auto">';
 h+="<div class='rline'><span>DATA</span><span class='cyn'>+"+o.xp+" XP"+(o.lvls?" LV "+R.lvl:"")+"</span></div>";
 h+="<div class='rline'><span>CHIPS</span><span class='amb'>+"+o.ch+"</span></div>";
 o.drops.forEach((it,i)=>{h+=itemCard(it,"<button class='pb primary' data-take='"+i+"'>TAKE</button><button class='pb' data-scrap='"+i+"'>+"+itemValue(it)+" CH</button>")});
 if(o.offer)h+="<div class='sect center'>SKILL FRAGMENT DECRYPTED — PICK ONE</div>"+o.offer.map(id=>"<div class='item pp' style='color:var(--amber)'><div class='ii'>"+skIcon(SK[id])+"</div><div style='flex:1'><div class='in'>"+SK[id].n+"</div><div class='il'>"+SK[id].d+"</div></div><div class='ib'><button class='pb primary' data-sk='"+id+"'>LEARN</button></div></div>").join("");
 h+="<button class='pb primary big' id='bRewardGo' style='margin-top:14px'>"+(R.floor===30&&E.boss&&!R.won?"APPROACH THE ROOT":"CONTINUE &gt;")+"</button></div>";
 ov.innerHTML=h;ov.classList.add("on");if(o.drops.length)SFX.loot();
 const done=(el)=>{const c=el.closest(".item");c.classList.add("sold")};
 o.drops.forEach((it,i)=>{
  ov.querySelector("[data-take='"+i+"']").addEventListener("click",e=>{
   if(R.inv.length>=15){const w=R.inv.reduce((a,b)=>a.tier<=b.tier?a:b);R.chips+=itemValue(w);R.inv.splice(R.inv.indexOf(w),1);toast("PACK FULL — SCRAPPED "+w.name)}
   R.inv.push(it);done(e.target);SFX.coin();buzz(8)});
  ov.querySelector("[data-scrap='"+i+"']").addEventListener("click",e=>{R.chips+=itemValue(it);done(e.target);SFX.coin();renderHud()});
 });
 ov.querySelectorAll("[data-sk]").forEach(b=>b.addEventListener("click",()=>{learnSkill(b.dataset.sk);ov.querySelectorAll("[data-sk]").forEach(x=>x.closest(".item").classList.add("sold"));SFX.lvl();buzz(10);toast("LEARNED "+SK[b.dataset.sk].n)}));
 ov.querySelector("#bRewardGo").addEventListener("click",()=>{
  SFX.tap();ov.classList.remove("on");
  if(R.floor===30&&E.boss&&!R.won){R.won=true;saveRun();endRun(true);return}
  R.cleared=true;R.nodes=null;saveRun();Scene.setEnemy(null);showNode();
 });
}
async function defeat(){
 SFX.die();buzz([40,80,120,80,200]);
 log(":: <span class='red'>SIGNAL LOST.</span>","s");
 Scene.fx("claw",{big:1});Scene.setFade(1);
 await wait(1300);endRun(false);
}

/* ================= floors / doors ================= */
function genNodes(){
 const f=R.floor;
 if(f%5===0)return [{t:"boss"}];
 const avail=Object.keys(NODES).filter(k=>!NODES[k].min||f>=NODES[k].min);
 const out=[];const pool=avail.slice();
 /* a floor always offers at least one fight */
 if(Math.random()<.8){out.push({t:"battle"});pool.splice(pool.indexOf("battle"),1)}
 while(out.length<3&&pool.length){
  let tot=pool.reduce((a,k)=>a+NODES[k].w,0),r=Math.random()*tot,sel=pool[0];
  for(const k of pool){r-=NODES[k].w;if(r<=0){sel=k;break}}
  pool.splice(pool.indexOf(sel),1);out.push({t:sel});
 }
 return out.sort(()=>Math.random()-.5);
}
let nodeBusy=false;
function showNode(){
 computeStats();closeScr();setMode("run");pane("paneNode");
 Scene.setBiome(R.floor);Scene.setFade(0);Scene.setIdleWalk(0);
 renderHud();nodeBusy=false;
 $("#whisper").textContent="— "+pick(WHISPERS)+" —";
 const list=$("#doors");list.innerHTML="";
 if(R.cleared){
  $("#descrow").classList.add("on");
  list.innerHTML="<div class='t2 center' style='flex:1;padding:14px 0'>SECTOR QUIET. THE STAIRS GO DOWN.</div>";
  return;
 }
 $("#descrow").classList.remove("on");
 if(!R.nodes)R.nodes=genNodes();
 R.nodes.forEach(nd=>{
  const d=document.createElement("button");
  if(nd.t==="boss"){const bs=pickBoss(R.floor);d.className="door boss";d.innerHTML=PX.iconHTML("skull","#ff4040")+"<div class='dn'>BREACH</div><div class='dd'>"+bs.n+" waits at the end of the corridor.</div><span class='risk hot'>DEATH</span>"}
  else{const N=NODES[nd.t];d.className="door";d.innerHTML=PX.iconHTML(NODE_ICON[N.i]||"quest",N.hot?"#ff6a5a":N.risk==="SAFE"?"#7dff6a":"#ffb347")+"<div class='dn'>"+N.n+"</div><div class='dd'>"+N.d+"</div><span class='risk "+(N.hot?"hot":N.risk==="SAFE"?"safe":N.risk==="ODD"||N.risk==="???"?"odd":"")+"'>"+N.risk+"</span>"}
  d.addEventListener("click",async()=>{if(nodeBusy)return;nodeBusy=true;d.classList.add("picked");SFX.door();buzz(10);await walkIn();resolveNode(nd.t)});
  list.appendChild(d);
 });
}
async function walkIn(){
 const steps=setInterval(()=>SFX.step(),260);
 Scene.setFade(.55);await Scene.walk(2.4,3.2);clearInterval(steps);Scene.setFade(0);
}
async function resolveNode(t){
 const f=R.floor;
 if(t==="boss"){R.cleared=false;R.nodes=null;saveRun();startBattle(mkEnemy(pickBoss(f),f,"b"));return}
 if(t==="battle"||t==="elite"){
  const pool=ENEMIES.filter(e=>f>=e.fl[0]&&f<=e.fl[1]);
  R.cleared=false;R.nodes=null;saveRun();
  startBattle(mkEnemy(pick(pool.length?pool:ENEMIES),f,t==="elite"?"e":"n"));return;
 }
 R.cleared=true;R.nodes=null;
 if(t==="cache"){
  SFX.loot();
  const its=[genItem(f),genItem(f),genItem(f)];
  await modal({title:"SUPPLY CACHE",body:"Dust, and three things that outlived their owner. Take one.",choices:its.map(it=>({t:"<span style='color:"+RC[it.tier]+"'>"+it.name+"</span>",s:itemLines(it).join(" · ")+" — "+RNAMES[it.tier],f(){if(R.inv.length>=15){R.chips+=itemValue(it);toast("PACK FULL — SCRAPPED")}else R.inv.push(it);SFX.coin()}})).concat([{t:"LEAVE IT"}])});
 }else if(t==="station"){openShop();return}
 else if(t==="shrine")await shrine();
 else if(t==="repair"){
  await modal({title:"REPAIR BAY",body:"The automed arm descends. It smells like hospitals and rust.",choices:[
   {t:"FULL PATCH",s:"Heal 40% + refill SYNAPSE",f(){R.hp=Math.min(S.hp,R.hp+S.hp*.4);R.sp=S.spMax;SFX.heal()}},
   {t:"QUICK WELD",s:"Heal 20% · +20 chips of scrap you find nearby",f(){R.hp=Math.min(S.hp,R.hp+S.hp*.2);R.chips+=20;SFX.heal()}}]});
 }else if(t==="anomaly"){await anomaly();return}
 else if(t==="surge"){
  const bet=Math.min(R.chips,40+R.floor*6);
  await modal({title:"STATIC SURGE",body:"A carrier wave hums at fortune-frequency. Stake "+bet+" chips.",choices:[
   {t:"RIDE THE WAVE",s:"50%: double. 50%: dust.",f(){if(Math.random()<.5){R.chips+=bet;SFX.coin();toast("+"+bet+" CHIPS")}else{R.chips-=bet;SFX.die();toast("THE WAVE EATS YOUR STAKE")}}},
   {t:"WALK AWAY"}]});
 }
 saveRun();showNode();
}
async function shrine(){
 const f=R.floor;
 await modal({title:"DATA SHRINE",body:"A server rack dressed in cable-weave and solder-wax. Old net-faith. It is still listening.",choices:[
 {t:"OFFER CHIPS",s:"-"+(30+f*4)+" chips → +12% ATK & MAG this run",f(){const c=30+f*4;if(R.chips<c){toast("FAITH DECLINED — NOT ENOUGH CHIPS");return}R.chips-=c;R.bonus.atk+=Math.round(S.atk*.12);R.bonus.mag=(R.bonus.mag||0)+Math.round(S.mag*.12);SFX.buff();toast("POWER ACCEPTED")}},
 {t:"BLOOD OFFERING",s:"Pay 25% HP → learn a random skill",f(){const c=S.hp*.25;if(R.hp<=c+5){toast("NOT ENOUGH BLOOD TO NEGOTIATE");return}R.hp-=c;const pool=CLASSES[R.cls].pool.filter(id=>!R.skills.includes(id));if(!pool.length){R.chips+=60;toast("NOTHING LEFT TO TEACH — +60 CHIPS");return}const id=pick(pool);learnSkill(id);SFX.lvl();toast("LEARNED: "+SK[id].n)}},
 {t:"DEFRAG",s:"Heal 25% + refill SYNAPSE",f(){R.hp=Math.min(S.hp,R.hp+S.hp*.25);R.sp=S.spMax;SFX.heal()}},
 {t:"GAMBLE AT THE ALTAR",s:"50%: +80% chips / 50%: -40%",f(){if(Math.random()<.5){const g=Math.round(R.chips*.8);R.chips+=g;SFX.coin();toast("FAITH PAYS. +"+g)}else{const l=Math.round(R.chips*.4);R.chips-=l;SFX.die();toast("THE SHRINE COLLECTS. -"+l)}}}]});
}
async function anomaly(){
 const ev=pick(EVENTS);
 const c=await modal({title:ev.n,body:ev.d,choices:ev.ch});
 const out=c&&c.f?c.f():"";
 levelCheck();
 if(typeof out==="string"&&out)await modal({title:ev.n,body:out});
 if(R.flags.fightEv){R.flags.fightEv=0;const pool=ENEMIES.filter(e=>R.floor>=e.fl[0]&&R.floor<=e.fl[1]+2);R.cleared=false;R.nodes=null;saveRun();return startBattle(mkEnemy(pick(pool.length?pool:ENEMIES),R.floor+(Math.random()<.5?2:0),"e"))}
 saveRun();showNode();
}

/* ================= shop ================= */
let STOCK=null;
function priceIt(x){return Math.max(5,Math.round(x))}
function openShop(){
 const f=R.floor;
 if(!STOCK||STOCK.f!==f){
  const pool=CLASSES[R.cls].pool.filter(id=>!R.skills.includes(id)&&(SK[id].lvl||1)<=R.lvl);
  STOCK={f,items:[genItem(f),genItem(f),genItem(f,1)],chip:pool.length?pick(pool):null};
 }
 const k=$("#shopKeeper").getContext("2d");k.imageSmoothingEnabled=false;k.clearRect(0,0,34,40);k.drawImage(PX.enemySprite("hr7").cv,0,0);
 renderShop();openScr("scrShop");
}
function renderShop(){
 const f=R.floor;
 $("#shChips").textContent=R.chips+" CH";
 let h="";
 STOCK.items.forEach((it,i)=>{
  const p=priceIt((30+f*10)*(1+it.tier*.85));it._p=p;
  h+=itemCard(it,"<button class='pb primary' data-buyi='"+i+"' "+(R.chips<p||it.sold?"disabled":"")+">"+(it.sold?"SOLD":p+" CH")+"</button>").replace("class='item pp'","class='item pp"+(it.sold?" sold":"")+"'");
 });
 if(STOCK.chip){
  const sk=SK[STOCK.chip],p=priceIt(90+f*8);STOCK._cp=p;
  h+="<div class='item pp' style='color:var(--amber)'><div class='ii'>"+skIcon(sk)+"</div><div style='flex:1'><div class='in'>SKILL: "+sk.n+"</div><div class='il'>"+sk.d+"</div></div><div class='ib'><button class='pb primary' data-buyc='1' "+(R.chips<p?"disabled":"")+">"+p+" CH</button></div></div>";
 }
 const hp=priceIt(35+f*5);
 h+="<div class='item pp' style='color:var(--green)'><div class='ii'>"+PX.iconHTML("heart","#7dff6a")+"</div><div style='flex:1'><div class='in'>PATCH KIT</div><div class='il'>Heal 50% + refill SYNAPSE, on the spot.</div></div><div class='ib'><button class='pb primary' data-buyh='1' "+(R.chips<hp||R.hp>=S.hp?"disabled":"")+">"+hp+" CH</button></div></div>";
 $("#shBody").innerHTML=h;
 $("#shBody").querySelectorAll("[data-buyi]").forEach(b=>b.addEventListener("click",()=>{const it=STOCK.items[+b.dataset.buyi];if(R.chips<it._p)return;R.chips-=it._p;it.sold=true;const c=Object.assign({},it);delete c.sold;delete c._p;if(R.inv.length<15)R.inv.push(c);else R.chips+=itemValue(c);SFX.coin();saveRun();renderShop()}));
 $("#shBody").querySelectorAll("[data-buyc]").forEach(b=>b.addEventListener("click",()=>{if(R.chips<STOCK._cp)return;R.chips-=STOCK._cp;const id=STOCK.chip;STOCK.chip=null;learnSkill(id);SFX.lvl();buzz(10);saveRun();renderShop()}));
 $("#shBody").querySelectorAll("[data-buyh]").forEach(b=>b.addEventListener("click",()=>{const p=priceIt(35+f*5);if(R.chips<p)return;R.chips-=p;R.hp=Math.min(S.hp,R.hp+S.hp*.5);R.sp=S.spMax;SFX.heal();saveRun();renderShop()}));
}

/* ================= gear / meta / codex / end ================= */
function renderLoadout(){
 computeStats();
 $("#ldChips").textContent=R.chips+" CH";
 let h="<div class='statgrid'>"+[["HP",Math.round(R.hp)+"/"+S.hp],["ATK",Math.round(S.atk)],["MAG",Math.round(S.mag)],["DEF",Math.round(S.def)],["RES",Math.round(S.res)],["SPD",Math.round(S.spd)],["CRIT",Math.round(S.crit)+"%"],["LUCK",Math.round(S.luk)],["SP",S.spMax]].map(p=>"<div class='cell'><div class='k'>"+p[0]+"</div><div class='v'>"+p[1]+"</div></div>").join("")+"</div>";
 h+="<div class='sect'>EQUIPPED</div>";
 ["w","f","m"].forEach(sl=>{const it=R.equip[sl];const nm=sl==="w"?"WEAPON":sl==="f"?"FRAME":"MODULE";
  h+=it?itemCard(it).replace("class='item pp'","class='item pp eqd'"):"<div class='item pp' style='color:var(--edge2)'><div class='ii'>"+PX.iconHTML(sl==="w"?"sword":sl==="f"?"shield":"chip","#3a2e4a")+"</div><div class='il'>— NO "+nm+" —</div></div>"});
 h+="<div class='sect'>SKILLS ("+R.loadout.length+"/6 EQUIPPED) — TAP TO TOGGLE</div>";
 R.skills.forEach(id=>{const sk=SK[id];const eq=R.loadout.includes(id);
  h+="<div class='item pp"+(eq?" eqd":"")+"' data-sk='"+id+"' style='color:"+(eq?"var(--amber)":"var(--dim)")+"'><div class='ii'>"+skIcon(sk)+"</div><div style='flex:1'><div class='in'>"+sk.n+"</div><div class='il'>"+sk.d+"</div></div><span class='itag'>"+(eq?"ON":"OFF")+"</span></div>";
 });
 if(R.inv.length)h+="<div class='sect'>PACK ("+R.inv.length+"/15) — EQUIP OR SCRAP</div>";
 R.inv.forEach((it,i)=>{h+=itemCard(it,"<button class='pb primary' data-eqi='"+i+"'>EQUIP</button><button class='pb danger' data-scrap='"+i+"'>+"+itemValue(it)+"</button>")});
 $("#ldBody").innerHTML=h;
 $("#ldBody").querySelectorAll("[data-sk]").forEach(el=>el.addEventListener("click",()=>{const id=el.dataset.sk;const i=R.loadout.indexOf(id);if(i>=0){if(R.loadout.length<=1){toast("NEED AT LEAST ONE SKILL");return}R.loadout.splice(i,1)}else{if(R.loadout.length>=6){toast("LOADOUT FULL (6)");return}R.loadout.push(id)}SFX.tap();saveRun();renderLoadout()}));
 $("#ldBody").querySelectorAll("[data-eqi]").forEach(el=>el.addEventListener("click",()=>{
  const it=R.inv[+el.dataset.eqi];const old=R.equip[it.slot];const hpPct=R.hp/S.hp;
  R.equip[it.slot]=it;R.inv.splice(R.inv.indexOf(it),1);if(old)R.inv.push(old);
  computeStats();R.hp=Math.max(1,Math.round(S.hp*hpPct));SFX.coin();saveRun();renderLoadout();renderHud()}));
 $("#ldBody").querySelectorAll("[data-scrap]").forEach(el=>el.addEventListener("click",()=>{const it=R.inv[+el.dataset.scrap];R.chips+=itemValue(it);R.inv.splice(R.inv.indexOf(it),1);SFX.coin();saveRun();renderLoadout();renderHud()}));
}
function renderMeta(){
 $("#mtShards").textContent=META.shards+" SHARDS";
 let h="<div class='t2' style='margin:4px 2px 8px'>Shards are extracted from every run, win or lose. Spend them. The Stack is patient.</div>";
 PERKS.forEach(p=>{
  const l=META.perks[p.id]||0,c=perkCost(l);
  h+="<div class='item pp' style='color:var(--cyan)'><div class='ii'>"+PX.iconHTML("up","#4de8e0")+"</div><div style='flex:1'><div class='in'>"+p.n+"</div><div class='il'>"+p.d+"</div><div class='ir'>LV "+l+"/"+p.max+"</div></div><div class='ib'>"+(l<p.max?"<button class='pb primary' data-pk='"+p.id+"' "+(META.shards<c?"disabled":"")+">"+c+" SH</button>":"<span class='itag grn'>MAX</span>")+"</div></div>";
 });
 h+="<div class='sect'>RUNNER PROFILES</div>";
 Object.keys(CLASSES).forEach(k=>{
  const c=CLASSES[k],locked=c.lock&&!META.unlocks.includes(k);
  h+="<div class='item pp' style='color:"+(locked?"var(--dim)":"var(--amber)")+"'><div class='ii'><canvas width='32' height='32' data-port='"+k+"' style='width:32px;height:32px'></canvas></div><div style='flex:1'><div class='in'>"+c.n+"</div><div class='il'>"+c.tag+"</div></div><div class='ib'>"+(locked?"<button class='pb primary' data-un='"+k+"' "+(META.shards<c.lock?"disabled":"")+">"+c.lock+" SH</button>":"<span class='itag grn'>OWNED</span>")+"</div></div>";
 });
 $("#mtBody").innerHTML=h;
 $("#mtBody").querySelectorAll("[data-port]").forEach(c=>drawPort(c,c.dataset.port));
 $("#mtBody").querySelectorAll("[data-pk]").forEach(b=>b.addEventListener("click",()=>{const p=PERKS.find(x=>x.id===b.dataset.pk);const l=META.perks[p.id]||0,c=perkCost(l);if(META.shards<c)return;META.shards-=c;META.perks[p.id]=l+1;SFX.lvl();saveMeta();renderMeta()}));
 $("#mtBody").querySelectorAll("[data-un]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.un,c=CLASSES[k].lock;if(META.shards<c)return;META.shards-=c;META.unlocks.push(k);SFX.win();saveMeta();renderMeta()}));
}
function renderCodex(){
 const all=ENEMIES.concat(BOSSES),seen=all.filter(d=>META.codex[d.id]);
 $("#cdxCount").textContent=seen.length+"/"+all.length;
 let h="";
 all.forEach(def=>{
  const k=META.codex[def.id],boss=BOSSES.includes(def);
  h+="<div class='item pp' style='color:"+(k?boss?"var(--red)":"var(--amber)":"var(--edge2)")+"'><div class='ii' style='width:52px;height:56px'><canvas width='52' height='56' data-cdx='"+def.id+"' data-b='"+(boss?1:0)+"' data-k='"+(k?1:0)+"' style='width:52px;height:56px'></canvas></div><div style='flex:1'><div class='in'>"+(k?def.n:"??????")+"</div><div class='il'>"+(k?"<i>"+def.flav+"</i>":"Not yet encountered.")+"</div>"+(k?"<div class='ir'>DELETED ×"+k+"</div>":"")+"</div></div>";
 });
 $("#cdxBody").innerHTML=h;
 $("#cdxBody").querySelectorAll("[data-cdx]").forEach(c=>{const s=PX.enemySprite(c.dataset.cdx,c.dataset.b==="1");const x=c.getContext("2d");x.imageSmoothingEnabled=false;const k=Math.min(52/s.w,56/s.h);x.drawImage(c.dataset.k==="1"?s.cv:PX.silhouette(s.cv,"#241a30"),(52-s.w*k)/2,56-s.h*k,s.w*k,s.h*k)});
}
function endRun(won){
 droneStop();wipeRun();
 const sh=R.floor+R.kills+(won?R.floor:0);
 META.shards+=sh;META.best=Math.max(META.best,R.floor);saveMeta();R.over=true;
 const b=$("#endBody");
 b.innerHTML="<div style='padding:30px 6px 10px;display:flex;flex-direction:column;min-height:100%;justify-content:center'><div class='bigword "+(won?"amb":"red")+"' style='font-size:22px'>"+(won?"ROOT<br>REACHED":"SIGNAL<br>LOST")+"</div>"+
 "<div class='t2 center' style='margin-bottom:16px'>"+(won?"ADMIN.AWAKE folds. The Stack hums a little quieter. You are a rumor now.":"The Stack files you under 'expected losses.'")+"</div>"+
 "<div class='pp' style='padding:12px 14px'>"+[["DEPTH","B"+R.floor+"F"],["DELETED",R.kills],["BOSSES",R.bossKills],["RUNNER",CLASSES[R.cls].n+" LV"+R.lvl],["BEST","B"+META.best+"F"]].map(p=>"<div class='rline'><span>"+p[0]+"</span><span class='amb'>"+p[1]+"</span></div>").join("")+
 "<div class='rline' style='border:0'><span>SHARDS</span><span class='cyn'>+"+sh+"</span></div></div>"+
 "<button class='pb primary big' id='bEndBoot' style='margin-top:16px'>RETURN TO SURFACE</button></div>";
 openScr("scrEnd");
 $("#bEndBoot").addEventListener("click",()=>{SFX.tap();R=null;toTitle()});
}

/* ================= intro cinematic (low-res, pixelated) ================= */
const INTRO=[
 {t:0,d:2.8,s:"THEY TELL IT DIFFERENT DOWN HERE.",sc:"rain"},
 {t:2.8,d:3.2,s:"SIX KILOMETERS OF DEAD SERVER. BURIED WHEN NEXUS BURNED THE SKY.",sc:"city"},
 {t:6.0,d:3.2,s:"SIX THOUSAND RUNNERS TOOK THE DROP. NONE OF THEM SIGNED OUT.",sc:"shaft"},
 {t:9.2,d:3.4,s:"THEY SAY A SIGNAL CLIMBS OUT OF THE ROOT SOME NIGHTS. IT SINGS IN A DEAD LANGUAGE.",sc:"sigil"},
 {t:12.6,d:1.4,s:"SOME HEARD IT AND WENT QUIET.",sc:"cuts"},
 {t:14.0,d:1.6,s:"YOU HEARD IT AND SAID: 'ONE MORE FLOOR.'",sc:"cuts"},
];
function hsh(s){let h=1779033703;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
function introScene(ctx,W,H,name,t){
 ctx.fillStyle="#050506";ctx.fillRect(0,0,W,H);
 const c="#ffb347",dim="rgba(233,226,210,.6)";
 if(name==="rain"){ctx.fillStyle=dim;for(let i=0;i<50;i++){const x=hsh("r"+i)%W,y=(t*40+hsh("g"+i)%H*3)%H;ctx.globalAlpha=.15+((i*37)%10)/16;ctx.fillRect(x,y,1,2+(i%3))}ctx.globalAlpha=1}
 else if(name==="city"){for(let i=0;i<12;i++){const bw=W/12,bh=H*(.15+((i*53)%40)/100),x=i*bw;ctx.fillStyle="#141018";ctx.fillRect(x,H*.72-bh,bw-1,bh+H);for(let j=0;j<6;j++){if((i*7+j*13)%5<2){ctx.fillStyle="#ff4040";ctx.fillRect(x+2+(j%2)*3,H*.72-bh+3+j*5,1,1)}}}ctx.fillStyle="#2a0a0a";ctx.fillRect(0,H*.72,W,H);if(Math.sin(t*9)>.6){ctx.fillStyle="rgba(255,120,60,.25)";ctx.fillRect(0,0,W,H*.3)}}
 else if(name==="shaft"){ctx.strokeStyle=c;ctx.lineWidth=1;for(let i=0;i<8;i++){const k=((t*.8+i/8)%1),s=4+k*k*W;ctx.globalAlpha=k;ctx.strokeRect(Math.round(W/2-s/2),Math.round(H/2-s/2*H/W),Math.round(s),Math.round(s*H/W))}ctx.globalAlpha=1}
 else if(name==="sigil"){ctx.strokeStyle=c;ctx.beginPath();ctx.arc(W/2,H/2,H*.25,0,Math.PI*2*((t*.3)%1));ctx.stroke();ctx.save();ctx.translate(W/2,H/2);ctx.rotate(t*.5);for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,H*.1);ctx.lineTo(H*.25,0);ctx.stroke()}ctx.restore();ctx.fillStyle=c;ctx.fillRect(W/2-2,H/2-2,4,4)}
 else if(name==="cuts"){const k=Math.floor(t*6)%3;ctx.strokeStyle=k===0?c:k===1?"#ff4040":"#f4efe2";const cx=W/2,cy=H/2,r=H*.18;ctx.beginPath();for(let i=0;i<=3+k;i++){const a=i/(3+k)*Math.PI*2+t*3;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke()}
}
function stopIntroAudio(){introNodes.forEach(n=>{try{n.stop?n.stop():0}catch(e){}});introNodes=[]}
let introRun=false;
async function playIntro(){
 if(introRun)return;introRun=true;droneStop();openScr("scrIntro");
 const cv=$("#introCv"),ctx=cv.getContext("2d"),r=cv.getBoundingClientRect();
 const W=Math.round(r.width/4),H=Math.round(r.height/4);cv.width=W;cv.height=H;
 $("#introTitle").classList.remove("on");
 const c=ac();if(c&&META.snd){try{introScore(c)}catch(e){}}
 let done=false;
 const finish=()=>{if(done)return;done=true;stopIntroAudio();introRun=false;META.introSeen=1;saveMeta();showClassSelect()};
 $("#introSkip").onclick=finish;
 const start=performance.now();
 await new Promise(res=>{
  const loop=()=>{
   if(done){res();return}
   const t=(performance.now()-start)/1000;
   let sc="rain";for(const b of INTRO){if(t>=b.t)sc=b.sc}
   if(t<15.6){introScene(ctx,W,H,sc,t);const beat=INTRO.find(b=>t>=b.t&&t<b.t+b.d);const txt=$("#introTxt");if(beat){txt.textContent=beat.s;txt.classList.add("on")}else txt.classList.remove("on");requestAnimationFrame(loop)}
   else if(!$("#introTitle").classList.contains("on")){$("#introTxt").classList.remove("on");ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);const fw=$("#fwhite");fw.style.transition="none";fw.style.opacity=".8";requestAnimationFrame(()=>{fw.style.transition="opacity .5s";fw.style.opacity="0"});buzz([60,40,120]);$("#introTitle").classList.add("on");setTimeout(()=>{finish();res()},2200)}
  };
  requestAnimationFrame(loop);
 });
}

/* ================= class select / title ================= */
function showClassSelect(){
 const list=$("#clslist");list.innerHTML="";
 $("#clsShards").textContent=META.shards+" SH";
 Object.keys(CLASSES).forEach(k=>{
  const c=CLASSES[k],locked=c.lock&&!META.unlocks.includes(k);
  const d=document.createElement("div");d.className="clscard pp"+(locked?" lock":"");
  d.innerHTML="<canvas width='32' height='32'></canvas><div style='flex:1;min-width:0'><div class='row spread'><h3>"+c.n+"</h3><span class='tagl'>"+c.tag+"</span></div><div class='cd'>"+c.d+"</div><div class='gim'>"+c.gim+"</div><div class='stl'>HP "+c.base.hp+" · ATK "+c.base.atk+" · DEF "+c.base.def+" · MAG "+c.base.mag+" · SPD "+c.base.spd+"</div>"+
  (locked?"<button class='pb primary small' style='margin-top:8px'>UNLOCK — "+c.lock+" SHARDS</button>":"")+"</div>";
  drawPort(d.querySelector("canvas"),k);
  if(locked){d.querySelector("button").addEventListener("click",e=>{e.stopPropagation();if(META.shards<c.lock){toast("NOT ENOUGH SHARDS");return}META.shards-=c.lock;META.unlocks.push(k);saveMeta();SFX.win();buzz(15);showClassSelect()})}
  else d.addEventListener("click",()=>{SFX.tap();buzz(8);newRun(k);saveRun();closeScr();showNode()});
  list.appendChild(d);
 });
 openScr("scrClass");
}
function refreshBoot(){
 $("#bResume").style.display=loadRun()?"block":"none";
 $("#bootstat").textContent="SHARDS "+META.shards+" · BEST B"+META.best+"F · KILLS "+META.kills;
 $("#bMute").innerHTML=(META.snd?"SOUND ON":"SOUND OFF");
}
function toTitle(){
 closeScr();setMode("title");pane("paneTitle");refreshBoot();
 Scene.setEnemy(null);Scene.setBiome(1+Math.floor(Math.random()*6)*5);Scene.setFade(0);Scene.setIdleWalk(.7);
}

/* ================= back button ================= */
function onBack(){
 if(modalOpen||$("#ovlReward").classList.contains("on")||B&&!B.over&&$("#app").classList.contains("mode-battle"))return;
 const open=document.querySelector(".scr.on");
 if(open){const back=open.querySelector("[id^=b][id$=Back]");if(back){back.click();return}if(open.id==="scrIntro"){$("#introSkip").click();return}return}
 if($("#app").classList.contains("mode-run")){$("#bAbandon").click();return}
 const A=CAP().App;if(A)A.exitApp();
}

/* ================= init ================= */
function init(){
 loadMeta();Scene.mount($("#scene"));toTitle();
 $("#bJack").addEventListener("click",async()=>{ac();buzz(8);SFX.tap();if(!META.introSeen)await playIntro();else showClassSelect()});
 $("#bIntro").addEventListener("click",()=>{ac();playIntro()});
 $("#bClassBack").addEventListener("click",()=>{SFX.tap();toTitle()});
 $("#bResume").addEventListener("click",()=>{SFX.tap();R=loadRun();if(!R||R.over){wipeRun();toast("NO ACTIVE RUN");refreshBoot();return}R.bonus.mag=R.bonus.mag||0;computeStats();showNode()});
 $("#bMeta").addEventListener("click",()=>{SFX.tap();renderMeta();openScr("scrMeta")});
 $("#bCodex0").addEventListener("click",()=>{SFX.tap();renderCodex();openScr("scrCodex")});
 $("#bMute").addEventListener("click",()=>{META.snd=META.snd?0:1;saveMeta();refreshBoot();if(META.snd){ac();droneStart()}else droneStop()});
 $("#bMetaBack").addEventListener("click",()=>{SFX.tap();refreshBoot();closeScr()});
 $("#bCodexBack").addEventListener("click",()=>{SFX.tap();closeScr()});
 $("#bLogBack").addEventListener("click",()=>{SFX.tap();closeScr()});
 $("#bLoadBack").addEventListener("click",()=>{SFX.tap();saveRun();closeScr();renderHud()});
 $("#bShopBack").addEventListener("click",()=>{SFX.tap();saveRun();showNode()});
 $("#bLoad").addEventListener("click",()=>{SFX.tap();renderLoadout();openScr("scrLoad")});
 $("#bCodex").addEventListener("click",()=>{SFX.tap();renderCodex();openScr("scrCodex")});
 $("#ticker").addEventListener("click",()=>{if($("#app").classList.contains("mode-battle")){openScr("scrLog");const b=$("#blog");b.scrollTop=b.scrollHeight}});
 $("#bAbandon").addEventListener("click",async()=>{
  await modal({title:"ABANDON RUN",body:"Your runner stays down there. Alone. Forever. The shards still count.",choices:[
   {t:"CUT THE LINK",s:"End run, bank shards",f(){endRun(false)}},
   {t:"STAY"}]});
 });
 $("#bDescend").addEventListener("click",async()=>{if(nodeBusy)return;nodeBusy=true;SFX.tap();buzz(8);const st=setInterval(()=>SFX.step(),220);Scene.setFade(1);await Scene.walk(3,3.6);clearInterval(st);R.floor++;R.cleared=false;R.nodes=null;saveRun();showNode();if(R.floor%5===1&&R.floor>1){banner(Scene.biomeName(R.floor),"ENTERING B"+R.floor+"F","info")}});
 /* battle input */
 $("#skillgrid").addEventListener("click",e=>{
  const scan=e.target.closest("#scanBtn");if(scan){SFX.tap();if(E)showScan();return}
  if(e.target.closest(".occhip"))return;
  if(!B||B.over||!_inp)return;
  const card=e.target.closest(".sk");if(!card)return;
  const id=Object.keys(cardEls).find(k=>cardEls[k]===card);if(!id)return;
  if(id==="FOCUS"){SFX.tap();submit({type:"focus"});return}
  const sk=SK[id],bl=blockedBy(P,sk);
  if(bl){toast(bl+" — CAN'T USE THAT");return}
  if(P.cds[id]>0){toast("ON COOLDOWN — TAP OC TO OVERCLOCK");return}
  if(P.sp<sk.sp){toast("NOT ENOUGH SYNAPSE");return}
  SFX.tap();buzz(6);submit({type:"skill",id,oc:false});
 });
 $("#skillgrid").addEventListener("click",e=>{
  const oc=e.target.closest(".occhip");if(!oc||!B||B.over||!_inp)return;
  const card=oc.closest(".sk");const id=Object.keys(cardEls).find(k=>cardEls[k]===card);
  if(!id||id==="FOCUS"||P.cds[id]<=0)return;
  const cost=ocCost(P.cds[id]);
  if(cost>=P.hp){toast("NOT ENOUGH HP TO OVERCLOCK");return}
  if(oc.classList.contains("arm")){oc.classList.remove("arm");submit({type:"skill",id,oc:true})}
  else{oc.classList.add("arm");oc.textContent="CONFIRM?";setTimeout(()=>{if(oc.classList.contains("arm")){oc.classList.remove("arm");if(B&&P.cds[id]>0)oc.textContent="OC -"+ocCost(P.cds[id])+"HP"}},1800)}
 });
 let lpT=null,lpFired=false;
 $("#skillgrid").addEventListener("pointerdown",e=>{
  const card=e.target.closest(".sk");if(!card||card.id==="scanBtn")return;lpFired=false;
  lpT=setTimeout(()=>{lpFired=true;buzz(12);const id=Object.keys(cardEls).find(k=>cardEls[k]===card);
   showSkillInfo(id,id==="FOCUS"?CLASSES[R.cls].focus:SK[id])},450);
 });
 ["pointerup","pointerleave","pointercancel"].forEach(ev=>$("#skillgrid").addEventListener(ev,()=>clearTimeout(lpT)));
 $("#skillgrid").addEventListener("click",e=>{if(lpFired){e.stopPropagation();lpFired=false}},true);
 document.addEventListener("pointerdown",function once(){ac();if(META.snd&&!SND.drone&&!B)droneStart();document.removeEventListener("pointerdown",once)});
 /* native shell */
 const C=CAP();
 if(C.App)C.App.addListener("backButton",onBack);
 if(C.App)C.App.addListener("pause",()=>{saveRun();droneStop()});
 if(C.StatusBar){try{C.StatusBar.hide()}catch(e){}}
}
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load("10px PS2P"),document.fonts.load("15px Pixelify")]).catch(()=>{}).then(init)}else init();
