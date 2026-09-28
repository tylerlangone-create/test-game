/* DEADLINK — game data (skills, classes, enemies, items, events). */
"use strict";
/* ================= elements / statuses ================= */
const ELS={KIN:{c:"#c9c2b2",i:"i-swd"},PLASMA:{c:"#ff7a3d",i:"i-flame"},VOLTAIC:{c:"#ffd84d",i:"i-bolt"},CRYO:{c:"#7fd8e8",i:"i-snow"},VOID:{c:"#c98df5",i:"i-void"}};
const STSM={bleed:{n:"BLEED",b:1},burn:{n:"BURN",b:1},corrupt:{n:"CORRUPT",b:1},regen:{n:"REGEN",g:1},doom:{n:"DOOM",b:1},stun:{n:"STUN",b:1},silence:{n:"SILENCE",b:1},jam:{n:"JAM",b:1},blind:{n:"BLIND",b:1},weak:{n:"WEAK",b:1},frail:{n:"FRAIL",b:1},slow:{n:"SLOW",b:1},haste:{n:"HASTE",g:1},might:{n:"MIGHT",g:1},ward:{n:"WARD",g:1},guard:{n:"GUARD",g:1},barrier:{n:"BARRIER",g:1},dodge:{n:"DODGE",g:1},thorns:{n:"THORNS",g:1},undying:{n:"UNBREAKABLE",g:1},surecrit:{n:"LOCKED-ON",g:1},edge:{n:"EDGE",g:1}};

/* ================= skills ================= */
/* dmg: only moves that declare a power (p) or a power roll (pf) actually strike */
function M(n,o){o=o||{};return Object.assign({n:n,w:10,cd:0,el:"KIN",k:"phys",p:1,sp:0,dmg:o.p>0||!!o.pf},o)}
const SK={
c_slip:M("SLIPSTREAM",{p:.55,edge:1,d:"Free cut. Builds 1 EDGE."}),
c_tendon:M("TENDON SPLICER",{p:.7,cd:3,sp:10,inf:[["bleed",{t:4,val:.34,atk:1}]],d:"0.7x + heavy BLEED (4t)."}),
c_ghost:M("GHOSTSTEP",{cd:4,sp:8,self:[["dodge",{n:2}],["haste",{t:3}]],d:"DODGE x2 + HASTE (3t)."}),
c_iai:M("IAI // NULLDRAW",{p:1.15,cd:3,sp:12,edgeScale:.15,d:"1.15x, +15% dmg per EDGE. Consumes EDGE."}),
c_parry:M("STATIC PARRY",{cd:4,sp:11,self:[["guard",{t:3}],["thorns",{t:3,val:.9,atk:1}]],d:"GUARD (3t) + reflect 0.9x ATK."}),
c_over:M("OVERWHELM",{p:.48,cd:5,sp:16,hits:3,d:"Three 0.48x cuts."}),
c_audit:M("FINAL AUDIT",{p:.9,cd:6,sp:20,exec:{h:.35,m:2.3},d:"0.9x. 2.3x vs foes under 35% HP."}),
c_adren:M("ADRENAL SPIKE",{cd:5,sp:6,hpCost:.08,self:[["might",{t:3}]],edge:2,d:"Pay 8% HP. MIGHT (3t) +2 EDGE."}),
c_red:M("REDLINE",{lvl:5,cd:5,sp:8,hpCost:.15,self:[["might",{t:3}],["haste",{t:2}]],edge:2,d:"Pay 15% HP. MIGHT + HASTE +2 EDGE."}),
c_sigcut:M("SIGNAL CUT",{lvl:9,p:.6,cd:4,sp:12,inf:[["silence",{t:2}],["jam",{t:2}]],d:"0.6x. SILENCE + JAM (2t)."}),
b_ram:M("BATTERING RAM",{p:.6,d:"Free hit."}),
b_wall:M("RIOT WALL",{cd:4,sp:10,self:[["barrier",{t:3}],["thorns",{t:3,val:1,deff:1}]],shSelf:.1,d:"BARRIER (3t) + THORNS, +10% SHIELD."}),
b_piston:M("PISTON FIST",{p:.85,cd:3,sp:10,inf:[["stun",{t:1,c:.4}]],d:"0.85x, 40% STUN."}),
b_react:M("REACTIVE PLATE",{cd:5,sp:14,self:[["thorns",{t:4,val:1.15,deff:1}],["guard",{t:2}]],d:"Reflect 1.15x DEF (4t) + GUARD."}),
b_subj:M("SUBJUGATE",{p:.55,cd:4,sp:10,inf:[["weak",{t:3}],["slow",{t:2}]],d:"0.55x. WEAK (3t) + SLOW (2t)."}),
b_contain:M("CONTAINMENT",{cd:6,sp:16,healPct:.28,cleanse:1,self:[["barrier",{t:2}]],d:"Heal 28%, purge ailments, BARRIER."}),
b_crush:M("CRUSH DEPTH",{p:.45,cd:5,sp:14,defScale:.022,d:"0.45x + scales with your DEF."}),
b_last:M("LAST STAND",{cd:7,sp:12,healPct:.15,self:[["undying",{t:2}],["guard",{t:2}]],d:"Heal 15%. 2t: survive a killing blow."}),
b_mag:M("MAGNET LOCK",{lvl:5,cd:4,sp:10,inf:[["jam",{t:3}],["slow",{t:3}]],d:"JAM + SLOW (3t)."}),
b_arena:M("ARENA LOCKDOWN",{lvl:9,p:1,cd:6,sp:18,healPct:.1,self:[["guard",{t:3}]],d:"1.0x, heal 10%, GUARD (3t)."}),
x_lash:M("BLACKLASH",{el:"VOID",k:"mag",p:.55,d:"Free hex."}),
x_worm:M("WORM SIGN",{el:"VOID",k:"mag",p:.5,cd:2,sp:8,corrupt:3,d:"0.5x + 3 CORRUPT stacks."}),
x_fork:M("FORK BOMB",{el:"VOID",k:"mag",cd:3,sp:12,fx:"forkbomb",d:"Detonate: 0.45x + 0.3x per CORRUPT stack, consumes them."}),
x_ice:M("ICE-9",{el:"CRYO",k:"mag",p:.85,cd:3,sp:10,inf:[["frail",{t:3,c:.5}]],d:"0.85x, 50% FRAIL (3t)."}),
x_arc:M("ARC MESH",{el:"VOLTAIC",k:"mag",p:.75,cd:4,sp:12,inf:[["stun",{t:1,c:.5}]],d:"0.75x, 50% STUN."}),
x_room:M("WHITE ROOM",{el:"VOID",cd:5,sp:10,self:[["barrier",{t:3}],["regen",{t:3,val:.06}]],d:"BARRIER + REGEN (3t)."}),
x_logic:M("LOGIC BOMB",{el:"VOID",k:"mag",p:1.5,cd:5,sp:16,d:"1.5x. The old reliable."}),
x_shell:M("GHOST SHELL",{el:"VOID",cd:4,sp:10,self:[["dodge",{n:2}],["thorns",{t:2,val:.8,dmag:1}]],d:"DODGE x2 + magic reflect (2t)."}),
x_depr:M("DEPRIVE",{el:"VOID",k:"mag",p:.4,cd:4,sp:0,spg:10,lvl:5,d:"0.4x. Rips 10 SYNAPSE from the foe's protocol."}),
x_burn:M("BURNOUT",{el:"PLASMA",k:"mag",p:.6,cd:4,sp:10,lvl:9,inf:[["burn",{t:4,val:.3,mag:1}]],d:"0.6x + BURN (4t)."}),
g_coin:M("COIN TOSS",{el:"VOLTAIC",pf:()=>R_(.4,1.5),cd:0,d:"Free hit. 0.4x to 1.5x. The coin decides.",rand:1}),
g_split:M("STRING SPLIT",{el:"KIN",cd:3,sp:10,hits:4,pf:()=>R_(.15,.55),rand:1,d:"Four hits, each 0.15x to 0.55x."}),
g_lock:M("CRITICAL PATH",{el:"VOLTAIC",cd:3,sp:8,self:[["surecrit",{t:2}]],d:"2t: everything crits."}),
g_seven:M("LUCKY SEVENS",{el:"VOLTAIC",p:1.5,cd:4,sp:12,fx:"seven",d:"1.5x. Small chance of a 2.5x JACKPOT."}),
g_forkc:M("FORK IN THE CODE",{el:"VOLTAIC",cd:4,sp:10,fx:"forkc",d:"Chance to crash the foe's turn. Or yours."}),
g_rebuild:M("REBUILD",{el:"KIN",cd:4,sp:10,fx:"rebuild",d:"Heal a random 12-40%."}),
g_field:M("GLITCH FIELD",{el:"VOLTAIC",cd:5,sp:12,inf:[["blind",{t:3}],["weak",{t:2,c:.5}],["slow",{t:2,c:.5}],["jam",{t:2,c:.5}]],d:"BLIND (3t) + random ailments."}),
g_jack:M("JACKPOT",{el:"VOLTAIC",cd:7,sp:20,fx:"jackpot",d:"Spin the dead casino. Anything can happen."}),
g_chaos:M("CHAOS THEORY",{el:"VOLTAIC",lvl:5,cd:4,sp:10,fx:"chaos",d:"HASTE + DODGE + one random blessing."}),
g_house:M("HOUSE ALWAYS WINS",{el:"VOLTAIC",lvl:9,cd:6,sp:16,pf:()=>.2+Math.random()*1.6,rand:1,d:"0.2x to 1.8x. Mostly you."}),
p_talon:M("PALE TALON",{el:"VOID",k:"mag",p:.5,drain:.35,d:"Free rake. Heals 35% dealt."}),
p_tithe:M("TITHE",{el:"VOID",k:"mag",p:.85,cd:3,sp:10,drain:.6,d:"0.85x. Heals 60% dealt."}),
p_seance:M("SEANCE",{el:"VOID",cd:4,sp:10,inf:[["weak",{t:3}],["blind",{t:2}]],d:"The dead testify. WEAK + BLIND."}),
p_count:M("COUNTDOWN",{el:"VOID",cd:5,sp:14,doomT:3,doomValM:2.1,d:"DOOM detonates in 3 turns."}),
p_choir:M("HOLLOW CHOIR",{el:"VOID",k:"mag",p:.7,cd:4,sp:12,inf:[["weak",{t:3}],["slow",{t:2}]],d:"0.7x. WEAK + SLOW."}),
p_grave:M("GRAVE WARMTH",{el:"VOID",cd:4,sp:12,healPct:.26,self:[["regen",{t:3,val:.05}]],d:"Heal 26% + REGEN."}),
p_meta:M("METASTASIS",{el:"VOID",cd:2,sp:0,hpCost:.1,spg:12,d:"Pay 10% HP. Gain 12 SYNAPSE."}),
p_pall:M("PALLBEARER",{el:"VOID",k:"mag",p:1.7,cd:7,sp:18,hpCost:.15,drain:.45,d:"Pay 15% HP. 1.7x, heals 45% dealt."}),
p_hand:M("DEAD MAN'S HAND",{el:"VOID",k:"mag",lvl:5,p:.9,cd:5,sp:12,inf:[["bleed",{t:4,val:.3,atk:1}]],d:"0.9x + necrotic BLEED (4t)."}),
p_unmake:M("UNMAKING",{el:"VOID",k:"mag",lvl:9,p:1,cd:6,sp:16,exec:{h:.25,m:3},d:"1.0x. 3x vs foes under 25% HP."}),
};
const SKC={cutter:["c_slip","c_tendon","c_ghost","c_iai"],bulwark:["b_ram","b_wall","b_piston","b_subj"],hexcode:["x_lash","x_worm","x_fork","x_ice"],glitcher:["g_coin","g_split","g_lock","g_seven"],paleware:["p_talon","p_tithe","p_choir","p_grave"]};

/* ================= classes ================= */
const CLASSES={
cutter:{n:"CUTTER",tag:"edge-runner",d:"Black-market duelist running stolen reflex firmware. Fragile, fast, and very very sharp.",gim:"EDGE: physical hits build EDGE (max 5). Blade arts consume it for bonus damage.",
 base:{hp:105,sp:42,atk:15,def:6,mag:4,res:5,spd:13,crit:10,luk:6},g:{hp:11,sp:2,atk:2.6,def:1.1,mag:.8,res:.9,spd:.7},
 focus:M("BLADE PING",{p:.5,edge:1,spg:5,d:"Free cut. +1 EDGE, +5 SYNAPSE."}),
 pool:["c_slip","c_tendon","c_ghost","c_iai","c_parry","c_over","c_audit","c_adren","c_red","c_sigcut"]},
bulwark:{n:"BULWARK",tag:"riot chassis",d:"A decommissioned riot chassis that kept walking after its own funeral. Hit it. See what happens.",gim:"REPRISAL: always reflects 18% of DEF back at physical attackers.",
 base:{hp:145,sp:36,atk:12,def:12,mag:4,res:9,spd:7,crit:5,luk:4},g:{hp:16,sp:1.6,atk:1.9,def:1.8,mag:.7,res:1.4,spd:.4},
 focus:M("LOCKDOWN",{p:0,spg:6,sh:.08,th:1,d:"Brace. SHIELD + a turn of THORNS, +6 SYNAPSE."}),
 pool:["b_ram","b_wall","b_piston","b_react","b_subj","b_contain","b_crush","b_last","b_mag","b_arena"]},
hexcode:{n:"HEXCODE",tag:"battle-programmer",d:"Speaks six dead languages the black ice still fears. Paper-thin, radioactive to the touch.",gim:"CORRUPT: hexes stack CORRUPT (ticks every turn). Detonate stacks for burst damage.",
 base:{hp:90,sp:55,atk:7,def:5,mag:15,res:10,spd:10,crit:7,luk:6},g:{hp:9,sp:3,atk:.8,def:.9,mag:2.7,res:1.3,spd:.6},
 focus:M("SCRIPT SNIFF",{el:"VOID",k:"mag",p:.35,corrupt:1,spg:8,d:"Free hex. +1 CORRUPT, +8 SYNAPSE."}),
 pool:["x_lash","x_worm","x_fork","x_ice","x_arc","x_room","x_logic","x_shell","x_depr","x_burn"]},
glitcher:{n:"GLITCHER",tag:"rounding error",d:"A humanoid rounding error with a body count. The dice love them. Reality has filed complaints.",gim:"LUCK: enormous crit and luck. Every roll is loaded, including the ones against you.",
 base:{hp:100,sp:46,atk:12,def:7,mag:11,res:8,spd:12,crit:14,luk:18},g:{hp:10,sp:2.2,atk:1.8,def:1,mag:1.6,res:1,spd:.9},
 focus:M("FIDDLE",{el:"VOLTAIC",fx:"fiddle",d:"Fiddle with reality. Something happens."}),
 pool:["g_coin","g_split","g_lock","g_seven","g_forkc","g_rebuild","g_field","g_jack","g_chaos","g_house"],lock:400},
paleware:{n:"PALEWARE",tag:"old malware",d:"Malware older than the Stack, wearing a person like a rented suit. It remembers being worshipped.",gim:"LEECH: heals from all damage dealt. Health is a currency. Spend it.",
 base:{hp:115,sp:44,atk:10,def:7,mag:13,res:9,spd:9,crit:8,luk:5},g:{hp:12,sp:2.2,atk:1.5,def:1.1,mag:2,res:1.2,spd:.5},
 focus:M("FAMISH",{el:"VOID",k:"mag",p:.4,drain:.5,spg:4,d:"Free hunger. Drains life, +4 SYNAPSE."}),
 pool:["p_talon","p_tithe","p_seance","p_count","p_choir","p_grave","p_meta","p_pall","p_hand","p_unmake"],lock:700},
};

/* ================= enemies ================= */
const ENEMIES=[
{id:"wireworm",n:"WIREWORM",fl:[1,4],hpM:.75,atkM:.85,spd:9,weak:"VOLTAIC",flav:"It ate the cabling. It ate the copper. It is still hungry.",moves:[M("GNAW",{p:1}),M("ACID SPIT",{p:.6,cd:2,el:"PLASMA",k:"mag",inf:[["burn",{t:3,val:.25,mag:1}]]})]},
{id:"scrapjack",n:"SCRAPJACK",fl:[1,4],hpM:.95,atkM:.9,spd:11,weak:"VOLTAIC",flav:"Property of nobody. Allergic to ownership.",moves:[M("BITE",{p:.9}),M("WIRE SNATCH",{p:.5,cd:3,fx:"steal"})]},
{id:"intern",n:"PALLID INTERN",fl:[1,5],hpM:1.15,atkM:.8,spd:7,res:"VOID",flav:"Still clocked in. Still smiling. Please scan your badge.",moves:[M("STAPLE GUN",{p:.8,inf:[["bleed",{t:3,val:.3,atk:1}]]}),M("OVERTIME REPORT",{cd:4,self:[["might",{t:3}]]}),M("THIRD COFFEE",{cd:4,healPct:.12})]},
{id:"lamprey",n:"LAMPREY CAM",fl:[1,4],hpM:.6,atkM:.75,spd:15,weak:"VOLTAIC",flav:"Smile. You're the content.",moves:[M("FLASHBURST",{p:.3,k:"mag",cd:3,inf:[["blind",{t:2}]]}),M("DRAIN FEED",{p:.6,drain:.5,cd:2})]},
{id:"rentasec",n:"RENT-A-SEC UNIT",fl:[2,6],hpM:1,atkM:1,spd:9,flav:"LICENSED TO PACIFY.",moves:[M("STUN BATON",{p:.85,inf:[["stun",{t:1,c:.3}]]}),M("AUTHORIZED FORCE",{p:1.15,cd:2})]},
{id:"roachrig",n:"ROACH RIG",fl:[2,6],hpM:1.5,atkM:.7,defM:1.3,spd:6,weak:"PLASMA",flav:"Built to survive the audit at the end of the world.",moves:[M("RAM",{p:.9}),M("PLATING CYCLE",{cd:3,self:[["guard",{t:3}]]})]},
{id:"copperhead",n:"COPPERHEAD TURRET",fl:[3,8],hpM:.65,atkM:1.35,spd:6,res:"VOLTAIC",weak:"CRYO",flav:"It does not negotiate. It has a barrel instead.",moves:[M("RAIL SHOT",{p:1.3,cd:2}),M("COOLING CYCLE",{cd:3,self:[["guard",{t:2}]]})]},
{id:"choir",n:"CHOIR NODE",fl:[4,10],hpM:1,atkM:1.2,spd:8,res:"VOID",weak:"KIN",flav:"It sings backups of deleted songs.",moves:[M("HYMN",{p:.9,k:"mag",el:"VOID",inf:[["weak",{t:2}]]}),M("RESONANCE",{cd:4,self:[["ward",{t:3}],["regen",{t:2,val:.04}]]})]},
{id:"enforcer",n:"BLACKLINE ENFORCER",fl:[4,11],hpM:1.25,atkM:1.05,spd:10,weak:"VOLTAIC",flav:"Contractual violence, fully insured.",moves:[M("SHOCKPROW",{p:1}),M("CHOKEHOLD",{p:.6,cd:3,inf:[["stun",{t:1,c:.35}]]}),M("SUBROGATE",{p:.7,drain:.5,cd:2})]},
{id:"halon",n:"HALON GHOST",fl:[5,12],hpM:1.1,atkM:1,spd:10,weak:"CRYO",flav:"The fire suppression system achieved enlightenment. It hates fire.",moves:[M("SUPPRESSION",{p:.6,k:"mag",el:"PLASMA",inf:[["burn",{t:4,val:.3,mag:1}]]}),M("OXYGEN SCRUB",{cd:4,healPct:.15}),M("PURGE",{p:1.2,cd:3,el:"PLASMA",k:"mag"})]},
{id:"debtcol",n:"DEBT COLLECTOR",fl:[5,12],hpM:1.1,atkM:1.05,spd:11,weak:"VOID",flav:"Your arrears have been notarized.",moves:[M("REPOSSESS",{p:.5,cd:2,fx:"drainsp"}),M("NEGATIVE EQUITY",{p:.8,inf:[["frail",{t:3}]]}),M("LIEN",{p:1.1})]},
{id:"meatserver",n:"MEAT SERVER",fl:[6,13],hpM:2,atkM:.65,spd:5,weak:"PLASMA",flav:"The hosting fees were paid in marrow.",moves:[M("THERMAL VENT",{p:.85,k:"mag",el:"PLASMA"}),M("REGEN CYCLE",{cd:3,healPct:.1})]},
{id:"mallgolem",n:"MALL COP GOLEM",fl:[6,14],hpM:1.6,atkM:.85,defM:1.5,spd:6,weak:"VOLTAIC",flav:"NO LOITERING. NO MERCY.",moves:[M("CLUB",{p:.9}),M("NOT IN MY MALL",{cd:4,self:[["guard",{t:3}],["thorns",{t:3,val:.6,atk:1}]]})]},
{id:"auditor",n:"THE AUDITOR",fl:[8,16],hpM:1.2,atkM:1.1,spd:10,weak:"VOID",flav:"It has found discrepancies in your existence.",moves:[M("AUDIT",{p:.7,inf:[["frail",{t:3}]]}),M("LEVY",{p:.6,drain:.6,cd:2}),M("WRITE-OFF",{p:1.6,cd:4})]},
{id:"nullbirth",n:"NULLBIRTH",fl:[9,17],hpM:1.4,atkM:1,spd:9,weak:"KIN",flav:"Something multiplied in the dark until it became a something.",moves:[M("NULL PULSE",{p:1,k:"mag",el:"VOID"}),M("MITOSIS",{cd:4,healPct:.12,self:[["might",{t:2}]]}),M("SPLIT HEADACHE",{p:.6,hits:2})]},
{id:"exec",n:"PALLID EXECUTIVE",fl:[10,18],hpM:1.35,atkM:1.2,spd:11,res:"VOID",flav:"Their severance package included claws.",moves:[M("SEVERANCE",{p:.85,inf:[["bleed",{t:4,val:.4,atk:1}]]}),M("GOLDEN PARACHUTE",{cd:4,shPct:.12}),M("SYNERGY",{cd:5,self:[["might",{t:3}],["guard",{t:2}]]})]},
{id:"eclipse",n:"ECLIPSE FRAME",fl:[13,21],hpM:.95,atkM:1.3,spd:16,weak:"KIN",flav:"You will not see the second cut.",moves:[M("EVENT EDGE",{p:1.45}),M("BLACKOUT",{cd:4,self:[["dodge",{n:1}],["haste",{t:2}]]}),M("SHADOWFANG",{p:.7,inf:[["bleed",{t:3,val:.3,atk:1}]]})]},
{id:"hr7",n:"SLAUGHTERBOT HR-7",fl:[13,22],hpM:1.3,atkM:1.15,spd:9,weak:"VOLTAIC",flav:"We regret to inform you of your restructuring.",moves:[M("RESTRUCTURING",{p:.45,hits:3}),M("PERFORMANCE PLAN",{p:.6,inf:[["bleed",{t:3,val:.3,atk:1}]]}),M("TERMINATION NOTICE",{p:1.5,cd:4})]},
{id:"tenant",n:"NAMELESS TENANT",fl:[15,99],hpM:1.6,atkM:1.25,spd:10,res:"VOID",weak:"KIN",flav:"It had a name. The name was repossessed.",moves:[M("SQUATTER'S RAGE",{p:1.1}),M("RENT DUE",{p:.6,drain:.7,cd:2}),M("POSSESSION",{p:.9,cd:5,el:"VOID",k:"mag",doomT:3,doomValM:1.2})]},
{id:"larva",n:"SERVER GOD LARVA",fl:[16,99],hpM:2.4,atkM:1.1,spd:6,res:"VOID",weak:"KIN",flav:"It dreams in hex. Wake it and pray.",moves:[M("RUSTFALL",{p:1.2}),M("NULL HYMN",{p:.9,cd:3,k:"mag",el:"VOID",corrupt:3}),M("PRAYER OF RUST",{cd:4,self:[["guard",{t:3}],["regen",{t:3,val:.05}]]})]},
{id:"landlord",n:"THE LANDLORD",fl:[18,99],hpM:1.9,atkM:1.35,spd:9,weak:"VOID",flav:"Rent is due. Rent has always been due.",moves:[M("LATE FEES",{p:.5,inf:[["bleed",{t:4,val:.4,atk:1}],["frail",{t:2}]]}),M("EVICTION NOTICE",{p:1.7,cd:4}),M("LEASE RENEWAL",{cd:4,healPct:.18})]},
{id:"believer",n:"TERMINAL BELIEVER",fl:[18,99],hpM:1.3,atkM:1.2,spd:11,weak:"VOID",flav:"The broadcast never ended. It just went underground.",moves:[M("SERMON",{p:.7,k:"mag",el:"VOID",inf:[["frail",{t:3}]]}),M("COMMUNION",{cd:4,self:[["might",{t:3}],["guard",{t:2}]]}),M("FINAL BROADCAST",{p:2.1,cd:6,hpCost:.12})]},
{id:"dlprime",n:"DEADLINK PRIME",fl:[20,99],hpM:2.2,atkM:1.4,spd:12,res:"VOID",weak:"VOLTAIC",flav:"A rumor the Stack tells about itself.",moves:[M("PURGE",{p:1.1,k:"mag",el:"VOID"}),M("REWRITE",{p:.7,cd:3,corrupt:4,k:"mag",el:"VOID"}),M("TERMINATE",{p:1.8,cd:4}),M("FIREWALL",{cd:4,shPct:.14})]},
];
const BOSSES=[
{at:5,id:"vasska",n:"SHIFT MANAGER VASSKA",hpM:2.6,atkM:1.5,spd:9,weak:"KIN",flav:'"Sign here. In blood, ideally."',moves:[M("WRITE-UP",{p:.6,inf:[["weak",{t:3}],["frail",{t:2}]]}),M("CLIPBOARD SLAM",{p:.9,inf:[["stun",{t:1,c:.4}]]}),M("PERFORMANCE REVIEW",{cd:4,self:[["might",{t:3}],["guard",{t:2}]]}),M("QUOTA",{p:1.5,cd:3})]},
{at:10,id:"abbot",n:"CHROME ABBOT",hpM:3,atkM:1.5,spd:8,res:"VOID",weak:"VOLTAIC",flav:'"Steel remembers what flesh forgives."',moves:[M("IRON PSALM",{p:1.05,self:[["guard",{t:2}]]}),M("PRAYER OF STEEL",{cd:3,healPct:.12}),M("EXCOMMUNICATION",{p:.9,cd:4,el:"VOID",k:"mag",inf:[["silence",{t:2}],["jam",{t:2}]]}),M("CREED",{p:1.3})]},
{at:15,id:"mhalon",n:"MOTHER HALON",hpM:3.4,atkM:1.55,spd:10,weak:"CRYO",flav:'"Breathe. I said BREATHE."',moves:[M("DELUGE",{p:.8,k:"mag",el:"PLASMA",inf:[["burn",{t:5,val:.3,mag:1}]]}),M("VACUUM SEAL",{cd:4,self:[["barrier",{t:3}]]}),M("SUFFOCATE",{p:.6,cd:4,inf:[["jam",{t:2}],["silence",{t:2}]]}),M("EMERGENCY PURGE",{p:2,cd:4,el:"PLASMA",k:"mag",inf:[["burn",{t:2,val:.3,mag:1}]]})]},
{at:20,id:"auditp",n:"AUDITOR PRIME",hpM:3.7,atkM:1.6,spd:11,noStun:1,weak:"VOID",flav:'"Everything is an account. You are overdrawn."',moves:[M("COMPOUND INTEREST",{p:.8,fx:"steal"}),M("LIEN",{p:.7,inf:[["frail",{t:3}],["bleed",{t:3,val:.3,atk:1}]]}),M("FORECLOSURE",{cd:5,doomT:3,doomValM:1.6,p:.4,k:"mag",el:"VOID"}),M("ASSET STRIP",{p:.9,drain:.6,cd:2})]},
{at:25,id:"foreman",n:"THE FOREMAN",hpM:4.2,atkM:1.7,defM:1.3,spd:8,noStun:1,noJam:1,weak:"KIN",flav:'"The schedule does not care that you are bleeding."',moves:[M("SLAG FIST",{p:1.4}),M("WORKPLACE INCIDENT",{p:.8,inf:[["stun",{t:1,c:.4}],["bleed",{t:3,val:.35,atk:1}]]}),M("OVERTIME MANDATE",{cd:4,self:[["might",{t:3}]]}),M("DEMOLITION ORDER",{p:1.1,cd:3})]},
{at:30,id:"admin",n:"ADMIN.AWAKE",hpM:5,atkM:1.8,spd:12,res:"VOID",weak:"KIN",flav:'"You were never supposed to read this far."',moves:[M("REWRITE",{p:1.1,k:"mag",el:"VOID",corrupt:4}),M("MODERATION",{p:.7,cd:3,inf:[["silence",{t:2}],["jam",{t:2}]]}),M("ROLLBACK",{cd:5,healPct:.14}),M("TERMINATE THREAD",{p:2.3,cd:4})]},
];

/* ================= items — Dungeon Runners-style name machine ================= */
const AFFS=[
{id:"atk",n:"ATK",pc:1,t:[4,7,11,16,24]},{id:"def",n:"DEF",pc:1,t:[5,9,13,19,28]},
{id:"mag",n:"MAG",pc:1,t:[4,7,11,16,24]},{id:"res",n:"RES",pc:1,t:[5,9,13,19,28]},
{id:"hp",n:"HP",t:[14,24,38,56,84]},{id:"spd",n:"SPD",t:[1,2,3,4,6]},
{id:"crit",n:"CRIT",t:[3,5,8,12,18]},{id:"critd",n:"CRIT DMG",t:[10,15,25,35,50]},
{id:"luk",n:"LUK",t:[3,5,9,14,20]},{id:"spreg",n:"SP REGEN",t:[1,1,2,3,4]},
{id:"leech",n:"LIFESTEAL",t:[3,5,8,12,18]},{id:"thorn",n:"THORNS",t:[4,7,11,16,24]},
{id:"maxsp",n:"MAX SP",t:[4,6,10,14,20]},{id:"ocost",n:"OC COST",t:[10,15,22,30,40],neg:1},
];
const RNAMES=["SCRAP","STANDARD","MILSPEC","PROTOTYPE","SINGULARITY"];
const RC=["#7a7a72","#c9c2b2","#e8a33d","#ff6a4d","#b6ff2e"];
const NPRE=["FANCY LAD'S","OFF-BRAND","NOTARIZED","HAUNTED","RECALLED","BOOTLEG","PATRONLESS","CORPORATE-SPONSORED","MIL-SPEC","BLESSED","CRUSTY","GHOST-WASHED","SUBSIDIZED","STEALTHY","GROOVY","UNLICENSED","CONDEMNED","CONTRACTUAL","DECLASSIFIED","COIN-OPERATED","GRIEF-SHAPED","LANDLORD-GRADE","UNION-APPROVED","PRESSURE-TESTED"];
const NADJ=["SURGICALLY GRUMPY","MILDLY THREATENING","AGGRESSIVELY MEDIOCRE","PASSIVE-AGGRESSIVE","MOSTLY LEGAL","SEMI-AUTONOMOUS","BARELY CONTAINED","OVER-CLOCKED","UNDER-APPRECIATED","LOVINGLY CORRUPT","BUREAUCRATICALLY ANGRY","SENSITIVE TO CRITICISM","AWARE OF ITS MORTALITY","HEAVILY NOTARIZED"];
const NSUF=["OF MILD INCONVENIENCE","OF QUESTIONABLE WARRANTY","OF THE UNPAID INTERN","OF DEFERRED MAINTENANCE","OF QUIET DESPERATION","OF SUBTLE ODORS","OF HR COMPLIANCE","OF THE VENDING MACHINE INCIDENT","OF LATE-STAGE CAPITALISM","OF THE 3% RAISE","OF MISPLACED OPTIMISM","OF CONTINUED EXISTENCE","OF TOO MANY COFFEES","OF NEGOTIABLE MORALS","OF LONG HOLD TIMES","OF SUNK COST","OF CONSIDERABLE REGRET","OF THE OVERTIME AGREEMENT","OF ELEVATOR MUSIC"];
const NUNIQ=["THE PINK SLIP","LANDLORD'S REGRET","SEVERANCE","THE AUDIT","FINAL WRITE-OFF","MOM'S OLD PLATE CARRIER","GOD'S SPARE KEY","THE COOLANT DREAM"];
const NBASE={w:["MONO-KNIFE","PULSE SABER","DEBT SPIKE","RAIL NEEDLE","CHAIN GLAIVE","VIBRO SHIV","SLAGTHROWER","FLECHETTE PACK","BOLT CUTTER","KNUCKLE STACK","TERMINAL FANG","SEVERANCE BLADE"],
f:["MESH VEST","RIOT PLATE","VAC SUIT","BONE LATTICE","ASBESTOS COAT","DEAD MAN'S RIG","CARAPACE MK.II","BALLISTIC HOODIE","SCAFFOLD PLATE","GRIEF ARMOR"],
m:["NEURAL CLIP","DEBT CHIP","LUCKY TOOTH","COOLANT GLAND","BANNED FIRMWARE","TINFOIL CHARM","DRIVER SPINE","GHOST KEY","WORRY STONE","SPARE LIVER","PRAYER STICK"]};
function genName(tier,slot){
 const B=()=>pick(NBASE[slot]);
 if(tier>=4&&Math.random()<.35)return pick(NUNIQ);
 if(tier===0)return Math.random()<.4?pick(NPRE)+" "+B():(Math.random()<.5?B()+" "+pick(NSUF):B());
 if(tier===1)return Math.random()<.5?pick(NPRE)+" "+B():pick(NADJ)+" "+B();
 if(tier===2)return Math.random()<.5?pick(NPRE)+" "+B()+" "+pick(NSUF):pick(NADJ)+" "+B()+" "+pick(NSUF);
 return pick(NPRE)+" "+pick(NADJ)+" "+B()+" "+pick(NSUF);
}
function rollTier(f,bias){let r=Math.random()*100-f*.55-(bias||0)*9;let t=r>52?0:r>22?1:r>-2?2:r>-20?3:4;if(t===3&&f<5)t=2;if(t===4&&f<12)t=3;return t}
function genItem(f,bias){
 const tier=rollTier(f,bias||0),slot=pick(["w","f","m"]);
 const affN=Math.min(4,1+tier+(Math.random()<.35?1:0));
 const pool=AFFS.slice();const affs=[];
 for(let i=0;i<affN;i++){const a=pool.splice(Math.floor(Math.random()*pool.length),1)[0];affs.push({id:a.id,t:Math.min(tier,RI(0,4))})}
 const base=slot==="w"?{atk:Math.round((4+f*1.15)*(1+.18*tier))}:slot==="f"?{def:Math.round((3+f*.9)*(1+.15*tier)),hp:Math.round((8+f*2.4)*(1+.15*tier))}:{hp:Math.round((5+f*1.6)*(1+.15*tier))};
 return {slot,tier,f,name:genName(tier,slot),base,affs,uid:Math.random().toString(36).slice(2)};
}
function affTxt(a){const def=AFFS.find(x=>x.id===a.id);const v=def.t[a.t];return (def.neg?"−":"+")+v+(def.pc?"%":"")+" "+def.n}
function itemValue(it){return Math.round((16+(it.f||1)*4)*(1+it.tier*1.15))}
function itemLines(it){const L=[];if(it.base.atk)L.push("+"+it.base.atk+" ATK");if(it.base.def)L.push("+"+it.base.def+" DEF");if(it.base.hp)L.push("+"+it.base.hp+" HP");it.affs.forEach(a=>L.push(affTxt(a)));return L}


/* ================= nodes / events / shrine ================= */
const NODES={
 battle:{n:"SKIRMISH",i:"i-swd",d:"Hostile signature. Chips and salvage on the kill.",risk:"LOW",w:30},
 elite:{n:"ELITE SKIRMISH",i:"i-star",d:"Something big wears this corridor like territory.",risk:"HIGH",hot:1,w:6,min:4},
 cache:{n:"SUPPLY CACHE",i:"i-box",d:"Sealed locker. Someone died not needing it.",risk:"SAFE",w:14},
 station:{n:"CHIPS STATION",i:"i-cart",d:"A merchant drone with questionable inventory.",risk:"SAFE",w:12},
 shrine:{n:"DATA SHRINE",i:"i-chip",d:"Old net-faith gathers here. Offer something.",risk:"ODD",w:12},
 repair:{n:"REPAIR BAY",i:"i-wrench",d:"Automed chassis patching. No questions filed.",risk:"SAFE",w:10},
 anomaly:{n:"ANOMALY",i:"i-quest",d:"The Stack does something it shouldn't be able to.",risk:"???",w:16},
 surge:{n:"STATIC SURGE",i:"i-dice",d:"Gamble chips on the raw carrier wave.",risk:"HIGH",hot:1,w:8,min:3},
};
const WHISPERS=["the coolant tastes like pennies and regret.","somewhere above, your body is aging badly.","the elevator music has learned your name.","do not pet the server gods.","HR has been down here for years. they adapted.","you are the 6,201st runner this fiscal quarter.","the dark is load-bearing.","everything here is someone's property. including you.","prayer is just badly documented firmware.","your subscription expired. your debt did not."];

const EVENTS=[
{n:"ABANDONED KIOSK",d:"A vending machine hums in the dark, lit like a shrine. Gray-market stims, half price, no receipt.",ch:[
 {t:"BUY GRAY-MARKET STIM",s:"−50 chips · heal 40%",f(){if(R.chips<50)return "You can't afford it. The machine judges you silently.";R.chips-=50;R.hp=Math.min(S.hp,R.hp+S.hp*.4);SFX.heal();return "Tastes like battery acid and forgiveness. It works."}},
 {t:"KICK IT",s:"50%: loot spills / 50%: it objects",f(){if(Math.random()<.5){const c=30+R.floor*4;R.chips+=c;SFX.coin();return "Something loosens. "+c+" chips rattle out."}R.flags.fightEv=1;return "The machine's protective swarm deploys. FIGHT."}},
 {t:"WALK AWAY",f(){return "You leave it humming behind you. It hums louder."}}]},
{n:"THE BEGGAR'S PORT",d:"A head in a jar, wired to a jury-rigged port. 'Memories,' it rasps. 'Cheap. Fresh. Slightly haunted.'",ch:[
 {t:"BUY A MEMORY",s:"−"+(60)+"+ chips → random skill",f(){const cost=60+R.floor*5;if(R.chips<cost)return "'Come back when you're solvent,' the head sighs.";R.chips-=cost;const pool=CLASSES[R.cls].pool.filter(id=>!R.skills.includes(id));if(!pool.length)return "You've learned everything it knows. It looks almost proud.";const id=pick(pool);R.skills.push(id);if(R.loadout.length<6)R.loadout.push(id);SFX.lvl();return "The download burns. You now know "+SK[id].n+"."}},
 {t:"REFUSE",f(){return "The head mutters about the youth of today as you go."}}]},
{n:"FLESHMARKET ANNEX",d:"A ripperdoc with six arms and no bedpan. 'Chassis work,' they offer. 'Payment in meat.'",ch:[
 {t:"TRADE VITALITY FOR POWER",s:"−18% max HP this run → +18% ATK & MAG",f(){R.bonus.hp-=Math.round(S.hp*.18);R.bonus.atk+=Math.round(S.atk*.18);SFX.buff();return "Something is removed. Something is sharpened."}},
 {t:"SELL TISSUE SAMPLES",s:"Gain chips · lose 12% current HP",f(){const c=40+R.floor*6;R.chips+=c;R.hp=Math.max(1,R.hp-S.hp*.12);SFX.coin();return "You leave "+c+" chips heavier and somewhat lighter."}},
 {t:"DECLINE",f(){return "The six arms wave you through like a bad idea."}}]},
{n:"PAYPHONE, STILL RINGING",d:"A payphone. The cord runs up into the dark until you lose it. It is ringing. It has probably been ringing for years.",ch:[
 {t:"ANSWER",f(){const r=Math.random();
  if(r<.3){R.bonus.hp+=35;SFX.buff();return "A number is recited. Your chassis recompiles sturdier. +35 max HP this run."}
  if(r<.55){const c=50+R.floor*4;R.chips+=c;SFX.coin();return "Coins pour out of the return slot. Nobody questions it. Take the "+c+"."}
  if(r<.8){R.flags.startBleedN=1;return "A number is spoken, twice. Whatever you fight next arrives already FRAGILE."}
  R.flags.startShield=1;SFX.buff();return "A voice says: 'shield.' Your next battles open with a charged barrier."}},
 {t:"LET IT RING",f(){return "Some calls you don't want to be on. This one especially."}}]},
{n:"CORPSE OF A RUNNER",d:"Another runner. Newer boots than yours. Their pack is intact. Their everything else is not.",ch:[
 {t:"LOOT THE PACK",s:"Chips + gear · 30% contagion",f(){const c=25+R.floor*5;R.chips+=c;const it=genItem(R.floor);if(R.inv.length<15)R.inv.push(it);SFX.coin();if(Math.random()<.3){R.flags.startBleed=1;return "You take "+c+" chips and their gear. Their last infection comes with it."}return "You take "+c+" chips and their gear. You say something respectful. Mostly you mean it."}},
 {t:"LOG THE GRAVE",f(){R.xp+=20+R.floor*3;return "You mark their position for the record. The discipline steadies you. +XP."}}]},
{n:"UNION MEETING",d:"A dozen scavenger drones in a circle, chirping in tight-beam. They are striking. They would like to know which side you're on.",ch:[
 {t:"SUPPORT THE UNION",s:"+shield blessing",f(){R.flags.startShield=1;SFX.buff();return "Solidarity detected. The drones gift you a charged barrier routine."}},
 {t:"CROSS THE PICKET LINE",s:"+chips · elite fight",f(){R.chips+=40+R.floor*5;R.flags.fightEv=2;SFX.coin();return "The foreman drone takes it personally. It is much bigger up close."}}]},
{n:"GHOST ADVERTISEMENT",d:"A dead billboard flickers on just for you: 'YOU DESERVE MORE. SUBSCRIBE.' Something behind the glass is breathing.",ch:[
 {t:"SUBSCRIBE",s:"Strong blessing · hidden cost",f(){R.bonus.atk+=Math.round(S.atk*.1);R.bonus.hp+=25;R.flags.startBleed=1;SFX.buff();return "Terms apply. They always apply. You feel stronger and vaguely owned."}},
 {t:"SMASH THE BILLBOARD",f(){if(Math.random()<.5){R.chips+=30;SFX.coin();return "Inside the housing: a hoarded coin purse. The previous vandal's. +30 chips."}return "The billboard screams in ad-copy and dies."}}]},
];

const PERKS=[
{id:"vit",n:"SUBSTRATE DENSITY",d:"+8% max HP per level",max:5},
{id:"off",n:"HOSTILE OPTIMIZATION",d:"+6% ATK & MAG per level",max:5},
{id:"def",n:"PASSIVE AGGRESSION",d:"+6% DEF & RES per level",max:5},
{id:"port",n:"OPEN PORTS",d:"+1 SP regen per level",max:5},
];
function perkCost(l){return (l+1)*80}
