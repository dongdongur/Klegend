/* 꾸미기 (js/life/cosmetics.js) — 도트 선수 · 액자 · 은퇴 카드 · 엠블럼 슬롯
 * 카탈로그(L.COSMETICS)와 해금 규칙, 장착 상태(localStorage "klife-cos"), 후원자 코드 검증, 은퇴 카드 이미지(canvas)를 한곳에 모았어요.
 * 해금 방식은 세 가지예요: free(기본) · achv(게임 기록으로 해금) · supporter(후원자 코드). 결제는 아직 없어요.
 * 메인(index.html)에서도 쓰도록 window.LIFE 가 없으면 빈 객체로 시작해요. 실제 선수·구단 이름은 이 파일에 쓰지 않아요. */
(function(){
"use strict";
const L=window.LIFE||(window.LIFE={});
const KEY="klife-cos";
const rd=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const en=()=>window.KL_LANG==="en";

/* ---------- 후원자 코드: KLS-XXXXXX-YYYY (앞 6자 + 검사 4자). 클라이언트에서 검증해요 (tools/gen_supporter_code.cjs 와 같은 식) ---------- */
const B32="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function fnv(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function checksum(body){ let h=fnv("kl|"+body+"|sup1"); h=Math.imul(h^(h>>>15),2246822519)>>>0; let o=""; for(let i=0;i<4;i++){ o+=B32[h&31]; h=h>>>5; if(i===1) h=(h^fnv(body+"x"))>>>0; } return o; }
function codeParts(raw){ const s=String(raw||"").toUpperCase().replace(/[\s\-_]/g,""); const m=s.match(/^KLS([A-Z2-9]{6})([A-Z2-9]{4})$/); return m?{body:m[1],chk:m[2]}:null; }
function codeOk(raw){ const p=codeParts(raw); return !!p&&checksum(p.body)===p.chk; }
function codeNorm(raw){ const p=codeParts(raw); return p?"KLS-"+p.body+"-"+p.chk:""; }

/* ---------- 카탈로그 ---------- */
const F={kind:"free"}, SP={kind:"supporter"};
const A=(k,n,text)=>({kind:"achv",k,n,text});
const I=(id,type,name,desc,unlock,x)=>Object.assign({id,type,name,desc,unlock},x||{});
const TYPES=[["hair","머리 모양","player"],["hcolor","머리색","player"],["band","헤어밴드","player"],["glasses","안경","player"],["captain","주장 완장","player"],["pattern","유니폼 무늬","player"],["frame","액자","frame"],["card","은퇴 카드","card"],["emblem","엠블럼","emblem"]];
const GROUPS=[["player","도트 선수"],["frame","액자"],["card","은퇴 카드"],["emblem","엠블럼"]];
const C=[
 I("hair_auto","hair","기본","이름으로 정해진 머리예요.",F,{o:null,def:1}),
 I("hair_short","hair","짧은 머리","단정한 기본 머리예요.",F,{o:0}),
 I("hair_side","hair","옆으로 넘긴 머리","앞머리를 한쪽으로 넘겼어요.",F,{o:1}),
 I("hair_long","hair","긴 옆머리","귀를 덮는 머리예요.",F,{o:2}),
 I("hair_spiky","hair","삐죽 머리","위로 뾰족하게 세웠어요.",F,{o:3}),
 I("hair_buzz","hair","스포츠머리","운동선수다운 짧은 머리예요.",F,{o:8}),
 I("hair_mohawk","hair","모히칸","가운데만 높이 세웠어요.",A("dex",10,"이벤트 도감 10종 만나기"),{o:4}),
 I("hair_afro","hair","풍성한 곱슬","부풀린 동그란 머리예요.",A("careers",3,"은퇴한 선수 3명 만들기"),{o:5}),
 I("hair_bun","hair","올림머리","머리를 위로 묶었어요.",A("caps",30,"한 선수로 대표팀 30경기 뛰기"),{o:6}),
 I("hair_pony","hair","꽁지머리","뒤로 묶은 머리가 흔들려요.",A("goals",100,"한 선수로 통산 100골 넣기"),{o:7}),
 I("hair_bald","hair","민머리","반짝이는 민머리예요.",A("careers",10,"은퇴한 선수 10명 만들기"),{o:9}),
 I("hcolor_auto","hcolor","기본","이름으로 정해진 머리색이에요.",F,{c:null,def:1}),
 I("hcolor_black","hcolor","새까만 머리","진한 검정이에요.",F,{c:"#14110f"}),
 I("hcolor_brown","hcolor","밤색","따뜻한 갈색이에요.",F,{c:"#6b4528"}),
 I("hcolor_blond","hcolor","금발","우승 5번이면 어울려요.",A("trophies",5,"한 선수로 우승 5회 달성"),{c:"#e3c15a"}),
 I("hcolor_red","hcolor","붉은 머리","불꽃 같은 색이에요.",A("dex",20,"이벤트 도감 20종 만나기"),{c:"#b5452a"}),
 I("hcolor_silver","hcolor","은발","에이스의 상징이에요.",A("peak",85,"최고 OVR 85 이상 선수 만들기"),{c:"#c8ccd6"}),
 I("hcolor_green","hcolor","초록 머리","축구 상식에 밝은 사람만 써요.",A("quiz",8,"축구 상식 퀴즈 8점 이상"),{c:"#3fbf7a"}),
 I("hcolor_blue","hcolor","파란 머리","후원자 전용 염색이에요.",SP,{c:"#3f7fe0"}),
 I("hcolor_pink","hcolor","분홍 머리","후원자 전용 염색이에요.",SP,{c:"#e2679e"}),
 I("hcolor_purple","hcolor","보라 머리","후원자 전용 염색이에요.",SP,{c:"#8e5cd6"}),
 I("band_none","band","없음","",F,{def:1}),
 I("band_white","band","흰 밴드","깔끔한 흰색 밴드예요.",F,{o:"white"}),
 I("band_kit","band","구단색 밴드","소속 구단 색으로 물들어요.",A("careers",1,"첫 선수 은퇴시키기"),{o:"kit"}),
 I("band_gold","band","금빛 밴드","반짝이는 금색이에요.",A("trophies",10,"한 선수로 우승 10회 달성"),{o:"gold"}),
 I("band_neon","band","네온 밴드","형광 초록이 빛나요.",SP,{o:"neon"}),
 I("glasses_none","glasses","없음","",F,{def:1}),
 I("glasses_round","glasses","동그란 안경","지적인 분위기예요.",A("dex",5,"이벤트 도감 5종 만나기"),{o:"round"}),
 I("glasses_goggle","glasses","스포츠 고글","경기용 보호 안경이에요.",A("careers",5,"은퇴한 선수 5명 만들기"),{o:"goggle"}),
 I("glasses_shade","glasses","선글라스","시크한 검은 렌즈예요.",A("peak",80,"최고 OVR 80 이상 선수 만들기"),{o:"shade"}),
 I("glasses_neon","glasses","네온 선글라스","빛나는 후원자 전용이에요.",SP,{o:"neon"}),
 I("captain_none","captain","없음","",F,{def:1}),
 I("captain_gold","captain","금색 완장","주장다운 노란 완장이에요.",A("trophies",3,"한 선수로 우승 3회 달성"),{o:"gold"}),
 I("captain_red","captain","붉은 완장","월드컵 우승 선수의 완장이에요.",A("wc",1,"월드컵 우승 경험하기"),{o:"red"}),
 I("captain_rainbow","captain","무지개 완장","후원자 전용이에요.",SP,{o:"rainbow"}),
 I("pattern_plain","pattern","무지","구단 색 한 가지예요.",F,{def:1}),
 I("pattern_stripe","pattern","세로줄","시원한 세로 줄무늬예요.",F,{o:"stripe"}),
 I("pattern_hoop","pattern","가로줄","옛 클래식 유니폼이에요.",A("careers",2,"은퇴한 선수 2명 만들기"),{o:"hoop"}),
 I("pattern_check","pattern","체크","바둑판 무늬예요.",A("dex",15,"이벤트 도감 15종 만나기"),{o:"check"}),
 I("pattern_sash","pattern","대각선 띠","어깨에서 허리로 가로지르는 띠예요.",A("jersey",1,"영구결번을 받은 선수 만들기"),{o:"sash"}),
 I("pattern_half","pattern","반반","좌우를 둘로 나눴어요.",SP,{o:"half"}),
 I("frame_none","frame","없음","액자 없이 깔끔하게 보여요.",F,{def:1}),
 I("frame_pixel","frame","도트 액자","네모난 도트 테두리예요.",F,{rings:["#2a1a4a","#ffcf4a","#2a1a4a"],sq:1}),
 I("frame_silver","frame","은빛 액자","첫 은퇴를 기념해요.",A("careers",1,"첫 선수 은퇴시키기"),{rings:["#6a7385","#e6eaf3"],glow:"rgba(220,230,255,.35)"}),
 I("frame_gold","frame","금빛 액자","영구결번의 영광이에요.",A("jersey",1,"영구결번을 받은 선수 만들기"),{rings:["#7a5a10","#ffcf4a"],glow:"rgba(255,207,74,.5)"}),
 I("frame_laurel","frame","월계수 액자","월드컵 우승자에게 어울려요.",A("wc",1,"월드컵 우승 경험하기"),{rings:["#2d6a3e","#e8c35a"],orn:"laurel",glow:"rgba(120,200,120,.35)"}),
 I("frame_neon","frame","네온 액자","어둠 속에서 빛나요.",SP,{rings:["#0b3b2c","#19f2a3"],glow:"rgba(25,242,163,.6)",anim:1}),
 I("frame_royal","frame","왕실 액자","보라와 금빛이 어우러져요.",SP,{rings:["#4b2a8a","#ffe9a8","#b07cff"],glow:"rgba(176,124,255,.5)",anim:1}),
 I("card_night","card","밤하늘","기본 남색 카드예요.",F,{def:1,bg:["#16224d","#0b1230"],acc:"#19f2a3",ink:"#eaf0ff",sub:"#8d9bc4"}),
 I("card_grass","card","잔디 구장","초록 잔디 줄무늬예요.",F,{bg:["#1f6b3a","#0f3d22"],acc:"#ffe28a",ink:"#f3fff3",sub:"#b9e2c3",pat:"stripes"}),
 I("card_sunset","card","노을","은퇴하는 날의 노을이에요.",A("careers",3,"은퇴한 선수 3명 만들기"),{bg:["#ff8a4c","#c2386b","#3a1d6e"],acc:"#fff1b8",ink:"#ffffff",sub:"#ffd9cf"}),
 I("card_gold","card","황금 카드","황금공 수상자의 카드예요.",A("ballon",1,"황금공 수상하기"),{bg:["#fff0b3","#e3b53d","#8a6410"],acc:"#5b3a00",ink:"#2a1a00",sub:"#6a4a10"}),
 I("card_ice","card","얼음 카드","차가운 파랑이에요.",A("dex",30,"이벤트 도감 30종 만나기"),{bg:["#e7f6ff","#9fd4f5","#3a79b8"],acc:"#0d3b6e",ink:"#0b2545",sub:"#2d5b8c"}),
 I("card_aurora","card","오로라","후원자 전용 카드예요.",SP,{bg:["#0b1a3a","#14665f","#6a2b9a"],acc:"#9cffd8",ink:"#f0fff9",sub:"#a8d8d0"}),
 I("card_arcade","card","오락실","도트 격자 카드예요. 후원자 전용이에요.",SP,{bg:["#1a1030","#2b1459","#1a1030"],acc:"#ffcf4a",ink:"#ffffff",sub:"#c0a8ff",pat:"grid"}),
 I("emblem_none","emblem","없음","표시하지 않아요.",F,{def:1}),
 I("emblem_shield","emblem","방패","든든한 방패예요.",F,{d:"M12 2L21 5V12C21 17 17 20.5 12 22C7 20.5 3 17 3 12V5Z",col:"#6aa8ff"}),
 I("emblem_star","emblem","별","반짝이는 별이에요.",F,{d:"M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z",col:"#ffcf4a"}),
 I("emblem_ball","emblem","축구공","동그란 축구공이에요.",F,{d:"M12 2a10 10 0 1 0 .001 0z",d2:"M12 7.3l3.5 2.5-1.3 4.1H9.8L8.5 9.8z",col:"#f4f4f4"}),
 I("emblem_bolt","emblem","번개","빠른 발을 닮았어요.",A("careers",2,"은퇴한 선수 2명 만들기"),{d:"M13 2L4 14h6l-1 8 9-12h-6z",col:"#27d7ff"}),
 I("emblem_crown","emblem","왕관","우승을 많이 한 선수에게 어울려요.",A("trophies",8,"한 선수로 우승 8회 달성"),{d:"M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z",col:"#ffcf4a"}),
 I("emblem_flame","emblem","불꽃","골을 쏟아낸 선수의 불꽃이에요.",A("goals",150,"한 선수로 통산 150골 넣기"),{d:"M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z",col:"#ff7a3a"}),
 I("emblem_wreath","emblem","월계관","월드컵 우승자의 표식이에요.",A("wc",1,"월드컵 우승 경험하기"),{d:"M12 21C6 19 3 14 4 7c2 1 3 3 3 5 0-3 1-6 5-8 4 2 5 5 5 8 0-2 1-4 3-5 1 7-2 12-8 14z",col:"#6fd08c"}),
 I("emblem_diamond","emblem","다이아몬드","후원자 전용이에요.",SP,{d:"M12 2l8 7-8 13L4 9z",d2:"M4 9h16M12 2l-3 7 3 13 3-13z",col:"#8be9ff"}),
 I("emblem_heart","emblem","하트","후원자 전용이에요.",SP,{d:"M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z",col:"#ff6f91"})
];
L.COSMETICS=C;
L.COS_TYPES=TYPES; L.COS_GROUPS=GROUPS;
const BY={}; C.forEach(x=>{ BY[x.id]=x; });
const DEF={}; C.forEach(x=>{ if(x.def) DEF[x.type]=x.id; });

/* ---------- 기록으로 해금: 지금까지 은퇴시킨 선수들의 기록 중 최댓값 ---------- */
function stats(){
  const hof=Array.isArray(rd("klife-hof"))?rd("klife-hof"):[], dex=rd("klife-dex")||{};
  const mx=f=>hof.reduce((m,x)=>Math.max(m,+(x&&x[f])||0),0); let quiz=0; try{ quiz=parseInt(localStorage.getItem("klife-quizbest")||"0",10)||0; }catch(e){}
  return {careers:hof.length,dex:Object.keys(dex).filter(k=>dex[k]).length,caps:mx("caps"),goals:mx("goals"),trophies:mx("trophies"),jersey:mx("jersey"),wc:mx("wc"),ballon:mx("ballon"),peak:mx("peak"),quiz};
}

/* ---------- 상태 ---------- */
function load(){ const s=rd(KEY)||{}; const codes=(Array.isArray(s.codes)?s.codes:[]).filter(codeOk).filter((c,i,a)=>a.indexOf(c)===i); return {eq:(s.eq&&typeof s.eq==="object")?s.eq:{},codes,sup:codes.length>0}; }
function write(st){ try{ localStorage.setItem(KEY,JSON.stringify({v:1,eq:st.eq,codes:st.codes,sup:st.codes.length>0})); }catch(e){} if(typeof L.onCosChange==="function"){ try{ L.onCosChange(); }catch(e){} } }
function isSupporter(){ return load().sup; }
function unlock(id){
  const it=BY[id]; if(!it) return {ok:false,why:""}; const u=it.unlock;
  if(u.kind==="free") return {ok:true,why:""};
  if(u.kind==="supporter"){ const ok=isSupporter(); return {ok,why:ok?"":"후원자 코드를 입력하면 열려요"}; }
  const s=stats(), cur=s[u.k]||0; return {ok:cur>=u.n,why:cur>=u.n?"":u.text,cur,need:u.n};
}
function eq(type){ const st=load(), id=st.eq[type]; if(id&&BY[id]&&BY[id].type===type&&unlock(id).ok) return id; return DEF[type]; }
function eqAll(){ const o={}; TYPES.forEach(t=>{ o[t[0]]=eq(t[0]); }); return o; }
function equip(id){ const it=BY[id]; if(!it) return false; if(!unlock(id).ok) return false; const st=load(); st.eq[it.type]=id; write(st); return true; }
function redeem(raw){
  const code=codeNorm(raw); if(!String(raw||"").trim()) return {ok:false,msg:"코드를 입력해 주세요."};
  if(!code) return {ok:false,msg:"코드 모양이 달라요. 알려 드린 코드를 그대로 붙여 넣어 주세요."};
  if(!codeOk(code)) return {ok:false,msg:"확인되지 않는 코드예요. 글자를 다시 확인해 주세요."};
  const st=load(); if(st.codes.includes(code)) return {ok:true,msg:"이미 등록된 코드예요. 후원자 꾸미기가 열려 있어요.",dup:true};
  st.codes.push(code); write(st); return {ok:true,msg:"후원자 코드를 확인했어요! 후원자 꾸미기가 모두 열렸고 광고도 꺼졌어요."};
}
function progressText(id){ const u=unlock(id); if(u.ok||u.need==null) return ""; return u.cur+"/"+u.need; }

/* ---------- 도트 선수에 쓸 옵션 ---------- */
function pixOpts(eqs){
  eqs=eqs||eqAll(); const g=t=>BY[eqs[t]]||{};
  const o={}; const h=g("hair"); if(h.o!=null) o.hs=h.o; const c=g("hcolor"); if(c.c) o.hc=c.c;
  const b=g("band"); if(b.o) o.band=b.o; const gl=g("glasses"); if(gl.o) o.gl=gl.o; const cp=g("captain"); if(cp.o) o.cap=cp.o; const pt=g("pattern"); if(pt.o) o.pat=pt.o;
  return o;
}
L.cosPix=function(eqs){ return pixOpts(eqs); };

/* ---------- 액자 ---------- */
function frameOf(id){ const f=BY[id||eq("frame")]; return f&&f.type==="frame"&&f.rings?f:null; }
function frameStyle(id){ const f=frameOf(id); if(!f) return ""; const w=3, n=f.rings.length; const sh=f.rings.map((c,i)=>"0 0 0 "+(w*(i+1))+"px "+c); if(f.glow) sh.push("0 0 20px "+(w*n)+"px "+f.glow); return "box-shadow:"+sh.join(",")+" !important;margin:"+(w*n+3)+"px !important;"+(f.sq?"border-radius:4px !important;":""); }
function frameShadow(id){ const f=frameOf(id); if(!f) return ""; return "box-shadow:"+f.rings.map((c,i)=>"0 0 0 "+(2*(i+1))+"px "+c).join(",")+";"; }
function frameInset(id){ const f=frameOf(id); if(!f) return ""; return "box-shadow:"+f.rings.slice().reverse().map((c,i)=>"inset 0 0 0 "+(3*(f.rings.length-i))+"px "+c).join(",")+";"; }
function ornHtml(id){ const f=frameOf(id); return f&&f.orn==="laurel"?'<i class="cf-orn l" aria-hidden="true">'+LAUREL+'</i><i class="cf-orn r" aria-hidden="true">'+LAUREL+'</i>':""; }
function frameClass(id){ const f=frameOf(id); return f?"cf"+(f.anim?" cf-anim":""):""; }
const LAUREL='<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="M6 36C6 22 14 10 30 4" fill="none" stroke="#e8c35a" stroke-width="2" stroke-linecap="round"/><g fill="#6fd08c"><ellipse cx="9" cy="28" rx="3.2" ry="6" transform="rotate(-25 9 28)"/><ellipse cx="12" cy="19" rx="3.2" ry="6" transform="rotate(-5 12 19)"/><ellipse cx="19" cy="12" rx="3.2" ry="6" transform="rotate(30 19 12)"/><ellipse cx="27" cy="9" rx="3" ry="5" transform="rotate(55 27 9)"/></g></svg>';
function decorate(el,id){
  if(!el) return; const f=frameOf(id); el.classList.remove("cf","cf-anim"); el.querySelectorAll(":scope>.cf-orn").forEach(x=>x.remove());
  if(!f){ el.style.removeProperty("box-shadow"); el.style.removeProperty("margin"); el.style.removeProperty("border-radius"); return; }
  frameClass(id).split(" ").forEach(c=>{ if(c) el.classList.add(c); });
  frameStyle(id).split(";").forEach(d=>{ const i=d.indexOf(":"); if(i<0) return; const p=d.slice(0,i).trim(), v=d.slice(i+1).replace("!important","").trim(); el.style.setProperty(p,v,"important"); });
  if(f.orn==="laurel"){ el.insertAdjacentHTML("afterbegin",'<i class="cf-orn l" aria-hidden="true">'+LAUREL+'</i><i class="cf-orn r" aria-hidden="true">'+LAUREL+'</i>'); }
}
/* 메인 화면: 내가 장착한 액자를 영구결번 전시관과 명예의 전당 카드에 씌워요 */
function applyMain(){ try{ const id=eq("frame"); document.querySelectorAll("section.jersey,section.board").forEach(el=>decorate(el,id)); }catch(e){} }
/* 서버에 등록할 때 같이 보낼 값(남이 볼 수 있는 것은 액자·카드·엠블럼뿐) */
function publicPick(){ const e=eqAll(); return {frame:e.frame,card:e.card,emblem:e.emblem}; }
function safeFrameId(id){ return BY[id]&&BY[id].type==="frame"?id:null; }

/* ---------- 엠블럼(우리가 그린 단순 도형) ---------- */
function emblemSvg(id,size,color){
  const e=BY[id||eq("emblem")]; if(!e||e.type!=="emblem"||!e.d) return ""; const s=size||16, col=color||e.col;
  return '<svg class="cemb" viewBox="0 0 24 24" width="'+s+'" height="'+s+'" aria-hidden="true" style="vertical-align:-'+Math.round(s*.14)+'px"><path d="'+e.d+'" fill="'+col+'" stroke="rgba(0,0,0,.45)" stroke-width="1.2" stroke-linejoin="round"/>'+(e.d2?'<path d="'+e.d2+'" fill="'+(e.id==="emblem_diamond"?"none":"rgba(15,20,40,.85)")+'" stroke="'+(e.id==="emblem_diamond"?"rgba(15,20,40,.5)":"none")+'" stroke-width="1"/>':"")+'</svg>';
}
function cardBg(id){ const c=BY[id||eq("card")]; if(!c||c.type!=="card") return ""; return "linear-gradient(165deg,"+c.bg.join(",")+")"; }

/* ---------- 은퇴 카드 이미지 (canvas) ----------
 * info: {name,pos,club,chain,ovr,apps,goals,assists,caps,grade,score,titles[],trophies,spriteUrl,eqs:{frame,card,emblem},year}
 * 선수 이름은 사용자가 지은 그대로, 나머지 글(구단·칭호)은 화면에 보이는 값(가상 이름 변환 후)을 써요. */
const LB={ko:{rt:"RETIREMENT",peak:"최고 OVR",grade:"커리어 등급",apps:"출전",goals:"골",assists:"도움",caps:"대표팀",tr:"우승",more:"외",foot:"K-레전드 · K-라이프",pt:"점"},en:{rt:"RETIREMENT",peak:"PEAK OVR",grade:"CAREER GRADE",apps:"Apps",goals:"Goals",assists:"Assists",caps:"Caps",tr:"Titles",more:"+",foot:"K-Legend · K-Life",pt:"pts"}};
function loadImg(url){ return new Premaso((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=url; }); }
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function fit(g,txt,max,start,weight){ let sz=start; do{ g.font=weight+" "+sz+"px 'Black Han Sans','Noto Sans KR',system-ui,sans-serif"; if(g.measureText(txt).width<=max) break; sz-=2; }while(sz>20); return sz; }
function drawCard(info){
  const lb=en()?LB.en:LB.ko, W=720, H=1000, cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
  const eqs=Object.assign({},eqAll(),info.eqs||{}), card=BY[eqs.card]&&BY[eqs.card].type==="card"?BY[eqs.card]:BY.card_night, fr=frameOf(eqs.frame), rings=fr?fr.rings:[], w=6, m=rings.length*w+(rings.length?6:0);
  const x0=m, y0=m, cw=W-m*2, ch=H-m*2, R=fr&&fr.sq?10:34;
  g.fillStyle="rgba(0,0,0,0)"; g.clearRect(0,0,W,H);
  /* 액자(바깥에서 안쪽으로) */
  if(fr&&fr.glow){ g.save(); g.shadowColor=fr.glow.replace(/[\d.]+\)$/,"1)"); g.shadowBlur=26; rr(g,x0-rings.length*w,y0-rings.length*w,cw+rings.length*w*2,ch+rings.length*w*2,R+rings.length*w); g.fillStyle=rings[rings.length-1]; g.fill(); g.restore(); }
  for(let i=rings.length;i>=1;i--){ g.fillStyle=rings[i-1]; rr(g,x0-i*w,y0-i*w,cw+i*w*2,ch+i*w*2,R+i*w); g.fill(); }
  /* 카드 바탕 */
  const gr=g.createLinearGradient(x0,y0,x0+cw*.45,y0+ch); card.bg.forEach((c,i)=>gr.addColorStop(card.bg.length===1?0:i/(card.bg.length-1),c));
  g.save(); rr(g,x0,y0,cw,ch,R); g.clip(); g.fillStyle=gr; g.fillRect(x0,y0,cw,ch);
  if(card.pat==="stripes"){ g.fillStyle="rgba(255,255,255,.06)"; for(let i=0;i<10;i+=2) g.fillRect(x0+i*cw/10,y0,cw/10,ch); }
  if(card.pat==="grid"){ g.strokeStyle="rgba(255,207,74,.12)"; g.lineWidth=2; for(let x=x0;x<x0+cw;x+=36){ g.beginPath(); g.moveTo(x,y0); g.lineTo(x,y0+ch); g.stroke(); } for(let y=y0;y<y0+ch;y+=36){ g.beginPath(); g.moveTo(x0,y); g.lineTo(x0+cw,y); g.stroke(); } }
  const sh=g.createRadialGradient(W/2,300,20,W/2,300,380); sh.addColorStop(0,"rgba(255,255,255,.22)"); sh.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=sh; g.fillRect(x0,y0,cw,ch);
  g.restore();
  const cx=W/2; g.textAlign="center"; g.textBaseline="alphabetic";
  g.fillStyle=card.acc; g.font="700 26px Oswald,'Noto Sans KR',sans-serif"; g.fillText(lb.rt,cx,y0+62);
  /* 도트 선수 */
  const sp=info.sprite; if(sp){ g.imageSmoothingEnabled=false; const sw=16*13, shh=24*13; g.fillStyle="rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(cx,y0+90+shh-8,sw*.42,12,0,0,Math.PI*2); g.fill(); g.drawImage(sp,cx-sw/2,y0+90,sw,shh); }
  /* 이름 */
  const ny=y0+470; g.fillStyle=card.ink; const nsz=fit(g,info.name,cw-80,66,"400"); g.fillText(info.name,cx,ny);
  /* 포지션 · 구단 (+엠블럼) */
  const sub=(info.pos?info.pos+" · ":"")+(info.club||""); g.font="500 30px 'Noto Sans KR',sans-serif"; let ssz=30; while(g.measureText(sub).width>cw-150&&ssz>18){ ssz-=2; g.font="500 "+ssz+"px 'Noto Sans KR',sans-serif"; }
  const em=BY[eqs.emblem]; const hasEm=em&&em.type==="emblem"&&em.d, tw=g.measureText(sub).width, ex=cx-(tw+(hasEm?44:0))/2;
  g.fillStyle=card.sub; g.textAlign="left"; g.fillText(sub,ex+(hasEm?44:0),ny+50);
  if(hasEm){ g.save(); g.translate(ex,ny+50-30); g.scale(1.5,1.5); const p=new Path2D(em.d); g.fillStyle=em.col; g.fill(p); g.lineWidth=1.2; g.strokeStyle="rgba(0,0,0,.45)"; g.stroke(p); if(em.d2){ const p2=new Path2D(em.d2); if(em.id==="emblem_diamond"){ g.strokeStyle="rgba(15,20,40,.5)"; g.lineWidth=1; g.stroke(p2); } else { g.fillStyle="rgba(15,20,40,.85)"; g.fill(p2); } } g.restore(); }
  g.textAlign="center";
  /* 최고 OVR · 등급 */
  const by=y0+560, bw=(cw-100)/2;
  [[lb.peak,String(info.ovr),x0+40],[lb.grade,info.grade+"",x0+60+bw]].forEach(([lab,val,bx],k)=>{ g.fillStyle="rgba(0,0,0,.18)"; rr(g,bx,by,bw,150,22); g.fill(); g.strokeStyle=card.acc; g.globalAlpha=.55; g.lineWidth=2; rr(g,bx,by,bw,150,22); g.stroke(); g.globalAlpha=1;
    g.fillStyle=card.sub; g.font="600 22px 'Noto Sans KR',sans-serif"; g.fillText(lab,bx+bw/2,by+36); g.fillStyle=card.acc; g.font="700 "+(k?"84":"84")+"px Oswald,'Black Han Sans',sans-serif"; g.fillText(val,bx+bw/2,by+120);
    if(k&&info.score!=null){ g.fillStyle=card.sub; g.font="500 20px 'Noto Sans KR',sans-serif"; g.fillText(info.score+" "+lb.pt,bx+bw/2+bw*.34,by+120); } });
  /* 기록 4칸 */
  const sy=y0+745, cols=[[lb.apps,info.apps],[lb.goals,info.goals],[lb.assists,info.assists],[lb.caps,info.caps]], cwid=(cw-80)/4;
  cols.forEach(([lab,val],i)=>{ const sx=x0+40+cwid*i+cwid/2; g.fillStyle=card.ink; g.font="700 48px Oswald,'Black Han Sans',sans-serif"; g.fillText(String(val),sx,sy+30); g.fillStyle=card.sub; g.font="500 20px 'Noto Sans KR',sans-serif"; g.fillText(lab,sx,sy+62); });
  /* 칭호 */
  const tl=(info.titles||[]).slice(0,3); let ty=y0+850; g.font="700 24px 'Noto Sans KR',sans-serif";
  const widths=tl.map(t=>g.measureText(t).width+36); let tot=widths.reduce((a,b)=>a+b,0)+(tl.length-1)*12; let scale=1; if(tot>cw-60) scale=(cw-60)/tot;
  let tx=cx-tot*scale/2; tl.forEach((t,i)=>{ const pw=widths[i]*scale; g.fillStyle="rgba(0,0,0,.22)"; rr(g,tx,ty,pw,46,23); g.fill(); g.strokeStyle=card.acc; g.globalAlpha=.7; g.lineWidth=1.5; rr(g,tx,ty,pw,46,23); g.stroke(); g.globalAlpha=1; g.fillStyle=card.ink; g.save(); g.beginPath(); g.rect(tx,ty,pw,46); g.clip(); g.font=Math.round(24*scale)+"px 'Noto Sans KR',sans-serif"; g.fillText(t,tx+pw/2,ty+31); g.restore(); tx+=pw+12*scale; });
  g.fillStyle=card.sub; g.globalAlpha=.8; g.font="500 20px 'Noto Sans KR',sans-serif"; g.fillText(lb.foot+(info.year?" · "+info.year:""),cx,y0+ch-26); g.globalAlpha=1;
  return cv;
}
function makeCard(info){
  const run=(img)=>{ const o=Object.assign({},info); o.sprite=img; return drawCard(o); };
  if(!info.spriteUrl) return Promise.resolve(run(null));
  return loadImg(info.spriteUrl).then(run,()=>run(null));
}

const API={types:TYPES,groups:GROUPS,items:C,by:id=>BY[id],stats,unlock,eq,eqAll,equip,redeem,progressText,isSupporter,pixOpts,frameStyle,frameShadow,frameInset,ornHtml,frameClass,frameOf,decorate,applyMain,publicPick,safeFrameId,emblemSvg,cardBg,makeCard,drawCard,codeOk,codeNorm,checksum};
L.cos=API; window.KL_COS=API;
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>{ if(document.querySelector("section.jersey")) applyMain(); }); else if(document.querySelector("section.jersey")) applyMain();
})();
