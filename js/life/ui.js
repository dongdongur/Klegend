/* K-라이프 화면 (모바일 우선). 계산은 js/life/engine.js · train.js · nat.js · awards.js · events.js (window.LIFE) */
(function(){
"use strict";
const L=window.LIFE, K=window.KLCore;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="klife-save", HOF="klife-hof", DEX="klife-dex";
const rd=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const wr=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const app=$("app");
const FAST=!!window.__LIFE_FAST||/[?&]fast/.test(location.search)||(()=>{ try{ return localStorage.getItem("klife-fast")==="1"; }catch(e){ return false; } })();   // 점검용: 로딩 연출 생략

const POSK={FW:"공격수",MF:"미드필더",DF:"수비수",GK:"골키퍼"};
const NEWDRAFT=()=>({name:"",number:"",pos:"FW",sub:"ST",foot:"오른발",role:"",height:"",weight:"",trait:"effort",route:"mid",points:{talent:2,family:2,mentor:2,grit:2,health:2},cands:null,pick:-1,loading:false});
const NEWPLAN=()=>({focus:"",tier:"basic",invest:"",alloc:{}});
let S=rd(KEY); if(S&&S.v!==L.STATE_VER) S=null; if(S&&L.migrate) L.migrate(S);
let view=S?(S.retired?(S.quit?"quit":"retired"):S.phase==="draft"?"draft":"game"):"home";
let tab="season";
let draft=NEWDRAFT();
let plan=S&&S.plan?Object.assign(NEWPLAN(),{focus:S.plan.focus||"",tier:S.plan.tier||"basic",invest:S.plan.invest||"",alloc:Object.assign({},S.plan.alloc)}):NEWPLAN();
let openStat=null, seg=null, modals=[], toast=null, off=null, openDet=false, chosenInc=[], planOpen=false, boardTab="table", ldTimer=null;
const TRAITS=()=>L.TRAIT_LIST;
const money=v=>v>=1?(Math.round(v*10)/10)+"억 원":Math.round(v*10000)+"만 원";
const save=()=>{ if(S){ wr(KEY,S); if(window.KL_AUTH) KL_AUTH.queue(cloudPayload); achTick(); } };
/* 새 업적: 달성하면 알림 창을 띄워요 */
function achTick(){ try{ if(!L.achTick||!S) return; const nu=L.achTick(S); if(!nu.length) return; nu.slice(0,3).forEach(a=>modals.push({t:"msg",kick:"ACHIEVEMENT · "+a.cat,title:"🏅 "+a.ko,body:a.dko+(nu.length>3?" (그 밖에 "+(nu.length-3)+"개 더!)":"")})); setTimeout(()=>{ if(modals.length&&!document.querySelector(".ov")) render(); },80); }catch(e){} }
const age=()=>L.age(S);
const subName=()=>{ const d=L.POSDEF[S.p.pos].subs.find(s=>s[0]===S.p.sub); return d?d[1]:S.p.sub; };
const scoutLabel=()=>{ const b=L.scoutBand(S); return b.final?"재능 "+b.label+" (확정)":"재능 "+b.label+" (예상 · 20세에 확정)"; };
function emblem(club,size){
  const name=club?club.name:"?", code=club&&(club.code||(window.KL_CLUB_CODE||{})[club.id||club.name]);
  const hue=[...name].reduce((h,c)=>(h*31+c.charCodeAt(0))%360,0), ini=esc(name.replace(/[^\p{L}\p{N}]/gu,"").slice(0,2)), sz=size||44;
  const mine=window.KL_CUSTOM&&KL_CUSTOM.logo(club); if(mine) return `<span class="emb" style="--s:${sz}px;--h:${hue}"><i>${ini}</i><img src="${mine}" alt=""></span>`;
  if(code&&window.KL_EMBLEM_URL&&window.KL_CRESTS_ON) return `<span class="emb" style="--s:${sz}px;--h:${hue}"><i>${ini}</i><img src="${KL_EMBLEM_URL(code)}" alt="" onerror="this.remove()"></span>`;
  return `<span class="emb" style="--s:${sz}px;--h:${hue}"><i>${ini}</i></span>`;
}
const yearLabel=()=>S.stage==="pro"?"프로 "+(S.history.filter(h=>!h.youth).length+1)+"년차":L.gradeLabel(age());

/* 눌러야 할 곳으로 화면을 올려서 깜빡여 알려 줘요 */
function hint(sel,msg){ if(msg){ toast=msg; keep(render); setTimeout(()=>{ toast=null; keep(render); },2200); } const el=document.querySelector(sel); if(!el) return; el.scrollIntoView({block:"center",behavior:"smooth"}); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
function keep(fn){ window.__keepScroll=true; fn(); window.__keepScroll=false; }

/* ================= 렌더 ================= */
function render(){
  if(window.KL_VIRT){ if(S&&S.p) KL_VIRT.keep(S.p.name); (S&&S.kids||[]).forEach(k=>KL_VIRT.keep(k.name)); try{ (JSON.parse(localStorage.getItem(HOF)||"[]")||[]).forEach(x=>KL_VIRT.keep(x.name)); }catch(e){} (srvRows||[]).forEach(x=>KL_VIRT.keep(x.name)); }
  if(window.KL_BGM){ const t=modals[0]&&modals[0].t; let md="menu"; if(t==="ucl"||t==="gold"||t==="ballon"||t==="cine"||t==="jersey") md="epic"; else if(view==="retired") md="retire"; else if(view==="game"&&S){ if(S.phase==="offseason"||S.phase==="draft") md="market"; else if(S.stage==="youth"||S.stage==="univ") md="cute"; else md=S.phase==="run"?"match":"calm"; } else if(view==="quiz") md="match"; KL_BGM.mood(md); }
  /* 화면 상태와 게임 상태가 어긋났을 때 스스로 바로잡아요(예: 드래프트 단계인데 시즌 화면이 열려 본문이 비던 문제) */
  if(S&&!S.retired){ if(S.phase==="draft"&&view==="game"){ view="draft"; if(!S.offers&&L.draftOffers){ try{ S.offers=L.draftOffers(S); }catch(e){} } } }
  if(S&&view==="game"&&S.phase==="offseason"&&!off) buildOff();
  let h="", nav=false;
  if(view==="home") h=homeView();
  else if(view==="create") h=createView();
  else if(view==="scout") h=scoutView();
  else if(view==="draft") h=draftView();
  else if(view==="retired") h=retiredView();
  else if(view==="quit") h=quitView();
  else if(view==="hof") h=hofView();
  else if(view==="dex") h=dexView();
  else if(view==="ach") h=achView();
  else if(view==="settings") h=settingsView();
  else if(view==="help") h=helpView();
  else if(view==="tactest") h=tacView();
  else if(view==="quiz") h=quizView();
  else { nav=true; h=header()+`<main class="body">${tab==="season"?seasonTab():tab==="player"?playerTab():tab==="career"?careerTab():feedTab()}</main>`+navHtml(); }
  if(view==="quiz") h=h.replace("<main class=\"body\"","<main data-novirt class=\"body\"");
  if(["settings","dex","ach","hof","quiz","help","tactest"].includes(view)){ const ttl={settings:"설정",dex:"이벤트 도감",ach:"업적",hof:"명예의 전당",quiz:"축구 상식 퀴즈",help:"도움말",tactest:"감독 성향 테스트"}[view]; h=h.replace('<main class="body">','<main class="body"><div class="backbar"><button type="button" data-act="home">← 뒤로</button><b>'+ttl+'</b></div>'); }
  app.className="phone"+(nav?"":" nonav");
  app.innerHTML=h+(modals.length?modalHtml():"")+(toast?`<div class="toast">${esc(toast)}</div>`:"");
  if(modals[0]&&modals[0].t==="cine"){ const cm=modals[0]; if(FAST||!window.KL_FX){ modals.shift(); setTimeout(render,0); } else if(!KL_FX.busy()){ KL_FX.cine(cm.o,()=>{ if(modals[0]===cm) modals.shift(); render(); }); } }
  if(modals[0]&&modals[0].t==="sign") bindSign();
  { const cm=app.querySelector(".cmark"); if(cm&&L.animMark) L.animMark(cm,1100); }
  if(modals[0]&&modals[0].t==="event"&&modals[0].mini){ const mm=modals[0], host=app.querySelector(".mini"); if(host&&!mm.bound){ mm.bound=true; L.miniBind(host,mm.mini.type,S,(ok)=>{ if(modals[0]!==mm) return; mm.res=L.resolveEvent(S,mm.ev,mm.mini.idx,ok); mm.mini=null; dexAdd(mm.ev.id); save(); keep(render); }); } }
  if(modals[0]&&["shop","ballon","xi","hofcmp","league","jersey","sns","second","grow","msg","ucl","gold"].includes(modals[0].t)){ const sh=app.querySelector(".ov .sheet"); if(sh&&!sh.querySelector(".xclose")) sh.insertAdjacentHTML("afterbegin",'<button type="button" class="xclose" data-act="mok" aria-label="닫기">✕ 닫기</button>'); }
  { const key=view+"|"+tab+"|"+(S&&S.phase); if(key!==lastKey){ lastKey=key; const b=document.querySelector(".body"); if(b){ b.classList.add("fresh"); setTimeout(()=>b.classList.remove("fresh"),900); } animateCounts(); } }
  if(!window.__keepScroll) window.scrollTo(0,0);
}
let signDirty=false;
function bindSign(){
  const cv=$("signpad"); if(!cv) return; const cx=cv.getContext("2d"); cx.lineWidth=5; cx.lineCap="round"; cx.lineJoin="round"; cx.strokeStyle="#ffcf4a"; signDirty=false; let down=false;
  const pos=e=>{ const r=cv.getBoundingClientRect(), t=e.touches?e.touches[0]:e; return [(t.clientX-r.left)*cv.width/r.width,(t.clientY-r.top)*cv.height/r.height]; };
  const st=e=>{ e.preventDefault(); down=true; const [x,y]=pos(e); cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x+.1,y); cx.stroke(); signDirty=true; };
  const mv=e=>{ if(!down) return; e.preventDefault(); const [x,y]=pos(e); cx.lineTo(x,y); cx.stroke(); };
  const en=()=>{ down=false; };
  cv.addEventListener("mousedown",st); cv.addEventListener("mousemove",mv); window.addEventListener("mouseup",en);
  cv.addEventListener("touchstart",st,{passive:false}); cv.addEventListener("touchmove",mv,{passive:false}); cv.addEventListener("touchend",en);
}
function askSign(title,lines,fn){ modals.unshift({t:"sign",title,lines,fn}); keep(render); }
/* 새 리그에 처음 입성할 때 나오는 소개 화면 */
const LEAGUE_INFO={
 K4:{ic:"🌱",tag:"K4 LEAGUE",c:"#7d8f69",title:"레전드리그4(4부) 입성",lines:["3월 개막 · 12월 폐막 · 14개 구단 26경기","지역 아마추어·세미프로 리그 — 연봉은 생계가 빠듯한 수준이에요","전국컵은 1라운드부터 도전 · 상위 2팀은 레전드리그3로 승격해요","여기서 잘하면 레전드리그3 구단이 승격 제안을 보내와요"]},
 K3:{ic:"🏟",tag:"K3 LEAGUE",c:"#8a9a5b",title:"레전드리그3(3부) 입성",lines:["3월 개막 · 12월 폐막 · 14개 구단 39경기","세미프로 리그 — 연봉은 낮지만 주전으로 뛸 기회가 많아요","전국컵 하부 참가 · 상위 2팀은 레전드리그2로 승격해요","여기서 잘하면 레전드리그2 구단이 승격 제안을 보내와요"]},
 EPL:{ic:"🏴",tag:"PREMIER LEAGUE",c:"#9b5cff",title:"잉글랜드 1부 리그 입성",lines:["8월 개막 · 5월 폐막","세계에서 가장 치열한 리그 — 구단 전력이 높아 골 넣기가 어려워요","전국컵 · EFL컵, 상위 4팀은 유럽 클럽컵 · 5~6위는 유럽 클럽컵2","하위 3팀은 챔피언십으로 강등돼요"]},
 EPL2:{ic:"🏴",tag:"CHAMPIONSHIP",c:"#5aa0ff",title:"챔피언십(잉글랜드 2부)",lines:["승격 플레이오프의 치열한 46경기","상위 3팀은 잉글랜드 1부 리그로 승격해요","몸값과 연봉은 1부보다 많이 낮아요"]},
 LAL:{ic:"🇪🇸",tag:"LA LIGA",c:"#ff5a5a",title:"스페인 1부 리그 입성",lines:["8월 개막 · 5월 폐막","기술과 패스 중심의 리그 — 상위 2팀의 벽이 높아요","스페인 컵, 상위 4팀 유럽컵 · 5~6위 유럽컵2"]},
 BUN:{ic:"🇩🇪",tag:"BUNDESLIGA",c:"#ff4d4d",title:"독일 1부 리그 입성",lines:["8월 개막 · 5월 폐막","빠른 전환과 높은 득점 — 골이 많이 나는 리그예요","독일 컵, 상위 4팀 유럽컵 · 5~6위 유럽컵2"]},
 SEA:{ic:"🇮🇹",tag:"SERIE A",c:"#3fa7ff",title:"이탈리아 1부 리그 입성",lines:["8월 개막 · 5월 폐막","수비 조직력의 리그 — 클린시트 싸움이 치열해요","코파 이탈리아, 상위 4팀 유럽컵 · 5~6위 유럽컵2"]},
 L1:{ic:"🇫🇷",tag:"LIGUE 1",c:"#4d7cff",title:"리그 1 입성",lines:["8월 개막 · 5월 폐막","스피드 있는 젊은 선수들의 리그","프랑스 컵, 상위 3팀 유럽컵 · 4~5위 유럽컵2"]},
 J1:{ic:"🇯🇵",tag:"J1 LEAGUE",c:"#ff6b81",title:"J1리그 입성",lines:["2월 개막 · 12월 폐막 (레전드리그와 비슷한 달력)","조직력과 체력 중심 — 응원 문화가 인상적이에요","일왕배, 상위 3팀 아시아 클럽컵"]},
 SPL:{ic:"🇸🇦",tag:"SAUDI PRO LEAGUE",c:"#2fd18b",title:"사우디 프로리그 입성",lines:["8월 개막 · 5월 폐막","세계적인 스타들이 모이고 연봉이 최고 수준이에요","킹스컵, 상위 3팀 아시아 클럽컵"]}
};
function leagueWelcome(){ const lg=S&&S.club&&S.club.lg; const info=LEAGUE_INFO[lg]; if(!info) return; S.seenLg=S.seenLg||[]; if(S.seenLg.includes(lg)) return; S.seenLg.push(lg);
  const cl=L.leagueClubs(S,lg); const top=cl.slice().sort((a,b)=>b.l-a.l).slice(0,3).map(c=>c.short||c.name);
  modals.unshift({t:"league",info,club:S.club.name,top,n:cl.length,lg}); }
let lastKey="";
function animateCounts(){
  document.querySelectorAll(".cnt").forEach(el=>{ const to=parseFloat(el.dataset.to); if(isNaN(to)) return; const dec=String(el.dataset.to).includes(".")?1:0, t0=performance.now(), dur=650;
    const step=t=>{ const k=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-k,3); el.textContent=(to*e).toFixed(dec); if(k<1) requestAnimationFrame(step); else el.textContent=el.dataset.to; };
    el.textContent=dec?"0.0":"0"; requestAnimationFrame(step); });
}
function say(m){ toast=m; keep(render); setTimeout(()=>{ toast=null; keep(render); },2200); }
function header(){
  const p=S.p;
  return `<header class="top"><button class="ibtn" data-act="home" title="K-라이프 첫 화면">☰</button>${emblem(S.club,40)}
   <div class="who"><b>${esc(p.name)} <small>No.${p.number}</small></b><small>${CS()?CS().emblemSvg(null,13)+" ":""}${esc(S.club.name)} · ${esc(subName())} · ${age()}세</small></div>
   <div class="ovr"><small>OVR</small><b>${p.ovr}</b></div></header>`;
}
function navHtml(){ return `<nav class="nav">${[["season","🗓","시즌"],["player","⚽","선수"],["career","🏆","커리어"],["feed","📰","소식"]].map(([k,i,t])=>`<button data-act="tab" data-v="${k}" class="${tab===k?"on":""}"><span>${i}</span>${t}</button>`).join("")}</nav>`; }

/* ================= 홈 ================= */
function homeView(){
  const hof=rd(HOF)||[];
  const cont=S&&!S.retired?`<button class="big alt" data-act="continue"><span>이어하기 · ${esc(S.p.name)} (${age()}세)</span><b>→</b></button>`:"";
  return `<main class="body"><div class="brand"><span class="mark">K</span><div><small>K-LIFE</small><b>축구 인생 키우기</b></div></div>
   <section class="hero"><small class="kick">NEW FOOTBALL LIFE</small><h1>이번 생, 어떤 선수로 살아볼까요?</h1>
    <p class="muted">중학교 유소년부터 은퇴까지. 훈련·계약·이적·국가대표·병역까지, 선택이 커리어를 바꿔요.</p>${cont}
    <button class="big" data-act="new"><span>새로운 인생 시작</span><b>→</b></button></section>
   ${weeklyCard()}
   <section class="card"><h3 class="sec">명예의 전당</h3>${hof.length?hof.slice().sort((a,b)=>b.score-a.score).slice(0,10).map((x,i)=>`<div class="hof"><b>${i+1}</b><div><b>${esc(x.name)}</b><br><small>${esc(x.pos)} · ${esc(x.club)} · ${x.years}년 · 통산 ${x.goals}골 ${x.assists}도움${x.retire?" · 영구결번":""}</small></div><span class="pill gold">${x.grade} ${x.score}</span></div>`).join(""):`<p class="muted">아직 은퇴한 선수가 없어요.</p>`}</section>
   <div class="grid2"><button class="wide" data-act="hoflist">🏆 친구들 명예의 전당</button><button class="wide" data-act="dex">📖 이벤트 도감</button></div>
   <button class="wide" data-act="ach">🏅 업적 ${(()=>{ try{ return Object.keys(L.achSaved()).length+" / "+L.ACH.length; }catch(e){ return ""; } })()} · 기록·이야기·도전</button>
   <button class="wide" data-act="help">📘 도움말 · 능력치와 한계선</button>
   <button class="wide" data-act="lang" data-noi18n>🌐 ${window.KL_LANG==="en"?"한국어로 보기 (Korean)":"English (beta)"}</button>
   <div class="grid2"><button class="wide" data-act="quiz">⚽ 축구 상식 퀴즈</button><button class="wide" data-act="settings">⚙ 설정 · 구단 이름과 로고</button></div>
   ${CS()?`<button class="wide" data-act="cosgo">🎨 꾸미기 · 도트 선수·액자·은퇴 카드</button>`:""}
   <a class="wide" href="patch-notes.html" style="display:grid;place-items:center;text-decoration:none">📰 패치노트${(()=>{ try{ return window.KL_PATCH_LATEST&&localStorage.getItem("kl-patch-seen")!==window.KL_PATCH_LATEST?" 🔴 NEW":""; }catch(e){ return ""; } })()}</a>
   <section class="card flat"><h3 class="sec">업데이트 예정</h3><p class="muted">· 차남곤 축구상·황금 신예 시상 연출, 입단 입장 장면<br>· 시즌 하이라이트(낭만 장면)<br>· 이어지는 이야기 더 늘리기<br>· 꾸미기 항목 더 늘리기(유니폼·액자·엠블럼)<br>· 감독판 이야기 늘리기, 선수판 가져오기</p></section>
   <p class="muted c"><a class="lnk" href="index.html">게임 선택 메뉴로</a>${S?` · <button class="lnk" data-act="wipe">저장 삭제</button>`:""}</p></main>`;
}

/* ================= 도움말 (능력치·포지션·한계선) — 데이터에서 자동으로 만들어서 게임과 항상 같아요 ================= */
let helpPos="FW", helpBack="home";
/* ================= 감독 성향 테스트 (선택): 내 플레이 취향 → 어울리는 전술 색과 역할 ================= */
let tac={i:0,sc:{},done:false};
const TAC_Q=[
 {q:"경기 시작 휘슬! 가장 짜릿한 순간은?",o:[["수비 뒤 빈 공간으로 달려가 골을 넣는 순간",{counter:2,attack:1}],["동료들과 짧은 패스로 상대를 가지고 노는 순간",{possess:2}],["상대 공을 끈질기게 빼앗아 곧장 역습하는 순간",{press:2,counter:1}],["높이 뜬 공을 몸으로 이겨내 헤딩을 따내는 순간",{direct:2,defend:1}]]},
 {q:"감독이 \"오늘은 이렇게 하자\"고 한다면 끌리는 말은?",o:[["\"앞에서부터 무섭게 몰아붙여!\"",{press:2,attack:1}],["\"공은 우리가 갖고 있자. 서두를 필요 없어.\"",{possess:2}],["\"단단히 막고, 기회가 오면 한 방에!\"",{defend:2,counter:1}],["\"먼저 점수를 내고 더 내자!\"",{attack:2}]]},
 {q:"연습 경기 후 가장 듣고 싶은 칭찬은?",o:[["\"어떻게 거기서 패스를 찔러 넣었어?\"",{possess:2,attack:1}],["\"그 체력은 정말 사람이 아니다\"",{press:2}],["\"네가 있어서 뒤가 든든했어\"",{defend:2}],["\"네 골 때문에 이겼어\"",{attack:1,counter:1,direct:1}]]},
 {q:"슬럼프가 왔을 때 나는?",o:[["영상을 돌려 보며 원인을 분석한다",{possess:1,defend:1}],["더 뛴다. 몸으로 이겨낸다",{press:2}],["기본기부터 다시 다진다",{defend:1,possess:1}],["과감하게 더 슛을 때린다",{attack:2}]]},
 {q:"가장 닮고 싶은 선수 유형은?",o:[["경기를 읽는 눈이 좋은 플레이메이커",{possess:2}],["폭발적인 스피드의 윙어",{counter:2,attack:1}],["굳건한 수비의 리더",{defend:2,direct:1}],["가장 먼저 압박하는 전방 공격수",{press:2}]]},
 {q:"팀이 1점 지고 있는 후반 막판, 나는?",o:[["롱볼이라도 올려서 박스 안을 흔들자",{direct:2,attack:1}],["침착하게 패스를 돌려 틈을 만든다",{possess:2}],["전원 공격! 라인을 끌어올린다",{attack:2,press:1}],["한 번의 역습 기회를 노린다",{counter:2}]]}
];
function tacView(){
  if(!tac.done){ const q=TAC_Q[tac.i]; return `<main class="body"><h2 class="sec" style="margin:4px 0 8px">감독 성향 테스트</h2><p class="muted">${tac.i+1} / ${TAC_Q.length} · 정답은 없어요. 끌리는 쪽을 골라요.</p><section class="card"><h3>${esc(q.q)}</h3>${q.o.map((o,i)=>`<button class="opt" data-act="tacans" data-v="${i}"><b>${esc(o[0])}</b></button>`).join("")}</section></main>`; }
  const st=Object.entries(tac.sc).sort((a,b)=>b[1]-a[1]), top=st[0]?st[0][0]:"attack", second=st[1]?st[1][0]:top;
  const roles=L.rolesOf(draft.sub).map(r=>({r,s:((L.ROLE_TAGS&&L.ROLE_TAGS[r[0]])||[]).reduce((a,t)=>a+(tac.sc[t]||0),0)})).sort((a,b)=>b.s-a.s); tac.pick=roles[0]?roles[0].r[0]:null;
  const S1=L.COACH_STYLES[top], S2=L.COACH_STYLES[second];
  return `<main class="body"><h2 class="sec" style="margin:4px 0 8px">테스트 결과</h2><section class="card"><small class="kick">YOUR STYLE</small><h2>${esc(S1.name)} 성향</h2><p class="muted">${esc(S1.desc)}</p><p>2순위: <b>${esc(S2.name)}</b></p></section>
   <section class="card flat"><h3 class="sec">이 자리(${esc(((L.POSDEF[draft.pos].subs.find(s=>s[0]===draft.sub)||[0,""])[1]))})에서 어울리는 역할</h3>${roles.slice(0,3).map((x,i)=>`<div class="hp"><b>${i===0?"⭐ ":""}${esc(x.r[1])}</b><small>${esc(x.r[2])}</small></div>`).join("")}
   <p class="muted">내 성향과 같은 전술을 쓰는 감독 밑에서는 출전 기회와 신뢰가 늘어요. 반대(${esc(L.COACH_STYLES[S1.anti].name)}) 감독을 만나면 역할을 바꾸거나 이적을 고민하게 돼요.</p></section>
   <button class="big" data-act="tacapply"><span>${tac.pick?"추천 역할로 설정하고 돌아가기":"돌아가기"}</span><b>→</b></button><button class="wide" data-act="tac">다시 해보기</button></main>`;
}
function helpView(){
  const d=L.POSDEF[helpPos], names=Object.fromEntries(d.stats);
  const pct=w=>w.map((x,i)=>d.stats[i][1]+" "+Math.round(x*100)+"%").join(" · ");
  const subs=d.subs.map(([id,nm])=>{ const w=(d.wSub&&d.wSub[id])||d.w; const inv=d.wSub&&d.wSub[id+"i"]; return `<div class="hp"><b>${esc(nm)}</b><small class="muted">${esc((L.SUBINFO&&L.SUBINFO[id])||"")}</small><small>OVR 비중 — ${esc(pct(w))}</small>${inv?`<small class="muted">반대발(역발) 윙어는 — ${esc(pct(inv))}</small>`:""}</div>`; }).join("");
  const stats=d.stats.map(([k,n],i)=>{ const sb=(L.subStats?L.subStats({stats:{[k]:70},name:"x"},k):[]); return `<div class="hp"><b>${esc(n)} <small class="muted">기본 비중 ${Math.round(d.w[i]*100)}%</small></b><small>${esc(L.statFx?L.statFx(k):"")}</small>${sb.length?`<small class="muted">세부: ${sb.map(x=>esc(x.name)).join(" · ")}</small>`:""}</div>`; }).join("");
  const ar=[13,16,19,21,23,25,27,29,31,33,35].map(a=>a+"세 "+(L.ageRate(a,helpPos)>=0?"+":"")+L.ageRate(a,helpPos).toFixed(1)).join(" · ");
  return `<main class="body">   <p class="muted">처음엔 몰라도 괜찮아요. 포지션과 능력치가 어떻게 OVR(종합 능력)이 되는지, 어디까지 오를 수 있는지를 한곳에 모았어요.</p>
   <div class="chips">${["FW","MF","DF","GK"].map(p=>`<button data-act="helppos" data-v="${p}" class="${helpPos===p?"on":""}">${L.POSDEF[p].name}</button>`).join("")}</div>
   <section class="card flat"><h3 class="sec">${esc(d.name)}는 이런 자리예요</h3><p>${esc((L.POSINFO&&L.POSINFO[helpPos]||"").split("예요.")[0]+"예요.")} OVR에는 ${d.stats.map(([k,n],i)=>({n,w:d.w[i]})).sort((a,b)=>b.w-a.w).slice(0,3).map(x=>esc(x.n)+"("+Math.round(x.w*100)+"%)").join("·")}이(가) 가장 크게 반영돼요.</p></section>
   <section class="card flat"><h3 class="sec">능력치와 역할</h3>${stats}</section>
   <section class="card flat"><h3 class="sec">세부 포지션별 OVR 비중</h3><p class="muted">같은 포지션이라도 자리에 따라 중요한 능력치가 달라요. 세부 포지션을 바꾸면 OVR도 달라져요.</p>${subs}</section>
   <section class="card flat"><h3 class="sec">한계선: 어디까지 오를 수 있나요?</h3>
    <div class="hp"><b>재능 등급 = OVR의 천장</b><small>잠재력은 능력치의 평균이 아니라 <u>OVR이 도달할 수 있는 최대치</u>예요. 개별 능력치는 99까지, OVR은 잠재력 이상으로는 거의 오르지 않아요.</small></div>
    <div class="hp"><b>C급 55~73 · B급 74~81 · A급 82~89 · S급 90 이상</b><small>등급은 20세 시즌이 끝날 때 확정돼요. 그 전에는 스카우터의 눈대중이에요.</small></div>
    <div class="hp"><b>재능 개발 센터</b><small>돈과 시간을 들이면 잠재력을 처음 값보다 최대 +12까지 키울 수 있어요. 완벽한 캠프(고득점+타이밍 퍼펙트)로 "한계 돌파"를 하면 +4가 더 열려요. 29세까지 시즌마다 한 번만 가능해요.</small></div>
    <div class="hp"><b>GOAT 각성</b><small>OVR 96 이상 + 황금공 2회 이상이면 드물게 이벤트가 열려요. 성공하면 상한이 101~105까지 올라가요. 대신 몸 관리 소홀 등 위험한 선택이 따라와요.</small></div>
    <div class="hp"><b>나이와 성장</b><small>${esc(helpPos==="GK"?"골키퍼는 전성기가 늦어요.":helpPos==="DF"?"수비수는 전성기가 조금 늦어요.":"")} 한 해 평균 변화: ${esc(ar)}. 체력·스피드는 일찍 꺾이고 기술은 오래 가요.</small></div></section>
   <section class="card flat"><h3 class="sec">출전 대우 용어</h3>
    <div class="hp"><b>핵심 인재 · 핵심 주전 · 주전 · 로테이션 · 벤치 · 2군</b><small>감독이 얼마나 믿고 기용하는지의 단계예요. 팀 수준 대비 내 OVR, 감독 신뢰, 포지션 경쟁으로 정해져요. 차기 유망주는 어리고 잠재력이 높아 아직 기회를 받는 단계예요.</small></div></section>
   <section class="card flat"><h3 class="sec">성장의 기본 규칙</h3>
    <div class="hp"><b>약점 vs 강점 특훈</b><small>낮은 능력치는 쉽게 오르고, 이미 높은 능력치는 더 어렵게 올라요. 트레이너 등급이 높을수록 높은 능력치도 잘 올라요.</small></div>
    <div class="hp"><b>몸 관리</b><small>컨디션이 낮거나 몸 관리를 소홀히 하면 성장이 둔해지고 부상 위험이 올라가요.</small></div></section>${helpFamily()}${adslot("help")}</main>`;
}
function helpFamily(){
  try{ const fam=Object.entries(L.FAMILY_PERK||{}).map(([id,f])=>{ const nm=(L.FAMILY.find(x=>x.id===id)||{}).name||id; return `<div class="hp"><b>${f.icon} ${esc(nm)} — ${esc(f.name)}</b><small>${esc(f.desc)}</small></div>`; }).join("");
    const inv=Object.values(L.INV_INFO||{}).map((v,i)=>{ const nm=L.INV_CATS[i][1]; return `<div class="hp"><b>${v.icon} ${esc(nm)}</b><small class="good">＋ 1포인트마다 ${esc(v.pro)}</small><br><small class="bad">－ ${esc(v.con)}</small></div>`; }).join("");
    const ch=[90,75,60,45,30,10].map(c=>{ const p=L.charPerk({char:c}); return `<div class="hp"><b>${p.icon} ${esc(p.name)}</b><small>${esc(p.desc)}</small></div>`; }).join("");
    return `<section class="card flat"><h3 class="sec">가정환경과 기질</h3><p class="muted">집안 형편은 유소년·대학 시기의 지원 포인트와, 프로가 된 뒤에도 이어지는 기질을 정해요.</p>${fam}</section>
   <section class="card flat"><h3 class="sec">가정 지원 투자</h3><p class="muted">해마다 받는 지원 포인트를 아래에 나눠 쓸 수 있어요(항목당 최대 5).</p>${inv}</section>
   <section class="card flat"><h3 class="sec">인성 점수 효과</h3><p class="muted">선택과 행동이 쌓여 인성이 정해져요. 높으면 신뢰·평판이 쌓이고, 낮아도 독기라는 장점이 대가와 함께 따라와요.</p>${ch}</section>`; }catch(e){ return ""; }
}

/* ================= 생성 ================= */
const PT_CATS=[["talent","재능","타고난 재능이 커질 확률 ↑, 숨은 특성(대천재 등) 확률 ↑"],["family","가정환경","부유한 집안일 확률 ↑ → 훈련 지원 포인트 ↑ · 용돈(어릴 때 쓸 수 있는 돈) ↑"],["mentor","좋은 스승","20세까지 성장 +4%/포인트"],["grit","끈기","훈련 성공 확률 +6%/포인트 · 기복 ↓ · 중도 포기 위기에 강함"],["health","건강","부상 위험 −7%/포인트"]];
const ROUTES=[
 ["mid","중학교 1학년 (13세 · U15)","🌱 처음부터 긴 성장 스토리","가장 길게(6년) 키워요. 이야기가 가장 풍성해요.",
  ["15세까지 성장 +8%, 잠재력을 가장 오래 키울 수 있어요","유스 클럽 개성·유학·해외 유스 아카데미(15~17세 제안)로 유럽에 일찍 진출할 수 있어요","가정 지원 포인트를 6년 동안 나눠 쓰며 방향을 잡아요"],
  ["플레이 시간이 길어요(프로까지 6시즌)","초반 유소년 리그 수준이 낮아 평가가 늦어요","집안 사정이 바뀌는 변수가 커요"]],
 ["hs","고등학교 1학년 (16세 · U18)","⚖️ 균형 잡힌 시작","3년 안에 프로를 노려요. 속도와 이야기의 중간이에요.",
  ["U18 리그 수준이 높아 빨리 평가받아요","해외 유스 아카데미 제안을 받을 수 있어요(16~17세)","프로까지 3시즌이라 적당히 짧아요"],
  ["성장 여유가 짧아요","어린 학년은 출전 기회가 적어요"]],
 ["high","고교 졸업 신인 (19세)","⚡ 바로 프로 도전","곧바로 드래프트예요. 빠른 대신 한 번의 평가가 중요해요.",
  ["유소년 시절을 건너뛰고 바로 프로 이야기를 즐겨요","드래프트·대학·해외 직행(실력·집안 조건) 중에 고를 수 있어요"],
  ["지명 확률이 낮으면 대학이나 해외 직행을 노려야 해요","해외 유스 경로가 없어요 — 해외는 이후 이적 때 워크퍼밋 규정을 넘어야 해요"]],
 ["univ","대학 졸업 신인 (23세)","🔥 어려운 모드 · 가장 짧게","즉시 전력감으로 시작하지만 성장 시간이 짧아요.",
  ["프로 커리어에 집중해서 가장 빨리 플레이해요","이미 완성된 능력치로 첫해부터 주전 경쟁이 가능해요"],
  ["성장 기간이 짧아 잠재력이 낮으면 한계가 빨리 와요","최종 드래프트에서 지명 못 받으면 커리어가 끝날 수 있어요","해외 진출·워크퍼밋 조건 맞추기가 어려워요"]]
];
function ptsLeft(){ return 10-Object.values(draft.points).reduce((a,b)=>a+b,0); }
function createView(){
  const d=L.POSDEF[draft.pos];
  if(!d.subs.some(s=>s[0]===draft.sub)) draft.sub=d.subs[0][0];
  if(!L.rolesOf(draft.sub).some(r=>r[0]===draft.role)) draft.role=(L.rolesOf(draft.sub)[0]||[])[0]||"";
  const left=ptsLeft();
  return `<main class="body"><div class="row"><button class="ibtn" data-act="home">‹</button><h2>선수 만들기</h2></div>${draft.weekly?weeklyBanner(draft.weekly):""}
   <section class="card" id="sec-name"><span class="lab">이름</span><input type="text" id="nm" maxlength="8" value="${esc(draft.name)}" placeholder="선수 이름">
    <span class="lab">등번호 (비워 두면 자동)</span><input type="number" id="no" inputmode="numeric" min="1" max="99" value="${esc(draft.number)}" placeholder="1–99"></section>
   <section class="card"><span class="lab">포지션</span><div class="chips">${Object.keys(L.POSDEF).map(k=>`<button data-act="pos" data-v="${k}" class="${draft.pos===k?"on":""}">${POSK[k]}</button>`).join("")}</div>
    <p class="muted">${esc(L.POSINFO[draft.pos])}</p>
    <span class="lab">세부 포지션</span><div class="chips">${d.subs.map(s=>`<button data-act="sub" data-v="${s[0]}" class="${draft.sub===s[0]?"on":""}">${s[1]}</button>`).join("")}</div>
    <p class="muted">${esc(L.SUBINFO[draft.sub]||"")}</p>
    <span class="lab">선호 역할 — 같은 자리에서 맡을 임무 (은사를 만나면 바뀔 수도 있어요)</span>
    <button class="wide" data-act="tac">🧪 나에게 맞는 전술·역할 알아보기 (선택, 1분)</button>
    ${L.rolesOf(draft.sub).map(r=>`<button class="opt ${draft.role===r[0]?"on":""}" data-act="role" data-v="${r[0]}"><b>${esc(r[1])}</b><small>${esc(r[2])}</small></button>`).join("")}
    <span class="lab">주발</span><div class="chips">${["오른발","왼발","양발"].map(f=>`<button data-act="foot" data-v="${f}" class="${draft.foot===f?"on":""}">${f}</button>`).join("")}</div>
    <p class="note">${esc(L.footInfo(draft.sub,draft.foot).text)}</p>
    ${(draft.sub==="LW"||draft.sub==="RW"||draft.sub==="LB"||draft.sub==="RB")?`<p class="muted">같은 측면이라도 주발에 따라 스타일이 달라져요. 오른쪽 자리 + 오른발 = 정발(크로스형), 오른쪽 자리 + 왼발 = 역발(안으로 파고드는 득점형)이에요.</p>`:""}</section>
   <section class="card" id="sec-pts"><span class="lab">초기 포인트 10 — 남은 포인트 <b style="color:${left?"var(--gold)":"var(--acc)"}">${left}</b></span>
    <p class="muted">포인트를 투자하면 유리한 쪽으로 확률이 쏠려요. 결과는 '무작위 + 투자'로 정해지니, 한쪽에 몰면 대박도 쪽박도 가능해요.</p>
    ${PT_CATS.filter(c=>!(c[0]==="mentor"&&(draft.route==="high"||draft.route==="univ"))).map(([k,n,dsc])=>`<div class="row"><div class="grow"><b>${n}</b><br><small class="muted">${dsc}</small></div><button class="ghost" data-act="pt" data-v="${k}:-1" ${draft.points[k]<=0?"disabled":""}>−</button><b style="min-width:26px;text-align:center;font-family:var(--f-num);font-size:18px">${draft.points[k]}</b><button class="ghost" data-act="pt" data-v="${k}:1" ${draft.points[k]>=5||left<=0?"disabled":""}>＋</button></div>`).join("")}</section>
   <section class="card"><span class="lab">체격 (비워 두면 포지션 평균)</span><div class="grid2"><input type="number" id="ht" inputmode="numeric" placeholder="키 cm" value="${esc(draft.height)}"><input type="number" id="wt" inputmode="numeric" placeholder="몸무게 kg" value="${esc(draft.weight)}"></div>
    <p class="note" id="bodyfx">${esc(bodyLine())}</p>
    <p class="muted">키는 포지션 평균(공격수 180cm, 미드필더 177, 수비수 183, 골키퍼 188)과, 몸무게는 그 키에 맞는 표준 체중과 비교해요. 키가 크면 버티는 힘·수비·제공권이 오르고 질주력·드리블이 내려가요. 같은 키라도 근육이 붙어 체중이 높으면 몸싸움이 크게 좋아지고, 말랐으면 확실히 밀려요(부상도 늘어요). 아래에 체격 유형과 장단점이 나와요.</p></section>
   <section class="card"><span class="lab">특성 (하나) — 여섯 가지 모두 노리는 방향이 달라요. 어느 쪽이 더 낫다기보다 내가 만들고 싶은 선수에 맞춰 골라요. 숨은 특성은 20세에 재능이 확정될 때 알려 줘요</span>${TRAITS().map(t=>`<button class="opt ${draft.trait===t.id?"on":""}" data-act="trait" data-v="${t.id}"><b>${t.icon} ${t.name} <small class="muted">· ${t.cat}</small></b><small>${t.desc}</small><span class="tp">${t.eff}</span></button>`).join("")}</section>
   <section class="card"><span class="lab">시작 시점</span>${ROUTES.map(([k,t,tag,s,pros,cons])=>`<button class="opt route ${draft.route===k?"on":""}" data-act="route" data-v="${k}"><b>${t}</b><span class="rtag">${tag}</span><small>${s}</small>${draft.route===k?`<div class="rpc"><div><i>장점</i>${pros.map(x=>`<p>＋ ${x}</p>`).join("")}</div><div><i class="c">단점</i>${cons.map(x=>`<p>－ ${x}</p>`).join("")}</div></div>`:""}</button>`).join("")}<p class="muted">선택한 시작 시점의 장단점이 펼쳐져요. 다른 시작으로도 해 보면 전혀 다른 이야기가 나와요.</p></section>
   <div class="cta"><button class="big ${(!draft.name.trim()||left)?"needs":""}" data-act="scout"><span>${!draft.name.trim()?"이름을 먼저 적어 주세요 ↑":left?"포인트 "+left+"개를 마저 나눠 주세요 ↑":"스카우트 후보 3명 보기"}</span><b>→</b></button></div></main>`;
}
function bodyLine(){ return "체격 효과: "+L.bodyText(draft.pos,+draft.height||0,+draft.weight||0); }
function readForm(){ const g=id=>{ const e=$(id); return e?e.value:null; }; const n=g("nm"); if(n!=null) draft.name=n; const no=g("no"); if(no!=null) draft.number=no; const h=g("ht"); if(h!=null) draft.height=h; const w=g("wt"); if(w!=null) draft.weight=w; }
/* 스카우트 후보 유형: 포지션마다 여러 가지가 있고, 세 명은 서로 다른 유형에서 뽑혀요 (능력치 분포·체격·성장 여력이 모두 달라요) */
const ARCH={
 FW:[["스피드 괴물","빠른 발 하나로 수비를 찢는 타입이에요. 마무리는 아직 거칠어요.","dribble",[-2,3,10,-2,-4,-3],0,0,0],
     ["어린 날의 천재","지금은 또래 중 최고지만 성장 여력은 크지 않을 수 있어요.","dribbler",[3,6,2,-6,4,1],5,-6,0],
     ["대기만성형 거구","지금은 투박해도 몸이 다 크면 달라질 수 있는 타입이에요.","target",[1,-5,-4,10,0,-2],-5,6,[6,9]],
     ["올라운드 만능","눈에 띄는 약점이 없는 안정적인 선수예요.","finisher",[1,1,1,1,1,1],0,0,0],
     ["타고난 골잡이","골문 앞에서만큼은 누구도 따라올 수 없어요. 나머지는 평범해요.","finisher",[10,-4,-2,0,4,-6],0,0,0],
     ["윙 테크니션","측면에서 발기술로 승부해요. 몸싸움은 약해요.","crosser",[-6,8,5,-6,0,6],1,0,[-3,-4]],
     ["냉정한 승부사","큰 경기에서 떨지 않는 침착함이 무기예요.","finisher",[2,0,0,2,9,0],0,2,0]],
 MF:[["경기 지휘관","시야와 패스로 경기의 템포를 쥐는 타입이에요.","playmaker",[6,8,0,-2,-2],1,2,0],
     ["철벽 앵커","궂은일을 도맡는 수비형 미드필더 타입이에요.","destroyer",[-2,-2,-4,4,10],0,0,[3,6]],
     ["돌파하는 인사이드","공을 몰고 전진하는 걸 즐겨요. 수비는 약해요.","box",[0,0,9,2,-5],2,-2,0],
     ["지치지 않는 엔진","90분 내내 뛰는 활동량이 장점이에요.","box",[-1,-2,0,12,1],0,0,[0,4]],
     ["어린 날의 연출가","패스 센스가 천재적이지만 몸이 아직 안 따라와요.","playmaker",[7,7,4,-6,-6],4,-5,[-3,-5]],
     ["대기만성 박스형","아직 어설프지만 체력과 의지가 남달라요.","box",[-2,-1,-2,7,3],-5,6,[4,6]],
     ["만능 미드필더","어느 자리에서도 제 몫을 하는 선수예요.","playmaker",[1,1,1,1,1],0,0,0]],
 DF:[["거친 수비벽","몸으로 막는 전형적인 스토퍼예요. 발은 느려요.","stopper",[4,8,6,-6,-6],0,0,[4,8]],
     ["빠른 풀백","오르내리는 스피드가 최고의 무기예요.","runner",[-2,0,-2,10,2],0,0,[-4,-6]],
     ["빌드업 리베로","후방에서 공을 만들어 내는 현대적인 수비수예요.","builder",[0,-4,-2,0,12],1,0,0],
     ["제공권 거인","공중볼은 거의 지지 않지만 민첩성은 떨어져요.","stopper",[4,2,10,-8,-4],-1,2,[8,10]],
     ["영리한 조율사","위치 선정으로 막아내요. 몸은 평범해요.","builder",[9,2,-2,0,3],2,2,0],
     ["대기만성 수비수","지금은 어설프지만 성장하면 크게 달라질 수 있어요.","stopper",[0,1,3,-2,-2],-6,7,[3,5]]],
 GK:[["반사신경 괴물","가까운 거리 슛을 막아내는 감각이 천부적이에요.","shotstopper",[2,10,0,-4,-4],0,0,0],
     ["수비 지휘관","수비진을 이끄는 목소리가 큰 골키퍼예요.","commander",[0,-2,2,0,10],0,0,0],
     ["스위퍼 키퍼","발밑이 좋아 필드 플레이어처럼 뛰어요.","sweeper",[-2,0,0,10,2],1,0,0],
     ["박스의 지배자","큰 체격으로 문전을 장악해요. 민첩성은 아쉬워요.","commander",[4,-4,8,0,4],-2,3,[7,10]],
     ["안정적인 선방","화려하진 않아도 실수가 적어요.","shotstopper",[8,0,4,-4,0],1,0,0],
     ["대기만성 키퍼","지금은 서투르지만 성장 여력이 커요.","shotstopper",[0,2,-2,-2,0],-6,7,[3,5]]]
};
/* 후보 조합 생성기: 강점·약점·성장 곡선·체형·출신·버릇을 섞어서 사실상 끝없이 다양한 후보를 만들어요 */
const GROW=[["조숙한",5,-6],["꾸준한",0,0],["대기만성",-5,6],["폭발 성장형",-3,3],["안정적인",2,-2],["늦깎이",-6,8],["기복 있는",1,1]];
const BODY=[["장신",[7,4]],["단신",[-7,-4]],["탄탄한 체격",[0,6]],["마른 체형",[2,-6]],["건장한 체격",[4,9]],["표준 체격",[0,0]],["다부진 체격",[-3,5]],["늘씬한 체형",[5,-3]]];
const ORIGIN=["골목 축구로 자란 아이","축구 명문 가문의 막내","해외에서 살다 온 아이","늦게 축구를 시작한 아이","형을 따라 공을 차기 시작한 아이","풋살장에서 눈에 띈 아이","체육 선생님의 추천으로 온 아이","아버지가 전직 선수인 아이","공부와 축구를 함께 하는 아이","섬마을에서 올라온 아이","시골 학교 운동장이 전부였던 아이","이사를 자주 다닌 아이","동네 대회를 휩쓸던 아이","축구를 반대하는 집에서 몰래 훈련한 아이","어릴 때 다른 종목을 하다 온 아이","동네 형들 사이에서 자란 아이","학원 대신 운동장으로 간 아이","군인 가정에서 자란 아이","도시 한복판 아파트 단지에서 자란 아이","할머니와 함께 자란 아이","쌍둥이 형제와 함께 공을 찬 아이","유소년 클럽에서 연습생으로 시작한 아이","친구들과 만든 동네 팀의 주장이었던 아이","방과 후 축구부에서 발견된 아이","해변 모래사장에서 공을 찬 아이","눈 쌓인 지방 도시에서 자란 아이","TV 중계를 보며 혼자 따라 한 아이","삼촌에게 축구를 배운 아이","학교 대표로 전국대회를 다녀온 아이","한 번 큰 부상을 이겨낸 아이"];
const QUIRK=["경기 전 같은 노래를 꼭 듣는다","승부욕이 폭발하는 편이다","수줍음이 많지만 공을 잡으면 달라진다","동료를 챙기는 리더 기질이 있다","큰 경기일수록 침착해진다","연습벌레라 늘 마지막까지 남는다","실수를 오래 곱씹는다","낙천적이라 슬럼프에도 잘 웃는다","영상 분석을 즐긴다","양발을 쓰려고 늘 연습한다","프리킥 연습을 따로 한다","경기 후 노트에 기록을 남긴다","먹는 걸 정말 좋아한다","새벽 러닝이 습관이다","말수가 적지만 믿음직하다","팬 서비스에 진심이다","심판에게 자주 항의한다","징크스가 많다","후배들이 잘 따른다","혼자 있는 시간이 필요하다"];
function genArch(pos){
  const d=L.POSDEF[pos], n=d.stats.length, pick=a=>a[Math.floor(Math.random()*a.length)];
  const idx=[...Array(n).keys()].sort(()=>Math.random()-.5); const i1=idx[0], i2=idx[1], iw=idx[n-1];
  const mods=Array(n).fill(0); mods[i1]=8+Math.floor(Math.random()*7); mods[i2]=4+Math.floor(Math.random()*5); mods[iw]=-(6+Math.floor(Math.random()*7));
  const g=pick(GROW), b=pick(BODY), tys=L.TYPES[pos]; let bt=tys[0][0], bv=-99; tys.forEach(t=>{ const v=t[2][i1]*2+t[2][i2]; if(v>bv){ bv=v; bt=t[0]; } });
  const name=g[0]+" "+d.stats[i1][1]+" 특화 "+b[0];
  const desc=pick(ORIGIN)+". "+pick(QUIRK)+". 약점은 "+d.stats[iw][1]+"이에요.";
  return [name,desc,bt,mods,g[1],g[2],b[1]];
}
function makeCands(){
  const pool=[0,1,2].map(()=>Math.random()<.35?ARCH[draft.pos][Math.floor(Math.random()*ARCH[draft.pos].length)]:genArch(draft.pos)), d=L.POSDEF[draft.pos];
  return pool.map(a=>{
    const t=L.rollTalent(); t.pot=Math.max(55,Math.min(97,t.pot+a[5])); t.grade=t.pot>=90?"S":t.pot>=82?"A":t.pot>=74?"B":"C";
    const body=a[6]||[0,0], hh=+draft.height||undefined, ww=+draft.weight||undefined;
    const c=L.create({name:draft.name.trim()||"이름 없는 선수",pos:draft.pos,sub:draft.sub,role:draft.role,type:a[2],route:draft.route,talent:t,foot:draft.foot,trait:draft.trait,points:Object.assign({},draft.points),number:+draft.number||undefined,height:hh,weight:ww});
    const sc=.75+Math.random()*.5; d.stats.forEach(([k],i)=>{ c.p.stats[k]=Math.max(10,Math.min(95,Math.round(c.p.stats[k]+a[3][i]*sc+a[4]))); });
    if(!hh&&body) c.p.height+=body[0]||0; if(!ww&&body) c.p.weight+=body[1]||0;
    c.p.ovr=L.ovrOf(c.p); c.p.peak=c.p.ovr; c.arch={name:a[0],desc:a[1],now:a[4],pot:a[5]};
    if(draft.weekly){ const f=(L.FAMILY||[]).find(x=>x.id===draft.weekly.fam); if(f){ c.family={id:f.id,name:f.name,pts:f.pts,pts0:f.pts,note:f.note,allow:f.allow}; c.funds=Math.round((f.start!=null?f.start:.1+f.funds*.1)*10)/10; } c.challenge=draft.weekly.id; }
    const est=Math.round(t.pot+(Math.random()*10-5)); const pk=x=>x[Math.floor(Math.random()*x.length)]; c.hint=est>=90?pk(["스카우터가 말을 잇지 못했어요. 이런 재목은 드물어요","\"10년에 한 번 나올 재능\"이라는 평가예요"]):est>=82?pk(["성장 여력이 아주 커 보여요","몇 년 뒤가 기대되는 원석이에요"]):est>=76?pk(["성장 여력이 괜찮은 편이에요","노력하면 프로 주전까지는 충분해 보여요"]):est>=70?pk(["평균적인 성장이 예상돼요","지금 모습 그대로 무난하게 클 것 같아요"]):pk(["성장 여력은 크지 않아 보여요","타고난 재능보다 노력으로 승부해야 해요"]);
    return c;
  });
}
function scoutView(){
  if(draft.loading) return `<main class="body"><section class="card load"><small class="kick">SCOUTING</small><h2>스카우트가 후보를 추리는 중</h2><div class="pg"><i style="width:${draft.prog||10}%"></i></div><div class="steps"><p class="ok">${POSK[draft.pos]} 후보군 추리기</p><p class="ok">주발·체격 대조</p><p>잠재력 평가</p></div></section></main>`;
  const d=L.POSDEF[draft.pos];
  return `<main class="body"><div class="row"><button class="ibtn" data-act="create">‹</button><h2>스카우트 리포트</h2></div>
   <p class="muted">세 후보는 유형도, 체격도, 성장 여력도 서로 달라요. 지금 강한 선수가 끝까지 강하다는 보장은 없어요. 재능 등급은 20세가 되면 확정되고, 그 전에는 스카우터의 눈대중으로만 알 수 있어요.</p>
   <div class="scout">${draft.cands.map((c,i)=>`<button class="cand ${draft.pick===i?"on":""}" data-act="cand" data-v="${i}"><div class="hd"><b>후보 ${i+1} · ${esc(c.arch?c.arch.name:c.p.typeName)}</b><b>${c.p.ovr}</b></div>${c.arch?`<small class="muted" style="display:block;margin:-2px 0 6px">${esc(c.arch.desc)} · 스카우터: ${esc(c.hint)}</small>`:""}
     ${d.stats.map(([k,n])=>`<div class="sbar"><span>${n}</span><div class="bar"><i style="width:${c.p.stats[k]}%"></i></div><b>${c.p.stats[k]}</b></div>`).join("")}<small class="muted">${c.p.height}cm ${c.p.weight}kg · ${c.p.foot} · ${esc(L.traitName(c.p.trait))} · ${esc(c.family.name)}</small></button>`).join("")}</div>
   ${rescoutHtml()}
   <div class="cta"><button class="big ${draft.pick<0?"needs":""}" data-act="start"><span>${draft.pick<0?"후보를 골라 주세요 ↑":"후보 "+(draft.pick+1)+"로 시작"}</span><b>→</b></button></div></main>`;
}

/* ================= 드래프트 (지명 확률 · 해외 직행) ================= */
function ensureDr(){ if(!S.dr) S.dr={rolled:false,ok:false,chance:L.draftChance(S),direct:L.overseasDirect(S),k3:L.k3Offers(S),k4:L.k4Offers(S)}; if(!S.dr.k3) S.dr.k3=L.k3Offers(S); if(!S.dr.k4) S.dr.k4=L.k4Offers(S); return S.dr; }
function draftView(){
  const dr=ensureDr(); const finalDraft=age()>=22;
  const pay=o=>{ const c=L.clubPayroll(S,o.club.id,o.club.lg); return c?`<small>구단 최고 ${money(c.top.sal)} · 최저 ${money(c.low.sal)}</small>`:""; };
  const card=(o,i,act)=>`<button class="offer" data-act="${act}" data-v="${i}">${emblem(o.club,52)}<div><b>${esc(o.club.name)}</b><small>${esc(o.tag||L.lgLabel(o.club.lg))}${L.isRivalMove&&L.isRivalMove(S,o.club)?" · ⚠ 라이벌":""} · 전력 ${o.lvl}${lgAvg(o)} · 예상 ${esc(o.role)}</small>${outlookTag(o)}${pay(o)}<span class="sal">연봉 ${money(o.salary)} · ${o.years}년</span></div></button>`;
  let h=`<main class="body"><small class="kick">LEGEND LEAGUE DRAFT</small><h2>프로 입단 도전</h2>
   <section class="card"><div class="row"><div class="grow"><b>${esc(S.p.name)}</b><br><small class="muted">${POSK[S.p.pos]} · OVR ${S.p.ovr} · ${esc(scoutLabel())}</small></div><div class="stat"><small>지명 확률</small><b style="color:${dr.chance>=60?"var(--acc)":dr.chance>=30?"var(--gold)":"var(--red)"}">${dr.chance}%</b></div></div>
    <div class="bar ${dr.chance<30?"warn":""}"><i style="width:${dr.chance}%"></i></div>
    <p class="muted">능력치와 잠재력으로 정해져요. ${finalDraft?"이번이 마지막 기회예요. 지명받지 못하면 프로의 꿈은 여기까지예요.":"지명받지 못해도 대학에 진학해 성장한 뒤 다시 도전할 수 있어요."}</p></section>`;
  if(!dr.rolled){
    h+=`<button class="big" data-act="draftgo"><span>드래프트 참가</span><b>→</b></button>`;
    if(dr.direct.length){ h+=`<h3 class="sec">해외 직행 (잉글랜드 1부 리그)</h3><p class="muted">지명 결과를 기다리지 않고 바로 해외 구단 2군(U21) 계약을 맺어요. 큰 환경에서 성장하지만 출전 기회는 적어요.</p>${dr.direct.map((o,i)=>card(o,i,"signdirect")).join("")}`; }
    if(!finalDraft) h+=`<button class="wide" data-act="univ">드래프트 대신 대학 진학 (성장 후 재도전)</button>`;
  } else if(dr.ok){
    h+=`<p class="note good">🎉 지명에 성공했어요! 입단 제의가 도착했어요.</p>${S.offers.map((o,i)=>card(o,i,"sign")).join("")}`;
    if(dr.direct.length) h+=`<h3 class="sec">해외 직행도 가능해요</h3>${dr.direct.map((o,i)=>card(o,i,"signdirect")).join("")}`;
    if(!finalDraft) h+=`<button class="wide" data-act="univ">대학 진학 (성장 후 재도전)</button>`;
  } else {
    h+=`<p class="note warn">😢 이번 드래프트에서는 어느 구단에도 지명받지 못했어요.</p>`;
    if(dr.direct.length) h+=`<h3 class="sec">해외 직행 (잉글랜드 1부 리그)</h3>${dr.direct.map((o,i)=>card(o,i,"signdirect")).join("")}`;
    if(dr.k3.length) h+=`<h3 class="sec">레전드리그3(3부) 입단</h3><p class="muted">세미프로 구단이 손을 내밀었어요. 연봉은 낮지만 주전으로 뛰며 레전드리그2 승격 제안을 노릴 수 있어요.</p>${dr.k3.map((o,i)=>card(o,i,"signk3")).join("")}`;
    if(dr.k4.length&&(!dr.k3.length||S.p.ovr<=54)) h+=`<h3 class="sec">레전드리그4(4부) 입단</h3><p class="muted">${dr.k3.length?"더 낮은 곳에서 출발하는 길도 있어요. ":"3부 구단의 연락은 없었지만 "}지역 구단이 손을 내밀었어요. 연봉은 생계가 빠듯한 수준이지만 매 경기 뛰며 레전드리그3 승격을 노릴 수 있어요.</p>${dr.k4.map((o,i)=>card(o,i,"signk4")).join("")}`;
    if(!finalDraft) h+=`<button class="big" data-act="univ"><span>대학에 진학해 다시 도전</span><b>→</b></button>`;
    h+=`<button class="wide red" data-act="quitdraft">축구를 접는다</button>`;
  }
  return h+`</main>`;
}

/* ================= 시즌 탭 ================= */
function meters(){
  const m=(n,v,cls)=>`<div class="meter"><span>${n}</span><div class="bar ${cls||""}"><i style="width:${Math.min(100,v)}%"></i></div><b>${Math.round(v)}</b></div>`;
  const ft=L.fameTierOf(S,S.fame), ct=L.charTier(L.charOf(S));
  const fameRow=`<div class="meter"><span>인기</span><div class="bar gold"><i style="width:${Math.min(100,ft.next?((S.fame-ft.base)/(ft.next-ft.base))*100:100)}%"></i></div><b>${Math.round(S.fame)}</b></div><div class="tierline"><span class="pill gold">${ft.icon} ${ft.name}</span><small class="muted">${esc(ft.desc)}${ft.next?" · 다음 "+ft.nextName+"까지 "+Math.max(1,Math.round(ft.next-S.fame)):""}</small></div>`;
  return `<section class="card flat">${m("컨디션",S.cond,S.cond<50?"warn":"")}${m("사기",S.morale,S.morale<40?"warn":"")}${fameRow}${m("인성",L.charOf(S),"")}${perkChips()}<div class="tierline"><span class="pill">${ct.icon} ${ct.name}</span><small class="muted">선택과 행동이 쌓여 인성 점수가 돼요. 광고 계약금과 평판에 영향을 줘요.</small></div><div class="row"><small class="muted">보유 자금 <b style="color:var(--gold)">${money(S.funds)}</b></small><span class="grow"></span><button class="ghost" data-act="shop" style="min-height:44px">💸 소비·후원</button></div></section>`;
}
function timeline(){
  const cur=S.sim?S.sim.seg:-1; const segs=S.sim?S.sim.segs:L.segsFor(S);
  return `<div class="tl">${segs.map((s,i)=>`<div class="${S.phase==="result"||i<cur?"done":i===cur?"now":""}"><b>${s.label}</b>${s.months}</div>`).join("")}</div>`;
}
function seasonTab(){
  if(S.military==="serving"&&S.milKind==="army"&&S.phase==="prep") return armyView();
  const ph=S.phase;
  if(ph==="prep") return prepView();
  if(ph==="run") return runView();
  if(ph==="result") return resultView();
  if(ph==="offseason") return offseasonView();
  return "";
}
function armyView(){
  return `<small class="kick">${S.year} 시즌</small><h2>군 복무 ${S.mildone+1}/2년차</h2><section class="card"><p class="muted">현역으로 복무 중이에요. 이번 해는 경기에 나갈 수 없고 몸 상태가 조금 떨어져요.</p></section>
   <div class="cta"><button class="big" data-act="army"><span>한 해 보내기</span><b>→</b></button></div>`;
}

/* 훈련 설정 (시즌 준비 · 구간마다 다시 바꿀 수 있어요) */
/* 시즌별 능력치: 해마다 능력치가 어떻게 변했는지 한눈에 */
function statHistory(){
  const rows=S.history.filter(h=>h.st&&h.st.length); if(rows.length<2) return "";
  const names0=L.POSDEF[S.p.pos].stats.map(s=>s[1]), nn=Math.max(...rows.map(r=>r.st.length)), names=names0.slice(0,nn);
  const last=rows[rows.length-1].st, first=rows[0].st;
  return `<section class="card flat"><h3 class="sec">시즌별 능력치 <small class="muted">표를 옆으로 밀 수 있어요</small></h3><div class="sh-wrap"><table class="sh"><tr><th>나이</th>${names.map(n=>`<th>${esc(n.length>4?n.slice(0,4):n)}</th>`).join("")}<th>OVR</th></tr>${rows.map((h,i)=>{ const pv=i?rows[i-1].st:null; return `<tr><td>${h.age}</td>${h.st.map((v,j)=>{ const d=pv?v-pv[j]:0; return `<td class="${d>0?"up":d<0?"dn":""}">${v}${d?`<sup>${d>0?"+":""}${d}</sup>`:""}</td>`; }).join("")}<td><b>${h.ovr1||""}</b></td></tr>`; }).join("")}</table></div></section>`;
}
/* 이적 제의 카드: 그 리그의 평균 전력을 함께 보여 줘서 구단 수준을 가늠하게 해요 */
const _avgCache={};
function lgAvg(o){ try{ const lg=o.club&&o.club.lg; if(!lg||lg==="MIL") return ""; const k=lg+":"+S.year; if(_avgCache[k]==null){ const cl=L.leagueClubs(S,lg); _avgCache[k]=cl&&cl.length?Math.round(cl.reduce((a,c)=>a+c.l,0)/cl.length*10)/10:0; } return _avgCache[k]?" (리그 평균 "+_avgCache[k]+")":""; }catch(e){ return ""; } }
/* 현재 대우 · 잔류 시 예상 대우 */
function treatWord(sr,p,lvl){ if(sr>=.85&&p.ovr>=lvl+2) return "핵심 인재"; if(sr<.6&&L.age(S)<=21&&p.pot-p.ovr>=8) return "차기 유망주"; return L.roleLabel(sr); }
function treatCard(){
  if(S.stage!=="pro"||!S.club) return "";
  const p=S.p, lvl=S.club.l||70, cur=(S.sim&&S.sim.sr!=null)?S.sim.sr:L.startRateAt(p.ovr,lvl,S.trust*.8,p), stay=L.startRateAt(p.ovr,lvl,S.trust*.8,p);
  const a=treatWord(cur,p,lvl), b=treatWord(stay,p,lvl);
  return `<p class="treat"><small class="muted">현재 대우</small> <b>${a}</b> <small class="muted">· 이대로 잔류하면 다음 시즌 예상</small> <b>${b}</b> <small class="muted">(선발 확률 약 ${Math.round(stay*100)}%)</small></p>`;
}
function outlookTag(o){ if(o.sr==null||!L.outlook) return ""; const k=L.outlook(S,o.sr); return `<small class="outlook ${k.cls}">${esc(k.txt)}</small>`; }
function allocLeft(){ L.trimAlloc(S,plan); const al=plan.alloc||{}; return L.familyPts(S)-Object.values(al).reduce((a,b)=>a+(b|0),0); }
function planEditor(){
  const d=L.POSDEF[S.p.pos], p=S.p, ws=L.weakStrong(S); const T=L.TIERS;
  const tierBtns=["basic","mid","high","top","world"].map(t=>{ const c=L.trainCost(S,t); return `<button class="trainbtn ${plan.tier===t?"on":""}" data-act="tier" data-v="${t}"><b>${T[t].name}</b><small>${T[t].desc}</small><em>${c?"구간당 "+money(c):"무료"}</em></button>`; }).join("");
  const stat=d.stats.map(([k,n])=>{ const i=L.trainInfo(S,k,plan.tier); return `<button class="trainbtn ${plan.focus===k?"on":""}" data-act="focus" data-v="${k}"><b>${n} 훈련</b><small>현재 ${p.stats[k]} · ${L.PHYS.has(k)?"체력형":"기술형"}</small><em>${i.chance?"능력치 +1 성공 확률 "+i.chance+"%":"이 등급으론 더 못 올라요"}</em></button>`; }).join("");
  const inv=[["", "투자 안 함","비용 없음"]].concat(Object.entries(L.INV_SEG).map(([k,v])=>{ const c=r1(v.cost*L.priceScale(S)); let tgt=""; if(k==="weak"){ const i=L.trainInfo(S,ws.weak,plan.tier); tgt=" → "+ws.names[ws.weak]+" ("+(i.chance*.8|0)+"%)"; } if(k==="strong"){ const i=L.trainInfo(S,ws.strong,plan.tier); tgt=" → "+ws.names[ws.strong]+" ("+(i.chance*.8|0)+"%)"; } return [k,v.name,v.desc+tgt+" · 비용 "+money(c)]; }));
  return `<h3 class="sec" id="sec-tier">트레이너 등급 <small class="muted">능력치가 높을수록 상위 트레이너가 필요해요</small></h3><div class="grid2">${tierBtns}</div>
   <h3 class="sec" id="sec-train">훈련 방향 <small class="muted">성공하면 해당 능력치 +1</small></h3><div class="grid2">${stat}
    <button class="trainbtn ${plan.focus==="rest"?"on":""}" data-act="focus" data-v="rest"><b>휴식·회복</b><small>컨디션 +10 · 사기 +1</small></button>
    <button class="trainbtn ${plan.focus==="media"?"on":""}" data-act="focus" data-v="media"><b>미디어 활동</b><small>인기 +2~4</small></button></div>
   <h3 class="sec" id="sec-invest">자기 투자</h3><div class="grid2">${inv.map(([k,n,s])=>`<button class="trainbtn ${plan.invest===k?"on":""}" data-act="invest" data-v="${k}"><b>${n}</b><small>${s}</small></button>`).join("")}</div>
   ${famCard()}`;
}
function r1(v){ return Math.round(v*10)/10; }
function famCard(){
  const pts=L.familyPts(S); if(!pts) return "";
  const al=plan.alloc||{}, left=allocLeft();
  return `<h3 class="sec" id="sec-fam">가정 지원 투자 <small class="muted">${esc(S.family.name)} · 남은 포인트 ${left}/${pts}</small></h3>
   <section class="card flat"><p class="muted">부모님의 지원을 어디에 쓸까요? 구간마다 다시 나눌 수 있어요. 집안 사정이 좋아지거나 나빠지면 포인트도 함께 바뀌어요. 해외 캠프는 대박이 터질 수도, 무리해서 지칠 수도 있어요.</p>
   ${L.INV_CATS.map(([k,n,dsc])=>{ const inf=L.INV_INFO[k], v=al[k]|0; return `<div class="row inv"><div class="grow"><b>${inf.icon} ${n}</b><br><small class="good">＋ 1포인트마다 ${esc(inf.pro)}</small><br><small class="bad">－ ${esc(inf.con)}</small>${v?`<br><small class="nowfx">지금 ${v}포인트 → ${esc(inf.total(v))}</small>`:""}</div><button class="ghost" data-act="al" data-v="${k}:-1" ${(al[k]|0)<=0?"disabled":""}>−</button><b style="min-width:26px;text-align:center;font-family:var(--f-num);font-size:18px">${al[k]|0}</b><button class="ghost" data-act="al" data-v="${k}:1" ${(al[k]|0)>=5||left<=0?"disabled":""}>＋</button></div>`; }).join("")}</section>`;
}
function compCard(){
  const key=S.stage==="youth"||S.stage==="univ"?"YOUTH":L.leagueKey(S); const names=[];
  names.push(key==="YOUTH"?(S.stage==="univ"?"대학 리그":(S.club.abroad?"해외 유스 리그":"유소년 리그")):L.lgLabel(key==="K1"&&S.club.lg==="MIL"?"MIL":key));
  if(key==="K1"||key==="K2"||key==="K3"||key==="K4") names.push("전국컵"); if(L.isForeign(key)) L.cupNames(key).forEach(n=>names.push(n)); if(key==="YOUTH") names.push("전국대회");
  if((key==="K1"||(L.FL[key]&&L.FL[key].acl))&&S.acl) names.push("아시아 클럽컵 🌏"); if(L.isForeign(key)&&S.uel&&!S.ucl) names.push("유럽 유럽 클럽컵2 🟠"); if(L.isForeign(key)&&S.ucl) names.push("유럽 유럽 클럽컵 ⭐");
  return `<p class="note">🏟 올해 출전 대회: ${names.map(esc).join(" · ")}${(key==="K1"&&S.acl)?"<br><small>지난 시즌 성적(또는 구단 전력)으로 아시아 클럽컵 출전권을 얻었어요.</small>":""}</p>`;
}
function coachCard(){
  if(S.stage!=="pro"||!L.styleFit) return ""; const f=L.styleFit(S); if(f.fit==="none") return "";
  const cls=f.fit==="good"?"good":f.fit==="bad"?"warn":""; const ic=f.fit==="good"?"🤝":f.fit==="bad"?"⚠️":"🧭";
  const nw=S.coachNew?`<p class="note ${S.coachFrom?"warn":""}">${S.coachFrom?"새 감독이 부임했어요. 이전 "+esc(S.coachFrom.name)+" 감독과 전술 색이 달라질 수 있어요.":"새 구단의 감독을 만났어요."}</p>`:"";
  return `${nw}<section class="card flat"><small class="kick">COACH</small><h3 class="sec">${esc(f.coach.name)} 감독 · ${esc(f.style.name)}</h3><p class="muted">${esc(f.style.desc)}</p><p class="note ${cls}">${ic} ${esc(f.text)}</p></section>`;
}
function prepView(){
  const p=S.p;
  const youthTip=S.stage==="youth"?`<p class="note">${esc(L.youthTeamName(S.club.short,age()))} · ${L.gradeLabel(age())}. ${age()<=15?"U15는 성장기라 성장이 8% 빠르고 출전 기회가 넉넉해요.":"U18는 리그 수준이 높아 어린 학년은 출전이 어려워요."} 유소년 리그에서 두각을 나타내면 연령별 대표팀과 해외 유스의 눈에 띄어요.</p>`:"";
  const mil=S.military==="sangmu"?`<p class="note">🎖 김천 새벽 복무 중 (${S.mildone+1}/2년차)</p>`:"";
  return `<small class="kick">${L.seasonLabel(S)} 프리시즌 (${L.preMonths(S)})</small><h2>${yearLabel()} · ${L.seasonLabel(S)} 시즌 준비</h2>
   <section class="card prow"><div class="row">${emblem(S.club,56)}<div class="grow"><small class="muted">${esc(S.club.name)}</small><br><b>${esc(S.p.typeName)} · ${esc(subName())}</b><br><small class="muted">${esc(scoutLabel())}</small></div></div></section>
   ${youthTip}${mil}${coachCard()}${compCard()}${meters()}
   ${planEditor()}
   <h3 class="sec">올해 일정</h3>${timeline()}
   <div class="cta"><button class="big ${plan.focus?"":"needs"}" data-act="begin"><span>${plan.focus?"훈련 후 시즌 시작":"훈련 방향을 골라 주세요 ↑"}</span><b>→</b></button></div>`;
}
function planSummary(){
  const d=L.POSDEF[S.p.pos]; const nm=plan.focus==="rest"?"휴식·회복":plan.focus==="media"?"미디어 활동":(d.stats.find(s=>s[0]===plan.focus)||[0,"미선택"])[1]+" 훈련";
  const al=plan.alloc||{}; const alTxt=L.INV_CATS.filter(([k])=>al[k]).map(([k,n])=>n+" "+al[k]).join(" · ");
  return `${nm} · ${L.TIERS[plan.tier].name}${plan.invest?" · "+L.INV_SEG[plan.invest].name:""}${alTxt?" · 가정 투자: "+alTxt:""}`;
}
function ticketCard(){
  if(!snapAvail()) return ""; const n=tickets();
  return `<section class="card flat"><div class="row"><div class="grow"><small class="kick">REFRESH TICKET</small><br><b>🎟 새로고침권 ${n}장</b><br><small class="muted">방금 끝낸 '${esc(snapMeta.label)}'을 한 번 더 돌려요. 부상이나 아쉬운 결과를 다시 시도할 수 있어요.</small></div><button class="ghost" data-act="tkuse" ${n<=0?"disabled":""}>다시 하기</button></div>${n<=0?`<p class="muted">장수가 없어요. <button class="lnk" data-act="tkfree">무료로 받기</button></p>`:""}</section>`;
}
function runView(){
  const sim=S.sim, nxt=sim.segs[sim.seg];
  const up=L.upcoming?L.upcoming(S):[];
  return `<small class="kick">${L.seasonLabel(S)} ${nxt?nxt.label:""}</small><h2>${nxt?nxt.label+" · "+nxt.months:"시즌 종료"}</h2>${S.stage==="youth"&&S.youthPerk?`<p class="note">🏫 유스 특징 · ${esc(S.youthPerk.name)} — ${esc(S.youthPerk.text)}</p>`:""}${timeline()}${up.length?`<section class="card flat"><small class="kick">COMING UP</small><h3 class="sec">이번 구간 빅매치</h3>${up.map(x=>`<div class="ln2"><b>${x.ic}</b><span><b style="color:var(--txt);font-family:var(--f-body)">${esc(x.t)}</b><br><small class="muted">${esc(x.d)}</small></span></div>`).join("")}</section>`:""}${meters()}
   ${seg?segCard(seg):`<section class="card"><p class="muted">훈련 계획이 반영된 채로 시즌이 시작돼요.</p></section>`}
   ${nxt?`<section class="card flat"><div class="row"><div class="grow"><small class="kick">NEXT TRAINING</small><br><b>${esc(nxt.label)} 훈련 설정</b><br><small class="muted">${esc(planSummary())}</small></div><button class="ghost" data-act="planbtn">${planOpen?"접기":"변경"}</button></div></section>${planOpen?planEditor():""}`:""}
   ${tableCard(sim)}
   ${ticketCard()}
   <div class="cta"><button class="big ${nxt&&!plan.focus?"needs":""}" data-act="next"><span>${nxt?(plan.focus?nxt.label+" 진행":"훈련 방향을 골라 주세요 ↑"):"시즌 결과 보기"}</span><b>→</b></button></div>`;
}
/* 1부 2군으로 계약했을 때: 그냥 2군에서 훈련할지, 2부리그에 임대를 가서 주전으로 뛸지 */
function tier2Prompt(){ try{ if(S.team!=="2군"||S.loan||S.stage!=="pro") return; const lo=L.loanOffers(S); modals.push({t:"tier2",offers:lo}); }catch(e){} }
function tier2Html(m){
  return `<div class="ov center"><div class="sheet"><small class="kick">SQUAD ROLE</small><h3>2군 소속이에요</h3><p class="muted">${esc(S.club.name)}의 1군 경쟁에서는 아직 밀려요. 어떻게 시즌을 보낼까요? 1군 감독이 호출하기 전까지 2군 경기만 뛰어요.</p>
   ${m.offers.length?`<h3 class="sec">2부리그 임대 <small class="muted">1년 · 주전으로 뛰고 돌아와요</small></h3>${m.offers.map((o,i)=>`<button class="offer" data-act="t2loan" data-v="${i}">${emblem(o.club,44)}<div><b>${esc(o.club.name)}</b><small>${esc(o.tag||"임대")} · 예상 역할 ${esc(o.role||"")} · 연봉 ${money(o.salary)} 유지</small></div></button>`).join("")}`:'<p class="note">지금은 받아 주는 임대 구단이 없어요.</p>'}
   <button class="big" data-act="t2stay"><span>2군에서 훈련하며 기회를 노린다</span><b>→</b></button></div></div>`;
}
/* 이적 연출: (해외면) 비행기 → 경기장 입구에서 환호받으며 입장 + 이적 인터뷰 */
const ARRIVE_Q=["\"어릴 때부터 꿈꿔 온 무대예요. 팬 여러분께 트로피로 보답하겠습니다.\"","\"이 팀의 일원이 되어 영광입니다. 첫날부터 모든 걸 쏟아붓겠습니다.\"","\"감독님과 동료들이 따뜻하게 맞아 줬어요. 빨리 그라운드에서 보여 드리고 싶어요.\"","\"도전하는 걸 좋아해요. 더 높은 곳을 향해 한 걸음 더 나아가겠습니다.\"","\"팬들의 함성을 들으니 가슴이 뛰네요. 멋진 시즌을 만들어 보겠습니다.\""];
/* 리그 → 대표 도시 (세계지도 항로용) */
const CITY={K1:{n:"이스트",code:"SEL",lat:37.57,lon:126.98},K2:{n:"이스트",code:"SEL",lat:37.57,lon:126.98},MIL:{n:"이스트",code:"SEL",lat:37.57,lon:126.98},EPL:{n:"런던",code:"LON",lat:51.5,lon:-.12},EPL2:{n:"런던",code:"LON",lat:51.5,lon:-.12},LAL:{n:"마드리드",code:"MAD",lat:40.42,lon:-3.7},LAL2:{n:"마드리드",code:"MAD",lat:40.42,lon:-3.7},BUN:{n:"뮌헨",code:"MUC",lat:48.14,lon:11.58},BUN2:{n:"뮌헨",code:"MUC",lat:48.14,lon:11.58},SEA:{n:"밀라노",code:"MIL",lat:45.46,lon:9.19},SEA2:{n:"밀라노",code:"MIL",lat:45.46,lon:9.19},L1:{n:"파리",code:"PAR",lat:48.86,lon:2.35},FR2:{n:"파리",code:"PAR",lat:48.86,lon:2.35},J1:{n:"라이더스",code:"TYO",lat:35.68,lon:139.7},J2:{n:"라이더스",code:"TYO",lat:35.68,lon:139.7},SPL:{n:"리야드",code:"RUH",lat:24.71,lon:46.68},SPL2:{n:"리야드",code:"RUH",lat:24.71,lon:46.68}};
function transferCines(o,flyAbroad,fromLg){
  const arr=[]; const nm=S.p.name, club=o.club.name;
  const fc=CITY[fromLg||"K1"]||CITY.K1, tc=CITY[o.club.lg]||CITY.K1;
  if(flyAbroad&&fc.n!==tc.n) arr.push({t:"cine",o:{kind:"flight",route:{from:fc,to:tc},icon:"✈️",kicker:"FLIGHT · "+S.year,title:"새로운 도전을 향해",sub:nm+", "+club+"(으)로 비행기에 올라요. "+L.lgLabel(o.club.lg)+"에서 새 이야기가 시작돼요.",lines:["연봉 "+money(o.salary)+" · "+o.years+"년"]}});
  arr.push({t:"cine",o:{kind:"arrive",icon:"🏟️",kicker:"WELCOME · "+club,title:club+" 입단!",sub:"경기장 터널을 지나 그라운드에 들어서자 팬들의 함성이 쏟아져요.",lines:["📣 팬들: \""+nm+"! "+nm+"!\"","🎤 입단 인터뷰 — "+ARRIVE_Q[Math.floor(Math.random()*ARRIVE_Q.length)]]}});
  return arr;
}
function healCost(){ return Math.max(.1,Math.round((S.sim.out||0)*.12*L.priceScale(S)*10)/10); }
function healBox(o){
  if(!S.sim||o.inj.treated||(S.sim.out||0)<2) return o.inj.treated?`<p class="muted">${esc(o.inj.treated)}</p>`:"";
  const c=healCost(), after=Math.ceil(S.sim.out*.35);
  return `<div class="card flat" style="gap:6px"><small class="muted">남은 결장 ${S.sim.out}경기. 돈을 내면 최신 재활 치료로 ${after}경기까지 줄일 수 있어요. 기다리면 무료지만 그만큼 못 뛰어요.</small><div class="grid2"><button class="ghost" data-act="healfast" ${S.funds<c?"disabled":""}>⚡ 집중 치료 ${money(c)}</button><button class="ghost" data-act="healwait">🛌 자연 회복</button></div></div>`;
}
function segCard(o){
  const chips=o.recs.filter(r=>r.comp==="리그").map(r=>`<i class="${r.res}">${r.res==="W"?"승":r.res==="D"?"무":"패"}</i>`).join("");
  const cups=o.recs.filter(r=>r.comp!=="리그");
  return `<section class="card"><small class="kick">${o.label.toUpperCase()} RESULT</small><div class="row"><div class="grow"><b style="font-size:18px">${o.segStat.W}승 ${o.segStat.D}무 ${o.segStat.L}패</b><br><small class="muted">${o.rank}위 / ${o.N}팀 · 승점 ${o.pts}</small></div><div class="stat"><small>평점</small><b>${o.segStat.rt||"-"}</b></div></div>
   <div class="chipsr">${chips}</div>
   <div class="four"><div class="stat"><small>출전</small><b>${o.segStat.apps}</b></div><div class="stat"><small>골</small><b>${o.segStat.g}</b></div><div class="stat"><small>도움</small><b>${o.segStat.as}</b></div><div class="stat"><small>누적</small><b>${o.cum.g}G ${o.cum.a}A</b></div></div>
   ${cups.map(r=>`<p class="note ${r.res==="W"?"good":"warn"}">🏆 ${esc(r.comp)} ${esc(r.cupRound||"")} ${r.res==="W"?"통과":"탈락"} (${r.f}:${r.a}${r.pk?" 승부차기":""})${r.min?" · 평점 "+r.rt:" · 결장"}</p>`).join("")}
   ${o.inj?`<p class="note warn">🩹 ${esc(o.inj.part)} 부상 — ${o.inj.matches}경기 결장</p>${healBox(o)}`:""}
   ${o.paid?`<p class="muted">이번 구간 훈련·투자 비용 ${money(o.paid)}</p>`:""}</section>`;
}
/* 리그 순위표 전체: 승-무-패 · 득실 · 승점 (좌우·상하로 밀어서 볼 수 있어요) */
function fullTable(rows,meId){
  return `<div class="tablewrap"><div class="tab"><div class="tr hd full"><span>#</span><span>팀</span><span>경기</span><span>승-무-패</span><span>득실</span><span>승점</span></div>${rows.map((t,i)=>`<div class="tr full ${(t.me||t.id===meId)?"me":""}"><span>${i+1}</span><span>${esc(t.name)}</span><span>${t.p!=null?t.p:t.w+t.d+t.l}</span><span>${t.w}-${t.d}-${t.l}</span><span>${t.gf-t.ga>0?"+":""}${t.gf-t.ga}</span><span><b>${t.pts}</b></span></div>`).join("")}</div></div>`;
}
function tableCard(sim){
  const tab=Object.values(sim.tab).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf).map(t=>Object.assign({},t,{name:L.teamName(sim,t.id)}));
  return `<section class="card flat"><h3 class="sec">리그 순위 <small class="muted">밀어서 전체 보기</small></h3>${fullTable(tab,sim.myId)}</section>`;
}
function boardCard(R){
  if(!R.table) return ""; const b=R.board;
  const tabs=[["table","순위표"],["scorers","득점왕"],["assists","도움왕"],["ratings","평점 1위"]];
  const list=k=>{ const arr=b&&b[k]||[]; if(!arr.length) return `<p class="muted">기록이 없어요.</p>`; return `<div class="tab">${arr.map((x,i)=>`<div class="tr ${x.me?"me":""}" style="grid-template-columns:26px 1fr 1fr 44px"><span>${i+1}</span><span>${esc(x.name)}</span><span class="muted">${esc(x.team)}</span><span><b>${k==="ratings"?x.v.toFixed?x.v.toFixed(2):x.v:x.v}</b></span></div>`).join("")}</div>`; };
  return `<section class="card flat"><h3 class="sec">${esc(R.leagueName)} 최종 기록</h3><div class="chips">${tabs.map(([k,n])=>`<button data-act="btab" data-v="${k}" class="${boardTab===k?"on":""}">${n}</button>`).join("")}</div>
   ${boardTab==="table"?fullTable(R.table,null):list(boardTab)}</section>`;
}

/* ===== 시즌 결과 ===== */
function resultView(){
  const R=S.lastR; if(!R) return "";
  const gk=S.p.pos==="GK";
  const stats=R.military?[]:[["출전",R.apps],[gk?"무실점":"골",gk?R.cs:R.goals],[gk?"선발":"도움",gk?R.starts:R.assists],["평점",R.rating||"-"]];
  const comps=(R.cups||[]).map(c=>`<p class="note ${c.res==="우승"?"good":""}">🏟 ${esc(c.name)} — ${esc(c.res)}</p>`).join("");
  return `<small class="kick">${R.age}세 시즌</small><h2>${R.year} 시즌 결과</h2>
   <div class="pills"><span class="pill acc">${esc(R.leagueName)}</span><span class="pill">${esc(R.role||"")}</span>${R.rank?`<span class="pill gold">${R.rank}위 / ${R.N}팀</span>`:""}</div>
   ${stats.length?`<section class="four">${stats.map(([k,v])=>`<div class="stat"><small>${k}</small><b class="cnt" data-to="${v}">${v}</b></div>`).join("")}</section>`:`<section class="card"><p class="muted">군 복무로 한 해를 보냈어요.</p></section>`}
   ${R.rank?`<section class="card flat"><div class="three"><div class="stat"><small>전적</small><b>${R.W}-${R.D}-${R.L}</b></div><div class="stat"><small>득실</small><b>${R.gf}:${R.ga}</b></div><div class="stat"><small>OVR</small><b>${R.ovr0}→${R.ovr1}</b></div></div></section>`:""}
   ${R.trophies.length?`<div class="pills">${R.trophies.map(t=>`<span class="pill gold">🏆 ${esc(t)}</span>`).join("")}</div>`:""}
   ${R.awards.length?`<div class="pills">${R.awards.map(a=>`<span class="pill gold">⭐ ${esc(a)} · ${esc(L.awardComp(a,R))}</span>`).join("")}</div>`:""}
   ${(R.records||[]).map(t=>`<p class="note good">🏅 ${esc(t)}</p>`).join("")}
   ${R.react?`<section class="card flat"><small class="kick">SNS · 팬 반응</small><h3 class="sec">📰 ${esc(R.react.headline)}</h3>${R.react.posts.map(p=>`<div class="sns ${p.tone>0?"up":p.tone<0?"dn":""}"><b>${esc(p.h)}${p.src&&p.src!=="SNS"?` <em class="srctag">${esc(p.src)}</em>`:""}</b><span>${esc(p.t)}</span><small>♥ ${p.likes}</small></div>`).join("")}<p class="muted">※ 모든 계정은 가상이에요.</p></section>`:""}
   ${(R.derbies||[]).length?`<section class="card flat"><h3 class="sec">🔥 ${esc(R.derbies[0].name)}</h3>${R.derbies.map(d=>`<div class="row"><span class="grow">${esc(d.opp)}전${d.min>0?"":" (결장)"}${d.g?" · "+d.g+"골":""}</span><b style="color:${d.res==="W"?"var(--acc)":d.res==="L"?"var(--red)":"var(--gold)"}">${d.f}:${d.a}</b></div>`).join("")}</section>`:""}
   ${(R.moneyNotes||[]).length?`<section class="card flat"><h3 class="sec">재정 리포트</h3>${R.moneyNotes.map(t=>`<p class="muted">${esc(t)}</p>`).join("")}</section>`:""}
   ${adslot("result")}
   ${R.awards.some(a=>/베스트 11|올해의 팀/.test(a))&&!R.youth?`<button class="wide" data-act="xi">⭐ 이번 시즌 베스트 11 보기</button>`:""}
   ${R.ballon?`<button class="wide" data-act="ballon">🏅 황금공 후보 ${R.ballon.rank}위 — 30인 명단 보기</button>`:""}
   ${comps}${R.nextAcl?`<p class="note good">🌏 다음 시즌 아시아 클럽컵 출전권을 얻었어요!</p>`:""}${R.nextUel?`<p class="note good">🟠 다음 시즌 유럽 유럽 클럽컵2에 진출해요!</p>`:""}${R.nextUcl?`<p class="note good">⭐ 다음 시즌 유럽 유럽 클럽컵에 진출해요!</p>`:""}
   ${(R.natEvents||[]).map(e=>e.skipped?`<p class="note warn">🇰🇷 ${esc(e.name)} — ${esc(e.text)}</p>`:e.declined?`<p class="note warn">🇰🇷 ${esc(e.name)} — 소집 불참</p>`:`<p class="note ${e.title?"good":""}">🇰🇷 ${esc(e.name)}${e.host?" ("+esc(e.host)+")":""} · ${esc(e.stage)} (팀 ${e.games||e.caps}경기 중 ${e.caps}경기 출전 · ${e.goals}골)${e.exempt?" · 체육요원 편입!":""}</p>`).join("")}
   ${R.injury?`<p class="note warn">🩹 ${esc(R.injury.text)}</p>`:""}${R.bonus?`<p class="note good">💰 옵션 보너스 ${R.bonus}억 (${(R.bonusHit||[]).map(esc).join(", ")})</p>`:""}
   ${(R.endorses||[]).map(e=>`<p class="note ${e.ok?"good":"warn"}">🤝 ${esc(e.brand)} 광고 ${e.cancelled?"이미지 조항 위반으로 해지":e.ok?"조건 달성":"조건 미달"} — ${money(e.pay)}</p>`).join("")}${R.famNote?`<p class="note">${esc(R.famNote)}</p>`:""}${R.noMedal?`<p class="note">🥈 2군 소속이라 이번 시즌 1군의 우승 메달은 받지 못했어요. 1군에서 뛰면 기록돼요.</p>`:""}${R.valueSpike?`<p class="note good">💰 몸값 폭등! 시장 가치 ${money(R.valueSpike.before)} → ${money(R.valueSpike.after)} (${esc(R.valueSpike.why||"맹활약")}). 이적 제의가 커질 수 있어요. ${L.age(S)>=29?"다만 나이 때문에 폭은 제한적이에요.":""}</p>`:""}${R.fameDrop?`<p class="note warn">📉 인기가 ${R.fameDrop} 떨어졌어요 (${esc(R.fameWhy)}). 경기력과 이미지를 관리해야 팬이 남아요.</p>`:""}${R.titleBoost?`<p class="note good">🏆 주전으로 우승에 기여한 자신감이 성장에 보태졌어요.</p>`:""}
   ${S.promoNote?`<p class="note">${esc(S.promoNote)}</p>`:""}
   ${boardCard(R)}
   ${R.table?`<button class="wide" data-act="det">${openDet?"▾":"▸"} 내 경기 기록 보기</button>${openDet?`<section class="card flat">${(R.matches||[]).filter(m=>m.min>0).slice(0,60).map(m=>`<div class="mrow ${m.res}"><b>${m.comp==="리그"?m.r+"R":esc(m.comp.slice(0,3))}</b><span>${m.home?"홈":"원정"} ${esc(L.teamName({teams:R.simTeams||[]},m.opp))}</span><small>${m.g?m.g+"골 ":""}${m.as?m.as+"도움 ":""}${m.rt}</small><em>${m.f}:${m.a}</em></div>`).join("")}</section>`:""}`:""}
   <div class="cta"><button class="big" data-act="offseason"><span>오프시즌으로</span><b>→</b></button></div>`;
}

/* ===== 오프시즌: 계약 · 이적 · 병역 · 광고 ===== */
function offseasonView(){
  if(!off) return "";
  if(S.stage!=="pro"){
    const ag=age()+1;
    return `<small class="kick">OFFSEASON</small><h2>${S.year+1}년을 준비해요</h2><section class="card"><p class="muted">${S.stage==="youth"?(ag>L.YOUTH_END?"유소년 과정을 마치고 프로 드래프트에 도전해요.":ag===16?"고등학교에 진학하며 U18 팀으로 올라가요.":"한 학년 올라가요."):(ag>=L.UNIV_DRAFT?"대학을 졸업하고 프로 드래프트에 도전해요.":"다음 학년으로 올라가요.")}</p></section>
     <div class="cta"><button class="big" data-act="nextyear"><span>다음 해로</span><b>→</b></button></div>`;
  }
  const lg=S.club.lg==="MIL"?"K1":S.club.lg, pay=L.clubPayroll(S,S.club.id,lg);
  let h=`<small class="kick">OFFSEASON · 이적 시장</small><h2>${S.year+1}년 오프시즌</h2>`;
  if(S.promoNote) h+=`<p class="note">${esc(S.promoNote)}</p>`;
  if(off.retire){ h+=`${L.canPlayCoach&&L.canPlayCoach(S)?`<section class="card flat"><h3 class="sec">🧑‍🏫 플레잉코치 제안</h3><p class="muted">계약은 끝났지만 플레잉코치로 남을 수 있어요. 연봉 25% 감소, 출전 비중 낮음, 팀 전력 +0.5, 은퇴 후 지도자의 길 보너스. 42세까지 뛸 수 있어요.</p><button class="wide" data-act="pcoach">플레잉코치로 남기</button></section>`:""}<section class="card"><p class="note warn">${esc(S.p.name)}의 나이와 기량으로는 더 이상 계약을 이어 가기 어려워요.</p></section><div class="cta"><button class="big" data-act="retire"><span>현역 은퇴</span><b>→</b></button></div>`; return h; }
  if(off.mil&&!off.milDone){
    h+=`<section class="card"><h3 class="sec">병역</h3><p class="muted">${off.mil.must?"올해는 병역을 해결해야 해요. 상무에 지원하거나 현역으로 입대해요.":"병역을 미리 해결할 수 있어요. 상무는 선발되어야 해요."}</p>
     ${off.mil.canMil?`<button class="wide" data-act="mil" data-v="sangmu">김천 새벽 지원</button>`:`<p class="muted">상무 지원은 OVR 66 이상부터 가능해요.</p>`}
     <button class="wide" data-act="mil" data-v="army">현역 입대 (2년)</button>${off.mil.must?"":`<button class="ghost" data-act="mil" data-v="skip">나중에</button>`}</section>`;
  }
  if(S.military==="sports") h+=`<p class="note good">🎖 체육요원 복무 중이에요. 선수로 뛰면서 남은 ${S.sportsMonths||0}개월을 채워요.</p>`;
  else if(S.military==="exempt") h+=`<p class="note good">🎖 병역 의무를 마쳤어요.</p>`;
  const c=off.contract; const inMil=S.club.lg==="MIL"||S.military==="serving"||S.military==="sangmu";
  if(inMil) h+=`<section class="card"><h3 class="sec">복무 중</h3><p class="muted">군 복무 중에는 월급 수준(연 0.3억)만 받고 계약을 새로 맺거나 이적할 수 없어요. 2년을 채우고 전역하면 원래 팀으로 돌아가요.</p></section>`;
  else if(S.contractYears<=1){
    const opts=L.incentiveOptions(S,c.offer);
    h+=`<section class="card"><h3 class="sec">재계약</h3>${treatCard()}${c.charNote?`<p class="note ${L.charOf(S)>=60?"good":"warn"}">${esc(c.charNote)}</p>`:""}<div class="three"><div class="stat"><small>현재 연봉</small><b>${money(c.last)}</b></div><div class="stat"><small>제시액</small><b>${money(c.offer)}</b></div><div class="stat"><small>${c.rate>=0?"+":""}${c.rate}%</small><b>${c.years}년</b></div></div>
     ${pay?`<div class="pay"><small>${esc(S.club.name)} 최고 연봉</small><b>${esc(pay.top.name)} ${money(pay.top.sal)}</b><small>최저 연봉</small><b>${esc(pay.low.name)} ${money(pay.low.sal)}</b><small>평균</small><b>${money(pay.avg)}</b></div>`:""}
     <span class="lab">연봉 옵션 (선택) — 기본급이 조금 낮아지는 대신, 조건을 채우면 시즌 끝에 보너스를 받아요</span>
     ${opts.map(o=>`<label class="chk"><input type="checkbox" data-act="inc" data-v="${o.id}" ${chosenInc.includes(o.id)?"checked":""}><div><b>${esc(o.label)}</b><small>달성 예상 ${o.prob}% · 보너스 ${o.bonus}억</small></div></label>`).join("")}
     <div class="grid2"><button class="ghost" data-act="renego" ${off.renego?"disabled":""}>재협상 (1회)</button><button class="ghost" data-act="accept">계약 수락</button></div>
     ${off.accepted?`<p class="note good">계약 완료: 연봉 ${money(S.salary)} · ${S.contractYears}년${S.incentives.length?" · 옵션 "+S.incentives.length+"개":""}</p>`:""}</section>`;
  } else h+=`<section class="card"><h3 class="sec">계약</h3>${treatCard()}<p class="muted">연봉 ${money(S.salary)} · 계약 ${S.contractYears}년 남음</p>${pay?`<div class="pay"><small>구단 최고 연봉</small><b>${money(pay.top.sal)}</b><small>구단 최저 연봉</small><b>${money(pay.low.sal)}</b></div>`:""}</section>`;
  if(L.endorsesOf(S).length) h+=`<section class="card flat"><h3 class="sec">광고 계약 중 <small class="muted">슬롯 ${L.endorsesOf(S).length}/${L.endorseSlots(S)}</small></h3>${L.endorsesOf(S).map(e=>`<p class="muted">🤝 ${esc(e.brand)} · 연 ${money(e.fee)} · ${e.years}년 남음 — 조건: ${esc(e.clause.label)}</p>`).join("")}${L.endorseFree(S)>0?`<small class="muted">슬롯이 ${L.endorseFree(S)}개 남아 있어요. 인기가 30·70·150을 넘으면 슬롯이 늘어요.</small>`:`<small class="muted">슬롯이 가득 찼어요.</small>`}</section>`;
  if(off.endorse&&off.endorse.length&&L.endorseFree(S)>0) h+=`<h3 class="sec">광고 제의 <small class="muted">슬롯 ${L.endorseFree(S)}개 남음 · 여러 개 고를 수 있어요</small></h3>${off.endorse.map((o,i)=>`<button class="offer" data-act="endorse" data-v="${i}"><div><b>${esc(o.brand)}</b> <em class="srctag">${esc(o.catName||"")}</em><small>${o.years}년 계약 · 조건: ${esc(o.clause.label)} (못 채우면 절반만)</small><span class="sal">연 ${money(o.fee)}</span></div></button>`).join("")}`;
  if(off.loans&&off.loans.length&&!off.accepted) h+=`<h3 class="sec">임대 제의 <small class="muted">1년 · 주전으로 뛰고 돌아와요</small></h3>${off.loans.map((o,i)=>`<button class="offer" data-act="loan" data-v="${i}">${emblem(o.club,48)}<div><b>${esc(o.club.name)}</b><small>${esc(o.tag)} · 전력 ${o.lvl}${lgAvg(o)} · 예상 ${esc(o.role)}</small>${outlookTag(o)}<span class="sal">연봉 ${money(o.salary)} (원소속 부담) · 1년</span></div></button>`).join("")}`;
  h+=`<section class="card flat"><h3 class="sec">내 대우</h3>${treatCard()}<small class="muted">잠재력은 능력치 전체의 '상한선'이에요. 평균이 아니라 OVR이 이 값을 넘기 어렵다는 뜻이에요.</small></section><h3 class="sec">이적 제의</h3>${off.loanNote?`<p class="note">임대 중이에요. 시즌이 끝나면 원소속 구단 ${esc(S.loan.parent.name)}(으)로 돌아가요.</p>`:""}${off.demandNote?`<p class="note warn">이적을 요청한 상태라 구단이 다른 팀의 제안을 열어 뒀어요.</p>`:""}${off.transfers.length?off.transfers.map((o,i)=>`<button class="offer" data-act="transfer" data-v="${i}">${emblem(o.club,48)}<div><b>${esc(o.club.name)}</b><small>${esc(o.tag)} · 전력 ${o.lvl}${lgAvg(o)} · 예상 ${esc(o.role)}</small>${outlookTag(o)}<span class="sal">연봉 ${money(o.salary)} · ${o.years}년</span></div></button>`).join(""):`<p class="muted">${inMil?"복무 중에는 이적 제의가 오지 않아요.":"지금은 들어온 이적 제의가 없어요."}</p>`}`;
  if(S.permitBlocked&&S.permitBlocked.length&&!off.accepted) h+=`<section class="card flat"><h3 class="sec">🔒 해외 이적 규정으로 막힌 제안</h3><p class="muted">실제 축구처럼 해외로 가려면 취업비자·외국인 쿼터 같은 조건이 필요해요. 어릴 때 그 나라 유스 아카데미에서 자라면 규정이 면제돼요.</p>${S.permitBlocked.map(b=>`<div class="ln2"><b>${esc(b.club)}</b><span>${esc(b.why)}</span></div>`).join("")}</section>`;
  h+=`${L.canPlayCoach&&L.canPlayCoach(S)?`<section class="card flat"><h3 class="sec">🧑‍🏫 플레잉코치 제안</h3><p class="muted">선수와 코치를 겸하는 길이에요. 연봉은 25% 줄고 출전 비중은 낮아지지만, 팀 전력 +0.5와 신뢰·평판이 오르고 은퇴 후 지도자의 길에서 크게 유리해요. 능력이 떨어져도 42세까지 뛸 수 있어요.</p><button class="wide" data-act="pcoach">플레잉코치로 전환</button></section>`:""}${S.playcoach?`<p class="note good">🧑‍🏫 플레잉코치 ${S.pcYears||0}년차</p>`:""}${L.canRetire(S)?`<button class="wide red" data-act="retire">현역 은퇴</button>`:""}
   <div class="cta"><button class="big ${(!inMil&&S.contractYears<=1&&!off.accepted)?"needs":""}" data-act="nextyear"><span>${(!inMil&&S.contractYears<=1&&!off.accepted)?"계약을 먼저 확정해 주세요 ↑":"다음 시즌으로"}</span><b>→</b></button></div>`;
  return h;
}

/* ================= 선수 / 커리어 / 소식 ================= */
function playerTab(){
  const p=S.p, d=L.POSDEF[p.pos], b=L.scoutBand(S);
  return `<section class="card"><div class="row">${L.pixelImg?L.pixelImg(S,88):""}<div class="grow"><small class="kick">${esc(p.typeName)}</small><h2>${esc(p.name)}</h2><small class="muted">No.${p.number} · ${p.height}cm ${p.weight}kg · ${p.foot} · ${esc(L.traitName(p.trait))}${S.scoutFinal&&p.hidden?" · "+esc(L.traitName(p.hidden,true)):""}</small></div><div class="stat"><small>OVR</small><b style="font-size:30px;color:var(--acc)">${p.ovr}</b></div></div>
   ${d.stats.map(([k,n])=>`<div class="sbar" data-act="substat" data-v="${k}" style="cursor:pointer"><span>${n} ${openStat===k?"▾":"▸"}</span><div class="bar"><i style="width:${Math.min(100,p.stats[k])}%"></i></div><b>${p.stats[k]}</b></div>${openStat===k?`<div class="subbox"><small class="muted">${esc(L.statFx(k))}</small>${L.subStats(p,k).map(x=>`<div class="sbar sub"><span>${esc(x.name)}</span><div class="bar"><i style="width:${Math.min(100,x.v)}%"></i></div><b>${x.v}</b></div><small class="muted subd">${esc(x.desc)}</small>`).join("")}</div>`:""}`).join("")}
   <div class="three"><div class="stat"><small>최고 OVR</small><b>${p.peak}</b></div><div class="stat"><small>재능${b.final?"":" 예상"}</small><b>${b.label}</b></div><div class="stat"><small>나이</small><b>${age()}</b></div></div>
   ${b.final?"":`<p class="muted">재능 등급은 20세 시즌이 끝나면 확정돼요. 경기 결과와 성장에 따라 달라질 수 있어요.</p>`}</section>
   ${styleCard()}${familyCard()}
   ${meters()}
   <section class="card flat"><h3 class="sec">계약</h3><div class="pay"><small>소속</small><b>${esc(S.club.name)}</b><small>연봉</small><b>${S.stage==="pro"?money(S.salary):"-"}</b><small>계약 기간</small><b>${S.stage==="pro"?S.contractYears+"년":"-"}</b><small>보유 자금</small><b>${money(S.funds)}</b><small>가정 환경</small><b>${S.family?esc(S.family.name)+(L.familyPts(S)?" · "+L.familyPts(S)+"점":""):"-"}</b><small>병역</small><b>${({none:"미필",exempt:"특례(면제)",sangmu:"상무 복무 중",serving:"현역 복무 중",served:"군필"})[S.military]||"-"}</b></div>${S.incentives.length?`<span class="lab">연봉 옵션</span>${S.incentives.map(o=>`<p class="muted">· ${esc(o.label)} (+${o.bonus}억)</p>`).join("")}`:""}
    ${L.endorsesOf(S).map(e=>`<p class="muted">🤝 ${esc(e.brand)} 광고 · 연 ${money(e.fee)}</p>`).join("")}${(S.cars||[]).length?`<p class="muted">🚗 보유 차량: ${(S.cars).map(c=>esc(c.name)).join(", ")}</p>`:""}
    <button class="wide" data-act="help">📘 도움말 · 능력치와 한계선</button>
    <button class="wide" data-act="camp">🌱 재능 개발 센터 <small class="muted">· 잠재력 ${S.p.pot}</small></button>
    <button class="wide" data-act="shop">💸 소비·후원</button></section>`;
}
function perkChips(){ try{ const a=L.perkList?L.perkList(S):[]; if(!a.length) return ""; return `<div class="perks">${a.map(p=>`<div class="perk ${p.kind}"><span class="pi">${p.icon}</span><div><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></div></div>`).join("")}</div>`; }catch(e){ return ""; } }
function familyCard(){
  const fam=S.family&&(S.stage==="youth"||S.stage==="univ")?`<div class="row"><span style="font-size:22px">🏠</span><div class="grow"><b>${esc(S.family.name)}</b> <small class="muted">지원 포인트 ${S.family.pts}</small><br><small class="muted">${esc(S.family.note)}</small></div></div>`:"";
  if(!fam&&!S.married&&!S.dating&&!(S.kids||[]).length) return ""; const ks=S.kids||[];
  return `<section class="card flat"><h3 class="sec">가족</h3>${fam}<p class="muted">${S.married?"💍 "+S.married.year+"년 결혼":S.dating?"💕 연애 중":""}</p>${ks.map(k=>`<div class="row"><span style="font-size:22px">${k.girl?"👧":"👦"}</span><div class="grow"><b>${esc(k.name)}</b> <small class="muted">${L.kidAge(S,k)}세</small><br><small class="muted">${k.hinted?esc(k.grade+"급 · "+L.kidHint(k)):L.kidAge(S,k)>=8?"재능 조짐을 지켜보는 중":"아직 어려요"}</small></div></div>`).join("")}</section>`;
}
function styleCard(){
  const p=S.p, r=L.roleDef(p.sub,p.role), f=L.footInfo(p.sub,p.foot), tr=L.TRAIT_ALL.find(t=>t.id===p.trait), ty=L.TYPES[p.pos].find(x=>x[0]===p.type);
  const hid=p.hidden&&L.scoutBand(S).final?L.HIDDEN_LIST.find(h=>h.id===p.hidden):null;
  return `<section class="card flat"><h3 class="sec">플레이 스타일</h3>
   <p><b>${esc(subName())}</b> <small class="muted">${esc(L.SUBINFO[p.sub]||"")}</small></p>
   ${r?`<p><b>${esc(r.name)}</b> <small class="muted">${esc(r.desc)}</small></p>`:""}
   <p><b>${esc(f.label)}</b> <small class="muted">${esc(f.text)}</small></p>
   ${ty?`<p><b>${esc(ty[1])}</b> <small class="muted">${esc(ty[3])}</small></p>`:""}
   ${tr?`<p><b>${tr.icon} ${esc(tr.name)}</b> <small class="muted">${esc(tr.desc)}</small></p>`:""}
   ${hid?`<p><b>${hid.icon} ${esc(hid.name)}</b> <small class="muted">${esc(hid.desc)}</small></p>`:""}
   <p><b>체격</b> <small class="muted">${esc(L.bodyText(p.pos,p.height,p.weight))}</small></p></section>`;
}
function careerTab(){
  const c=S.career, pro=S.history.filter(h=>!h.youth), yth=S.history.filter(h=>h.youth);
  const aw=S.awards.filter(a=>!a.youth), tr=S.trophies.filter(t=>!t.youth);
  const league=tr.filter(t=>/리그1 우승|리그2 우승|잉글랜드 1부 리그 우승/.test(t.name)).length;
  const lg=L.legacy(S);
  return `<section class="card"><small class="kick">PRO CAREER</small><div class="four"><div class="stat"><small>출전</small><b>${c.apps}</b></div><div class="stat"><small>골</small><b>${c.goals}</b></div><div class="stat"><small>도움</small><b>${c.assists}</b></div><div class="stat"><small>대표팀</small><b>${c.caps}</b></div></div>
    <div class="four"><div class="stat"><small>우승</small><b>${tr.length}</b></div><div class="stat"><small>리그우승</small><b>${league}</b></div><div class="stat"><small>수상</small><b>${aw.length}</b></div><div class="stat"><small>평점</small><b>${c.ratingN?(c.ratingSum/c.ratingN).toFixed(2):"-"}</b></div></div></section>
   ${honours()}
   ${S.ballon.length?`<section class="card flat"><h3 class="sec">황금공 순위</h3>${S.ballon.map(b=>`<p class="muted">${b.year} · <b>${b.rank}위</b> (${esc(b.club)})</p>`).join("")}</section>`:""}
   <section class="card flat"><h3 class="sec">시즌별 기록</h3>${pro.length?pro.slice().reverse().map(h=>`<div class="mrow"><b>${h.year}</b><span>${esc(h.club)}<br><small>${esc(h.leagueName)} ${h.rank?h.rank+"위":""}</small></span><small>${h.military?"군 복무":h.apps+"경기 "+h.goals+"G "+h.assists+"A"}</small><em>${h.ovr1||""}</em></div>`).join(""):`<p class="muted">프로 기록이 아직 없어요.</p>`}
    ${yth.length?`<h3 class="sec">유소년·대학 시절</h3>${yth.slice().reverse().map(h=>`<div class="mrow"><b>${h.age}세</b><span>${esc(h.club)}</span><small>${h.apps}경기 ${h.goals}G</small><em>${h.ovr1||""}</em></div>`).join("")}`:""}</section>
   ${statHistory()}
   ${valueChart()}
   <section class="card flat"><h3 class="sec">커리어 평가</h3><div class="pay"><small>커리어 점수</small><b>${lg.total}</b><small>예상 등급</small><b>${L.legacyGrade(lg.total)}</b></div>${lg.rom?`<p class="note good">🌟 낭만 보너스 +${lg.rom} — 재능 ${lg.grade}등급으로 이뤄낸 업적이라 더 빛나요</p>`:""}</section>`;
}
function feedTab(){
  const mo=S.moments.slice().reverse();
  return `<section class="card flat"><h3 class="sec">최근 소식</h3>${S.feed.length?S.feed.slice(0,40).map(f=>`<div style="padding:8px 0;border-bottom:1px solid var(--line2)"><small class="muted">${esc(f.when)}</small><br><span>${f.tone>0?'<span class="dot"></span>':""}${esc(f.text)}</span></div>`).join(""):`<p class="muted">소식이 아직 없어요.</p>`}</section>
   <section class="card flat"><h3 class="sec">커리어 하이라이트</h3>${mo.length?mo.map(m=>`<div style="padding:8px 0;border-bottom:1px solid var(--line2)"><span class="pill gold">${esc(m.badge)}</span> <small class="muted">${m.year} · ${m.age}세 · ${esc(m.club)}</small><br>${esc(m.text)}</div>`).join(""):`<p class="muted">아직 하이라이트가 없어요.</p>`}</section>`;
}

/* ================= 명예의 전당 (서버 저장 · 친구와 비교) · 이벤트 도감 ================= */
const CFG=window.KL_CONFIG||{};
const hofOn=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY);
/* 실시간 활동 기록(서버 기록실에 '지금 K-레전드는'으로 보여요). 이름만 올라가고, 서버에 표가 없으면 조용히 건너뛰어요 */
function liveLog(kind,txt){ try{ if(!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY)) return; const who=((localStorage.getItem("klife-nick")||(S&&S.p&&S.p.name)||"익명")+"").slice(0,24); fetch(CFG.SUPABASE_URL+"/rest/v1/life_live",{method:"POST",keepalive:true,headers:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:"Bearer "+CFG.SUPABASE_ANON_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({kind,who,txt:String(txt).slice(0,90),mode:"life"})}).catch(()=>{}); }catch(e){} }
const HH={apikey:CFG.SUPABASE_ANON_KEY,Authorization:"Bearer "+CFG.SUPABASE_ANON_KEY,"Content-Type":"application/json"};
let hofRows=null, hofErr="", hofBusy=false;
function dexAdd(id){ const d=rd(DEX)||{}; d[id]=(d[id]||0)+1; wr(DEX,d); }
/* ================= 축구 상식 퀴즈 ================= */
let qz=null;
function quizView(){
  if(!qz) return `<main class="body"><div class="brand"><span class="mark">⚽</span><div><small>FOOTBALL QUIZ</small><b>축구 상식 퀴즈</b></div></div>
   <section class="card flat"><p class="muted">무작위 10문제예요. 맞히면 ${L.QUIZ.length}문제 중에서 계속 새로 나와요. 8개 이상 맞히면 하루 한 번 새로고침권 1장을 받아요(지금은 무료 이벤트).</p>
   <p class="muted">내 최고 기록: <b>${qzBest()}</b></p><button class="big" data-act="qzstart"><span>퀴즈 시작</span><b>→</b></button></section></main>`;
  if(qz.done){ const t=L.quizTitle(qz.score,qz.list.length); return `<main class="body"><section class="card"><small class="kick">RESULT</small><h2>${t[1]} ${esc(t[0])}</h2><div class="four"><div class="stat"><small>정답</small><b>${qz.score}/${qz.list.length}</b></div></div>
   ${qz.reward?`<p class="note good">🎟 새로고침권 1장을 받았어요!</p>`:qz.score>=8?`<p class="muted">오늘은 이미 보상을 받았어요.</p>`:""}
   <button class="big" data-act="qzstart"><span>다시 도전</span><b>→</b></button><button class="wide" data-act="home">홈으로</button></section></main>`; }
  const q=qz.list[qz.i], ans=qz.picked;
  return `<main class="body"><small class="kick">Q${qz.i+1} / ${qz.list.length} · 정답 ${qz.score}개</small><section class="card"><h3 class="sec" style="font-size:19px;line-height:1.5">${esc(q.q)}</h3>
   ${q.opts.map((o,k)=>`<button class="opt ${ans==null?"":o.ok?"qok":k===ans?"qno":""}" data-act="qzpick" data-v="${k}" ${ans!=null?"disabled":""}><b>${esc(o.t)}</b></button>`).join("")}
   ${ans!=null?`<p class="note ${q.opts[ans].ok?"good":"warn"}">${q.opts[ans].ok?"정답! ":"아쉬워요. "}${esc(q.ex)}</p><button class="big" data-act="qznext"><span>${qz.i+1<qz.list.length?"다음 문제":"결과 보기"}</span><b>→</b></button>`:""}</section></main>`;
}
function qzBest(){ try{ return localStorage.getItem("klife-quizbest")||"-"; }catch(e){ return "-"; } }
/* ================= 설정: 구단 이름·로고 ================= */
const SET_TABS=[["K1","레전드리그1"],["K2","레전드리그2"],["K3","레전드리그3"],["K4","레전드리그4"],["EPL","잉글랜드"],["EPL2","잉글랜드 2부"],["LAL","스페인"],["LAL2","스페인 2부"],["BUN","독일"],["BUN2","독일 2부"],["SEA","이탈리아"],["SEA2","이탈리아 2부"],["L1","프랑스"],["FR2","프랑스 2부"],["J1","일본"],["J2","일본 2부"],["SPL","사우디"],["SPL2","사우디 2부"]];
let setTab="EPL";
function setClubs(k){
  if(k==="K1") return (L.kTeams?L.kTeams(1):window.KLCore.TEAMS26.concat([window.KLCore.GIMCHEON])).map(d=>({key:d.club,name:d.club,fixed:true}));
  if(k==="K2") return window.KLCore.K2_DEFS.map(d=>({key:d.club,name:d.club,fixed:true}));
  if(k==="K3") return L.K3_DEFS.map(d=>({key:d.id,name:d.name,fixed:true}));
  if(k==="K4") return L.K4_DEFS.map(d=>({key:d.id,name:d.name,fixed:true}));
  const E=window.KL_EPL, list=k==="EPL"?(E&&(E.clubs||E)):(window.KL_FL&&window.KL_FL[k]);
  return (list||[]).map(c=>({key:c.id,name:c.name,short:c.short}));
}
/* 계정·클라우드 저장 카드 */
let cloudMsg="";
function accountCard(){
  const A=window.KL_AUTH; if(!A) return "";
  const u=A.user();
  if(!u) return `<div class="card flat" style="gap:6px"><b>☁ 구글로 로그인하면 기기를 바꿔도 이어서 해요</b><small class="muted">로그인은 선택이에요. 진행 중인 인생이 내 계정에 백업돼요.</small><button class="big" data-act="login"><span>구글로 로그인</span><b>→</b></button>${cloudMsg?`<p class="note">${esc(cloudMsg)}</p>`:""}</div>`;
  return `<div class="card flat" style="gap:6px"><b>☁ ${esc(u.name||u.email)}</b><small class="muted">${esc(u.email||"")} · 로그인됨</small><div class="grid2"><button class="wide" data-act="cloudup">지금 저장</button><button class="wide" data-act="clouddown">불러오기</button></div><button class="wide" data-act="logout">로그아웃</button>${cloudMsg?`<p class="note">${esc(cloudMsg)}</p>`:""}</div>`;
}
function cloudPayload(){ try{ return {save:JSON.parse(localStorage.getItem("klife-save")||"null"),dex:JSON.parse(localStorage.getItem("klife-dex")||"null"),hof:JSON.parse(localStorage.getItem("klife-hof")||"null"),cos:rd("klife-cos"),at:new Date().toISOString()}; }catch(e){ return {}; } }
function settingsView(){
  if(setMain==="cos"&&CS()) return cosPage();
  const C=KL_CUSTOM.get(), cl=setClubs(setTab);
  return `<main class="body"><div class="brand"><span class="mark">⚙</span><div><small>SETTINGS</small><b>구단 이름과 로고</b></div></div>${CS()?setMainChips():""}
   <section class="card flat"><p class="muted">리그별로 구단 이름과 로고를 내 마음대로 바꿀 수 있어요. 이 기기에만 저장돼요. 이미 진행 중인 인생의 지난 기록 글자는 그대로이고, 새로 만나는 곳부터 바뀐 이름이 보여요. 바꾼 뒤에는 새로고침이 필요해요.</p>
   ${accountCard()}
   <button class="wide" data-act="theme">🎨 화면: ${window.KL_THEME?(KL_THEME.names[KL_THEME.get()]||""):""} → ${window.KL_THEME?(KL_THEME.names[KL_THEME.next()]||""):""}</button>
   </section>
   <div class="chips setchips">${SET_TABS.map(([k,n])=>`<button class="chip ${k===setTab?"on":""}" data-act="setTab" data-v="${k}">${n}</button>`).join("")}</div>
   <section class="card flat">${setTab.startsWith("K")?`<p class="muted">레전드리그는 내부 기록 때문에 이름은 바꿀 수 없고 로고만 바꿀 수 있어요.</p>`:""}
   ${cl.map(c=>{ const lg=C.logos[c.key]; const nm=(C.names[c.key]||[])[0]||""; return `<div class="setrow">${emblem({id:c.key,name:c.name},40)}<div class="setfields">${c.fixed?`<b>${esc(c.name)}</b>`:`<input class="setname" data-cn="${esc(c.key)}" value="${esc(nm)}" placeholder="${esc(c.name)}" maxlength="20">`}<label class="setlogo">로고 고르기<input type="file" accept="image/*" data-cl="${esc(c.key)}" hidden></label>${lg?`<button class="lnk" data-act="setLogoDel" data-v="${esc(c.key)}">로고 지우기</button>`:""}</div></div>`; }).join("")}</section>
   <section class="card flat"><h3 class="sec">🎟 새로고침권 ${tickets()}장</h3><p class="muted">직전에 끝낸 구간을 한 번 더 돌릴 수 있는 권이에요. 지금은 무료예요. 나중에 앱에서는 묶음(1장·10장·100장)으로 판매할 수 있게 준비해 뒀어요.</p><button class="wide" data-act="tkfree">무료로 5장 받기</button></section>
   <section class="card flat"><h3 class="sec">내 인생 백업</h3><p class="muted">기기를 바꾸거나 브라우저 데이터를 지우기 전에 파일로 저장해 두세요. 저장 중인 인생, 도감, 설정이 한 파일에 담겨요.</p>
   <button class="wide" data-act="bkExport">💾 백업 파일 저장</button>
   <label class="wide" style="display:grid;place-items:center;cursor:pointer">📂 백업 파일 불러오기<input type="file" accept=".json,application/json" data-bk="1" hidden></label></section>
   <p class="muted c"><button class="lnk" data-act="setReset">설정 전체 초기화</button> · <button class="lnk" data-act="home">돌아가기</button></p></main>`;
}
/* ================= 주간 도전 ================= */
let wkTop=null, wkBusy=false, wkErr="", wkFor="";
function weeklyDesc(W){ const rt=ROUTES.find(r=>r[0]===W.route), fm=(L.FAMILY||[]).find(f=>f.id===W.fam); return {pos:POSK[W.pos],route:rt?rt[1]:W.route,fam:fm?fm.name:W.fam,famNote:fm?fm.note:""}; }
function weeklyBanner(W){ const d=weeklyDesc(W); return `<section class="card weekly"><small class="kick">WEEKLY CHALLENGE · ${esc(W.id)}</small><h3 class="sec">이번 주 도전</h3><p class="muted">${esc(d.pos)} · ${esc(d.route)} · ${esc(d.fam)} 출신으로 시작해요. 이 조건은 바꿀 수 없고, 이름·특성·포인트는 마음대로 정할 수 있어요.</p></section>`; }
function weeklyLoad(id){ if(wkBusy||!hofOn) return; wkBusy=true; wkFor=id; fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof?select=nickname,name,pos,score,grade&challenge=eq."+encodeURIComponent(id)+"&order=score.desc&limit=5",{headers:HH}).then(r=>{ if(!r.ok){ const e=new Error("x"); e.st=r.status; throw e; } return r.json(); }).then(rows=>{ wkTop=rows; wkErr=""; }).catch(e=>{ wkTop=[]; wkErr=e&&e.st===400?"순위 서버를 준비하고 있어요":"순위를 불러오지 못했어요"; }).finally(()=>{ wkBusy=false; if(view==="home") render(); }); }
function weeklyCard(){ try{ const W=L.weekly(), d=weeklyDesc(W); if(wkFor!==W.id&&!wkBusy) weeklyLoad(W.id);
  const best=L.weeklyBest(W.id); const rank=wkBusy&&!wkTop?"<p class=\"muted\">순위를 불러오는 중…</p>":wkErr?`<p class="muted">${esc(wkErr)}</p>`:(wkTop&&wkTop.length?wkTop.map((x,i)=>`<div class="hof"><b>${i+1}</b><div><b>${esc(x.nickname||x.name)}</b><br><small>${esc(x.name)} · ${esc(x.grade||"")}</small></div><span>${x.score}</span></div>`).join(""):"<p class=\"muted\">아직 기록이 없어요. 첫 번째 도전자가 되어 보세요!</p>");
  return `<section class="card weekly"><small class="kick">WEEKLY CHALLENGE · ${esc(W.id)} · 마감 ${esc(W.endsOn)}</small><h3 class="sec">이번 주 도전</h3><p class="muted">${esc(d.pos)} · ${esc(d.route)} · ${esc(d.fam)} 출신. 같은 조건으로 시작해 커리어 점수로 겨뤄요.</p>${best?`<p class="note">이번 주 내 최고 기록 <b>${best.score}</b>점 (${esc(best.name||"")})</p>`:""}<button class="big" data-act="wk"><span>도전 시작</span><b>→</b></button><h4 class="sec" style="margin-top:12px">이번 주 순위</h4>${rank}</section>`; }catch(e){ return ""; } }
function achView(){ const st=L.achState(S||null), done=st.filter(x=>x.done).length;
  const row=x=>{ const a=x.a, pc=x.pg?Math.round(x.pg[0]/x.pg[1]*100):0; return `<div class="ach ${x.done?"on":""}"><i>${x.done?"🏅":"🔒"}</i><div><b>${esc(a.ko)}</b><small>${esc(a.dko)}</small>${x.pg&&!x.done?`<div class="bar"><i style="width:${pc}%"></i></div><small>${x.pg[0]} / ${x.pg[1]}</small>`:""}</div></div>`; };
  return `<main class="body"><section class="card flat"><h3 class="sec">달성한 업적 ${done} / ${st.length}</h3><div class="bar"><i style="width:${Math.round(done/st.length*100)}%"></i></div><p class="muted">한 번 달성하면 다음 인생에도 계속 남아요.</p></section>`+["성취","낭만","도전"].map(c=>`<section class="card"><h3 class="sec">${c}</h3>${st.filter(x=>x.a.cat===c).map(row).join("")}</section>`).join("")+`</main>`; }
function dexView(){ const d=rd(DEX)||{}, all=L.dexAll(); const n=all.filter(x=>d[x.id]).length;
  return `<main class="body"><h2 class="sec" style="margin:4px 0 8px">이벤트 도감</h2>
   <section class="card flat"><h3 class="sec">확률 도감 — 이벤트 규칙</h3>${L.EVENT_RULES.map(t=>`<p class="muted">· ${esc(t)}</p>`).join("")}</section>
   <p class="muted">지금까지 만난 이벤트 ${n}/${all.length}</p>${all.map(x=>d[x.id]?`<div class="card flat"><b>${esc(x.title)}</b><small class="muted">${x.story?esc(x.story)+" · ":""}만난 횟수 ${d[x.id]}회</small></div>`:`<div class="card flat" style="opacity:.55"><b>???</b><small class="muted">아직 만나지 못한 이벤트</small></div>`).join("")}</main>`; }
function mainClub(){ const e=Object.entries(S.clubYears||{}).sort((a,b)=>b[1]-a[1])[0]; return e?e[0]:S.club.name; }
/* 가장 많이 맞붙은 더비 한 개의 전적 */
function derbySum(pro){ const m={}; pro.forEach(h=>(h.dv||[]).forEach(x=>{ const k=x[0]; const o=m[k]||(m[k]={name:x[0],opp:x[1],w:0,d:0,l:0,g:0}); o.opp=x[1]; if(x[2]==="W") o.w++; else if(x[2]==="L") o.l++; else o.d++; o.g+=x[3]||0; })); const a=Object.values(m).sort((p,q)=>(q.w+q.d+q.l)-(p.w+p.d+p.l)); return a[0]||null; }
function hofDetail(){
  const p=S.p, d=L.POSDEF[p.pos], pro=S.history.filter(h=>!h.youth), hid=p.hidden?L.HIDDEN_LIST.find(h=>h.id===p.hidden):null, tr=L.TRAIT_ALL.find(t=>t.id===p.trait);
  return {v:1,cos:CS()?CS().publicPick():null,ovr:p.ovr,stats:d.stats.map(([k,n])=>[n,p.stats[k]]),sub:subName(),role:L.roleName(p),foot:p.foot,height:p.height,weight:p.weight,trait:tr?tr.icon+" "+tr.name:"",hidden:hid?hid.name:"",
    family:{married:!!S.married,kids:(S.kids||[]).map(k=>k.name+"("+(k.girl?"딸":"아들")+")")},gen:S.gen||1,parent:S.parent?{name:S.parent.name,pos:S.parent.pos,peak:S.parent.peak,grade:S.parent.grade}:null,after:S.after?{name:S.after.name,title:S.after.title,lines:S.after.lines.map(x=>[x.y,x.t])}:null,ver:{start:S.verStart||null,end:window.KL_VER?window.KL_VER("선수판"):null},fame:Math.round(S.fameMax||S.fame),fameTier:L.fameTier(S.fameMax||S.fame).name,char:Math.round(L.charOf(S)),charTier:L.charTier(L.charOf(S)).name,styleLog:(S.styleLog||[]).map(x=>[x.year,x.age,x.text]),titles:L.titlesOf(S),trophies:S.trophies.filter(t=>!t.youth).map(t=>[t.name,t.year]),awards:S.awards.filter(a=>!a.youth).map(a=>[a.name+(a.comp?" ("+a.comp+")":""),a.year]),
    jerseys:(S.jersey||[]).map(j=>({club:j.club,number:j.number})),chain:L.clubChain(S).map(c=>c.name+" ("+c.from+(c.to>c.from?"~"+c.to:"")+")"),ballon:S.ballon.map(b=>[b.year,b.rank]),
    seasons:pro.map(h=>[h.age,h.club,h.leagueName||h.lg||"",h.apps,h.goals,h.assists,h.rating,h.ovr1]),derby:derbySum(pro)};
}
function hofEntry(nick){
  const c=S.career, lg=L.legacy(S), tr=S.trophies.filter(t=>!t.youth), aw=S.awards.filter(a=>!a.youth&&!/후보/.test(a.name));
  return {nickname:nick,name:S.p.name,pos:POSK[S.p.pos],type_name:S.p.typeName,club:mainClub(),years:S.history.filter(h=>!h.youth).length,apps:c.apps,goals:c.goals,assists:c.assists,caps:c.caps,
    trophies:tr.length,awards:aw.length,ballon:S.ballon.filter(b=>b.rank===1).length,ballon_cand:S.ballon.length,wc:tr.filter(t=>/월드컵 우승/.test(t.name)).length,peak:S.p.peak,
    score:lg.total,grade:L.legacyGrade(lg.total),jersey:(S.jersey||[]).length,cs:c.cs||0,pv:Math.round(((S.valueHist||[]).reduce((m,x)=>Math.max(m,x.val),0))*10)/10,psal:Math.round((c.peakSal||0)*10)/10,earned:Math.round((c.earned||0)*10)/10,jerseys:(S.jersey||[]).map(j=>({club:j.club,number:j.number})),detail:hofDetail(),challenge:S.challenge||null};
}
/* 비정상 기록 거르기(친구들 순위를 지키기 위해): 불가능한 숫자가 있으면 등록하지 않아요 */
function hofSanity(r){
  const y=Math.max(1,r.years||1);
  if(r.peak>99||r.peak<30) return "능력치 기록이 이상해서 등록할 수 없어요";
  if(r.years>46) return "커리어 기간이 비정상이라 등록할 수 없어요";
  if(r.apps>y*75||r.goals>r.apps*1.7+5||r.assists>r.apps*1.7+5) return "경기 기록이 비정상이라 등록할 수 없어요";
  if(r.ballon>y||r.trophies>y*9||r.caps>y*30||r.awards>y*14) return "수상 기록이 비정상이라 등록할 수 없어요";
  return "";
}
async function hofPost(row){
  if(!hofOn) throw new Error("서버 설정이 없어요");
  { const bad=hofSanity(row); if(bad) throw new Error(bad); }
  const send=b=>fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof",{method:"POST",headers:Object.assign({Prefer:"return=minimal"},HH),body:JSON.stringify(b)});
  let r=await send(row);
  if(!r.ok&&r.status===400&&row.challenge){ const sc=Object.assign({},row); delete sc.challenge; r=await send(sc); if(r.ok) return; }
  if(!r.ok&&r.status===400){ const s0=Object.assign({},row); delete s0.challenge; delete s0.pv; delete s0.psal; delete s0.earned; r=await send(s0); if(!r.ok&&r.status===400){ const s1=Object.assign({},s0); delete s1.detail; r=await send(s1); if(!r.ok&&r.status===400){ const s2=Object.assign({},s1); delete s2.jerseys; r=await send(s2); } } }   // jerseys 컬럼이 아직 없는 서버면 옛 형식으로 저장
  if(!r.ok) throw new Error(r.status===404?"서버에 life_hof 표가 아직 없어요":"등록 실패 ("+r.status+")");
}
async function hofLoad(){
  hofBusy=true; hofErr=""; render();
  try{ if(!hofOn) throw new Error("서버 설정이 없어요");
    const r=await fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof?select=*&order=score.desc&limit=40",{headers:HH});
    if(!r.ok) throw new Error(r.status===404?"서버에 life_hof 표가 아직 없어요":"불러오기 실패 ("+r.status+")");
    hofRows=await r.json(); }
  catch(e){ hofErr=e.message; hofRows=[]; }
  hofBusy=false; render();
}
function hofView(){
  return `<main class="body"><h2 class="sec" style="margin:4px 0 8px">친구들 명예의 전당</h2>
   <p class="muted">은퇴한 선수를 서버에 등록하면 친구들과 비교할 수 있어요. 선수를 누르면 내 최고 선수와 비교해요.</p>
   ${hofBusy?'<p class="muted c">불러오는 중…</p>':""}${hofErr?'<p class="note warn">'+esc(hofErr)+'</p>':""}
   ${(hofRows||[]).map((x,i)=>`<button class="offer" data-act="hofcmp" data-v="${i}"><b style="font-family:var(--f-num);color:var(--gold);width:26px">${i+1}</b><div><b>${esc(x.name)} <small class="muted">by ${esc(x.nickname)}</small></b><small>${esc(x.pos)} · ${esc(x.club)} · ${x.years}년 · ${x.goals}골 ${x.assists}도움${x.jersey?" · 영구결번":""}${x.ballon?" · 황금공 "+x.ballon+"회":""}</small></div><span class="pill gold">${esc(x.grade)} ${x.score}</span></button>`).join("")}
   ${!hofBusy&&hofRows&&!hofRows.length&&!hofErr?'<p class="muted c">아직 등록된 선수가 없어요.</p>':""}${adslot("hof")}</main>`;
}
function bestLocal(){ const h=rd(HOF)||[]; return h.filter(x=>x.apps!=null).sort((a,b)=>b.score-a.score)[0]||null; }
function cmpHtml(a){
  const b=bestLocal(); if(!b) return `<div class="ov"><div class="sheet"><div class="grab"></div><h3>${esc(a.name)}</h3><p class="muted">내 쪽에 비교할 은퇴 선수가 없어요. 먼저 선수를 은퇴시켜 보세요.</p><button class="wide" data-act="mok">닫기</button></div></div>`;
  const rows=[["커리어 점수","score"],["전성기 OVR","peak"],["출전","apps"],["골","goals"],["도움","assists"],["대표팀","caps"],["우승","trophies"],["수상","awards"],["황금공","ballon"],["월드컵 우승","wc"],["영구결번","jersey"]];
  const w=rows.filter(r=>(b[r[1]]||0)>(a[r[1]]||0)).length, l=rows.filter(r=>(b[r[1]]||0)<(a[r[1]]||0)).length;
  return `<div class="ov"><div class="sheet"><div class="grab"></div><small class="kick">HEAD TO HEAD</small><h3>${esc(b.name)} vs ${esc(a.name)}</h3><p class="muted">내 ${esc(b.name)}(${esc(b.grade)}) · ${esc(a.nickname)}의 ${esc(a.name)}(${esc(a.grade)})</p>
   <div class="tab">${rows.map(([n,k])=>{ const x=b[k]||0,y=a[k]||0; return `<div class="tr" style="grid-template-columns:1fr 70px 70px"><span>${n}</span><span style="color:${x>y?"var(--acc)":"var(--muted)"};font-weight:${x>y?800:400}">${x}</span><span style="color:${y>x?"var(--gold)":"var(--muted)"};font-weight:${y>x?800:400}">${y}</span></div>`; }).join("")}</div>
   <p class="note ${w>l?"good":l>w?"warn":""}">${w>l?"내 선수가 "+w+"개 항목에서 앞서요!":l>w?"친구 선수가 "+l+"개 항목에서 앞서요.":"막상막하예요."}</p><button class="wide" data-act="mok">닫기</button></div></div>`;
}

/* ================= 공용 조각 ================= */
function valueChart(){
  const h=S.valueHist||[]; if(h.length<2) return "";
  const W=320,H=120,pad=14, mx=Math.max(...h.map(x=>x.val)), n=h.length;
  const px=i=>pad+(W-2*pad)*(n===1?0:i/(n-1)), py=v=>H-pad-(H-2*pad)*(Math.log(v+1)/Math.log(mx+1));
  const pts=h.map((x,i)=>px(i)+","+py(x.val)).join(" "); const peak=h.reduce((b,x,i)=>x.val>h[b].val?i:b,0);
  const money2=v=>v>=1?(Math.round(v*10)/10)+"억":Math.round(v*10000)+"만";
  return `<section class="card flat"><small class="kick">MARKET VALUE</small><h3 class="sec">몸값 흐름</h3>
   <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block"><polyline points="${pad},${H-pad} ${pts} ${W-pad},${H-pad}" fill="rgba(255,207,74,.10)" stroke="none"/><polyline points="${pts}" fill="none" stroke="#ffcf4a" stroke-width="2.2"/>
   ${h.map((x,i)=>`<circle cx="${px(i)}" cy="${py(x.val)}" r="${i===peak?5:3}" fill="${i===peak?"#ffcf4a":x.mil?"#27d7ff":"#fff"}"/>`).join("")}</svg>
   <div class="pay"><small>최고 몸값</small><b>${money2(h[peak].val)} (${h[peak].year}, ${h[peak].age}세)</b><small>마지막 몸값</small><b>${money2(h[n-1].val)}</b></div>
   <p class="muted">몸값은 이적 시장 가치예요. 연봉과 달라요. 파란 점은 군 복무 시기예요. 복무 중에는 월급 수준(연 0.3억)만 받지만 선수 가치는 그대로 평가돼요.</p></section>`;
}
function honours(){
  const tr=S.trophies.filter(t=>!t.youth), aw=S.awards.filter(a=>!a.youth&&!/후보/.test(a.name));
  const ys=y=>"'"+String(y).slice(2);
  const grpT={}; tr.forEach(x=>{ (grpT[x.name]=grpT[x.name]||[]).push(ys(x.year)); });
  const grpA={}; aw.forEach(x=>{ (grpA[x.name]=grpA[x.name]||[]).push(ys(x.year)+(x.comp?"·"+x.comp:"")); });
  const row=(n,arr)=>`<div class="mrow" style="grid-template-columns:1fr 2fr"><b>${esc(n)}${arr.length>1?" ×"+arr.length:""}</b><small>${arr.map(esc).join(" · ")}</small></div>`;
  const trH=Object.entries(grpT).sort((x,y)=>y[1].length-x[1].length).map(([n,a])=>row(n,a)).join(""), awH=Object.entries(grpA).sort((x,y)=>y[1].length-x[1].length).map(([n,a])=>row(n,a)).join("");
  if(!trH&&!awH) return "";
  return `<section class="card flat"><small class="kick">HONOURS</small><h3 class="sec">우승 연혁</h3>${trH||'<p class="muted">우승 기록이 없어요.</p>'}${awH?'<h3 class="sec">개인 수상 (대회)</h3>'+awH:""}</section>`;
}
function playStyle(){
  const es=S.evStats; if(!es||es.n<3) return "";
  const rr=es.risk/es.n, name=rr>=.55?["🎲","과감한 승부사","확률이 낮아도 질러 보는 타입이었어요."]:rr<=.2?["🧭","신중한 모범생","안전한 길을 골라 흔들림이 적었어요."]:["⚖️","균형 잡힌 현실주의자","걸 때와 물러설 때를 알았어요."];
  return `<section class="card flat"><small class="kick">HOW YOU PLAYED</small><h3 class="sec">플레이 성향</h3><div class="row"><span style="font-size:42px">${name[0]}</span><div class="grow"><b style="font-size:18px">${name[1]}</b><br><small class="muted">${name[2]}</small></div></div>
   <div class="three"><div class="stat"><small>선택</small><b>${es.n}</b></div><div class="stat"><small>성공</small><b>${es.hit}</b></div><div class="stat"><small>운</small><b>${es.luck>=0?"+":""}${es.luck.toFixed(1)}</b></div></div>
   <p class="muted">모험(성공 확률 50% 이하) 선택 ${es.risk}번 중 ${es.riskHit}번 성공 · 운이 +면 기대보다 많이 성공한 거예요.</p></section>`;
}
/* 서버 전체 기록과 내 선수 비교 */
const SRV_CATS=[["pv","시즌 최고 몸값","억"],["psal","시즌 최고 연봉","억"],["earned","통산 수입(연봉 합계)","억"],["goals","최다 득점","골"],["assists","최다 도움","도움"],["apps","최다 출전","경기"],["caps","최다 대표팀 출전","경기"],["trophies","최다 우승","회"],["awards","최다 개인 수상","회"],["ballon","최다 황금공","회"],["wc","최다 월드컵 우승","회"],["peak","최고 능력치","OVR"],["score","최고 커리어 점수","점"],["cs","최다 무실점","경기"],["jersey","최다 영구결번","개"],["years","최장 커리어","시즌"]];
let srvRows=null, srvLoading=false;
function srvLoad(){ if(srvRows||srvLoading||!hofOn) return; srvLoading=true;
  fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof?select=id,name,nickname,goals,assists,apps,caps,trophies,awards,ballon,wc,peak,score,cs,jersey,years,pv,psal,earned&limit=1000",{headers:HH}).then(r=>r.ok?r.json():fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof?select=id,name,nickname,goals,assists,apps,caps,trophies,awards,ballon,wc,peak,score,cs,jersey,years&limit=1000",{headers:HH}).then(r2=>r2.ok?r2.json():[])).then(l=>{ srvRows=l; srvLoading=false; if(view==="retired") keep(render); }).catch(()=>{ srvRows=[]; srvLoading=false; }); }
function afterCard(){
  if(!L.afterPaths) return "";
  if(S.second){ const s=S.second; return `<section class="card flat"><small class="kick">AFTER CAREER</small><h3 class="sec">${s.icon} 은퇴 후: ${esc(s.name)} <small class="muted">(진행 중)</small></h3>${s.lines.map(x=>`<div class="ln2"><b>${x.y}세</b><span>${esc(x.t)}</span></div>`).join("")}<button class="big" data-act="secgo"><span>이야기 이어가기 (${s.age}세)</span><b>→</b></button></section>`; }
  if(S.after){ const a=S.after; return `<section class="card flat"><small class="kick">AFTER CAREER</small><h3 class="sec">${a.icon} 은퇴 후: ${esc(a.name)}</h3>${a.lines.map(x=>`<div class="ln2"><b>${x.y}세</b><span>${esc(x.t)}</span></div>`).join("")}<p class="note good">🏅 ${esc(a.title)} — 커리어 점수 +${a.bonus}</p></section>`; }
  return `<section class="card flat"><small class="kick">AFTER CAREER</small><h3 class="sec">은퇴 후의 삶</h3><p class="muted">어떤 길을 갈까요? 한 번만 고를 수 있고, 선수 시절의 능력·인기·인성·재산이 이어져요. 길에 따라 커리어 점수가 올라요.</p>${L.afterPaths(S).map(p=>`<button class="opt" data-act="after" data-v="${p.id}" ${p.locked?"disabled":""}><b>${p.locked?"🔒 ":""}${p.icon} ${esc(p.name)}</b><small>${esc(p.desc)}</small></button>`).join("")}</section>`;
}
function lifeCard(){
  const ft=L.fameTierOf(S,S.fameMax||S.fame), ct=L.charTier(L.charOf(S)), cs=L.charSummary(S);
  return `<section class="card flat"><small class="kick">LIFE</small><h3 class="sec">어떤 삶을 살았나</h3>
   <div class="row"><div class="grow"><small class="muted">최고 인기</small><br><b style="font-size:20px">${ft.icon} ${esc(ft.name)}</b> <small class="muted">(${Math.round(S.fameMax||S.fame)})</small></div><div class="grow"><small class="muted">인성 점수</small><br><b style="font-size:20px">${ct.icon} ${esc(ct.name)}</b> <small class="muted">(${Math.round(L.charOf(S))})</small></div></div>
   <p class="muted">${esc(ft.desc)}</p>
   ${cs.up.length?`<p class="note good">👍 ${cs.up.map(x=>esc(x.k)+" +"+x.v).join(" · ")}</p>`:""}${cs.down.length?`<p class="note warn">👎 ${cs.down.map(x=>esc(x.k)+" "+x.v).join(" · ")}</p>`:""}</section>`;
}
function srvRecCard(){
  if(!hofOn) return ""; if(!srvRows){ srvLoad(); return `<section class="card flat"><h3 class="sec">서버 기록과 비교</h3><p class="muted">불러오는 중…</p></section>`; }
  const mine=hofEntry(""); const rows=SRV_CATS.filter(c=>!(c[0]==="cs"&&S.p.pos!=="GK"&&S.p.pos!=="DF")).map(([k,label,unit])=>{
    let best=null; srvRows.forEach(x=>{ if((x[k]||0)>(best?best[k]||0:0)) best=x; });
    const my=mine[k]||0, rec=best?best[k]||0:0, beat=my>rec&&my>0, tie=my===rec&&my>0&&best, rank=1+srvRows.filter(x=>(x[k]||0)>my).length;
    return {label,unit,my,rec,best,beat,tie,rank}; });
  const broke=rows.filter(r=>r.beat).length;
  return `<section class="card flat"><small class="kick">SERVER RECORDS</small><h3 class="sec">서버 기록과 비교</h3><p class="muted">${srvRows.length}명의 은퇴 선수와 비교한 내 순위예요. ${broke?`<b style="color:var(--gold)">서버 기록 ${broke}개를 경신했어요!</b>`:""}</p>
   ${rows.map(r=>`<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><div class="grow"><b>${esc(r.label)}</b><br><small class="muted">1위 ${r.best?esc(r.best.name)+" ("+r.rec+r.unit+")":"-"}</small></div><div style="text-align:right"><b style="color:${r.beat?"var(--gold)":r.tie?"var(--acc)":"var(--txt)"};font-family:var(--f-num);font-size:18px">${r.my}${r.unit}</b><br><small class="muted">${r.beat?"👑 신기록!":r.tie?"타이":"서버 "+r.rank+"위"}</small></div></div>`).join("")}
   <p class="muted">내 선수는 등록하면 서버 기록에 포함돼요.</p></section>`;
}
function natRun(r){
  if(!r.matches||!r.matches.length) return ""; const g=r.group;
  return `<div class="card flat" style="gap:4px;text-align:left">${g?`<b>${esc(g.name)} · ${g.passed?"조 "+g.rank+"위로 통과":"조 "+g.rank+"위 탈락"} (승점 ${g.pts})</b><small class="muted">${g.teams.map(esc).join(" · ")}</small>`:""}${r.matches.map(m=>`<div class="row" style="padding:3px 0"><small class="muted" style="min-width:74px">${esc(m.stage)}</small><span class="grow">${esc(m.opp)} <small class="muted">${esc(m.tier||"")}</small></span><b style="color:${m.res==="W"?"var(--acc)":m.res==="L"?"var(--red)":"var(--gold)"}">${m.f}:${m.a}${m.pk?" (PK "+m.pk[0]+"-"+m.pk[1]+")":""}</b></div>`).join("")}</div>`;
}
function legendCard(){
  if(!L.compareLegends) return ""; const cmp=L.compareLegends(S); if(!cmp.list.length) return "";
  return `<section class="card flat"><small class="kick">LEGEND COMPARISON</small><h3 class="sec">역대 레전드와 비교</h3><p class="muted">${esc(cmp.body)} · 내 커리어 점수 <b>${cmp.mine}</b> (역할·체형·주발이 비슷한 레전드를 골랐어요. 수치는 공개 기록 기반 근사치)</p>
   ${cmp.list.map(x=>`<div class="card" style="gap:6px"><div class="row"><div class="grow"><b>${esc(x.n)}</b><br><small class="muted">${esc(x.tag)} · ${x.h}cm · ${esc(x.foot)}</small><div class="pills">${(x.why||[]).map(w=>`<span class="pill acc">${esc(w)}</span>`).join("")}</div></div><span class="pill ${x.beat?"gold":""}">${x.beat?"넘어섰어요!":x.pct+"%"}</span></div>
    <div class="bar ${x.beat?"gold":""}"><i style="width:${Math.min(100,x.pct)}%"></i></div>
    <div class="pay">${x.rows.map(r=>`<small>${r[0]}</small><b style="color:${r[1]>=r[2]?"var(--acc)":"var(--muted)"}">${r[1]} <span class="muted">vs</span> ${r[2]}</b>`).join("")}</div></div>`).join("")}</section>`;
}
function chainHtml(){ const ch=L.clubChain(S); return ch.map(c=>c.mil?"🎖 "+c.name:c.name).join(" → "); }
/* ================= 은퇴 · 중도 포기 ================= */
function retiredView(){
  const lg=L.legacy(S), g=L.legacyGrade(lg.total), c=S.career, jr=S.jersey||[];
  return `<main class="body">${CS()?"":`<div style="text-align:center">${L.pixelImg?L.pixelImg(S,150,{suit:true,age:Math.max(L.age(S),30)}):""}</div>`}<small class="kick">RETIREMENT</small><h1>${esc(S.p.name)}, 그라운드를 떠나다</h1>
   <p class="muted">${L.age(S)}세 · 프로 ${S.history.filter(h=>!h.youth).length}시즌 · ${esc(chainHtml())}</p>
   <div class="pills">${L.titlesOf(S).map(t=>`<span class="pill gold">🏷 ${esc(t)}</span>`).join("")}</div>
   ${retCard()}${lifeCard()}${lg.rom?`<section class="card flat"><p class="note good">🌟 낭만 보너스 +${lg.rom} — 재능 ${lg.grade}등급으로 이뤄낸 업적이라 점수가 더 올랐어요</p></section>`:""}${afterCard()}
   <section class="card flat"><h3 class="sec">선수 정보</h3><p class="muted">${esc(S.p.height)}cm ${esc(S.p.weight)}kg · ${esc(S.p.foot)} · ${esc(subName())}${L.roleName(S.p)?" · "+esc(L.roleName(S.p)):""} · ${esc(S.p.typeName)}</p>${(S.styleLog||[]).length?`<div class="stylelog">${S.styleLog.map(x=>`<p class="muted"><b>${x.year}</b> (${x.age}세) ${esc(x.text)}</p>`).join("")}</div>`:""}</section>
   ${jr.map(j=>`<section class="banner"><small>PERMANENTLY RETIRED NUMBER</small><div class="no">${j.number}</div><b>${esc(j.club)} 영구결번</b><small>${j.yrs}시즌 활약 · 우승 ${j.titles}회</small></section>`).join("")}
   <section class="hero"><small class="kick">LEGACY</small><div class="row"><h1 style="font-size:64px;color:var(--gold)">${g}</h1><div class="grow"><b style="font-size:24px;font-family:var(--f-num)">${lg.total}</b><br><small class="muted">커리어 점수</small></div></div></section>
   <section class="four"><div class="stat"><small>출전</small><b>${c.apps}</b></div><div class="stat"><small>골</small><b>${c.goals}</b></div><div class="stat"><small>도움</small><b>${c.assists}</b></div><div class="stat"><small>대표팀</small><b>${c.caps}</b></div></section>
   <section class="card flat"><div class="pay"><small>전성기 OVR</small><b>${S.p.peak}</b><small>우승</small><b>${S.trophies.filter(t=>!t.youth).length}회</b><small>수상</small><b>${S.awards.filter(a=>!a.youth).length}회</b><small>황금공 후보</small><b>${S.ballon.length}회</b><small>누적 옵션 보너스</small><b>${money(c.bonus||0)}</b><small>누적 광고 수입</small><b>${money(c.sponsor||0)}</b></div></section>
   ${srvRecCard()}${valueChart()}${playStyle()}${honours()}${legendCard()}${adslot("retired")}
   ${S.moments.length?`<section class="card flat"><h3 class="sec">하이라이트</h3>${S.moments.slice(-12).reverse().map(m=>`<p class="muted">${m.year} · ${esc(m.text)}</p>`).join("")}</section>`:""}
   ${mgrCard()}
   <section class="card flat"><h3 class="sec">명예의 전당 등록</h3><p class="muted">서버에 등록하면 친구들이 내 선수를 보고 비교할 수 있어요.</p>${S.hofUp?'<p class="note good">등록 완료! 친구 명예의 전당에서 확인해 보세요.</p>':`<input type="text" id="nick" maxlength="12" placeholder="닉네임" value="${esc(((()=>{ try{ return localStorage.getItem("klife-nick")||""; }catch(e){ return ""; } })()))}"><button class="wide" data-act="hofup">서버에 등록</button>`}<button class="ghost" data-act="hoflist">친구들 명예의 전당 보기</button></section>
   ${childCard()}
   <button class="big" data-act="new"><span>새로운 인생 시작</span><b>→</b></button><button class="wide" data-act="home">K-라이프 홈</button></main>`;
}
function quitView(){
  const q=S.quit||{text:"축구를 그만두었어요."};
  return `<main class="body"><small class="kick">ANOTHER LIFE</small><h1>${esc(S.p.name)}, 다른 길을 걷다</h1>
   <section class="hero"><p>${esc(q.text)}</p><p class="muted">${q.age}세 · ${q.year}년. 모든 운동선수가 성공하는 건 아니에요. 하지만 이 시간은 헛되지 않았어요.</p></section>
   <section class="card flat"><div class="pay"><small>최고 OVR</small><b>${S.p.peak}</b><small>유소년 기록</small><b>${S.career.youthApps}경기 ${S.career.youthGoals}골</b><small>가정 환경</small><b>${S.family?esc(S.family.name):"-"}</b>${(()=>{ const ph=S.history.filter(h=>!h.youth&&!h.military); return ph.length?`<small>프로 경력</small><b>${ph.length}시즌 · ${ph.reduce((a,h)=>a+(h.apps||0),0)}경기</b><small>마지막 소속</small><b>${esc(S.club?S.club.name:"-")}</b>`:""; })()}</div></section>
   ${S.moments.length?`<section class="card flat"><h3 class="sec">하이라이트</h3>${S.moments.slice(-8).reverse().map(m=>`<p class="muted">${m.year} · ${esc(m.text)}</p>`).join("")}</section>`:""}
   <button class="big" data-act="new"><span>다시, 새로운 인생</span><b>→</b></button><button class="wide" data-act="home">K-라이프 홈</button></main>`;
}
/* 감독판으로 가져가기: 은퇴한 선수의 핵심 정보를 짧은 코드로 만들어요 (js/mgr_import.js) */
function mgrCard(){
  if(!window.KLImport) return "";
  let code=""; try{ code=KLImport.encode(KLImport.fromLife(S,L)); }catch(e){ return ""; }
  return `<section class="card flat"><small class="kick">K-LEGEND 38</small><h3 class="sec">감독판으로 가져가기</h3>
   <p class="muted">은퇴한 ${esc(S.p.name)} 선수를 감독판의 전설 감독과 전설 카드로 데려갈 수 있어요. 같은 브라우저라면 아래 버튼으로 바로 넘어가고, 다른 기기라면 코드를 복사해서 감독판의 '내 선수 가져오기'에 붙여 넣어 주세요.</p>
   <textarea class="codebox" id="mgrcode" readonly rows="3" aria-label="감독판 이전 코드">${esc(code)}</textarea>
   <div class="grid2"><button class="wide" data-act="mgrcopy">코드 복사</button><button class="wide" data-act="mgrgo">감독판으로 가기 →</button></div>
   <p class="muted"><small>효과는 소폭이에요. 인성·전설 등급·포지션이 감독판 시작 보너스가 되고, 후보 영입에 전설 카드가 한 장 나와요.</small></p></section>`;
}
function childCard(){
  const fam=L.childFamily(S); const kids=S.kids||[];
  if(!kids.length) return `<section class="card flat"><small class="kick">NEXT GENERATION</small><h3 class="sec">세대 계승</h3><p class="muted">세대 계승은 결혼해서 자녀가 태어난 선수만 할 수 있어요. 다음 인생에서는 선수 시절에 가정을 꾸려 보세요. 자녀가 12세가 되기 전에 돈과 튜터링으로 미리 방향을 정해 줄 수 있어요.</p></section>`;
  return `<section class="card flat"><small class="kick">NEXT GENERATION</small><h3 class="sec">세대 계승 — 자녀로 이어하기</h3>
   <p class="muted">부모(전성기 OVR ${S.p.peak})의 재능이 자녀에게 이어져요. 같은 포지션이면 안정적이고, 다른 포지션을 고르면 부모보다 훨씬 좋거나 훨씬 나쁜 재능이 나올 수 있어요. 집안 형편은 부모의 커리어로 정해져요 (<b>${esc(fam.name)}</b>).</p>
   ${kids.length?`<p class="muted">내 아이들이에요. 한 명을 고르면 그 아이의 재능이 이어져요. 재능 조짐은 8세 즈음 보이기 시작해요.</p><div class="chips">${kids.map((k,i)=>`<button data-act="kidpick" data-v="${i}" class="${draft.kidPick===i?"on":""}">${esc(k.name)} · ${k.girl?"딸":"아들"} · ${L.kidAge(S,k)}세${k.hinted?" · "+k.grade+"급":""}</button>`).join("")}</div>`:""}
   ${(()=>{ const kk=kids[draft.kidPick]; if(!kk) return `<p class="note warn">위에서 이어서 키울 자녀를 골라 주세요.</p>`; const inv=kk.inv||{}; const dir=kk.dir?POSK[kk.dir]:null; return `<p class="note">${esc(kk.name)}${kk.hinted?" · "+kk.grade+"급 재능 조짐":""} · 목표 포지션: <b>${dir||"미정 (아래에서 고르세요)"}</b><br><small class="muted">${Object.entries(L.KID_INV).filter(([k])=>inv[k]).map(([k,d])=>d.name+" "+inv[k]+"단계").join(" · ")||"아직 육성 기록이 없어요"}</small></p>${dir?"":`<div class="chips">${Object.keys(L.POSDEF).map(k=>`<button data-act="kidpos" data-v="${k}" class="${(draft.kidPos||S.p.pos)===k?"on":""}">${POSK[k]}${k===S.p.pos?" (부모와 같음)":""}</button>`).join("")}</div>`}`; })()}
   <input type="hidden" id="kid" value="${esc(draft.kidName||"")}">
   <button class="wide" data-act="kid">선택한 자녀로 새 인생 시작 →</button></section>`;
}

/* ================= 소비 · 후원 ================= */
function shopTabs(m){ const t=m.tab||"buy"; return `<div class="chips shoptabs">${[["buy","🛍 소비"],["staff","🧑‍💼 스태프"],["invest","📈 투자"],["honor","🏅 명예"]].concat((S.kids||[]).length?[["kids","👶 자녀"]]:[]).map(([k,n])=>`<button data-act="shoptab" data-v="${k}" class="${t===k?"on":""}">${n}</button>`).join("")}</div>`; }
/* ================= 재능 개발 센터 ================= */
function campHtml(m){
  const i=L.potProgInfo(S), c=S.camp, r=m.res;
  const hd=`<div class="ov"><div class="sheet camp"><div class="grab"></div><small class="kick">TALENT CENTER</small><h3>🌱 재능 개발 센터</h3>`;
  const ft='<button class="wide" data-act="mok">닫기</button></div></div>';
  if(r){ return hd+`<div class="campres ${r.win?"win":"lose"}"><b class="big">${r.win?"성공! 잠재력 +"+r.gain:"이번엔 벽을 넘지 못했어요"}</b><p class="muted">${r.win?(r.brk?"완벽한 캠프였어요. 이제 더 높은 곳까지 도전할 수 있어요(한계 돌파).":"잠재력이 "+r.pot+"이(가) 됐어요."):"재능 게이지가 쌓였어요 ("+r.luck+"/5). 다음 도전은 성공 확률이 올라가요."}</p><small class="muted">캠프 점수 ${r.score}점 · 성공 확률은 ${r.p}%였어요</small><ul class="clog">${r.log.map(x=>"<li>"+esc(x)+"</li>").join("")}</ul></div>`+ft; }
  if(c){
    const ph=c.phase;
    const bar='<div class="cbar">'+[0,1,2,3].map(k=>'<i class="'+(k<ph?"on":k===ph?"cur":"")+'"></i>').join("")+'</div>';
    if(ph<=2){ const e=c.ev[ph]; return hd+bar+`<small class="kick">${["1주차","2주차","마지막 주"][ph]} · ${esc(c.tier.name)}</small>${c.last?`<p class="note">${esc(c.last)}</p>`:""}<h3 class="sec">${esc(e.t)}</h3><p>${esc(e.b)}</p>${e.c.map((x,k)=>`<button class="big" data-act="campch" data-v="${k}"><span>${esc(x[0])}</span><b>→</b></button>`).join("")}<p class="muted">선택에 따라 캠프 점수와 컨디션이 달라져요. 점수가 높을수록 성공 확률이 올라가요.</p></div></div>`; }
    return hd+bar+`<small class="kick">FINAL TEST</small><p>마지막 평가전! 움직이는 표시가 <b>가운데 빛나는 칸</b>에 올 때 눌러요.</p><div class="ctrack"><i class="czone"></i><i class="cmark"></i></div><button class="big" data-act="campstop"><span>지금!</span><b>⚡</b></button></div></div>`;
  }
  return hd+`<p class="muted">돈과 시간을 들여 잠재력(능력치 상한)을 끌어올리는 곳이에요. 시즌마다 한 번, 29세까지. 캠프는 3주 과정이고 선택과 마지막 타이밍 도전이 결과를 바꿔요. 실패하면 재능 게이지가 쌓여요.</p>
   <div class="kv3"><div><small>현재 잠재력</small><b>${S.p.pot}</b></div><div><small>더 키울 수 있는 폭</small><b>+${i.room}</b></div><div><small>재능 게이지</small><b>${i.luck}/5</b></div></div>
   ${S.potBreak?'<p class="note good">✨ 한계 돌파 달성: 상한이 더 열렸어요.</p>':'<p class="muted">완벽한 캠프(고득점 + 타이밍 퍼펙트)를 마치면 한계 돌파로 키울 수 있는 폭이 더 늘어요.</p>'}
   ${m.msg?`<p class="note warn">${esc(m.msg)}</p>`:""}${i.used?'<p class="note">이번 시즌에는 이미 입소했어요. 다음 시즌에 도전하세요.</p>':i.ag>29?'<p class="note warn">30세부터는 입소할 수 없어요.</p>':""}
   ${i.tiers.map(t=>`<div class="card flat" style="gap:4px"><div class="row"><div class="grow"><b>${t.icon} ${esc(t.name)}</b> <span class="pill gold">${money(t.cost)}</span><br><small class="muted">${esc(t.note)} · 잠재력 +${t.gain} · 기본 성공 ${Math.round(t.p*100)}%</small></div><button class="ghost" data-act="campgo" data-v="${t.id}" ${!i.ok||S.funds<t.cost?"disabled":""}>입소</button></div></div>`).join("")}`+ft;
}
function potBody(){
  const i=L.potProgInfo(S), g=L.scoutBand?L.scoutBand(S):null;
  return `<p class="muted">잠재력은 숨겨져 있지 않아요. 돈과 시간을 들여 끌어올릴 수 있어요. 시즌마다 한 번, 29세까지 시도할 수 있고, 실패해도 재능 게이지가 쌓여 다음 성공 확률이 올라가요.</p>
   <div class="kv3"><div><small>현재 잠재력</small><b>${S.p.pot}</b></div><div><small>더 키울 수 있는 폭</small><b>+${i.room}</b></div><div><small>재능 게이지</small><b>${i.luck}/5</b></div></div>
   ${i.used?`<p class="note">이번 시즌에는 이미 시도했어요. 다음 시즌에 다시 도전할 수 있어요.</p>`:i.ag>29?`<p class="note warn">30세부터는 재능 개발을 받을 수 없어요.</p>`:""}
   ${i.tiers.map(t=>`<div class="card flat" style="gap:4px"><div class="row"><div class="grow"><b>${t.icon} ${esc(t.name)}</b> <span class="pill gold">${money(t.cost)}</span><br><small class="muted">${esc(t.note)} · 잠재력 +${t.gain} · 성공 확률 ${Math.round(t.p*100)}%</small></div><button class="ghost" data-act="potup" data-v="${t.id}" ${!i.ok||S.funds<t.cost?"disabled":""}>도전</button></div></div>`).join("")}`;
}
function staffBody(){
  const tot=r1((S.staff||[]).reduce((s,id)=>{ const d=L.STAFF.find(x=>x.id===id); return s+(d?L.staffCost(S,d):0); },0));
  return `<p class="muted">전담 스태프는 해마다 비용을 내고 계속 도움을 받아요. 시즌이 끝날 때 자동으로 정산되고, 자금이 모자라면 계약이 끝나요. 현재 연 비용 <b>${money(tot)}</b>. (연봉이 높을수록 비용도 올라가요)</p>${L.STAFF.map(s=>{ const has=L.hasStaff(S,s.id), c=L.staffCost(S,s); return `<div class="card flat" style="gap:4px"><div class="row"><div class="grow"><b>${s.icon} ${esc(s.name)}</b> <span class="pill gold">연 ${money(c)}</span><br><small class="muted">${esc(s.desc)}</small></div>${has?`<button class="ghost" data-act="fire" data-v="${s.id}">해지</button>`:`<button class="ghost" data-act="hire" data-v="${s.id}" ${S.funds<c?"disabled":""}>고용</button>`}</div></div>`; }).join("")}`;
}
function investBody(){
  const amts=[1,5,20,50,200,1000];
  return `<p class="muted">투자 수익은 시즌이 끝날 때 반영돼요. 시즌 도중에 넣은 돈은 남은 기간만큼만 수익이 붙어요. 팔면 그 순간의 가치를 받아요. 보유 자산 <b>${money(L.assetValue(S))}</b>${S.assetProfit?` · 지금까지 실현 손익 ${S.assetProfit>=0?"+":""}${money(S.assetProfit)}`:""}</p>${L.ASSETS.map(d=>{ const a=(S.assets||[]).find(x=>x.id===d.id); const gain=a?r1(a.value-a.cost):0;
    return `<div class="card flat" style="gap:6px"><div class="row"><div class="grow"><b>${d.icon} ${esc(d.name)}</b> <span class="pill">최소 ${money(d.min)}</span><br><small class="muted">${esc(d.desc)}</small></div></div>${a?`<p class="note ${gain>=0?"good":"warn"}">보유 ${money(a.value)} (원금 ${money(a.cost)}, ${gain>=0?"+":""}${money(gain)})${a.last!=null?" · 작년 "+(a.last>=0?"+":"")+Math.round(a.last*100)+"%":""} <button class="ghost" data-act="sellasset" data-v="${d.id}" style="min-height:44px;margin-left:6px">전부 팔기</button></p>`:""}<div class="chips">${amts.filter(x=>x>=d.min&&x<=S.funds).map(x=>`<button data-act="buyasset" data-v="${d.id}:${x}">${x}억</button>`).join("")||'<small class="muted">투자할 자금이 부족해요</small>'}</div></div>`; }).join("")}`;
}
function kidsBody(){
  const ks=S.kids||[]; return `<p class="muted">자녀가 12세가 되기 전까지 목표 포지션을 정하고 돈·튜터링으로 미리 키울 수 있어요. 은퇴 후 세대 계승 때 그 결과가 그대로 이어져요. (방향을 정한 포지션으로 이어 가면 효과가 더 커요)</p>${ks.map((k,i)=>{ const open=L.kidOpen(S,k), inv=k.inv||{}; return `<div class="card flat" style="gap:6px"><div class="row"><span style="font-size:22px">${k.girl?"👧":"👦"}</span><div class="grow"><b>${esc(k.name)}</b> <small class="muted">${L.kidAge(S,k)}세 · ${open?"육성 가능":"방향 확정"}</small><br><small class="muted">${k.hinted?esc(k.grade+"급 · "+L.kidHint(k)):"재능은 8세 즈음 조짐이 보여요"}</small></div></div>
    <div class="chips">${Object.keys(L.POSDEF).map(p=>`<button data-act="kiddir" data-v="${i}:${p}" class="${k.dir===p?"on":""}" ${open?"":"disabled"}>${POSK[p]}</button>`).join("")}</div>
    ${Object.entries(L.KID_INV).map(([key,d])=>`<div class="row"><div class="grow"><b>${d.name}</b> <span class="pill">${inv[key]||0}/${d.max}</span><br><small class="muted">${d.desc}</small></div><button class="ghost" data-act="kidinv" data-v="${i}:${key}" ${open&&(inv[key]||0)<d.max&&S.funds>=L.kidCost(S,key)?"":"disabled"}>${money(L.kidCost(S,key))}</button></div>`).join("")}</div>`; }).join("")}`;
}
function honorBody(){
  return `<p class="muted">돈으로 이름을 남기는 곳이에요. 항목마다 은퇴 후 커리어 점수가 오르고, 평판과 인기도 올라요.</p>${L.HONORS.map(h=>{ const has=L.hasHonor(S,h.id); return `<div class="card flat" style="gap:4px"><div class="row"><div class="grow"><b>${h.icon} ${esc(h.name)}</b> <span class="pill gold">${money(h.price)}</span><br><small class="muted">${esc(h.note)} · 커리어 점수 +${h.legacy}${h.rep?" · 평판 +"+h.rep:""}${h.fame?" · 인기 +"+h.fame:""}</small></div><button class="ghost" data-act="honor" data-v="${h.id}" ${has||S.funds<h.price?"disabled":""}>${has?"완료":"하기"}</button></div></div>`; }).join("")}`;
}
function shopHtml(){
  const m=modals[0]; const row=(kind,it)=>{ const owned=(kind==="car"&&(S.cars||[]).some(c=>c.id===it.id))||(it.price>=40&&(S.owned||[]).includes(it.id));
    return `<div class="card flat" style="gap:4px"><div class="row"><div class="grow"><b>${esc(it.name)}</b> <span class="pill gold">${money(it.price)}</span><br><small class="muted">${esc(it.note)} · 사기 +${it.mood}${it.cond?" · 컨디션 +"+it.cond:""}${it.fame?" · 인기 +"+it.fame:""}${it.rep?" · 평판 +"+it.rep:""}</small></div><button class="ghost" data-act="buy" data-v="${kind}:${it.id}" ${owned||S.funds<it.price?"disabled":""}>${owned?"보유":"구매"}</button></div></div>`; };
  return `<div class="ov"><div class="sheet"><div class="grab"></div><small class="kick">SPENDING</small><h3>소비·후원</h3><p class="muted">보유 자금 <b style="color:var(--gold)">${money(S.funds)}</b> · 차량은 해마다 가격의 5%가 유지비로 나가요.</p>
   ${m.msg?`<p class="note ${m.ok?"good":"warn"}">${esc(m.msg)}</p>`:""}
   ${shopTabs(m)}${(m.tab||"buy")==="buy"?`<h3 class="sec">자동차</h3>${L.CARS.map(c=>row("car",c)).join("")}<h3 class="sec">생활·기부</h3>${L.GIFTS.map(g=>row("gift",g)).join("")}`:m.tab==="staff"?staffBody():m.tab==="invest"?investBody():m.tab==="kids"?kidsBody():honorBody()}
   <p class="muted">${L.endorsesOf(S).length?"광고 계약 중: "+L.endorsesOf(S).map(e=>esc(e.brand)).join(", ")+" (슬롯 "+L.endorsesOf(S).length+"/"+L.endorseSlots(S)+")":"광고 제의는 인기가 높아지면 오프시즌에 들어와요."}</p><button class="wide" data-act="mok">닫기</button></div></div>`;
}

/* ================= 팝업 ================= */
function modalHtml(){
  const m=modals[0];
  if(m.t==="cine") return "";
  if(m.t==="confirm") return `<div class="ov center"><div class="sheet"><small class="kick">CONFIRM</small><h3>${esc(m.title)}</h3><p class="muted">${esc(m.body)}</p><button class="big" data-act="cfyes"><span>${esc(m.yes||"확인")}</span><b>→</b></button><button class="wide" data-act="cfno">${esc(m.no||"취소")}</button></div></div>`;
  if(m.t==="cardimg") return `<div class="ov"><div class="sheet"><div class="grab"></div><small class="kick">RETIREMENT CARD</small><h3>${esc(m.name)}의 은퇴 카드</h3><img class="cardimg" alt="${esc(m.name)} 은퇴 카드" src="${m.url}"><p class="muted c">저장이 안 되면 이미지를 길게 눌러 '이미지 저장'을 골라 주세요.</p><button class="big" data-act="cardsave"><span>이미지로 저장</span><b>↓</b></button>${m.can?`<button class="wide" data-act="cardshare">📤 공유하기</button>`:""}<button class="wide" data-act="mok">닫기</button></div></div>`;
  if(m.t==="shop") return shopHtml();
  if(m.t==="tier2") return tier2Html(m);
  if(m.t==="camp") return campHtml(m);
  if(m.t==="hofcmp") return cmpHtml(m.a).replace("<button class=\"wide\" data-act=\"mok\">닫기</button>","<button class=\"wide\" data-act=\"hofprof\">🔎 이 선수의 능력치·업적·커리어 전체 보기</button><button class=\"wide\" data-act=\"mok\">닫기</button>");
  if(m.t==="grow"){ const g=m.g; return `<div class="ov center"><div class="sheet"><small class="kick">${esc(m.label)} · TRAINING RESULT</small><h3>능력치가 변했어요</h3>
    <div class="row"><div class="stat grow"><small>OVR</small><b>${g.ovr0} → ${g.ovr1}</b></div></div>
    ${g.changes.map(c=>`<div class="row"><b class="grow">${esc(c.name)}</b><b style="color:${c.d>0?"var(--acc)":"var(--red)"};font-family:var(--f-num);font-size:20px">${c.d>0?"▲ +":"▼ "}${c.d}</b></div>`).join("")}
    ${(m.notes||[]).map(n=>`<p class="note warn">${esc(n)}</p>`).join("")}<button class="big" data-act="mok"><span>확인</span><b>→</b></button></div></div>`; }
  if(m.t==="event"){
    const e=m.ev;
    const uc=e.ucl?" ucl":"";
    if(m.res){ const r=m.res; return `<div class="ov center${uc}"><div class="sheet evt"><span class="tagline">${esc(e.story||"EVENT")}</span><h3>${esc(e.title)}</h3><div class="res ${r.hit?"":"no"}"><b>${esc(r.text)}</b>${r.lines.length?`<small>${r.lines.map(esc).join(" · ")}</small>`:""}</div>
      <p class="muted">${r.safe?"안전한 선택 · 주사위 없이 확정 (효과 60%, 30% 확률로 작은 대가)":"🎲 주사위 "+r.roll+" / 성공 기준 "+r.need+" → "+(r.hit?"성공":"실패")}</p><button class="big" data-act="mok"><span>확인</span><b>→</b></button></div></div>`; }
    if(m.mini) return `<div class="ov center${uc}"><div class="sheet evt"><span class="tagline">${{pk:"PENALTY KICK",fk:"FREE KICK",so:"PENALTY SHOOTOUT",hd:"CORNER HEADER",cn:"CORNER KICK",gk:"PENALTY SAVE",awake:"AWAKENING TRAINING"}[m.mini.type]||"MINI GAME"}</span><h3>${esc(e.title)}</h3>${L.miniHtml(m.mini.type)}</div></div>`;
    return `<div class="ov${uc}"><div class="sheet evt"><div class="grab"></div><span class="tagline">${esc(e.story?"스토리 · "+e.story:"EVENT · "+S.year)}</span><h3>${esc(e.title)}</h3><p class="muted">${esc(e.body)}</p>${e.opts.map((o,i)=>`<button class="opt" data-act="evopt" data-v="${i}"><b>${esc(o.label)}</b>${o.safe?`<p style="color:var(--acc)">안전한 선택 · 확정 (효과 60% · 30% 확률로 작은 대가)</p>`:(o.p!=null&&o.p<100)?`<p>성공 확률 ${L.eventNeed?L.eventNeed(S,o):o.p}%</p>`:`<p style="color:var(--acc)">확정</p>`}${o.costNote?`<small class="muted">${esc(o.costNote)}</small>`:""}</button>`).join("")}</div></div>`;
  }
  if(m.t==="nat"){ const r=m.r; return `<div class="ov center"><div class="sheet"><small class="kick">NATIONAL TEAM</small><h3>${esc(r.name)} ${r.year}</h3>${r.host?`<p class="muted c">📍 ${esc(r.host)}</p>`:""}${r.skipped||r.declined?`<p class="note warn">${esc(r.text)}</p>`:`<div class="banner" style="color:var(--txt);border-color:${r.title?"var(--gold)":"var(--line)"};background:var(--panel2)"><div class="no" style="font-size:34px">${esc(r.stage)}</div><small>${r.caps}경기 ${r.goals}골</small></div>${natRun(r)}${r.carry?`<p class="note good">🌟 ${esc(r.text)}</p>`:""}${r.golden?`<p class="note good">🏅 대회 MVP(골든볼)로 선정!</p>`:""}${r.exempt?`<p class="note good">🎖 체육요원으로 편입됐어요!</p>`:""}`}<button class="big" data-act="mok"><span>확인</span><b>→</b></button></div></div>`; }
  if(m.t==="callup"){ const c=m.c, refused=(S.nat&&S.nat.refused)||0; return `<div class="ov center"><div class="sheet"><small class="kick">CALL-UP</small><h3>${esc(c.name)} 대표팀 소집</h3><p class="note">📍 개최지: ${esc(c.host||"")} · ${esc(c.months||"")}</p>${c.draw?`<div class="card flat" style="gap:4px"><b>조 편성 · ${esc(c.draw.group)}</b><p class="muted">🇰🇷 대한민국 · ${c.draw.opps.map(o=>esc(o.n)+" ("+o.tier+")").join(" · ")}</p></div>`:""}<p class="muted">${esc(S.p.name)} 선수가 ${esc(c.name)} 명단에 이름을 올렸어요. 소집에 응할까요?</p>${refused?`<p class="note warn">지금까지 소집을 ${refused}번 거부했어요. 3번이 되면 '대표팀 기피자'로 낙인찍혀요.</p>`:""}
    <button class="big" data-act="callgo"><span>대회에 합류</span><b>→</b></button><button class="wide red" data-act="calldecl">불참한다 (인기·평판 하락)</button></div></div>`; }
  if(m.t==="ballon"){ const R=S.lastR; const lst=L.ballonList(S,R.ballon.rank); return `<div class="ov"><div class="sheet"><div class="grab"></div><small class="kick">BALLON D'OR ${R.year}</small><h3>후보 30인 · 내 순위 ${R.ballon.rank}위</h3><div class="tab">${lst.map(x=>`<div class="tr ${x.me?"me":""}" style="grid-template-columns:30px 1fr"><span>${x.rank}</span><span>${esc(x.name)}${x.me?" ◀":""}</span></div>`).join("")}</div><button class="wide" data-act="mok">닫기</button></div></div>`; }
  if(m.t==="sign") return `<div class="ov center"><div class="sheet"><small class="kick">CONTRACT</small><h3>${esc(m.title)}</h3>${m.lines.map(x=>`<p class="muted">${esc(x)}</p>`).join("")}<canvas id="signpad" width="640" height="240" class="signpad"></canvas><p class="muted c">아래 칸에 손가락(또는 마우스)으로 사인해 주세요</p><div class="grid2"><button class="ghost" data-act="signclear">지우기</button>${S.sign?`<button class="ghost" data-act="signprev">이전 사인 쓰기</button>`:`<span></span>`}</div><button class="big" data-act="signdone"><span>서명하고 계약 확정</span><b>✍</b></button><button class="wide" data-act="signcancel">다시 생각해 볼게요</button></div></div>`;
  if(m.t==="jersey"){ const j=m.j; const t=String(j.number); const fs2=t.length>2?64:84;
    const shirt=(back)=>`<svg viewBox="0 0 220 240" aria-hidden="true"><defs><linearGradient id="jg${back?1:0}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".35" stop-color="#f6c63a"/><stop offset=".7" stop-color="#c88a10"/><stop offset="1" stop-color="#ffe27a"/></linearGradient></defs><path d="M72 14 L34 38 L8 88 L46 112 L62 88 L62 224 Q62 232 70 232 L150 232 Q158 232 158 224 L158 88 L174 112 L212 88 L186 38 L148 14 Q110 48 72 14 Z" fill="url(#jg${back?1:0})" stroke="#fff6c8" stroke-width="3" stroke-linejoin="round"/><path d="M72 14 Q110 48 148 14" fill="none" stroke="#fff6c8" stroke-width="5"/>${back?`<text x="110" y="84" text-anchor="middle" font-family="Black Han Sans,sans-serif" font-size="22" fill="#5a3b00" letter-spacing="2">${esc(m.name)}</text><text x="110" y="178" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="${fs2}" fill="#5a3b00" stroke="#fff3b8" stroke-width="2" paint-order="stroke">${esc(t)}</text>`:`<text x="110" y="150" text-anchor="middle" font-size="64" fill="#7a5200">★</text>`}</svg>`;
    return `<div class="ov center jerseyov"><div class="jbeams"></div><div class="jstage"><small class="kick" style="color:#ffe27a">PERMANENTLY RETIRED NUMBER</small><div class="jspin"><div class="jface">${shirt(false)}</div><div class="jface jback">${shirt(true)}</div></div><h3>${esc(j.club)}</h3><p class="jsub">No.${esc(t)} 영구결번</p><p class="muted c">${esc(m.name)} · ${j.yrs}시즌 · 우승 ${j.titles}회</p>${(j.why||[]).length?`<p class="jwhy">${j.why.map(esc).join(" · ")}</p>`:""}<div class="jsparks"></div><button class="big" data-act="mok"><span>영광의 순간을 마친다</span><b>🏆</b></button></div></div>`; }
  if(m.t==="league"){ const i=m.info; return `<div class="ov center lgw" style="--c:${i.c}"><div class="sheet lgsheet"><div class="lgflag">${i.ic}</div><small class="kick" style="color:${i.c}">${esc(i.tag)}</small><h3>${esc(i.title)}</h3><p class="muted c">${esc(m.club)}에서 새 도전이 시작돼요</p>${i.lines.map(x=>`<p class="lgl">${esc(x)}</p>`).join("")}<p class="muted c">${m.n}개 구단 · 상위권: ${m.top.map(esc).join(" · ")}</p><button class="big" data-act="mok"><span>도전 시작</span><b>→</b></button></div></div>`; }
  if(m.t==="second"){ const nd=L.secNode(S); if(!nd) return ""; return `<div class="ov"><div class="sheet"><div class="grab"></div><small class="kick">${esc(m.kick||"SECOND LIFE")}</small><h3>${esc(nd.title)}</h3><p class="muted">${esc(nd.body)}</p>${m.res?`<p class="note good">${esc(m.res)}</p>`:""}${nd.opts.map((o,i)=>`<button class="opt" data-act="secopt" data-v="${i}" ${o.disabled?"disabled":""}><b>${esc(o.label)}</b><small>${esc(o.hint||"")}</small></button>`).join("")}</div></div>`; }
  if(m.t==="numpick"){ const must=m.curBad; return `<div class="ov center"><div class="sheet"><small class="kick">SHIRT NUMBER</small><h3>${must?"등번호를 바꿔야 해요":"어떤 등번호를 달까요?"}</h3>
   <p class="muted">${must?`${esc(m.club)}에서는 ${m.cur}번이 다른 선수의 영구결번이라 쓸 수 없어요.`:`${esc(m.club)}에서 원래 번호를 다시 쓸 수 있어요.`}${m.banned.length?` (영구결번: ${m.banned.sort((a,b)=>a-b).join(", ")}번)`:""}</p>
   ${m.origOk?`<button class="opt" data-act="numpick" data-v="orig"><b>원래 번호 ${m.orig}번</b><small>처음 달던 번호로 돌아가요</small></button>`:""}
   ${!m.curBad?`<button class="opt" data-act="numpick" data-v="cur"><b>지금 번호 ${m.cur}번 그대로</b><small>계속 쓰던 번호예요</small></button>`:""}
   <label class="muted" style="display:grid;gap:6px">새 번호 직접 정하기 (1~99)<input id="numin" type="number" min="1" max="99" inputmode="numeric" placeholder="예: 10"></label>
   <button class="big" data-act="numpick" data-v="custom"><span>이 번호로 정하기</span><b>→</b></button></div></div>`; }
  if(m.t==="sns") return `<div class="ov center"><div class="sheet"><small class="kick">NOW ON SNS</small><h3>📱 지금 SNS는</h3>${m.posts.map(p=>`<div class="sns ${p.tone>0?"up":p.tone<0?"dn":""}"><b>${esc(p.h)}${p.src&&p.src!=="SNS"?` <em class="srctag">${esc(p.src)}</em>`:""}</b><span>${esc(p.t)}</span><small>♥ ${p.likes}</small></div>`).join("")}<button class="big" data-act="mok"><span>확인</span><b>→</b></button></div></div>`;
  if(m.t==="ucl") return `<div class="ov center ucl"><div class="sheet uclsheet"><div class="stars">★ ★ ★ ★ ★ ★ ★ ★</div><small class="kick">CHAMPIONS NIGHT</small><h3>유럽 클럽컵 · ${esc(m.label)}</h3>${m.recs.map(r=>`<div class="umatch"><span class="rd">${esc(r.cupRound||"")}</span><b>${esc(r.opp)}</b><em class="${r.res==="W"?"w":r.res==="L"?"l":"d"}">${r.f}:${r.a}${r.pk?" (PK "+r.pk[0]+"-"+r.pk[1]+")":""}</em><small>${r.min>0?(r.g?r.g+"골 ":"")+(r.as?r.as+"도움 ":"")+"평점 "+r.rt:"결장"}</small></div>`).join("")}<button class="big" data-act="mok"><span>계속</span><b>→</b></button></div></div>`;
  if(m.t==="xi") return `<div class="ov center"><div class="sheet"><small class="kick">BEST ELEVEN ${S.lastR.year}</small><h3>${esc(S.lastR.leagueName)} 베스트 11</h3><div class="xi">${m.list.map(x=>`<div class="${x.me?"me":""}"><b>${esc(x.slot)}</b><span>${esc(x.name)}${x.me?" ◀":""}</span><small>${esc(x.club)} · ${x.ovr}</small></div>`).join("")}</div><button class="big" data-act="mok"><span>닫기</span><b>→</b></button></div></div>`;
  if(m.t==="gold") return `<div class="ov center gold"><div class="sheet goldsheet"><div class="rays"></div><small class="kick">${esc(m.kick)}</small><div class="ball">⚽</div><h3>${esc(m.title)}</h3><p class="gsub">${esc(m.sub)}</p><p class="muted c">${esc(m.club)}</p>${m.lines.map(x=>`<p class="muted c">${esc(x)}</p>`).join("")}<button class="big" data-act="mok"><span>트로피 받기</span><b>🏆</b></button></div></div>`;
  if(m.t==="msg") return`<div class="ov center"><div class="sheet"><small class="kick">${esc(m.kick||"알림")}</small><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p>${m.banner?`<div class="banner"><div class="no">${esc(m.banner)}</div></div>`:""}<button class="big" data-act="mok"><span>확인</span><b>→</b></button></div></div>`;
  return "";
}

/* ================= 흐름 ================= */
/* 로딩 팝업은 한 번만 띄우고 막대·문구만 바꿔요 (다시 그리지 않아서 깜빡이지 않아요) */
let ld=null;
function showLoading(kick,title,steps){
  hideLoading(); const el=document.createElement("div"); el.className="ov center load"; el.innerHTML=`<div class="sheet"><small class="kick">${esc(kick)}</small><h3>${esc(title)}</h3><div class="pg"><i style="width:6%"></i></div><div class="steps">${steps.map(s=>`<p>${esc(s)}</p>`).join("")}</div></div>`;
  document.body.appendChild(el); ld={el,steps}; const mine=ld; setTimeout(()=>{ if(ld===mine){ hideLoading(); try{ say("진행이 늦어져서 화면을 풀었어요. 다시 눌러 주세요"); }catch(e){} } },25000); return ld;
}
function setLoading(i,n){ if(!ld) return; ld.el.querySelector(".pg i").style.width=Math.round(i/n*100)+"%"; ld.el.querySelectorAll(".steps p").forEach((p,k)=>{ p.className=k<i?"ok":""; }); }
function hideLoading(){ if(ld){ ld.el.remove(); ld=null; } }
function runLoading(kick,title,steps,done){
  if(FAST){ done(); return; }
  showLoading(kick,title,steps); let i=0; const n=steps.length;
  const tick=()=>{ i++; setLoading(i,n); if(i<n) setTimeout(tick,520); else setTimeout(()=>{ hideLoading(); done(); },380); };
  setTimeout(tick,420);
}
function afterSegment(out){
  seg=out; const q=[];
  if(out.growth&&out.growth.changes.length) q.push({t:"grow",g:out.growth,label:out.label,notes:out.notes});
  else if(out.notes&&out.notes.length) q.push({t:"grow",g:{changes:[],ovr0:out.growth.ovr0,ovr1:out.growth.ovr1},label:out.label,notes:out.notes});
  { const sr=L.segReactions?L.segReactions(S,out):null; if(sr) q.push({t:"sns",posts:sr.posts,label:out.label}); }
  out.callups.forEach(c=>{ const T=L.TOURN&&L.TOURN[c.t]; if(T&&!T.rel&&!S.firstCallShown&&!(S.career&&S.career.caps>0)){ S.firstCallShown=true; q.push({t:"cine",o:{kind:"promo",icon:"🇰🇷",kicker:"FIRST CALL-UP",title:"태극마크를 달다",sub:S.p.name+", 처음으로 국가대표 명단에 이름이 올랐어요.",lines:[c.name+" · "+c.months]}}); } q.push({t:"callup",c}); });
  const uc=(out.recs||[]).filter(r=>r.cup==="ucl"); if(uc.length) q.push({t:"ucl",recs:uc,label:out.label});
  const uev=L.rollUclEvent?L.rollUclEvent(S,out):null; if(uev) q.push({t:"event",ev:uev});
  const ev=uev?null:L.rollEvent(S,out); if(ev) q.push({t:"event",ev});
  modals=q; save(); render();
}
function startSeason(){ if(!S.history.length) liveLog("new","새로운 인생을 시작했어요 ("+(L.POSDEF[S.p.pos]?{FW:"공격수",MF:"미드필더",DF:"수비수",GK:"골키퍼"}[S.p.pos]:"")+")"); L.beginSeason(S,Object.assign({},plan,{alloc:Object.assign({},plan.alloc)})); save(); }
/* ===== 새로고침권: 직전에 진행한 구간(전반기·하반기 등)을 한 번 더 돌려요 =====
 * 부상 등으로 구간을 날렸을 때 쓰는 아이템이에요. 지금은 모두 무료로 받을 수 있어요.
 * 나중에 앱에서 묶음 판매(1장 10원 · 10장 100원 · 100장 1,000원 등)를 붙일 수 있게 장수 관리만 먼저 만들어 뒀어요. */
const TK="klife-tickets", SNAPK="klife-snap";
const TK_PACKS=[{n:1,price:10},{n:10,price:100},{n:100,price:1000}];   // 판매는 아직 열지 않았어요(준비 중)
function tickets(){ try{ const v=localStorage.getItem(TK); return v==null?3:Math.max(0,parseInt(v,10)||0); }catch(e){ return 0; } }
function setTickets(n){ try{ localStorage.setItem(TK,String(Math.max(0,n|0))); }catch(e){} }
let snapJson=null, snapMeta=null;
try{ snapJson=localStorage.getItem(SNAPK); snapMeta=JSON.parse(localStorage.getItem(SNAPK+"-meta")||"null"); }catch(e){}
function snapTake(){ try{ const j=JSON.stringify(S); snapJson=j; snapMeta={year:S.year,seg:S.sim.seg,label:S.sim.segs[S.sim.seg].label,name:S.p.name}; try{ localStorage.setItem(SNAPK,j); localStorage.setItem(SNAPK+"-meta",JSON.stringify(snapMeta)); }catch(e){} }catch(e){ snapJson=null; snapMeta=null; } }
function snapAvail(){ return !!(snapJson&&snapMeta&&S&&S.sim&&snapMeta.year===S.year&&snapMeta.name===S.p.name&&S.sim.seg===snapMeta.seg+1); }
function snapRestore(){ if(!snapAvail()||tickets()<=0) return false; try{ const o=JSON.parse(snapJson); Object.keys(S).forEach(k=>{ delete S[k]; }); Object.assign(S,o); setTickets(tickets()-1); snapJson=null; snapMeta=null; try{ localStorage.removeItem(SNAPK); localStorage.removeItem(SNAPK+"-meta"); }catch(e){} modals.length=0; seg=null; save(); return true; }catch(e){ return false; } }
/* ===== 등번호: 다른 선수가 영구결번으로 만든 번호는 그 구단에서 쓸 수 없어요 ===== */
let retiredNums=null, retiredLoading=false;
function loadRetired(force){
  if(!hofOn||retiredLoading||(retiredNums&&!force)) return; retiredLoading=true;
  fetch(CFG.SUPABASE_URL+"/rest/v1/life_hof?select=jerseys&jersey=gt.0&limit=1000",{headers:HH}).then(r=>r.ok?r.json():[]).then(rows=>{ const m={}; rows.forEach(x=>(x.jerseys||[]).forEach(j=>{ (m[j.club]=m[j.club]||[]).push(+j.number); })); retiredNums=m; retiredLoading=false; }).catch(()=>{ retiredNums=retiredNums||{}; retiredLoading=false; });
}
function numAfter(){
  try{
    const club=S.club; if(!club||club.lg==="MIL") return; const banned=((retiredNums||{})[club.name]||[]).map(Number);
    const cur=+S.p.number||0, orig=+(S.numOrig||cur), curBad=banned.includes(cur), origOk=orig!==cur&&!banned.includes(orig);
    S.numByClub=S.numByClub||{};
    if(!curBad&&!origOk){ S.numByClub[club.id]=cur; return; }
    modals.push({t:"numpick",club:club.name,cid:club.id,banned,cur,orig,curBad,origOk}); keep(render);
  }catch(e){}
}
function runNext(){
  if(!S.sim) return;
  if(S.sim.seg>=S.sim.segs.length){ finishSeason(); return; }
  const sg=S.sim.segs[S.sim.seg];
  L.setPlan(S,Object.assign({},plan,{alloc:Object.assign({},plan.alloc)}));
  snapTake();
  runLoading(L.seasonLabel(S)+" 시즌",sg.label+" 진행 중",[sg.months+" 일정 확인","훈련·트레이닝","리그 경기 진행","컵 대회·대표팀 소집","기록 집계"],()=>{ const out=L.playSegment(S); afterSegment(out); });
}
function finishSeason(){
  runLoading(S.year+" 시즌","시즌 결산 중",["최종 순위 확정","개인 기록 집계","수상 후보 평가","재능 평가·성장 반영"],()=>{
    const sim=S.sim; const teams=sim?sim.teams:[];
    const R=L.finishSeason(S); R.simTeams=teams; seg=null; boardTab="table";
    liveLog("season",S.year+" 시즌 · "+(R.club?R.club.name:"")+(R.goals!=null?" "+R.goals+"골 "+R.assists+"도움":""));
    if(R.scoutFinal){ const sf=R.scoutFinal; const hid=sf.hidden?" 그리고 스카우터가 숨은 재능을 발견했어요 — "+L.traitName(sf.hidden,true)+". "+L.HIDDEN_LIST.find(h=>h.id===sf.hidden).desc:""; const txt={S:"세계 무대에서도 통할 재목이에요. 키우기에 따라 월드클래스가 될 수 있어요.",A:"국가대표급 잠재력이 보여요. 꾸준히 성장하면 리그 정상급이 될 거예요.",B:"1군 주전으로 충분히 자리 잡을 재목이에요.",C:"재능은 평범하지만 노력으로 길을 개척할 수 있는 선수예요."}[sf.grade];
      modals.push({t:"msg",kick:"SCOUT REPORT",title:"재능 등급이 확정됐어요: "+sf.grade,body:"20세까지의 경기 결과와 성장을 종합한 스카우터의 최종 평가예요. "+txt+hid,banner:sf.grade}); }
    else if(S.history.length===1&&!S.scoutedMid){ S.scoutedMid=true; modals.push({t:"msg",kick:"SCOUT REPORT",title:"스카우터의 첫 중간 평가: "+L.scoutBand(S).label,body:"아직은 범위로만 말할 수 있어요. 20세가 되면 경기 결과와 성장에 따라 하나로 확정돼요."}); }
    { const tr=(R.trophies||[]).filter(t=>/우승/.test(t)); const club=R.club?R.club.name:""; let o=null;
      const EUR=/유럽 클럽컵|유럽컵2|컨퍼런스|월드컵|아시안|종합 국제대회|ACL|AFC/; const ucl=tr.find(t=>/유럽 클럽컵 우승/.test(t)&&!/AFC|아시아/.test(t)), uel=tr.find(t=>/유럽 클럽컵2 우승|유럽 클럽컵3 우승/.test(t)), lgT=tr.find(t=>!EUR.test(t)&&!/컵|포칼|코파|슈퍼|일왕배|트로피/.test(t)&&/(리그|잉글랜드 1부 리그|스페인 1부 리그|독일 1부 리그|이탈리아 1부 리그|레전드리그|J1|프랑스 1부 리그|사우디).*우승|리그 우승/.test(t)), cup=tr.find(t=>!EUR.test(t)&&/컵|포칼|코파|일왕배|슈퍼/.test(t));
      const treble=!!(ucl&&lgT&&cup);
      const lines=[R.goals!=null&&R.apps?(R.apps+"경기 "+R.goals+"골 "+R.assists+"도움"):"", R.rating?("평점 "+R.rating):""].filter(Boolean);
      if(treble) o={kind:"euro",icon:"👑",kicker:"THE TREBLE · "+R.year,title:"트레블 달성!",sub:club+"이(가) 리그·컵·유럽 클럽컵를 모두 들어 올렸어요. 역사에 남을 시즌이에요.",lines:["리그 우승 · "+cup.replace(/ 우승$/,"")+" · 유럽 클럽컵 우승"].concat(lines)};
      else if(ucl) o={kind:"euro",icon:"⭐",kicker:"CHAMPIONS OF EUROPE · "+R.year,title:"유럽의 정상에 서다",sub:club+"이(가) 유럽 클럽컵를 들어 올렸어요.",lines};
      else if(uel) o={kind:"win",icon:"🏆",kicker:"EUROPEAN CUP · "+R.year,title:uel.replace(/ 우승$/,"")+" 우승!",sub:club+"이(가) 유럽 무대에서 트로피를 들어 올렸어요.",lines};
      else if(lgT) o={kind:"win",icon:"🏆",kicker:"LEAGUE CHAMPIONS · "+R.year,title:club+" 리그 우승!",sub:S.p.name+"의 "+R.year+" 시즌, 우승 트로피를 들어 올렸어요.",lines};
      else if(cup) o={kind:"win",icon:"🏆",kicker:"CUP WINNERS · "+R.year,title:cup.replace(/ 우승$/,"")+" 우승!",sub:club+"의 한 시즌이 트로피로 마무리됐어요.",lines};
      else if((R.records||[]).length) o={kind:"record",icon:"📈",kicker:"NEW RECORD · "+R.year,title:"기록을 새로 썼어요",sub:R.records[0],lines:R.records.slice(1,3)};
      if(o) modals.unshift({t:"cine",o}); }
    if(R.ballon&&R.ballon.rank===1){ const n=S.ballon.filter(b=>b.rank===1).length; modals.unshift({t:"gold",kick:"BALLON D'OR "+R.year,title:esc0(S.p.name)+", 올해의 황금공",sub:(n>1?n+"번째 ":"")+"세계 최고의 선수로 선정됐어요",club:R.club.name,lines:[R.leagueName+" "+R.rank+"위 · "+R.goals+"골 "+R.assists+"도움 · 평점 "+R.rating,...(R.trophies.length?[R.trophies.join(" · ")]:[])]}); }
    save(); render();
  });
}
function esc0(s){ return String(s==null?"":s); }
function buildOff(){
  off={};
  if(S.stage==="pro"){
    off={contract:L.contractOffer(S),loans:L.loanOffers(S),transfers:L.transferOffers(S),mil:L.militaryPrompt(S),milDone:false,renego:false,accepted:false,retire:false,endorse:L.endorseOffers(S)};
    if(S.demand){ off.transfers=L.transferOffers(S,{max:5}); off.demandNote=true; S.demand=false; }
    if(S.loan){ off.transfers=[]; off.loans=[]; off.loanNote=true; }
    if(S.military==="serving"||S.military==="sangmu"||S.club.lg==="MIL"){ off.transfers=[]; off.endorse=[]; }
    if(L.mustRetire(S)) off.retire=true;
    chosenInc=[];
  }
}
function goOffseason(){
  S.phase="offseason"; buildOff();
  if(S.stage==="pro"){
    const jh=L.jerseyHint(S); if(jh) modals.push({t:"msg",kick:"CLUB LEGEND",title:jh.name+"의 상징이 되어 가요",body:jh.yrs+"시즌째 한 팀에서 뛰고 있어요. 이대로 은퇴한다면 영구결번 이야기가 나올지도 몰라요."});
  }
  save(); render();
}
function doRetire(){
  { const ch=L.charOf(S), ft=L.fameTierOf(S,S.fameMax||S.fame), yrs=S.history.filter(h=>!h.youth).length, c=S.career;
    const o={kind:"retire",icon:"🎽",kicker:"FAREWELL · "+L.age(S)+"세",title:ch>=75?"박수 속에 떠나는 "+S.p.name:ch<35?S.p.name+", 논란도 이야기가 되다":S.p.name+", 그라운드를 떠나다",
      sub:ch>=75?"상대 팬들까지 일어나 박수를 보냈어요. 실력만큼 사람됨으로 기억될 선수예요.":ch<35?"호불호가 갈렸지만, 누구도 그의 존재감을 무시하지 못했어요.":"긴 여정을 마치고 새 이야기를 준비해요.",
      lines:[yrs+"시즌 · "+c.apps+"경기 "+c.goals+"골 "+c.assists+"도움",ft.name+" 인기 · "+L.charTier(ch).name]};
    modals.unshift({t:"cine",o}); const tb=L.retireTribute&&L.retireTribute(S); if(tb) modals.push({t:"msg",kick:"TRIBUTE",title:tb.title,body:tb.body}); }
  liveLog("retire","은퇴했어요 ("+(S.history.filter(h=>!h.youth).length)+"시즌 · 통산 "+S.career.goals+"골)");
  try{ if(S.challenge&&L.weeklyRecord) L.weeklyRecord(S.challenge,L.legacy(S).total,S.p.name); }catch(e){}
  const jr=L.jerseyRetired(S); S.jersey=jr; S.retired=true; view="retired"; jr.forEach(j=>modals.push({t:"jersey",j,name:S.p.name}));
  const h=rd(HOF)||[]; h.push(Object.assign(hofEntry(""),{retire:jr.length>0}));
  wr(HOF,h); save(); render();
}
function nextYear(){
  L.nextYear(S); off=null; seg=null; openDet=false; planOpen=false; const pn=S.promoNote; S.promoNote=null;
  if(pn&&S.stage==="pro"){ leagueWelcome(); modals.push({t:"msg",kick:/^방출/.test(pn)?"RELEASED":/^강등/.test(pn)?"RELEGATED":"PROMOTED",title:/^방출/.test(pn)?"계약 해지":/^강등/.test(pn)?"강등":"승격",body:pn.replace(/^(방출|강등|승격): /,"")}); }
  if(S.phase==="draft"){ S.dr=null; view="draft"; } else view="game";
  save(); render();
}
function finishPopup(){            // 팝업이 모두 끝난 뒤 처리(중도 포기 엔딩 등)
  if(!modals.length&&S&&S.retired&&S.quit&&view==="game"){ view="quit"; }
}

/* ================= 꾸미기 · 은퇴 카드 · 스카우터 새로고침 (js/life/cosmetics.js) ================= */
const CS=()=>window.KL_COS;
let setMain="club", cosGrp="player", cosTyp="hair", cosSel=null, cosMsg="", supDraft="";
if(L){ L.onCosChange=()=>{ if(window.KL_AUTH) KL_AUTH.queue(cloudPayload); }; if(L.rewardHook===undefined) L.rewardHook=null; }   // rewardHook: 나중에 보상형 광고를 붙일 자리 — function(kind, done){ …광고를 끝까지 보면 done(true) }
const adslot=n=>`<div class="adslot" data-slot="${n}"></div>`;
/* 미리보기용 도트: 진행 중인 선수가 있으면 그 선수의 체격으로, 없으면 기본 체격으로 그려요 */
function cosSprite(size,cosOv,extra){
  if(S&&S.p&&L.pixelImg) return L.pixelImg(S,size,Object.assign({clean:true,cos:cosOv},extra||{}));
  const url=L.pixelSprite(Object.assign({name:"dot",age:24,kit:"#2f6fd6"},cosOv,extra||{})), w=Math.round(size*16/24);
  return `<img class="pix" alt="" width="${w}" height="${size}" src="${url}" style="width:${w}px;height:${size}px">`;
}
function cosThumb(it,eqs){
  const K=CS(), pv=Object.assign({},eqs); pv[it.type]=it.id;
  if(it.type==="hcolor"){ return it.c?`<span class="sw" style="background:${it.c}"></span>`:`<span class="sw" style="background:conic-gradient(#14110f,#6b4528,#e3c15a,#3f7fe0,#14110f)"></span>`; }
  if(it.type==="frame"){ const f=K.frameShadow(it.id); return `<span class="fr" style="${f}"></span>`; }
  if(it.type==="card"){ return `<span class="cd" style="background:${K.cardBg(it.id)}"></span>`; }
  if(it.type==="emblem"){ return it.d?K.emblemSvg(it.id,34):`<span class="muted" style="font-size:20px">∅</span>`; }
  const torso=it.type==="captain"||it.type==="pattern";
  return `<span class="crop ${torso?"t":""}">${cosSprite(120,K.pixOpts(pv),{})}</span>`;
}
function cosStage(pv,it){
  const K=CS();
  if(cosGrp==="player") return `<div class="stage">${cosSprite(132,K.pixOpts(pv))}</div>`;
  if(cosGrp==="frame"){ const id=pv.frame, f=K.frameOf(id); return `<div class="stage"><div class="mock ${K.frameClass(id)}" style="${K.frameStyle(id)}">${K.ornHtml(id)}<span>🏅 영구결번 전시관</span><span class="muted" style="font-size:11px">내 선수 카드가 이 액자에 담겨요</span></div></div>`; }
  if(cosGrp==="card"){ const c=K.by(pv.card); return `<div class="stage"><div class="mock card" style="background:${K.cardBg(pv.card)};color:${c.ink};border-color:${c.acc}"><b style="color:${c.acc};letter-spacing:.2em;font-size:11px">RETIREMENT</b><span style="font-size:15px">내 선수</span><b style="font-size:30px;color:${c.acc}">88</b><span style="color:${c.sub};font-size:11px">최고 OVR</span></div></div>`; }
  return `<div class="stage"><div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px">${K.emblemSvg(pv.emblem,30)||"∅"}<span>내 구단</span></div></div>`;
}
function cosPage(){
  const K=CS(), eqs=K.eqAll(), items=K.items.filter(x=>x.type===cosTyp);
  if(!items.some(x=>x.id===cosSel)) cosSel=null;
  const cur=cosSel?K.by(cosSel):K.by(eqs[cosTyp]), pv=Object.assign({},eqs); pv[cosTyp]=cur.id;
  const u=K.unlock(cur.id), isEq=eqs[cosTyp]===cur.id, kinds={achv:"기록으로 해금",supporter:"후원자 전용",free:"기본"};
  const act=u.ok?(isEq?`<p class="why" style="color:var(--acc)">✓ 장착 중이에요</p>`:`<button class="big" data-act="cosequip" data-v="${cur.id}"><span>이걸로 장착하기</span><b>→</b></button>`)
    :`<p class="why lock">🔒 ${esc(u.why||"")}${u.need!=null?" ("+u.cur+"/"+u.need+")":""}</p>${cur.unlock.kind==="supporter"?`<button class="wide" data-act="cossup">후원자 코드 입력하러 가기 ↓</button>`:""}`;
  const subs=cosGrp==="player"?`<div class="cossub">${K.types.filter(t=>t[2]==="player").map(t=>`<button class="${t[0]===cosTyp?"on":""}" data-act="costyp" data-v="${t[0]}">${t[1]}</button>`).join("")}</div>`:"";
  const sup=K.isSupporter();
  return `<main class="body"><div class="brand"><span class="mark">🎨</span><div><small>STYLE</small><b>꾸미기</b></div></div>${setMainChips()}
   <section class="card flat cospv">${cosStage(pv,cur)}<h3>${esc(cur.name)} <small class="muted">· ${kinds[cur.unlock.kind]||""}</small></h3>${cur.desc?`<p class="muted">${esc(cur.desc)}</p>`:""}${act}</section>
   <div class="chips setchips">${K.groups.map(g=>`<button class="chip ${g[0]===cosGrp?"on":""}" data-act="cosgrp" data-v="${g[0]}">${g[1]}</button>`).join("")}</div>
   ${subs}
   <div class="cosgrid">${items.map(it=>{ const un=K.unlock(it.id), on=eqs[it.type]===it.id, pg=!un.ok&&un.need!=null?`<small>${un.cur}/${un.need}</small>`:(!un.ok&&it.unlock.kind==="supporter"?"<small>후원자</small>":""); return `<button class="cosit ${on?"on":""} ${cur.id===it.id?"sel":""} ${un.ok?"":"lk"}" data-act="cossel" data-v="${it.id}" aria-label="${esc(it.name)}"><span class="th">${cosThumb(it,eqs)}</span><span>${esc(it.name)}${pg}</span>${on?`<i class="bd ok">장착</i>`:un.ok?"":`<i class="bd">🔒</i>`}</button>`; }).join("")}</div>
   <p class="muted">장착한 꾸미기는 이 기기와 로그인한 계정의 클라우드 저장에 함께 저장돼요. 게임 능력치·결과에는 영향이 없어요.</p>
   <section class="card flat supbox" id="sec-sup"><h3 class="sec">후원자 코드</h3><p class="muted">후원해 주신 분께 따로 알려 드리는 코드예요. 등록하면 후원자 전용 꾸미기가 열리고 광고가 꺼져요.</p>
    ${sup?`<p class="note good">후원자로 등록돼 있어요. 고맙습니다! 💚</p>`:""}
    <input type="text" id="supcode" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="KLS-XXXXXX-XXXX" value="${esc(supDraft)}">
    <button class="wide" data-act="supgo">${sup?"코드 더 등록하기":"코드 등록"}</button>${cosMsg?`<p class="note ${/!$|열려|이미/.test(cosMsg)?"good":"warn"}">${esc(cosMsg)}</p>`:""}</section>
   <p class="muted c"><button class="lnk" data-act="home">돌아가기</button></p></main>`;
}
function setMainChips(){ return `<div class="setmain"><button class="${setMain==="club"?"on":""}" data-act="setMain" data-v="club">구단·로고</button><button class="${setMain==="cos"?"on":""}" data-act="setMain" data-v="cos">🎨 꾸미기</button></div>`; }
/* 은퇴 카드(화면) — 같은 내용을 canvas 이미지로도 저장해요 */
function retCard(){
  const K=CS(); if(!K||!L.pixelImg) return "";
  const eqs=K.eqAll(), cd=K.by(eqs.card), fr=K.frameOf(eqs.frame), lg=L.legacy(S), g=L.legacyGrade(lg.total), c=S.career, tt=L.titlesOf(S).slice(0,3);
  const sty=`background:${K.cardBg(eqs.card)};--ci:${cd.ink};--ca:${cd.acc};--cs:${cd.sub};${K.frameStyle(eqs.frame)}`;
  return `<section class="rcard ${K.frameClass(eqs.frame)} ${fr&&fr.sq?"sq":""} ${cd.pat?"p-"+cd.pat:""}" style="${sty}">${K.ornHtml(eqs.frame)}<div class="rc-k">RETIREMENT</div><div class="rc-sp">${L.pixelImg(S,150,{suit:true,age:Math.max(L.age(S),30)})}</div>
   <h2>${esc(S.p.name)}</h2><div class="rc-sb">${K.emblemSvg(eqs.emblem,16)}<span>${POSK[S.p.pos]} · ${esc(mainClub())}</span></div>
   <div class="rc-two"><div><small>최고 OVR</small><b>${S.p.peak}</b></div><div><small>커리어 등급</small><b>${g}</b></div></div>
   <div class="rc-four"><div><b>${c.apps}</b><small>출전</small></div><div><b>${c.goals}</b><small>골</small></div><div><b>${c.assists}</b><small>도움</small></div><div><b>${c.caps}</b><small>대표팀</small></div></div>
   ${tt.length?`<div class="rc-tt">${tt.map(t=>`<span>${esc(t)}</span>`).join("")}</div>`:""}<div class="rc-ft">K-레전드 · K-라이프 · ${S.year}</div></section>
   <div class="rcbtn"><button class="big" data-act="cardmake"><span>🖼 카드 이미지로 저장</span><b>→</b></button><button class="wide" data-act="cosgo">🎨 카드·액자 꾸미기</button></div>`;
}
function cardInfo(){
  const K=CS(), lg=L.legacy(S), c=S.career, eqs=K.eqAll();
  const tx=s=>{ s=String(s==null?"":s); try{ if(window.KL_VIRT&&KL_VIRT.on&&KL_VIRT.tx) s=KL_VIRT.tx(s); if(window.KL_LANG==="en"&&window.KL_I18N) s=KL_I18N.tx(s); }catch(e){} return s; };
  const m=/src="([^"]+)"/.exec(L.pixelImg(S,150,{suit:true,age:Math.max(L.age(S),30)})||"");
  return {name:S.p.name,pos:tx(POSK[S.p.pos]),club:tx(mainClub()),ovr:S.p.peak,apps:c.apps,goals:c.goals,assists:c.assists,caps:c.caps,grade:L.legacyGrade(lg.total),score:lg.total,titles:L.titlesOf(S).slice(0,3).map(tx),year:S.year,spriteUrl:m?m[1]:"",eqs};
}
function cardSaveFile(m){ try{ const a=document.createElement("a"); a.href=m.url; a.download=m.file; document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),400); return true; }catch(e){ return false; } }
/* 스카우터 새로고침: 하루 무료 3번(내 기기의 날짜 기준). 보상형 광고는 L.rewardHook 이 생기면 연결해요 */
const SCK="klife-screfresh", SC_FREE=3;
const dayKey=()=>{ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
function scState(){ const o=rd(SCK); return (o&&o.d===dayKey())?{d:o.d,used:+o.used||0,extra:+o.extra||0}:{d:dayKey(),used:0,extra:0}; }
const scLeft=()=>{ const o=scState(); return Math.max(0,SC_FREE+o.extra-o.used); };
function scUse(){ const o=scState(); if(SC_FREE+o.extra-o.used<=0) return false; o.used++; wr(SCK,o); return true; }
function rescoutHtml(){
  const n=scLeft(), hook=typeof L.rewardHook==="function";
  return `<div class="rescout">${n>0?`<button class="wide" data-act="rescout">🔄 후보 다시 뽑기<small>오늘 ${n}번 남았어요 · 하루 ${SC_FREE}번 무료</small></button>`
    :`<p class="muted c">오늘 다시 뽑기 ${SC_FREE}번을 모두 썼어요. 내일 다시 뽑을 수 있어요.</p>${hook?`<button class="wide" data-act="rescoutad">▶ 광고를 보고 한 번 더 뽑기</button>`:""}`}
   ${n>0?`<p class="muted">다시 뽑으면 지금 보이는 후보 세 명은 사라지고 새 후보 세 명이 나와요. 재능 등급은 뽑아도 20세 전에는 알 수 없어요.</p>`:""}</div>`;
}
function rescoutGo(){
  draft.cands=makeCands(); draft.pick=-1;
  if(FAST){ render(); return; }
  draft.loading=true; draft.prog=10; render(); setTimeout(()=>{ draft.prog=70; render(); setTimeout(()=>{ draft.loading=false; render(); },500); },450);
}

/* ================= 이벤트 위임 ================= */
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]"); if(!b) return; const act=b.dataset.act, v=b.dataset.v; if(b.tagName==="INPUT") return;
  if(ld) return;
  if(view==="create"||view==="scout") readForm();
  switch(act){
    case "home": if((view==="help"||view==="tactest")&&helpBack&&helpBack!=="help"&&helpBack!=="tactest"){ view=helpBack; render(); break; } if(window.__fromIndex){ location.href="index.html"; break; } view="home"; render(); break;
    case "tab": tab=v; render(); break;
    case "continue": view=S.retired?(S.quit?"quit":"retired"):S.phase==="draft"?"draft":"game"; tab="season"; render(); break;
    case "wipe": if(confirm("저장된 선수를 삭제할까요?")){ try{ localStorage.removeItem(KEY); }catch(_){} S=null; render(); } break;
    case "wk": { const W=L.weekly(); S=null; draft=NEWDRAFT(); plan=NEWPLAN(); draft.pos=W.pos; draft.sub=L.POSDEF[W.pos].subs[0][0]; draft.route=W.route; draft.weekly=W; if(W.route==="high"||W.route==="univ") draft.points.mentor=0; view="create"; render(); break; }
    case "new": S=null; draft=NEWDRAFT(); plan=NEWPLAN(); view="create"; render(); break;
    case "pos": if(draft.weekly){ say("이번 주 도전은 포지션과 시작 시점이 정해져 있어요"); break; } draft.pos=v; draft.sub=L.POSDEF[v].subs[0][0]; keep(render); break;
    case "sub": draft.sub=v; draft.role=""; keep(render); break;
    case "role": draft.role=v; keep(render); break;
    case "foot": draft.foot=v; keep(render); break;
    case "trait": draft.trait=v; keep(render); break;
    case "route": if(draft.weekly){ say("이번 주 도전은 포지션과 시작 시점이 정해져 있어요"); break; } draft.route=v; if(v==="high"||v==="univ") draft.points.mentor=0; keep(render); break;
    case "pt": { const [k,d]=v.split(":"); const nx=draft.points[k]+(+d); if(nx<0||nx>5||(+d>0&&ptsLeft()<=0)) break; draft.points[k]=nx; keep(render); break; }
    case "create": view="create"; render(); break;
    case "scout":
      if(!draft.name.trim()){ hint("#sec-name","이름을 먼저 적어 주세요"); break; }
      if(ptsLeft()>0){ hint("#sec-pts","포인트 "+ptsLeft()+"개가 남았어요. 모두 나눠 주세요"); break; }
      draft.cands=makeCands(); draft.pick=-1;
      if(FAST){ view="scout"; render(); break; }
      view="scout"; draft.loading=true; draft.prog=10; render(); setTimeout(()=>{ draft.prog=55; render(); setTimeout(()=>{ draft.loading=false; render(); },700); },650); break;
    case "cand": draft.pick=+v; keep(render); break;
    case "start": { if(draft.pick<0){ hint(".cand","후보를 한 명 골라 주세요"); break; } S=draft.cands[draft.pick]; plan=NEWPLAN(); view=S.phase==="draft"?"draft":"game"; tab="season";
      if(S.phase==="draft") S.dr=null; else modals.push({t:"msg",kick:"FAMILY",title:S.family.name,body:S.family.note+". 해마다 지원 포인트 "+S.family.pts+"점으로 성장 투자를 고를 수 있고, 구간마다 다시 나눌 수 있어요. 가정 형편은 살다 보면 바뀌기도 해요."});
      save(); render(); break; }
    case "draftgo": { const dr=ensureDr(); if(dr.rolled) break; dr.rolled=true; dr.ok=Math.random()*100<dr.chance; if(dr.ok) S.offers=L.draftOffers(S); else S.offers=[]; save(); render(); break; }
    case "sign": { const o=S.offers[+v]; askSign("프로 계약서 · "+o.club.name,["연봉 "+money(o.salary)+" · "+o.years+"년 계약","계약금 "+money(Math.max(.05,Math.round(o.salary*8)/10))+" 지급","예상 역할 "+o.role],()=>{ L.signWith(S,o); S.dr=null; view="game"; tab="season"; if(!FAST) transferCines(o,false).reverse().forEach(m=>modals.unshift(m)); modals.unshift({t:"cine",o:{kind:"promo",icon:"✍️",kicker:"PRO DEBUT · "+S.year,title:"프로 선수가 되다",sub:o.club.name+"과(와) 프로 계약을 맺었어요. 이제부터 진짜 시작이에요.",lines:["연봉 "+money(o.salary)+" · "+o.years+"년"]}}); tier2Prompt(); save(); render(); numAfter(); }); break; }
    case "signk3": { const o=S.dr.k3[+v]; askSign("프로 계약서 · "+o.club.name,["레전드리그3(3부) · 연봉 "+money(o.salary)+" · "+o.years+"년 계약","예상 역할 "+o.role,"세미프로 구단이에요. 잘하면 레전드리그2 승격 제안이 와요"],()=>{ L.signWith(S,o); S.dr=null; view="game"; tab="season"; leagueWelcome(); modals.unshift({t:"cine",o:{kind:"promo",icon:"🏟",kicker:"K3 DEBUT · "+S.year,title:"레전드리그3에서 시작하다",sub:o.club.name+"과(와) 계약했어요. 밑바닥에서 다시 올라가 봐요.",lines:["연봉 "+money(o.salary)+" · "+o.years+"년"]}}); save(); render(); numAfter(); }); break; }
    case "signk4": { const o=S.dr.k4[+v]; askSign("프로 계약서 · "+o.club.name,["레전드리그4(4부) · 연봉 "+money(o.salary)+" · "+o.years+"년 계약","예상 역할 "+o.role,"지역 구단이에요. 생활비를 벌며 뛰는 선수도 많아요. 잘하면 레전드리그3 승격 제안이 와요"],()=>{ L.signWith(S,o); S.dr=null; view="game"; tab="season"; leagueWelcome(); modals.unshift({t:"cine",o:{kind:"promo",icon:"🌱",kicker:"K4 DEBUT · "+S.year,title:"레전드리그4에서 시작하다",sub:o.club.name+"과(와) 계약했어요. 가장 낮은 곳에서 다시 시작해요.",lines:["연봉 "+money(o.salary)+" · "+o.years+"년"]}}); save(); render(); numAfter(); }); break; }
    case "signdirect": { const o=S.dr.direct[+v]; askSign("해외 직행 계약서 · "+o.club.name,["연봉 "+money(o.salary)+" · "+o.years+"년 계약","잉글랜드 1부 리그 2군(U21)에서 시작해요"],()=>{ L.signWith(S,o); S.abroadYouth=true; S.dr=null; view="game"; tab="season"; leagueWelcome(); modals.unshift({t:"cine",o:{kind:"promo",icon:"✈️",kicker:"OVERSEAS DEBUT · "+S.year,title:"유럽으로 곧장 떠나다",sub:o.club.name+"에서 프로 인생을 시작해요.",lines:[L.lgLabel(o.club.lg)]}}); save(); render(); numAfter(); }); break; }
    case "signclear": { const cv=$("signpad"); if(cv){ cv.getContext("2d").clearRect(0,0,cv.width,cv.height); signDirty=false; } break; }
    case "signprev": { const cv=$("signpad"), im=new Image(); im.onload=()=>{ const c=cv.getContext("2d"); c.clearRect(0,0,cv.width,cv.height); c.drawImage(im,0,0,cv.width,cv.height); signDirty=true; }; im.src=S.sign; break; }
    case "signcancel": modals.shift(); keep(render); break;
    case "signdone": { if(!signDirty){ say("사인을 먼저 해 주세요"); break; } const cv=$("signpad"); S.sign=cv.toDataURL("image/png"); const m=modals.shift(); save(); if(m&&m.fn){ if(window.KL_FX&&!FAST&&!KL_FX.busy()){ KL_FX.stamp(String(m.title||"").split(" · ").pop().slice(0,16),()=>m.fn()); render(); } else m.fn(); } break; }
    case "univ": L.chooseUniv(S); S.dr=null; view="game"; tab="season"; save(); render(); break;
    case "quitdraft": L.quitCareer(S,"draft","프로 구단의 지명을 받지 못해 축구를 접기로 했어요."); S.dr=null; view="quit"; save(); render(); break;
    case "focus": plan.focus=v; keep(render); break;
    case "tier": plan.tier=v; keep(render); break;
    case "invest": plan.invest=v; keep(render); break;
    case "planbtn": planOpen=!planOpen; keep(render); break;
    case "al": { const [k,d]=v.split(":"); plan.alloc=plan.alloc||{}; const cur=plan.alloc[k]|0, nx=cur+(+d); if(nx<0||nx>5||(+d>0&&allocLeft()<=0)) break; plan.alloc[k]=nx; keep(render); break; }
    case "begin": if(!plan.focus){ hint("#sec-train","훈련 방향을 골라 주세요"); break; } startSeason(); seg=null; render(); runNext(); break;
    case "next": if(S.sim&&S.sim.seg<S.sim.segs.length&&!plan.focus){ planOpen=true; keep(render); setTimeout(()=>hint("#sec-train","훈련 방향을 골라 주세요"),30); break; } runNext(); break;
    case "army": { const R=L.armyYear(S); S.lastR=R; save(); render(); break; }
    case "det": openDet=!openDet; keep(render); break;
    case "btab": boardTab=v; keep(render); break;
    case "ballon": modals.push({t:"ballon"}); render(); break;
    case "xi": modals.push({t:"xi",list:L.bestXI(S,S.lastR)}); render(); break;
    case "healfast": { const o=window.__lastSeg||seg; const c=healCost(); if(o&&o.inj&&S.sim&&S.funds>=c){ S.funds=r1(S.funds-c); const before=S.sim.out; S.sim.out=Math.ceil(before*.35); o.inj.treated="집중 치료로 결장이 "+before+"경기에서 "+S.sim.out+"경기로 줄었어요. (-"+money(c)+")"; save(); } keep(render); break; }
    case "healwait": { if(seg&&seg.inj){ seg.inj.treated="자연 회복을 택했어요. 몸이 완전히 나을 때까지 기다려요."; S.cond=Math.min(100,S.cond+4); save(); } keep(render); break; }
    case "tac": tac={i:0,sc:{},done:false}; helpBack="create"; view="tactest"; render(); window.scrollTo(0,0); break;
    case "tacans": { const q=TAC_Q[tac.i]; const o=q.o[+v]; Object.keys(o[1]).forEach(k=>tac.sc[k]=(tac.sc[k]||0)+o[1][k]); tac.i++; if(tac.i>=TAC_Q.length) tac.done=true; keep(render); break; }
    case "tacapply": { if(tac&&tac.pick) draft.role=tac.pick; view="create"; render(); break; }
    case "help": helpBack=view; view="help"; render(); window.scrollTo(0,0); break;
    case "helppos": helpPos=v; keep(render); break;
    case "login": KL_AUTH.login(); break;
    case "logout": KL_AUTH.logout(); cloudMsg="로그아웃했어요."; render(); break;
    case "cloudup": cloudMsg="저장하는 중…"; render(); KL_AUTH.upload(cloudPayload()).then(()=>{ cloudMsg="클라우드에 저장했어요 ("+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})+")"; render(); }).catch(e=>{ cloudMsg=String(e.message||e); render(); }); break;
    case "clouddown": cloudMsg="불러오는 중…"; render(); KL_AUTH.download().then(row=>{ if(!row||!row.data||!row.data.save){ cloudMsg="클라우드에 저장된 인생이 없어요."; render(); return; } if(S&&!confirm("이 기기의 현재 인생을 클라우드 저장으로 덮어쓸까요?\n(클라우드 저장 시각: "+(row.updated_at||"").slice(0,16).replace("T"," ")+")")){ cloudMsg="취소했어요."; render(); return; } try{ localStorage.setItem("klife-save",JSON.stringify(row.data.save)); if(row.data.dex) localStorage.setItem("klife-dex",JSON.stringify(row.data.dex)); if(row.data.hof) localStorage.setItem("klife-hof",JSON.stringify(row.data.hof)); if(row.data.cos) localStorage.setItem("klife-cos",JSON.stringify(row.data.cos)); }catch(e){} location.reload(); }).catch(e=>{ cloudMsg=String(e.message||e); render(); }); break;
    case "lang": if(window.KL_I18N) KL_I18N.toggle(); break;
    case "substat": openStat=openStat===v?null:v; keep(render); break;
    case "shop": modals.push({t:"shop"}); keep(render); break;
    case "camp": modals.push({t:"camp"}); keep(render); break;
    case "t2stay": modals.shift(); keep(render); break;
    case "t2loan": { const m=modals[0]; const o=m.offers[+v]; if(o&&L.doLoan(S,o)!==false){ modals.shift(); say(o.club.name+"(으)로 임대를 떠나요"); save(); } keep(render); break; }
    case "campgo": { const r=L.campStart(S,v); const m=modals[0]; if(m&&m.t==="camp"){ m.msg=r.ok?null:r.text; m.res=null; } save(); keep(render); break; }
    case "campch": { const m=modals[0]; if(m&&m.t==="camp"){ L.campChoose(S,+v); } save(); keep(render); break; }
    case "campstop": { const m=modals[0]; const mk=document.querySelector(".cmark"), tr=document.querySelector(".ctrack"); let pos=.5; if(mk&&tr){ const a=mk.getBoundingClientRect(), b=tr.getBoundingClientRect(); pos=Math.max(0,Math.min(1,(a.left+a.width/2-b.left)/b.width)); } if(m&&m.t==="camp"&&S.camp){ L.campTiming(S,pos); const r=L.campFinish(S); m.res=r; if(r.win&&window.KL_FX&&!FAST){ modals.unshift({t:"cine",o:{kind:"promo",icon:"🌱",kicker:"TALENT BREAKTHROUGH",title:r.brk?"한계를 넘다":"재능이 눈을 뜨다",sub:S.p.name+"의 잠재력이 "+r.gain+" 올랐어요. ("+r.pot+")",lines:r.log.slice(0,3)}}); } } save(); keep(render); break; }
    case "after": { if(L.SECOND_PATHS&&L.SECOND_PATHS.includes(v)){ if(L.secStart(S,v)){ modals.push({t:"second"}); save(); keep(render); } break; } L.afterDo(S,v); save(); keep(render); break; }
    case "secgo": if(S.second){ modals.push({t:"second"}); keep(render); } break;
    case "secopt": { const m=modals[0]; if(!m||m.t!=="second") break; const r=L.secChoose(S,+v); save(); if(r.done){ modals.shift(); modals.push({t:"msg",kick:"AFTER CAREER",title:(r.after?r.after.title:"이야기가 끝났어요"),body:(r.after&&r.after.special==="legend_both"?"🏆 선수로도 감독으로도 정상에 올랐어요. ":"")+(r.text||"")+(r.after?" 커리어 점수 +"+r.after.bonus:"")}); } else { m.res=r.text; } keep(render); break; }
    case "kiddir": { const [i,p]=v.split(":"); const r=L.kidDirect(S,+i,p); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "kidinv": { const [i,key]=v.split(":"); const r=L.kidInvest(S,+i,key); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "pcoach": { L.setPlayCoach(S); off=null; save(); say("플레잉코치로 전환했어요"); break; }
    case "potup": { const r=L.potUp(S,v); const m=modals[0]; if(m&&m.t==="shop"){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "shoptab": { const m=modals[0]; if(m&&m.t==="shop"){ m.tab=v; m.msg=null; } keep(render); break; }
    case "hire": { const r=L.hire(S,v); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "fire": { const r=L.fire(S,v); const m=modals[0]; if(m){ m.msg=r.text; m.ok=true; } save(); keep(render); break; }
    case "buyasset": { const [id,amt]=v.split(":"); const r=L.buyAsset(S,id,+amt); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "sellasset": { const r=L.sellAsset(S,v); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "honor": { const r=L.buyHonor(S,v); const m=modals[0]; if(m){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "buy": { const [kind,id]=v.split(":"); const r=L.buyItem(S,kind,id); const m=modals[0]; if(m&&m.t==="shop"){ m.msg=r.text; m.ok=r.ok; } save(); keep(render); break; }
    case "endorse": { const o=off.endorse[+v]; L.signEndorse(S,o); off.endorse.splice(+v,1); if(L.endorseFree(S)<=0) off.endorse=[]; save(); say(o.brand+"와(과) 광고 계약을 맺었어요"); break; }
    case "offseason": goOffseason(); break;
    case "nextyear": if(off&&S.stage==="pro"&&S.contractYears<=1&&!off.accepted&&!(S.club.lg==="MIL"||S.military==="serving"||S.military==="sangmu")){ hint("[data-act=accept]","계약을 먼저 확정해 주세요"); break; } if(S.phase!=="offseason"&&S.stage!=="youth"&&S.stage!=="univ") break; nextYear(); break;
    case "inc": chosenInc=chosenInc.includes(v)?chosenInc.filter(x=>x!==v):chosenInc.concat(v); keep(render); break;
    case "renego": { if(off.renego) break; const n=L.negotiate(S,off.contract); off.renego=true; const o=Object.assign({},off.contract,{offer:n.offer,rate:n.rate}); off.contract=o; say(n.mult>1?"협상 성공! 연봉이 올랐어요":n.mult<1?"역효과… 구단이 제시액을 낮췄어요":"구단이 기존 제안을 유지했어요"); break; }
    case "accept": { const o=L.applyIncentives(S,off.contract,chosenInc); askSign("재계약서 · "+S.club.name,["연봉 "+money(o.offer)+" · "+o.years+"년"],()=>{ if(!off) return; L.acceptContract(S,o); off.accepted=true; save(); keep(render); }); break; }
    case "loan": { const o=off.loans[+v]; askSign("임대 계약서 · "+o.club.name,["1년 임대 · 연봉 "+money(o.salary)+" (원소속 구단 부담)","시즌이 끝나면 "+S.club.name+"(으)로 복귀해요"],()=>{ if(!off) return; if(L.doLoan(S,o)===false){ say("임대할 수 없어요"); return; } off.accepted=true; off.loans=[]; off.transfers=[]; off.contract={last:S.salary,offer:S.salary,rate:0,years:S.contractYears}; leagueWelcome(); save(); keep(render); numAfter(); }); break; }
    case "transfer": { const o=off.transfers[+v]; askSign("이적 계약서 · "+o.club.name,["연봉 "+money(o.salary)+" · "+o.years+"년 계약"],()=>{ if(!off) return; const wasF=L.isForeign(S.club.lg), fromLg=S.club.lg; if(L.doTransfer(S,o)===false){ say("군 복무 중에는 이적할 수 없어요"); return; } off.accepted=true; leagueWelcome(); off.transfers=[]; tier2Prompt(); off.contract={last:o.salary,offer:o.salary,rate:0,years:o.years}; S.contractYears=o.years; save(); say(o.club.name+"(으)로 이적했어요"); if(!FAST) transferCines(o,L.isForeign(o.club.lg)||wasF,fromLg).reverse().forEach(m=>modals.unshift(m)); numAfter(); }); break; }
    case "mil": { if(v==="skip"){ off.milDone=true; } else { L.enlist(S,v); off.milDone=true; off.transfers=[]; off.endorse=[]; off.contract=L.contractOffer(S); } save(); keep(render); break; }
    case "retire": if(L.mustRetire(S)||off&&off.retire&&!L.canRetire(S)){ doRetire(); break; } modals.push({t:"confirm",title:"정말 은퇴할까요?",body:S.p.name+"의 선수 생활이 여기서 끝나요. 은퇴하면 되돌릴 수 없고, 은퇴 후의 삶으로 넘어가요.",yes:"은퇴한다",no:"조금 더 뛴다",then:"retire"}); keep(render); break;
    case "cfyes": { const m=modals.shift(); if(m&&m.then==="retire"){ doRetire(); break; } keep(render); break; }
    case "cfno": modals.shift(); keep(render); break;
    case "kidpick": { draft.kidPick=+v; const k=(S.kids||[])[+v]; if(k) draft.kidName=k.name; keep(render); break; }
    case "kidpos": { const k=(document.getElementById("kid")||{}).value; draft.kidName=k; draft.kidPos=v; keep(render); break; }
    case "kid": { const kk0=(S.kids||[])[draft.kidPick]; if(!kk0){ say("이어서 키울 자녀를 먼저 골라 주세요"); break; } const nm=kk0.name; const pos=kk0.dir||draft.kidPos||S.p.pos; const kidObj=(draft.kidPick!=null&&(S.kids||[])[draft.kidPick]&&(S.kids[draft.kidPick].name===nm))?S.kids[draft.kidPick]:null; const res=L.createChild(S,{name:nm,pos,trait:S.p.trait,kid:kidObj}); const par=S; S=res.state; plan=NEWPLAN(); view="game"; tab="season"; save();
      const tl=res.talent; modals.push({t:"msg",kick:"NEXT GENERATION",title:nm+" — "+par.p.name+"의 "+(S.gen)+"세대",body:(tl.same?"부모와 같은 포지션이라 재능이 안정적으로 이어졌어요.":"다른 포지션을 선택해 재능이 크게 달라질 수 있었어요.")+" 재능 바탕 "+tl.base+" (±"+tl.spread+" 범위)에서 뽑은 결과는 비밀이에요. 20세가 되면 스카우터가 알려 줄 거예요. 집안 형편: "+S.family.name+"."}); render(); break; }
    case "ach": view="ach"; render(); break;
    case "dex": view="dex"; render(); break;
    case "settings": view="settings"; render(); break;
    case "quiz": qz=null; view="quiz"; render(); break;
    case "qzstart": qz={list:L.quizPick(10),i:0,score:0,picked:null,done:false,reward:false}; render(); break;
    case "qzpick": { if(!qz||qz.picked!=null) break; qz.picked=+v; if(qz.list[qz.i].opts[qz.picked].ok) qz.score++; render(); break; }
    case "qznext": { if(!qz) break; if(qz.i+1<qz.list.length){ qz.i++; qz.picked=null; } else { qz.done=true; try{ const b=parseInt(localStorage.getItem("klife-quizbest")||"0",10)||0; if(qz.score>b) localStorage.setItem("klife-quizbest",String(qz.score)); const day=new Date().toISOString().slice(0,10); if(qz.score>=8&&localStorage.getItem("klife-quizday")!==day){ localStorage.setItem("klife-quizday",day); setTickets(tickets()+1); qz.reward=true; } }catch(e){} } render(); break; }
    case "setTab": setTab=v; render(); break;
    case "setMain": setMain=v; render(); break;
    case "cosgo": setMain="cos"; view="settings"; render(); break;
    case "cosgrp": cosGrp=v; cosTyp=v==="player"?(["hair","hcolor","band","glasses","captain","pattern"].includes(cosTyp)?cosTyp:"hair"):v; cosSel=null; keep(render); break;
    case "costyp": cosTyp=v; cosSel=null; keep(render); break;
    case "cossel": cosSel=v; keep(render); break;
    case "cosequip": { if(CS().equip(v)){ cosSel=null; say(CS().by(v).name+" 장착했어요"); } else say("아직 열리지 않았어요"); break; }
    case "cossup": { const e=document.getElementById("sec-sup"); if(e) e.scrollIntoView({block:"center",behavior:"smooth"}); break; }
    case "supgo": { const el=document.getElementById("supcode"); supDraft=el?el.value:""; const r=CS().redeem(supDraft); cosMsg=r.msg; if(r.ok) supDraft=""; if(r.ok&&!r.dup&&window.KL_ADS_SCAN) setTimeout(window.KL_ADS_SCAN,0); keep(render); break; }
    case "cardmake": { const K=CS(); if(!K||!S) break; const fname="klegend-"+(String(S.p.name).replace(/[^\p{L}\p{N}_-]+/gu,"")||"card")+".png"; say("카드를 만드는 중이에요…");
      K.makeCard(cardInfo()).then(cv=>{ const done=blob=>{ const url=blob?URL.createObjectURL(blob):cv.toDataURL("image/png"); let fo=null; try{ if(blob&&typeof File==="function") fo=new File([blob],fname,{type:"image/png"}); }catch(e){} let can=false; try{ can=!!(fo&&navigator.canShare&&navigator.canShare({files:[fo]})); }catch(e){} modals.unshift({t:"cardimg",url,fname,fo,can,name:S.p.name}); keep(render); }; if(cv.toBlob) cv.toBlob(done,"image/png"); else done(null); }).catch(()=>say("카드를 만들지 못했어요")); break; }
    case "cardsave": { const m=modals[0]; if(m&&m.t==="cardimg"){ try{ const a=document.createElement("a"); a.href=m.url; a.download=m.fname; document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),400); say("이미지를 저장했어요. 안 보이면 이미지를 길게 눌러 주세요"); }catch(e){ say("이미지를 길게 눌러 저장해 주세요"); } } break; }
    case "cardshare": { const m=modals[0]; if(m&&m.t==="cardimg"&&m.can){ try{ navigator.share({files:[m.fo],title:"K-라이프 은퇴 카드"}).catch(()=>{}); }catch(e){ say("공유할 수 없어요. 이미지를 길게 눌러 저장해 주세요"); } } break; }
    case "rescout": { if(!scUse()){ say("오늘 무료 횟수를 모두 썼어요"); break; } rescoutGo(); break; }
    case "rescoutad": { if(typeof L.rewardHook!=="function"){ say("아직 준비 중이에요"); break; } L.rewardHook("scout",ok=>{ if(ok){ const o=scState(); o.extra++; wr(SCK,o); say("한 번 더 뽑을 수 있어요"); } else say("광고를 끝까지 보지 않아 적용되지 않았어요"); }); break; }
    case "numpick": { const m=modals[0]; if(!m||m.t!=="numpick") break; let n; if(v==="orig") n=m.orig; else if(v==="cur") n=m.cur; else n=parseInt(($("numin")||{}).value,10);
      if(!n||n<1||n>99){ say("1~99 사이의 번호를 적어 주세요"); break; } if(m.banned.includes(n)){ say(n+"번은 영구결번이라 쓸 수 없어요"); break; }
      if(!S.numOrig&&n!==+S.p.number) S.numOrig=+S.p.number; S.p.number=n; S.numByClub=S.numByClub||{}; S.numByClub[m.cid]=n; modals.shift(); L.addMoment(S,"등번호","번호",m.club+"에서 "+n+"번을 달아요."); save(); keep(render); break; }
    case "theme": if(window.KL_THEME){ KL_THEME.toggle(); } render(); break;
    case "tkuse": { if(confirm("새로고침권 1장을 써서 직전 구간을 다시 돌릴까요?\n(지금까지의 결과는 사라지고 구간 시작 전으로 돌아가요)")){ if(snapRestore()){ say("직전 구간을 되돌렸어요"); } else say("되돌릴 수 없어요"); render(); } break; }
    case "tkfree": setTickets(tickets()+5); say("새로고침권 5장을 받았어요 (지금은 무료)"); render(); break;
    case "bkExport": { try{ const o={app:"klife",v:1,at:new Date().toISOString(),data:{}}; ["klife-save","klife-hof","klife-dex","klife-nick","klife-cos","kl-custom","kl-alias","kl-bgm"].forEach(k=>{ const x=localStorage.getItem(k); if(x!=null) o.data[k]=x; }); const bl=new Blob([JSON.stringify(o)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download="klife-backup-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); say("백업 파일을 저장했어요"); }catch(e){ say("백업에 실패했어요"); } break; }
    case "setVirt": try{ localStorage.setItem("kl-virt",(window.KL_VIRT&&KL_VIRT.on)?"0":"1"); }catch(e){} location.reload(); break;
    case "setAlias": KL_CUSTOM.alias(!KL_CUSTOM.aliasOn()); say(KL_CUSTOM.aliasOn()?"앱용 이름 세트를 켰어요. 새로고침하면 적용돼요":"앱용 이름 세트를 껐어요. 새로고침하면 원래대로 돌아와요"); render(); break;
    case "setLogoDel": KL_CUSTOM.setLogo(v,null); render(); break;
    case "setReset": if(confirm("이름·로고 설정을 모두 초기화할까요?")){ KL_CUSTOM.resetAll(); location.reload(); } break;
    case "hoflist": view="hof"; render(); hofLoad(); break;
    case "hofcmp": modals.push({t:"hofcmp",a:hofRows[+v]}); render(); break;
    case "hofprof": if(window.KLHofView) KLHofView.player(modals[0].a); break;
    case "mgrcopy": { const t=document.getElementById("mgrcode"); const txt=t?t.value:""; const ok=()=>say("코드를 복사했어요"), fb=()=>{ try{ t.focus(); t.select(); if(document.execCommand("copy")) ok(); else say("코드를 길게 눌러서 복사해 주세요"); }catch(e){ say("코드를 길게 눌러서 복사해 주세요"); } };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(fb); else fb(); break; }
    case "mgrgo": { const t=document.getElementById("mgrcode"); try{ localStorage.setItem(KLImport.PEND,t?t.value:""); }catch(e){} location.href="manager.html?import=1"; break; }
    case "hofup": { const nk=(document.getElementById("nick")||{}).value||""; if(!nk.trim()){ say("닉네임을 적어 주세요"); break; } try{ localStorage.setItem("klife-nick",nk.trim()); }catch(_){} hofPost(hofEntry(nk.trim())).then(()=>{ S.hofUp=true; save(); keep(render); say("명예의 전당에 등록했어요"); }).catch(e=>say(e.message)); break; }
    case "mok": modals.shift(); finishPopup(); save(); keep(render); if(!modals.length&&!window.__keepScrollOnClose) {} break;
    case "evopt": { const m=modals[0]; if(m.ev.opts[+v]&&m.ev.opts[+v].mini&&!m.mini){ m.mini={idx:+v,type:m.ev.opts[+v].mini}; keep(render); break; } m.res=L.resolveEvent(S,m.ev,+v); dexAdd(m.ev.id); save(); keep(render); break; }
    case "callgo": { const m=modals[0]; const rr=L.joinTournament(S,m.c); modals[0]={t:"nat",r:rr}; if(rr&&rr.title&&!rr.skipped){ const wc=rr.t==="wc"; modals.splice(1,0,{t:"cine",o:{kind:wc?"world":"win",icon:wc?"🌍":"🏆",kicker:(wc?"WORLD CUP ":"")+rr.year,title:wc?"월드컵 우승!":((rr.name||"대회")+" 우승!"),sub:"태극마크를 단 "+S.p.name+"의 대표팀이 정상에 올랐어요.",lines:[(rr.goals?rr.goals+"골 ":"")+(rr.caps?rr.caps+"경기 출전":"")].filter(Boolean)}}); } save(); keep(render); break; }
    case "calldecl": { const m=modals[0]; modals[0]={t:"nat",r:L.declineCall(S,m.c)}; save(); keep(render); break; }
  }
});
document.addEventListener("change",e=>{ const t=e.target;
  if(t.dataset&&t.dataset.cn!=null){ const nm=t.value.trim(); KL_CUSTOM.setName(t.dataset.cn,nm,nm?nm.replace(/s+(FC|SC|CF)$/i,"").split(" ").slice(-1)[0]:""); say(nm?"이름을 저장했어요 (새로고침하면 적용돼요)":"원래 이름으로 돌려 놨어요"); }
  else if(t.dataset&&t.dataset.bk&&t.files&&t.files[0]){ const fr=new FileReader(); fr.onload=()=>{ try{ const o=JSON.parse(fr.result); if(!o||o.app!=="klife"||!o.data) throw 0; if(!confirm("지금 저장된 인생과 설정이 백업 파일 내용으로 바뀌어요. 계속할까요?")) return; Object.keys(o.data).forEach(k=>{ if(/^(klife-|kl-)/.test(k)) localStorage.setItem(k,o.data[k]); }); location.reload(); }catch(e){ say("올바른 백업 파일이 아니에요"); } }; fr.readAsText(t.files[0]); }
  else if(t.dataset&&t.dataset.cl!=null&&t.files&&t.files[0]){ KL_CUSTOM.shrink(t.files[0],url=>{ if(!url){ say("이미지를 읽지 못했어요"); return; } KL_CUSTOM.setLogo(t.dataset.cl,url); render(); }); } });
document.addEventListener("input",e=>{ if(e.target.id==="ht"||e.target.id==="wt"){ draft.height=(document.getElementById("ht")||{}).value||""; draft.weight=(document.getElementById("wt")||{}).value||""; const bf=document.getElementById("bodyfx"); if(bf) bf.textContent=bodyLine(); } if(e.target.id==="nm"){ draft.name=e.target.value; } });
window.__LIFE={get S(){return S;},get view(){return view;},pushModal:(m)=>{ modals.push(m); render(); },modalCount:()=>modals.length,act:(a,v)=>{ const el=document.createElement("button"); el.dataset.act=a; if(v!=null) el.dataset.v=v; document.body.appendChild(el); el.click(); el.remove(); },render,draftSet:o=>Object.assign(draft,o),getPlan:()=>plan,setPlan:p=>{plan=p;},get modals(){return modals;},get off(){return off;},get seg(){return seg;}};
try{ const go=((location.hash+"&"+location.search).match(/[#?&]go=(\w+)/)||[])[1]; if(go==="quiz"){ window.__fromIndex=true; qz=null; view="quiz"; } else if(go==="settings"){ window.__fromIndex=true; view="settings"; } else if(go==="cos"&&CS()){ window.__fromIndex=true; setMain="cos"; view="settings"; } }catch(e){}
loadRetired(); render();
})();
