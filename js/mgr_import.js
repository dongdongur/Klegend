/*
 * 내 선수 가져오기 (js/mgr_import.js) — 선수판(K-라이프)에서 은퇴한 선수를 감독판(K-레전드 38)으로 데려와요.
 *  - 이전 코드: "KLP1.<본문>.<체크섬>" 짧은 문자열. 계정·서버 없이 복사/붙여넣기, 같은 브라우저면 링크(manager.html?import=1)로 바로 넘겨요.
 *    체크섬은 글자가 빠지거나 실수로 바뀐 걸 잡는 단순 검사예요(코드를 아주 열심히 뜯어고치면 막을 수는 없어요 → 값 범위는 따로 검사하고 효과도 작게 잡았어요).
 *  - 효과는 모두 '소폭'이에요: ① 전설 감독 보너스(인성→팬 신뢰·선수단 사기 시작값, 전설 등급→언론, 포지션→공격/수비 보정)
 *    ② 후보 영입 목록에 '전설 카드' 1장(은퇴한 선수의 전성기 능력치) ③ 부임 기자회견 질문 1개(골키퍼 출신은 육성 이벤트).
 *  - 선수판은 encode 쪽, 감독판은 decode·apply 쪽을 써요. 감독판 연결 지점(js/game.js)은 KLGameHook 과 KLImport.mgr/offer/note 몇 줄뿐이에요.
 */
(function(){
"use strict";
var VER="KLP1", PEND="kl-import-pending";
var POSKO={GK:"골키퍼",DF:"수비수",MF:"미드필더",FW:"공격수"};
var SUBS={GK:["GK"],DF:["CB","LB","RB"],MF:["CM","AM","DM"],FW:["ST","LW","RW"]};
var SUBKO={GK:"골키퍼",CB:"센터백",LB:"왼쪽 풀백",RB:"오른쪽 풀백",CM:"중앙 미드필더",AM:"공격형 미드필더",DM:"수비형 미드필더",ST:"스트라이커",LW:"왼쪽 윙어",RW:"오른쪽 윙어"};
var GRADES=["S","A","B","C","D"];
var clamp=function(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); };

/* ---------- 코드 만들기 · 읽기 ---------- */
function h53(s,seed){   // 53비트 문자열 해시(cyrb53)
  var h1=0xdeadbeef^seed, h2=0x41c6ce57^seed;
  for(var i=0;i<s.length;i++){ var ch=s.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0);
}
function chk(s){ return h53(s,0x4b4c).toString(36).padStart(11,"0").slice(-9); }
function b64e(str){ return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64d(b){ b=b.replace(/-/g,"+").replace(/_/g,"/"); while(b.length%4) b+="="; return decodeURIComponent(escape(atob(b))); }
function cleanName(n){ return String(n||"").replace(/[\u0000-\u001f<>"'`&\\]/g,"").trim().slice(0,12); }
function ident(info){ return h53(JSON.stringify([info.n,info.p,info.s,info.o,info.a,info.g,info.as,info.c,info.ch,info.ls,info.y]),0x1d).toString(36).padStart(11,"0").slice(-8); }

/* 선수판 상태 → 핵심 정보 (은퇴 화면에서 호출) */
function fromLife(S,L){
  var c=S.career||{}, lg=L.legacy(S), tot={}, pro=0;
  (S.history||[]).forEach(function(h){ if(h.youth||h.military) return; pro++; tot[h.club]=(tot[h.club]||0)+1; });
  var club="", best=0; Object.keys(tot).forEach(function(k){ if(tot[k]>best){ best=tot[k]; club=k; } });
  return {n:cleanName(S.p.name)||"이름 없는 선수", p:S.p.pos, s:S.p.sub, o:Math.round(S.p.peak||0),
    a:c.apps|0, g:c.goals|0, as:c.assists|0, c:c.caps|0, ch:Math.round(L.charOf?L.charOf(S):50),
    gr:L.legacyGrade(lg.total), ls:Math.round(lg.total), cl:String(club||"").slice(0,16),
    t:(S.trophies||[]).filter(function(t){ return !t.youth; }).length, y:pro};
}
function encode(info){
  var a=[VER,info.n,info.p,info.s,info.o,info.a,info.g,info.as,info.c,info.ch,info.gr,info.ls,info.cl,info.t,info.y];
  var body=VER+"."+b64e(JSON.stringify(a));
  return body+"."+chk(body);
}
var E={
  empty:"이전 코드를 붙여 넣어 주세요.",
  notcode:"K-라이프 이전 코드가 아니에요. 선수 키우기 은퇴 화면의 '감독판으로 가져가기'에서 만든 코드를 붙여 넣어 주세요.",
  cut:"코드가 중간에 잘린 것 같아요. 처음(KLP1)부터 끝까지 전부 복사했는지 확인해 주세요.",
  sum:"코드의 글자가 일부 바뀌었거나 빠졌어요. 복사한 코드를 고치지 말고 그대로 붙여 넣어 주세요.",
  val:"코드 안의 선수 정보가 올바르지 않아요. 선수 키우기에서 코드를 다시 만들어 주세요."
};
/* → {ok:true,info,id} 또는 {ok:false,err:"친절한 문구"} */
function decode(raw){
  var s=String(raw||"").replace(/\s+/g,"");
  if(!s) return {ok:false,err:E.empty};
  if(s.indexOf(VER+".")!==0) return {ok:false,err:E.notcode};
  var parts=s.split(".");
  if(parts.length!==3||!parts[1]||!parts[2]) return {ok:false,err:E.cut};
  if(chk(parts[0]+"."+parts[1])!==parts[2].toLowerCase()) return {ok:false,err:E.sum};
  var a; try{ a=JSON.parse(b64d(parts[1])); }catch(e){ return {ok:false,err:E.cut}; }
  if(!Array.isArray(a)||a.length!==15||a[0]!==VER) return {ok:false,err:E.val};
  var info={n:cleanName(a[1]),p:a[2],s:a[3],o:a[4],a:a[5],g:a[6],as:a[7],c:a[8],ch:a[9],gr:a[10],ls:a[11],cl:String(a[12]||"").slice(0,16),t:a[13],y:a[14]};
  var num=function(v,lo,hi){ return typeof v==="number"&&isFinite(v)&&Math.floor(v)===v&&v>=lo&&v<=hi; };
  if(!info.n||!POSKO[info.p]||SUBS[info.p].indexOf(info.s)<0||GRADES.indexOf(info.gr)<0
    ||!num(info.o,30,99)||!num(info.a,0,1500)||!num(info.g,0,1200)||!num(info.as,0,1200)||!num(info.c,0,300)
    ||!num(info.ch,0,100)||!num(info.ls,0,30000)||!num(info.t,0,80)||!num(info.y,0,30)) return {ok:false,err:E.val};
  if(info.p==="GK"&&info.g>40) return {ok:false,err:E.val};
  return {ok:true,info:info,id:ident(info)};
}

/* ---------- 효과 (전부 소폭) ---------- */
function fx(info){
  var ch=info.ch, press={S:6,A:4,B:2,C:1,D:0}[info.gr]||0, fans=0, squad=0;
  if(ch>=60){ fans=Math.min(6,Math.round((ch-50)/8)); squad=Math.min(1,Math.round((ch-50)/40)); }
  else if(ch<35) press-=2;
  var a=0,d=0; if(info.p==="FW") a=.06; else if(info.p==="MF"){ a=.03; d=.03; } else if(info.p==="DF") d=.06; else d=.04;
  return {fans:fans,press:press,squad:squad,att:a,def:d};
}
function lines(info){
  var f=fx(info), out=[];
  if(f.fans||f.squad) out.push("인성 "+info.ch+" → 팬 신뢰 +"+f.fans+", 선수단 사기 +"+f.squad+" (시작값)");
  else if(info.ch<35) out.push("인성 "+info.ch+" → 언론 평가가 조금 깎여서 시작해요");
  else out.push("인성 "+info.ch+" → 팬 신뢰·사기 보너스는 인성 60 이상부터예요");
  if(f.press>0) out.push("전설 등급 "+info.gr+" → 언론 평가 +"+f.press+" (시작값)");
  if(info.p==="FW") out.push("공격수 출신 → 팀 공격 +0.06");
  else if(info.p==="MF") out.push("미드필더 출신 → 팀 공격·수비 각 +0.03");
  else if(info.p==="DF") out.push("수비수 출신 → 팀 수비 +0.06");
  else out.push("골키퍼 출신 → 팀 수비 +0.04, 골키퍼 육성 이벤트(성공하면 수비 +0.03 더)");
  out.push("후보 영입 목록에 전설 카드(OVR "+cardOvr(info)+") 1장이 나와요");
  return out;
}
var CARD_MAX=78;   // 전설 카드 OVR 상한 (골드 등급 안쪽). 밸런스: tools/tests/mgrimport.cjs
function cardOvr(info){ return clamp(info.o,58,CARD_MAX); }

/* ---------- 감독판 쪽: 상태 · 효과 연결 ---------- */
var cardCache={};
function game(){ return window.KLGameHook||null; }
function career(){ var g=game(); var S=g&&g.get(); return S&&S.career?S.career:null; }
function legendCard(im){
  if(cardCache[im.id]) return cardCache[im.id];
  var o=cardOvr(im);
  return cardCache[im.id]={name:im.n,pos:im.p,det:[im.s],ovr:o,ovrS:o,ovrP:o,sq:-1,age:33,legend:true,lid:im.id};
}
/* game.js: 감독 정보에 전설 감독 보정을 얹어요 (core.js mgrFx 가 xAtt·xDef 를 더해요) */
function mgr(m,c){
  if(!m||!c||!c.imp) return m;
  var f=fx(c.imp), gk=c.imp.gkOk?.03:0;
  return Object.assign({},m,{xAtt:f.att,xDef:f.def+gk});
}
/* game.js 후보 영입: 목록의 마지막 칸을 전설 카드로 바꿔요 (고를 때까지 매 라운드 나와요) */
function offer(S,players){
  var c=S&&S.career, im=c&&c.imp; if(!im||im.got||!players||!players.length) return;
  if(S.xi.concat(S.bench).some(function(p){ return p&&p.legend; })){ im.got=true; return; }
  players[players.length-1]=legendCard(im);
}
function note(p){ var c=career(), im=c&&c.imp; if(!im||!p||!p.legend) return "";
  return "전설 카드 · 선수 키우기에서 은퇴한 내 선수예요. 전성기 OVR "+im.o+(im.o>CARD_MAX?" (카드는 "+CARD_MAX+"로 맞춰요)":im.o<58?" (카드는 58로 맞춰요)":"")+" · "+im.a+"경기 "+im.g+"골 "+im.as+"도움"+(im.cl?" · 대표 구단 "+im.cl:"")+" · 전설 등급 "+im.gr; }

/* 부임 기자회견에 질문 1개 (한 커리어에 한 번) */
function legendQ(c){
  var im=c.imp; if(!im||im.evDone) return null; im.evDone=true;
  var who="스포츠일간 박민철 기자";
  var Q={
    FW:{text:"선수 시절 "+im.g+"골을 넣은 공격수 출신이시죠. 감독이 된 지금, 우리 팀 공격은 어떤 색깔로 가나요?",
      answers:[{label:"골이 터지는 팀을 만들겠습니다. 공격은 공격수가 가장 잘 압니다.",f:2,p:1,s:2},{label:"공격수 출신이라는 이름표는 떼겠습니다. 균형부터 보겠습니다.",f:0,p:1,s:1},{label:"한 골이 얼마나 어려운지 압니다. 선수들과 같이 풀겠습니다.",f:1,p:0,s:2}]},
    MF:{text:"중원에서 경기를 읽던 미드필더 출신이시죠. 감독이 된 지금, 팀의 중심은 어디에 두시겠어요?",
      answers:[{label:"허리가 강해야 팀이 삽니다. 중원 싸움에서 밀리지 않겠습니다.",f:2,p:1,s:2},{label:"공수 간격을 좁히는 게 핵심입니다. 모두가 같이 뛰는 축구를 하겠습니다.",f:1,p:1,s:2},{label:"공은 돌리되 서두르지 않겠습니다. 팬들께서도 기다려 주세요.",f:0,p:1,s:1}]},
    DF:{text:"뒷문을 지키던 수비수 출신이시죠. 감독이 된 지금, 이번 시즌 실점 목표가 있으신가요?",
      answers:[{label:"한 경기 한 골 이하로 막겠습니다. 수비는 약속입니다.",f:2,p:1,s:2},{label:"실점을 줄이는 만큼 득점도 늘릴 수 있게 균형을 맞추겠습니다.",f:1,p:1,s:2},{label:"숫자보다 집중력이 먼저입니다. 마지막 1분까지 지키겠습니다.",f:1,p:0,s:2}]},
    GK:{text:"골키퍼 출신이라 후배 골키퍼 육성에 관심이 많으시다고요. 이번 시즌 골키퍼 훈련을 직접 맡으시겠어요?",
      answers:[{label:"직접 맡겠습니다. 매일 골키퍼 훈련을 제가 이끌겠습니다.",chance:70,impGk:true,win:{f:2,p:1,s:3},lose:{f:0,p:0,s:-1},ok:"훈련이 통했어요. 골키퍼 후배들의 반응 속도와 위치 선정이 눈에 띄게 좋아졌어요.",no:"의욕이 앞선 탓에 후배가 지쳐 버렸어요. 그래도 열정은 선수단에 전해졌어요."},
        {label:"골키퍼 코치를 믿고 저는 팀 전체를 보겠습니다.",f:0,p:0,s:1}]}
  }[im.p];
  return {kind:"event",who:who,text:Q.text,answers:Q.answers};
}
function hookPress(){
  var P=window.KLPress; if(!P||P.__imp) return; P.__imp=true;
  var pre=P.pre, apply=P.apply;
  P.pre=function(c){ var qs=pre.apply(this,arguments); try{ var q=legendQ(c); if(q) qs.push(q); }catch(e){} return qs; };
  P.apply=function(c,a){ var r=apply.apply(this,arguments); try{ if(a&&a.impGk&&r&&r.hit&&c.imp) c.imp.gkOk=true; }catch(e){} return r; };
}

/* ---------- 가져오기 ---------- */
function canImport(){
  var g=game(), S=g&&g.get(); if(!S) return {ok:false,why:"게임을 불러오는 중이에요. 잠시 뒤에 다시 눌러 주세요."};
  var c=S.career;
  if(c.imp) return {ok:false,why:"이 커리어에는 이미 전설 선수("+c.imp.n+")가 있어요. 한 커리어에 한 명만 가져올 수 있어요."};
  if(c.no>1||c.history.length||S.done||S.phase!=="draft") return {ok:false,why:"시즌이 이미 시작돼서 지금은 가져올 수 없어요. 새로 시작할 때 가져와 주세요."};
  return {ok:true};
}
function apply(res){
  var chk0=canImport(); if(!chk0.ok) return {ok:false,err:chk0.why};
  var g=game(), S=g.get(), c=S.career, info=res.info;
  c.imp=Object.assign({id:res.id,got:false,evDone:false,gkOk:false},info);
  var f=fx(info); c.rep=c.rep||{fans:50,press:50,squad:50};
  c.rep.fans=clamp(c.rep.fans+f.fans,0,100); c.rep.press=clamp(c.rep.press+f.press,0,100); c.rep.squad=clamp(c.rep.squad+f.squad,0,100);
  try{ localStorage.removeItem(PEND); }catch(e){}
  if(g.renderAll) g.renderAll(); if(g.autoSave) g.autoSave();
  return {ok:true};
}

/* ---------- 화면 ---------- */
var msg="", opened=false;
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function readPending(){ try{ var v=localStorage.getItem(PEND); if(!v) return null; var r=decode(v); if(!r.ok){ localStorage.removeItem(PEND); return null; } return r; }catch(e){ return null; } }
function summary(info,idTag){
  var box=el("div","imp-card");
  var head=el("div","imp-head"); head.append(el("b","imp-name",info.n),el("span","imp-pill",info.gr+" · 커리어 "+info.ls));
  box.appendChild(head);
  box.appendChild(el("p","imp-sub",POSKO[info.p]+" ("+SUBKO[info.s]+") · 전성기 OVR "+info.o+(info.cl?" · "+info.cl:"")));
  box.appendChild(el("p","imp-sub",info.y+"시즌 · "+info.a+"경기 "+info.g+"골 "+info.as+"도움 · 대표팀 "+info.c+"경기 · 우승 "+info.t+"회"));
  return box;
}
function render(){
  var wrap=document.getElementById("impWrap");
  var bar=document.querySelector(".clubbar"); if(!bar) return;
  if(!wrap){ wrap=el("section","panel imp-panel"); wrap.id="impWrap"; wrap.style.marginTop="16px"; bar.insertAdjacentElement("afterend",wrap); }
  var c=career(); wrap.innerHTML="";
  var h=el("div","panel-h"); h.append(el("h2",null,"내 선수 가져오기"),el("span","label",c&&c.imp?"가져옴":"선택")); wrap.appendChild(h);
  if(!c){ return; }
  if(c.imp){
    var im=c.imp; wrap.appendChild(summary(im));
    wrap.appendChild(el("p","hint","전설 감독으로 부임했어요. 이 커리어에 적용되는 효과예요."));
    var ul=el("ul","imp-fx"); lines(im).forEach(function(t){ ul.appendChild(el("li",null,t)); }); wrap.appendChild(ul);
    wrap.appendChild(el("p","hint",im.got?"전설 카드는 이미 스쿼드에 있어요.":"후보 뽑기에서 전설 카드가 나와요. 고르지 않으면 다음 라운드에도 다시 나와요."));
    return;
  }
  var can=canImport();
  if(!can.ok){ wrap.appendChild(el("p","hint",can.why)); return; }
  var pend=readPending(), auto=pend||/[?&]import=1/.test(location.search);
  wrap.appendChild(el("p","hint",(opened||auto)?"선수 키우기에서 은퇴한 내 선수를 전설 감독과 전설 카드로 데려와요. 효과는 소폭이고, 한 커리어에 한 명만 가져올 수 있어요.":"선수 키우기에서 은퇴한 내 선수를 전설 감독과 전설 카드로 데려와요."));
  if(!opened&&!auto){ var op=el("button","btn ghost","내 선수 가져오기 열기"); op.type="button"; op.style.width="100%"; op.onclick=function(){ opened=true; render(); var t=document.getElementById("impCode"); if(t) t.focus(); }; wrap.appendChild(op); return; }
  if(pend){
    var pb=el("div","imp-pend"); pb.appendChild(el("b",null,"방금 은퇴한 선수가 있어요")); pb.appendChild(summary(pend.info));
    var go=el("button","btn go big","이 선수 가져오기"); go.type="button"; go.onclick=function(){ var r=apply(pend); if(!r.ok){ msg=r.err; render(); } };
    pb.appendChild(go); wrap.appendChild(pb);
  }
  var ta=el("textarea","imp-in"); ta.id="impCode"; ta.rows=3; ta.placeholder="이전 코드를 붙여 넣어 주세요 (KLP1.으로 시작해요)"; ta.setAttribute("aria-label","이전 코드"); ta.spellcheck=false; ta.autocapitalize="off"; ta.autocomplete="off";
  wrap.appendChild(ta);
  var row=el("div","imp-row"); var ok=el("button","btn primary","코드로 가져오기"); ok.type="button";
  var out=el("p","imp-msg",msg); out.setAttribute("aria-live","polite");
  ok.onclick=function(){
    var r=decode(ta.value); if(!r.ok){ msg=r.err; out.textContent=msg; out.className="imp-msg bad"; return; }
    var a=apply(r); if(!a.ok){ msg=a.err; out.textContent=msg; out.className="imp-msg bad"; }
  };
  row.appendChild(ok);
  if(navigator.clipboard&&navigator.clipboard.readText){ var pb2=el("button","btn ghost","붙여넣기"); pb2.type="button"; pb2.onclick=function(){ navigator.clipboard.readText().then(function(t){ ta.value=t; ta.focus(); }).catch(function(){ out.textContent="붙여넣기 권한이 없어요. 입력칸을 길게 눌러서 붙여 넣어 주세요."; out.className="imp-msg bad"; }); }; row.appendChild(pb2); }
  wrap.append(row,out);
  if(msg) out.className="imp-msg bad";
  msg="";
}

window.KLImport={cardOvr:cardOvr,encode:encode,decode:decode,fromLife:fromLife,fx:fx,lines:lines,mgr:mgr,offer:offer,note:note,render:render,PEND:PEND,_canImport:canImport,_apply:apply,_hookPress:hookPress};

if(typeof document!=="undefined"&&document.querySelector&&document.querySelector(".clubbar")){   // 감독판에서만
  hookPress(); render();
  try{ if(/[?&]import=1/.test(location.search)){ var w=document.getElementById("impWrap"); if(w) setTimeout(function(){ w.scrollIntoView({block:"center"}); },80); } }catch(e){}
}
})();
