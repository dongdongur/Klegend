/*
 * 시네마틱 연출 (js/fx.js)
 * 큰 업적(우승·유럽컵·월드컵·신기록·은퇴 등)을 영상처럼 보여 줘요.
 *  - 위아래 레터박스가 내려오고 → 카메라 플래시 → 스포트라이트가 훑고 → 글자가 한 글자씩 떠오르고 → 종이 꽃가루가 쏟아져요.
 *  - 화면을 누르거나 '건너뛰기'로 넘길 수 있고, 몇 초 뒤엔 저절로 닫혀요. 움직임을 줄이는 설정이면 정적인 카드로 보여 줘요.
 * 사용: KL_FX.cine({kind:"win"|"euro"|"world"|"record"|"retire"|"promo", kicker, title, sub, lines:[...], icon}, onDone)
 */
(function(){
"use strict";
const KINDS={
  win:{icon:"🏆",ac:"#f0bd4f",conf:["#f0bd4f","#f3ecd8","#ec6a55","#86d7c0"],dur:6400},
  euro:{icon:"⭐",ac:"#9ec8ff",conf:["#9ec8ff","#f0bd4f","#f3ecd8","#ffffff"],dur:7200},
  world:{icon:"🌍",ac:"#f0bd4f",conf:["#f0bd4f","#86d7c0","#ec6a55","#9ec8ff","#f3ecd8"],dur:7600},
  record:{icon:"📈",ac:"#86d7c0",conf:["#86d7c0","#f3ecd8","#f0bd4f"],dur:5600},
  retire:{icon:"🎽",ac:"#f3ecd8",conf:[],dur:6400},
  promo:{icon:"🚀",ac:"#86d7c0",conf:["#86d7c0","#f0bd4f","#f3ecd8"],dur:5200},
  flight:{icon:"✈️",ac:"#9ec8ff",conf:[],dur:7600},
  arrive:{icon:"🏟️",ac:"#f0bd4f",conf:["#f0bd4f","#f3ecd8","#ec6a55"],dur:7800},
  golden:{icon:"🌟",ac:"#ffd45a",conf:["#ffd45a","#ffffff","#9ec8ff","#f3ecd8"],dur:7000},
  paper:{icon:"📰",ac:"#d8c79a",conf:[],dur:8600}
};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let busy=false;
function confetti(cv,colors,ms){
  if(!colors.length) return; const ctx=cv.getContext("2d"); const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=cv.width=innerWidth*dpr, H=cv.height=innerHeight*dpr; cv.style.width=innerWidth+"px"; cv.style.height=innerHeight+"px";
  const N=Math.round(Math.min(160,innerWidth/3)); const P=[]; const start=performance.now();
  for(let i=0;i<N;i++) P.push({x:Math.random()*W,y:-Math.random()*H*.6,w:(6+Math.random()*7)*dpr,h:(10+Math.random()*10)*dpr,vx:(Math.random()-.5)*2.2*dpr,vy:(2.2+Math.random()*3.2)*dpr,r:Math.random()*6.28,vr:(Math.random()-.5)*.25,c:colors[i%colors.length],d:Math.random()*1000});
  (function tick(t){ const el=t-start; if(el>ms||!cv.isConnected) return; ctx.clearRect(0,0,W,H);
    P.forEach(p=>{ p.x+=p.vx+Math.sin((el+p.d)/420)*.8*dpr; p.y+=p.vy; p.r+=p.vr; if(p.y>H+20){ p.y=-20; p.x=Math.random()*W; }
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.globalAlpha=Math.max(0,Math.min(1,1-(el-ms+900)/900)); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.r*1.3)+.2)); ctx.restore(); });
    requestAnimationFrame(tick); })(start);
}
/* 신문 기사: 한 장이 빙글 돌며 날아들고, 머리기사·사진·본문이 차례로 나타나요 */
function paperHtml(o,esc){ const p=o.paper||{};
  const body=(o.lines||[]).map((s,i)=>'<p style="animation-delay:'+(2.6+i*.55).toFixed(2)+'s">'+esc(s)+'</p>').join("");
  const head=[...String(o.title||"")].map((ch,i)=>ch===" "?'<span class="sp"> </span>':'<span class="lt" style="animation-delay:'+(1.5+i*.04).toFixed(2)+'s">'+esc(ch)+'</span>').join("");
  return '<div class="fx-paper"><div class="pp-sheet"><div class="pp-mast"><small>'+esc(p.no||"")+'</small><b>'+esc(p.name||"일간 풋볼 타임즈")+'</b><small>'+esc(p.date||"")+'</small></div><i class="pp-rule"></i>'
    +'<div class="pp-tag">'+esc(o.kicker||"")+'</div><h2 class="pp-head">'+head+'</h2><p class="pp-sub">'+esc(o.sub||"")+'</p>'
    +'<div class="pp-cols"><div class="pp-photo">'+(o.photoHtml||'<span>'+esc(o.icon||"📰")+'</span>')+'<em>'+esc(o.cap||"")+'</em></div><div class="pp-text">'+body+'</div></div><div class="pp-stamp">'+esc(p.stamp||"단독")+'</div></div></div>'; }
function cine(o,done){
  const k=KINDS[o.kind]||KINDS.win; if(busy){ if(done) done(); return; } busy=true;
  const calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const w=document.createElement("div"); w.className="fx"+(calm?" calm":""); w.style.setProperty("--ac",k.ac);
  const SH=o.walkerHtml?2.3:0;
  const letters=[...String(o.title||"")].map((ch,i)=>ch===" "?'<span class="sp"> </span>':'<span class="lt" style="animation-delay:'+(1.15+SH+i*.045).toFixed(2)+'s">'+esc(ch)+'</span>').join("");
  const lines=(o.lines||[]).map((t,i)=>'<li style="animation-delay:'+(2.5+SH+i*.35).toFixed(2)+'s">'+esc(t)+'</li>').join("");
  const paperCard=o.kind==="paper"?paperHtml(o,esc):"";
  w.innerHTML='<div class="fx-bar t"></div><div class="fx-bar b"></div><div class="fx-beam"></div><div class="fx-flash"></div><canvas class="fx-conf"></canvas>'
   +(paperCard||'<div class="fx-card"><div class="fx-icon">'+(o.iconHtml||o.icon||k.icon)+'</div><div class="fx-kick">'+esc(o.kicker||"")+'</div><h2 class="fx-title">'+letters+'</h2><p class="fx-sub">'+esc(o.sub||"")+'</p>'+(lines?'<ul class="fx-lines">'+lines+'</ul>':"")+'</div>')
   +'<button type="button" class="fx-skip">건너뛰기 ›</button>';
  const sc=o.scene||(o.kind==='flight'?'flight':o.kind==='arrive'?'arrive':'');
  const useMap=sc==='flight'&&o.route&&window.KL_MAP&&!calm;
  if(useMap){ w.classList.add('mapfx'); w.insertAdjacentHTML('afterbegin','<div class="fx-scene"><canvas class="fx-map"></canvas></div>'); }
  else if(sc==='bus'){ w.insertAdjacentHTML('afterbegin','<div class="fx-scene sc-bus"><i class="road"></i><div class="bus"><span class="bw">'+(o.busHtml||'')+'</span><span class="bw b2"></span><span class="bw b3"></span><b>🇰🇷 대표팀</b></div></div>'); }
  else if(sc){ const sceneHtml=sc==='flight'?'<div class="fx-scene sc-flight"><i class="cl c1">☁️</i><i class="cl c2">☁️</i><i class="cl c3">☁️</i><i class="plane">✈️</i><i class="route"></i></div>':'<div class="fx-scene sc-arrive"><i class="tunnel"></i><i class="crowd">👥👥👥👥👥👥</i><i class="cam c1">📸</i><i class="cam c2">📸</i><i class="cam c3">📸</i></div>';
    w.insertAdjacentHTML('afterbegin',sceneHtml); if(o.walkerHtml){ const sc2=w.querySelector('.sc-arrive'); if(sc2){ sc2.insertAdjacentHTML('beforeend','<div class="gate"><i class="gl l"></i><i class="gl r"></i><b>'+esc(o.gate||"")+'</b><i class="dark"></i></div><div class="ground"></div><div class="walker"><div class="wb">'+o.walkerHtml+'</div></div>'); } w.classList.add("walk"); w.style.setProperty("--sh",SH+"s"); } }
  document.body.appendChild(w); document.body.classList.add("fx-on");
  if(useMap){ const cv=w.querySelector('.fx-map'); const sc2=Math.min(1,900/Math.max(innerWidth,innerHeight)); cv.width=Math.round(innerWidth*sc2); cv.height=Math.round(innerHeight*sc2); setTimeout(()=>{ if(cv.isConnected) KL_MAP.flight(cv,o.route,(o.dur||k.dur)-2400); },500); }
  const t0=performance.now(); let closed=false;
  const close=()=>{ if(closed) return; closed=true; w.classList.add("out"); setTimeout(()=>{ w.remove(); document.body.classList.remove("fx-on"); busy=false; if(done) done(); },420); };
  w.addEventListener("click",e=>{ if(performance.now()-t0>(e.target.closest(".fx-skip")?0:900)) close(); });
  if(!calm){ setTimeout(()=>confetti(w.querySelector(".fx-conf"),k.conf,(o.dur||k.dur)-600),900); }
  try{ if(window.KL_BGM&&KL_BGM.sting) KL_BGM.sting(o.kind); }catch(e){}
  setTimeout(close,(o.dur||k.dur)+(SH?1800:0));
}
/* 계약서 도장: 쾅! 하고 구단 이름이 찍혀요 */
function stamp(label,done,spriteHtml){
  const w=document.createElement("div"); w.className="fx-stamp"; w.innerHTML='<div class="paper"><b>계약서</b><i class="ln"></i><i class="ln"></i><i class="ln s"></i><div class="seal"><span>'+esc(label)+'</span></div></div>'+(spriteHtml?'<div class="stp-me">'+spriteHtml+'</div>':'');
  document.body.appendChild(w); let closed=false; const close=()=>{ if(closed) return; closed=true; w.classList.add("out"); setTimeout(()=>{ w.remove(); if(done) done(); },320); };
  w.addEventListener("click",close); setTimeout(()=>{ w.classList.add("hit"); },520); setTimeout(close,1700);
}
window.KL_FX={cine:cine,busy:()=>busy,stamp:stamp};
})();
