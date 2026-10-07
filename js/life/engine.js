/*
 * K-라이프 (축구선수 키우기) 엔진 v2 — 핵심
 * ------------------------------------------------------------
 * 감독 버전(js/core.js)의 레전드리그 구단·선수 데이터를 그대로 쓰고, 한 선수의 커리어를 시즌 단위로 진행해요.
 * 화면과 상관없는 계산만 있어요 (화면은 js/life/ui.js).
 *
 * 파일 구성:  engine.js(핵심·시즌) · nat.js(국제대회) · awards.js(수상·황금공·영구결번) · events.js(시즌 중 이벤트)
 *
 * 시간 흐름(한 해):  프리시즌(훈련·투자 선택) → 전반기(3~6월) → 중반기(7~8월) → 후반기(9~10월) → 시즌 마무리(11~12월)
 *                    → 결과 → 오프시즌(계약·이적·병역·은퇴) → 다음 해
 * 나이 흐름:  중학교 1~3학년 13~15세 · 고등학교 1~3학년 16~18세 · 프로 입단(고졸) 19세 · 대학 4년 19~22세 → 23세 드래프트
 */
(function(){
"use strict";
const K=window.KLCore, CFG=K.CONFIG;
const L=window.LIFE=window.LIFE||{};
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const logistic=z=>1/(1+Math.exp(-z));
const r1=v=>Math.round(v*10)/10;
const binom=(n,p)=>{ let k=0; for(let i=0;i<n;i++) if(Math.random()<p) k++; return k; };
const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
Object.assign(L,{rnd,ri,pick,clamp,logistic,r1,binom,shuffle});

/* ================= 포지션·능력치 ================= */
const POSDEF={
  FW:{name:"공격수",subs:[["ST","스트라이커"],["LW","왼쪽 윙어"],["RW","오른쪽 윙어"]],
      stats:[["finishing","마무리"],["dribble","볼 다루기"],["pace","질주력"],["physical","버티는 힘"],["composure","담력"],["passing","측면 창의력"]],w:[.30,.17,.17,.15,.15,.06],
      wSub:{LW:[.20,.20,.20,.06,.10,.24],RW:[.20,.20,.20,.06,.10,.24],LWi:[.28,.20,.20,.06,.10,.16],RWi:[.28,.20,.20,.06,.10,.16]}},   // Wi: 반대발 윙어(인버티드)는 크로스보다 슈팅이 더 중요해요   // 윙어는 크로스·패스가 중요해요(결정력·피지컬 비중 ↓)
  MF:{name:"미드필더",subs:[["CM","중앙 미드필더"],["AM","공격형 미드필더"],["DM","수비형 미드필더"]],
      stats:[["passing","연결 패스"],["vision","공간 읽기"],["dribble","볼 다루기"],["stamina","지구력"],["defending","수비 감각"]],w:[.25,.20,.20,.20,.15],
      wSub:{AM:[.22,.24,.26,.20,.08],DM:[.22,.16,.08,.24,.30]}},
  DF:{name:"수비수",subs:[["CB","센터백"],["LB","왼쪽 풀백"],["RB","오른쪽 풀백"]],
      stats:[["defending","수비 감각"],["tackle","대인 압박"],["physical","버티는 힘"],["pace","질주력"],["building","후방 전개"]],w:[.30,.25,.20,.15,.10],
      wSub:{CB:[.34,.28,.22,.06,.10],LB:[.22,.20,.14,.24,.20],RB:[.22,.20,.14,.24,.20]}},
  GK:{name:"골키퍼",subs:[["GK","골키퍼"]],
      stats:[["saving","선방"],["reflex","순발력"],["handling","안정 캐칭"],["kicking","발밑 킥"],["command","라인 통솔"]],w:[.30,.25,.20,.10,.15]},
};
const TYPES={
  FW:[["finisher","골잡이형",[6,-2,0,0,3,-3],"박스 안에서 득점을 만드는 타입"],["dribbler","돌파형",[-2,6,4,-3,0,1],"빠른 발과 드리블로 수비를 벗기는 타입"],["target","타깃형",[3,-4,-3,7,2,-2],"몸싸움과 제공권으로 버티는 타입"],["crosser","크로스형",[-3,3,3,-3,0,8],"측면에서 크로스와 패스로 기회를 만드는 타입(윙어에 어울려요)"]],
  MF:[["playmaker","플레이메이커형",[6,5,0,-2,-3],"패스와 시야로 경기를 조율하는 타입"],["box","박스 투 박스형",[0,0,1,7,2],"활동량으로 공수를 오가는 타입"],["destroyer","수비형 미드필더형",[-1,-2,-3,3,7],"공을 따내고 지켜 주는 타입"]],
  DF:[["stopper","스토퍼형",[5,3,3,-3,-4],"강한 대인 수비로 막는 타입"],["builder","빌드업형",[-1,-2,-1,0,8],"후방에서 패스로 공격을 만드는 타입"],["runner","오버래핑 풀백형",[-3,-2,0,8,3],"측면을 오르내리는 타입"]],
  GK:[["shotstopper","선방형",[6,5,0,-4,-2],"반사신경으로 막아내는 타입"],["sweeper","스위퍼 키퍼형",[-1,0,-1,6,4],"발밑과 위치 선정이 좋은 타입"],["commander","지휘형",[0,-2,3,0,7],"수비를 조율하는 타입"]],
};
const STATE_VER=3;
const BORN=2008, YOUTH_END=18, PRO_START=19, UNIV_END=22, UNIV_DRAFT=23;
/* 옛 저장 데이터 보정: 공격수에게 새로 생긴 '크로스·패스' 능력치를 채워요 */
L.migrate=function(S){ try{ if(L.healSave) L.healSave(S);  const p=S&&S.p; if(p&&p.pos==="FW"&&p.stats&&p.stats.passing==null){ p.stats.passing=clamp(Math.round(((p.stats.dribble||50)+(p.stats.composure||50))/2-6),10,95); p.ovr=ovrOf(p); p.peak=Math.max(p.peak||0,p.ovr); } }catch(e){} return S; };
const wingInv=p=>(p.sub==="LW"&&p.foot==="오른발")||(p.sub==="RW"&&p.foot==="왼발");
const ovrOf=p=>{ const d=POSDEF[p.pos], w=(d.wSub&&((wingInv(p)&&d.wSub[p.sub+"i"])||d.wSub[p.sub]))||d.w; return Math.round(d.stats.reduce((s,[k],i)=>s+(p.stats[k]!=null?p.stats[k]:50)*w[i],0)); };
const age=S=>S.year-S.p.born;
const PHYS=new Set(["pace","stamina","physical"]);
Object.assign(L,{POSDEF,TYPES,STATE_VER,BORN,YOUTH_END,PRO_START,UNIV_END,UNIV_DRAFT,ovrOf,age,PHYS});

/* ===== 성장 특성 =====
 * 고를 수 있는 특성(visible)과 스카우터가 첫 시즌 뒤에 밝혀내는 숨은 특성(hidden)이 있어요.
 * grow: 성장폭 배수(양수일 때) · shift: 나이 곡선 이동(+면 일찍 크고 일찍 꺾임) · focus: 집중훈련 효과 배수 · inj: 부상 배수
 * fame: 인기 배수 · vari: 해마다 성장 들쭉날쭉 정도 · big: 큰 경기(대표팀·컵) 보정 · trust: 감독 신뢰 증가 배수 · decl: 노화 속도 배수 */
const TRAIT_ALL=[
 /* ---- 성장 ---- */
 {id:"effort",cat:"성장",name:"노력의 천재",icon:"🔥",desc:"집중 훈련한 능력치가 70% 더 크게 올라요. 시작은 평범하고 성장 기복이 작아요.",eff:"훈련 능력치 ▲▲ · 기복 ▼",fx:{focus:1.7,grow:1.0,vari:.8}},
 {id:"genius",cat:"성장",name:"천재",icon:"✨",desc:"어릴 때 기술 능력치가 폭발적으로 올라요. 대신 일찍 정점에 닿고, 체력 능력치는 일찍 꺾여요.",eff:"기술 ▲▲ · 체력 ▼ · 일찍 정점",fx:{grow:1.2,shift:1.5,decl:1.1,tech:.5,phys:-.2}},
 {id:"late",cat:"성장",name:"대기만성",icon:"🌱",desc:"어릴 땐 느리지만 20대 중반부터 진가가 나와요. 체력 능력치가 오래 유지돼요.",eff:"후반 성장 ▲ · 체력 유지 ▲ · 초반 ▼",fx:{shift:-2,decl:.8,tech:.15,phys:.25}},
 {id:"grinder",cat:"성장",name:"훈련 벌레",icon:"⛏️",desc:"훈련 효율이 좋아요. 트레이너 비용이 25% 줄고, 집중 훈련 성공 확률이 +12%p(끈기 2포인트 효과) 올라요. 돈이 모자란 초반에 큰 힘이 돼요.",eff:"훈련 비용 ▼ · 성공 확률 ▲",fx:{learn:.75,grit:2}},
 {id:"steady",cat:"성장",name:"꾸준한 성실파",icon:"📈",desc:"성장은 평범해도 해마다 기복이 거의 없어요.",eff:"기복 ▼▼",fx:{vari:.4,grow:1.05}},
 {id:"streaky",cat:"성장",name:"기복형 승부사",icon:"🎲",desc:"잘 풀리면 크게 자라고, 안 풀리면 정체돼요. 해마다 결과가 들쭉날쭉해요.",eff:"기복 ▲▲",fx:{vari:1.9,grow:1.05}},
 /* ---- 경기 ---- */
 {id:"joker",cat:"경기",name:"조커",icon:"🃏",desc:"교체로 나와도 흐름을 바꿔요. 벤치에서 투입될 때 골 확률이 60% 올라가고 평점도 좋아요. 주전 경쟁이 치열한 팀에서 빛나요.",eff:"교체 투입 골 ▲▲ · 벤치에서도 활약",fx:{joker:1.6,sr:.03}},
 {id:"setpiece",cat:"경기",name:"세트피스 장인",icon:"🎯",desc:"프리킥·코너킥·페널티가 날카로워요. 포지션과 상관없이 골 +12%, 도움 +8%. 수비수는 골이 25% 더 늘어요.",eff:"골·도움 ▲ (포지션 불문)",fx:{setp:1.12}},
 {id:"iq",cat:"경기",name:"경기 지능",icon:"🧠",desc:"움직임이 영리해요. 출전 비중 +5%p, 도움 +12%, 나이가 들어도 천천히 쇠퇴해요.",eff:"출전 ▲ · 도움 ▲ · 노화 ▼",fx:{sr:.05,assist:1.12,decl:.85}},
 {id:"clutch",cat:"경기",name:"큰 경기 체질",icon:"🎯",desc:"대표팀·컵·결승·유럽컵 같은 큰 무대에서 훨씬 강해요(+40%). 월드컵·유럽컵 우승에 도전하기 좋아요.",eff:"큰 경기 ▲▲",fx:{big:1.4}},
 {id:"allround",cat:"경기",name:"만능 일꾼",icon:"🧩",desc:"어떤 전술에도 녹아들어요. 감독 전술과 역할이 어긋나도 불이익이 없고, 포지션·역할 변경 성공 확률이 +15%p예요.",eff:"전술 궁합 걱정 없음 · 변신 성공 ▲",fx:{util:1}},
 /* ---- 몸·마음 ---- */
 {id:"iron",cat:"몸·마음",name:"강철 체력",icon:"🛡️",desc:"피지컬·스피드·활동량이 잘 늘고 늦게까지 유지돼요. 부상이 절반으로 줄어요.",eff:"체력 ▲▲ · 부상 ▼",fx:{inj:.5,decl:.8,phys:.35}},
 {id:"healer",cat:"몸·마음",name:"회복 체질",icon:"🩹",desc:"다쳐도 빨리 돌아와요. 결장 기간이 40% 줄어요.",eff:"부상 결장 ▼▼",fx:{heal:.6}},
 {id:"ironmind",cat:"몸·마음",name:"강철 멘탈",icon:"🧱",desc:"슬럼프가 없어요. 사기가 45 아래로 안 내려가고, 이벤트 모험 성공 확률이 +5%p예요.",eff:"사기 하한 · 이벤트 성공 ▲",fx:{mind:1}},
 {id:"longevity",cat:"몸·마음",name:"장수 DNA",icon:"🧬",desc:"30대 중반까지 전성기가 이어져요. 노화 속도가 40% 줄고 부상도 조금 줄어요.",eff:"노화 ▼▼ · 롱런",fx:{decl:.6,inj:.9}},
 /* ---- 커리어 ---- */
 {id:"moneyking",cat:"커리어",name:"재테크 천재",icon:"💰",desc:"투자 수익률이 40% 높고 실패 위험이 줄어요. 광고 계약금도 +25%. 돈을 굴리는 재미가 커요.",eff:"투자 ▲▲ · 광고 ▲",fx:{invest:1.4,endorse:1.25}},
 {id:"adapt",cat:"커리어",name:"적응왕",icon:"🌍",desc:"어느 리그, 어느 나라에 가도 금방 자리 잡아요. 이적 직후 신뢰가 높고(0.50), 해외 연봉 제안이 +8%예요. 향수병·언어 이벤트는 안 나와요.",eff:"해외 이적 ▲ · 이적 적응 ▲",fx:{adapt:1}},
 {id:"star",cat:"커리어",name:"스타 기질",icon:"⭐",desc:"인기와 평판이 빠르게 올라요(+50%). 광고 계약금도 +40%예요. 광고 슬롯 +1, 재계약 연봉 +6%, 부진해도 인기가 덜 떨어지고, 스타 전용 이벤트가 나와요. 유소년 때부터 지역 후원금이 들어오고(트레이너·재능 개발에 투자), 드래프트 지명 확률이 +8%p예요. 능력치에는 영향이 없어요.",eff:"인기·평판 ▲ · 광고 ▲▲",fx:{fame:1.5,endorse:1.4}},
 /* ---- 팀 ---- */
 {id:"winner",cat:"팀",name:"우승 청부사",icon:"🏆",desc:"이 선수가 있으면 팀이 더 잘 이겨요. 팀 전력이 +1.2 올라서 리그·컵·유럽컵 성적이 좋아지고, 큰 경기도 조금 강해요.",eff:"팀 전력 ▲ · 우승 확률 ▲",fx:{winner:1.2,big:1.1}},
 {id:"leader",cat:"팀",name:"리더형",icon:"🧭",desc:"감독의 신뢰가 빨리 쌓이고(+70%) 팀 분위기를 끌어 팀 전력이 +0.5 올라요.",eff:"감독 신뢰 ▲ · 팀 전력 ▲",fx:{trust:1.7,winner:.5}},
];
/* 선택 가능한 6가지 — 서로 노리는 방향이 달라요 (성장·재능·롱런·인기와 돈·팀 성적·안정적인 출전) */
const PICK=["effort","genius","iron","star","winner","allround"];
const SIX={
 effort:{cat:"성장형",desc:"훈련하는 만큼 크는 타입이에요. 집중 훈련한 능력치가 80% 더 오르고 훈련 성공 확률도 조금 높아요. 시작은 평범하지만 훈련 설정을 잘 고르면 가장 크게 자라요.",eff:"집중 훈련 ▲▲ · 기복 ▼ · 꾸준한 성장",fx:{focus:1.8,grow:1.0,vari:.75,grit:2}},
 genius:{cat:"재능형",desc:"어릴 때 기술이 폭발적으로 올라요. 10대~20대 초반에 가장 빠르게 크지만 일찍 정점에 닿고, 체력 능력치는 일찍 꺾여요. 짧고 굵게 빛나는 타입이에요.",eff:"기술 ▲▲▲ · 초반 급성장 · 체력 ▼ · 일찍 쇠퇴",fx:{grow:1.2,shift:1.5,decl:1.15,tech:.5,phys:-.25}},
 iron:{cat:"롱런형",desc:"몸이 튼튼하고 오래가요. 부상이 절반으로 줄고 다쳐도 빨리 돌아오며, 노화가 20% 느려서 30대 중반까지 전성기를 이어 가요. 대신 성장 폭 자체는 평범해요.",eff:"부상 ▼▼ · 회복 ▲ · 노화 ▼ · 롱런",fx:{inj:.5,decl:.78,phys:.25,heal:.75}},
 star:{cat:"인기형",desc:"인기와 평판이 60% 빨리 오르고 광고 계약금도 60% 높아요. 구단이 마케팅 가치 때문에 자주 기용해서 출전 기회도 조금 더 얻고, 이적 시장의 시선과 황금공·MVP 득표에도 유리해요. 능력치는 평범하지만 돈과 명성으로 앞서 나가는 타입이에요.",eff:"인기·평판 ▲▲▲ · 광고 ▲▲▲ · 슬롯 +1 · 연봉 +6% · 인기 하락 절반 · 스타 전용 이벤트",fx:{fame:1.6,endorse:1.6,sr:.05}},
 winner:{cat:"팀 성적형",desc:"이 선수가 있으면 팀이 이겨요. 팀 전력이 +1.3 오르고 큰 경기(대표팀·컵·결승·유럽컵)에서 35% 더 강해요. 우승 트로피와 월드컵·유럽컵 도전에 가장 유리해요.",eff:"팀 전력 ▲▲ · 큰 경기 ▲▲ · 우승 확률 ▲",fx:{winner:1.3,big:1.35}},
 allround:{cat:"안정형",desc:"어떤 감독, 어떤 팀에서도 자리를 잡아요. 출전 비중이 +5%p, 감독 전술과 역할이 어긋나도 불이익이 없고, 포지션·역할 변경 성공이 쉬워요. 해외 이적 적응도 빨라요.",eff:"출전 ▲ · 전술 궁합 걱정 없음 · 변신·적응 ▲",fx:{sr:.05,util:1,adapt:1,heal:.85}}
};
PICK.forEach(id=>{ const t=TRAIT_ALL.find(x=>x.id===id); if(t){ Object.assign(t,SIX[id]); } else { TRAIT_ALL.push(Object.assign({id,name:id},SIX[id])); } });
const NAMES={effort:["노력의 천재","🔥"],genius:["천재","✨"],iron:["강철 체력","🛡️"],star:["스타 기질","⭐"],winner:["우승 청부사","🏆"],allround:["만능 일꾼","🧩"]};
PICK.forEach(id=>{ const t=TRAIT_ALL.find(x=>x.id===id); t.name=NAMES[id][0]; t.icon=NAMES[id][1]; });
const TRAIT_LIST=PICK.map(id=>TRAIT_ALL.find(x=>x.id===id)); L.TRAIT_ALL=TRAIT_ALL;
const HIDDEN_LIST=[
 {id:"mega",name:"대천재",icon:"👑",desc:"백 년에 한 번 나올 재능. 잠재력이 크게 올라가고 모든 능력치가 빨리 커요.",fx:{grow:1.35,potAdd:7,tech:.3,phys:.3},p:.02},
 {id:"monster",name:"늦게 터지는 괴물",icon:"🐉",desc:"한동안 평범해 보이지만 20대에 폭발해요. 체력도 오래 유지돼요.",fx:{shift:-3,grow:1.25,potAdd:5,tech:.3,phys:.3},p:.02},
 {id:"ironman",name:"철인",icon:"🦾",desc:"부상이 거의 없고 30대 중반까지 체력 능력치를 유지해요.",fx:{inj:.3,decl:.55,phys:.5},p:.02},
 {id:"glass",name:"유리 대포",icon:"💥",desc:"재능은 넘치지만 몸이 따라 주지 않아요. 기술은 쑥쑥 크지만 체력은 약하고 부상이 잦아요.",fx:{inj:2.2,grow:1.2,potAdd:4,tech:.2,phys:-.3},p:.02},

 {id:"longevity",name:"장수 DNA",icon:"🧬",desc:"30대 중반까지 전성기가 이어져요. 노화 속도가 40% 줄고 부상도 조금 줄어요. 일찍 지는 천재형과 만나면 '천재인데 오래가는' 선수가 돼요.",fx:{decl:.6,inj:.9},p:.035},
 {id:"healer",name:"회복 체질",icon:"🩹",desc:"다쳐도 빨리 돌아와요. 결장 기간이 40% 줄어요.",fx:{heal:.6},p:.03},
 {id:"joker",name:"조커 체질",icon:"🃏",desc:"교체로 나와도 흐름을 바꿔요. 벤치에서 투입될 때 골 확률이 60% 올라가요.",fx:{joker:1.6,sr:.03},p:.03},
 {id:"setpiece",name:"세트피스 장인",icon:"🎯",desc:"프리킥·코너킥·페널티가 날카로워요. 골 +12%, 도움 +8%, 수비수는 골이 더 늘어요.",fx:{setp:1.12},p:.03},
 {id:"iq",name:"경기 지능",icon:"🧠",desc:"움직임이 영리해요. 출전 비중 +5%p, 도움 +12%, 나이가 들어도 천천히 쇠퇴해요.",fx:{sr:.05,assist:1.12,decl:.85},p:.03},
 {id:"moneyking",name:"재테크 천재",icon:"💰",desc:"투자 수익률이 40% 높고 광고 계약금이 25% 올라요.",fx:{invest:1.4,endorse:1.25},p:.03},
 {id:"adapt",name:"적응왕",icon:"🌍",desc:"어느 리그에 가도 금방 자리 잡아요. 이적 직후 신뢰가 높고 해외 연봉 제안이 +8%예요.",fx:{adapt:1},p:.03},
 {id:"ironmind",name:"강철 멘탈",icon:"🧱",desc:"슬럼프가 없어요. 사기가 45 아래로 안 내려가고 이벤트 모험 성공 확률이 +5%p예요.",fx:{mind:1},p:.03},
 {id:"grinder",name:"훈련 벌레",icon:"⛏️",desc:"훈련 효율이 좋아요. 트레이너 비용 −25%, 집중 훈련 성공 확률 +12%p.",fx:{learn:.75,grit:2},p:.03},
 {id:"captain",name:"주장감",icon:"🧭",desc:"감독의 신뢰가 빨리 쌓이고(+70%) 팀 분위기를 끌어 팀 전력이 +0.5 올라요.",fx:{trust:1.7,winner:.5},p:.03},
 {id:"bigstage",name:"큰 경기 체질",icon:"🏟️",desc:"대표팀·컵·결승·유럽컵 같은 큰 무대에서 40% 더 강해요.",fx:{big:1.4},p:.025}
];
L.TRAIT_LIST=TRAIT_LIST; L.HIDDEN_LIST=HIDDEN_LIST;
L.traitFx=function(p){
  const out={grow:1,shift:0,focus:1,inj:1,fame:1,vari:1,big:1,trust:1,decl:1,potAdd:0,tech:0,phys:0,joker:1,setp:1,heal:1,learn:1,invest:1,endorse:1,assist:1,winner:0,grit:0,mind:0,util:0,adapt:0,sr:0};
  const mul=["grow","focus","inj","fame","vari","big","trust","decl","joker","setp","heal","learn","invest","endorse","assist"], add=["shift","potAdd","tech","phys","winner","grit","mind","util","adapt","sr"];
  [TRAIT_ALL.find(t=>t.id===p.trait),HIDDEN_LIST.find(t=>t.id===p.hidden)].forEach(t=>{ if(!t) return; const f=t.fx; mul.forEach(k=>{ if(f[k]!=null) out[k]*=f[k]; }); add.forEach(k=>{ if(f[k]) out[k]+=f[k]; }); });
  return out;
};
L.traitName=function(id,hidden){ const t=(hidden?HIDDEN_LIST:TRAIT_ALL).find(x=>x.id===id); return t?t.icon+" "+t.name:""; };
const HID_SYN={genius:{longevity:2.5,healer:1.6},effort:{iq:2,grinder:1.5,ironmind:1.5},iron:{healer:1.5,ironmind:1.5},star:{moneyking:2.2,bigstage:1.6,adapt:1.5},winner:{captain:2,bigstage:2,ironmind:1.5},allround:{adapt:2,iq:1.8,joker:1.6}};
L.rollHidden=function(mult,trait){ mult=mult||1; const syn=HID_SYN[trait]||{}; const RARE=["mega","monster","ironman","glass"]; const ws=HIDDEN_LIST.map(h=>RARE.includes(h.id)?h.p*mult*(syn[h.id]||1):h.p*.55*(1+(mult-1)*.4)*(syn[h.id]||1)); let r=Math.random()*1; for(let i=0;i<HIDDEN_LIST.length;i++){ r-=ws[i]; if(r<0) return HIDDEN_LIST[i].id; } return null; };

/* ===== 가정 환경과 성장 투자 =====
 * 어린 시절(유소년·대학)에는 부모의 재정 수준에 따라 해마다 '지원 포인트'가 나와요. 이 포인트를 개인 레슨·피지컬 트레이닝·영양·회복·멘탈·해외 캠프에 나눠 투자해요.
 * 많이 투자하면 성장이 빨라지고, 해외 캠프는 큰 폭으로 크는(또는 무리하는) 극단적인 결과 확률을 키워요. 가정 형편은 이벤트로 바뀔 수 있어요. */
const FAMILY=[{id:"rich",name:"재력가 집안",w:.07,pts:12,funds:2,start:2.2,allow:.9,note:"용돈이 넉넉하고 해외 캠프까지 보내 줄 수 있어요"},{id:"upper",name:"넉넉한 집안",w:.2,pts:9,funds:1,start:.8,allow:.42,note:"용돈을 넉넉히 받아 원하는 레슨은 대부분 받을 수 있어요"},
 {id:"mid",name:"평범한 집안",w:.4,pts:7,funds:.5,start:.3,allow:.2,note:"필요한 곳에 골라서 투자해야 해요"},{id:"tight",name:"빠듯한 집안",w:.22,pts:5,funds:.2,start:.12,allow:.09,note:"부모님이 허리띠를 졸라매고 뒷바라지해요"},{id:"poor",name:"어려운 집안",w:.11,pts:3,funds:.05,start:.04,allow:.03,note:"용돈은 거의 없어요. 가진 건 재능과 노력뿐이에요"}];
const INV_CATS=[["skill","개인 레슨","기술 능력치 ▲"],["body","피지컬 트레이닝","체력 능력치 ▲"],["care","영양·회복","부상 ↓ 컨디션 ↑"],["mind","멘탈·학업","기복 ↓ 사기 ↑"],["camp","해외 캠프","대박(각성)·과열 위험 ↑"]];
L.FAMILY=FAMILY; L.INV_CATS=INV_CATS;
/* 가정 지원 투자: 포인트 1개당 효과(장점·단점)를 한 곳에 모아 둬요. 실제 계산은 train/engine 이 같은 숫자를 써요. */
L.INV_INFO={
 skill:{icon:"🎯",pro:"기술 능력치(드리블·패스·마무리 등)가 구간마다 +0.22씩 더 올라요",con:"체력 능력치에는 효과가 없어요",total:n=>"기술 능력치 구간 성장 +"+(n*.22).toFixed(2)},
 body :{icon:"💪",pro:"체력 능력치(질주력·버티는 힘 등)가 구간마다 +0.22씩 더 올라요",con:"기술 능력치에는 효과가 없어요",total:n=>"체력 능력치 구간 성장 +"+(n*.22).toFixed(2)},
 care :{icon:"🥗",pro:"부상 위험 −10%, 구간 끝 컨디션 +1.5 회복",con:"능력치가 직접 오르진 않아요",total:n=>"부상 위험 −"+(n*10)+"% · 구간마다 컨디션 +"+(n*1.5)},
 mind :{icon:"🧠",pro:"성장 기복 −12%(꾸준해져요), 구간마다 사기 +1",con:"기복이 줄어서 '대박' 성장도 함께 줄어요",total:n=>"기복 −"+(n*12)+"% · 구간마다 사기 +"+n},
 camp :{icon:"✈️",pro:"각성 확률 +3.5%(전 능력치 +1~3, 잠재력 +2~5), 성장 기복 +16%",con:"무리 확률 +2%(전 능력치 −1, 사기 −15)",total:n=>"각성 "+(n*3.5).toFixed(1)+"% vs 무리 "+(n*2)+"% · 기복 +"+(n*16)+"%"}
};
L.rollFamily=function(bias){ bias=bias||0; const ws=FAMILY.map((f,i)=>f.w*Math.exp(bias*.45*(2-i)/2)); const tot=ws.reduce((a,b)=>a+b,0); let r=Math.random()*tot; for(let i=0;i<FAMILY.length;i++){ r-=ws[i]; if(r<0) return FAMILY[i]; } return FAMILY[2]; };
L.familyPts=S=>S.family&&(S.stage==="youth"||S.stage==="univ")?Math.max(0,S.family.pts):0;
/* ===== 체격 효과 =====
 * 키와 몸무게는 포지션 평균(공격수 180·미드필더 177·수비수 183·골키퍼 188cm)과 비교해서 시작 능력치에 반영돼요.
 * 크고 무거울수록 피지컬·수비·제공권이 유리하고 스피드·민첩성(드리블)이 불리해요. 작고 가벼우면 반대예요. */
const POS_AVG={FW:[180,73],MF:[177,70],DF:[183,77],GK:[188,82]};
L.bodyFx=function(pos,h,w){
  const av=POS_AVG[pos]; h=h||av[0]; w=w||av[1];
  /* 키: 포지션 평균과의 차이(6cm=1단계). 근육량: 그 키에서 BMI 22.5 체중과의 차이(4kg=1단계) — 키만 크고 마른 선수와 키도 크고 단단한 선수가 확실히 달라져요 */
  const tall=clamp((h-av[0])/6,-5,5), ideal=22.5*Math.pow(h/100,2), mass=clamp((w-ideal)/4,-4,4), bmi=w/Math.pow(h/100,2);
  const o={}; const add=(k,v)=>{ o[k]=(o[k]||0)+v; };
  const d=POSDEF[pos]; const mp=mass<0?mass*1.4:mass;   // 마른 쪽 불이익을 더 크게(근육이 모자라면 몸싸움에서 확실히 밀려요)
  d.stats.forEach(([k])=>{
    if(k==="physical") add(k,2.2*tall+3.2*mp);
    else if(k==="tackle"||k==="defending") add(k,1.8*tall+1.8*mp);
    else if(k==="pace") add(k,-1.2*tall-1.0*mass);
    else if(k==="dribble") add(k,-1.2*tall-.7*mass);
    else if(k==="stamina") add(k,-.6*mass);
    else if(k==="saving"||k==="handling"||k==="command") add(k,2.4*tall+.6*mass);
    else if(k==="reflex") add(k,-1.6*tall-.6*mass);
    else if(k==="finishing"&&pos==="FW") add(k,.5*tall+.4*mass);
  });
  const res={}; Object.keys(o).forEach(k=>{ const v=Math.round(clamp(o[k],-16,16)); if(v) res[k]=v; });
  return {stats:res,tall:Math.round(tall*10)/10,mass:Math.round(mass*10)/10,bmi:Math.round(bmi*10)/10,type:L.bodyType(tall,mass,pos)};
};
/* 체격 유형: 키(장신·보통·단신)와 근육량(단단함·보통·마름)으로 이름과 장단점을 붙여요 */
L.bodyType=function(tall,mass,pos){
  const T=tall>=1.3?"L":tall<=-1.3?"S":"M", B=mass>=1.2?"H":mass<=-1.2?"T":"M";
  const t={
   LH:["💪","탱크형 장신","버티는 힘·제공권이 아주 좋지만 질주력·민첩성은 떨어지고, 큰 몸이라 무릎·허벅지 부상이 조금 늘어요."],
   LM:["🗼","균형 잡힌 장신","높이와 힘을 고루 갖췄어요. 스피드와 드리블은 조금 떨어져요."],
   LT:["🥢","멸치형 장신","키는 큰데 몸이 가늘어서 몸싸움에 잘 밀려요. 대신 움직임이 가볍지만, 근육량이 부족해 부상이 늘어요. 근력 훈련이 필요해요."],
   MH:["🦾","근육형","힘과 수비 몸싸움이 좋고 속도는 조금 느려요."],
   MM:["⚖️","표준 체격","특별한 장단점이 없어요."],
   MT:["🪶","마른 체형","가볍고 날렵하지만 몸싸움에 약하고 부상이 조금 늘어요."],
   SH:["🧱","단단한 단신","낮은 무게중심으로 몸싸움은 버티지만 높이 싸움은 약해요."],
   SM:["🧢","작은 체격","높이는 불리하지만 민첩해요."],
   ST:["🐇","가벼운 단신","민첩성·드리블이 좋지만 몸싸움과 제공권은 크게 불리해요."]}[T+B];
  return {icon:t[0],name:t[1],desc:t[2],tall,mass};
};
/* 근육량이 모자라거나(마름) 몸이 너무 크면(벌크) 부상 위험이 조금 커져요 */
L.bodyInjMul=function(S){ try{ const p=S.p; const f=L.bodyFx(p.pos,p.height,p.weight); const m=f.mass; return 1+(m<0?.07*Math.min(3,-m):0)+(m>2?.03*Math.min(2,m-2):0); }catch(e){ return 1; } };
L.bodyText=function(pos,h,w){
  const fx=L.bodyFx(pos,h,w), d=POSDEF[pos]; const nm=Object.fromEntries(d.stats);
  const ent=Object.entries(fx.stats); const ty=fx.type;
  return ty.icon+" "+ty.name+" — "+(ent.length?ent.map(([k,v])=>nm[k]+" "+(v>0?"+":"")+v).join(" · "):"능력치 변화 없음")+". "+ty.desc;
};
L.rollTalent=function(){ const x=Math.random(), pot=x<.05?ri(90,97):x<.22?ri(82,89):x<.55?ri(74,81):ri(64,73); return {pot,grade:pot>=90?"S":pot>=82?"A":pot>=74?"B":"C"}; };

/* 나이별 성장(한 해 평균 상승): 어릴 때 크게, 20대 중반에 정점, 30대에 완만히 하락 */
const AGE_RATE={13:3.0,14:3.0,15:3.0,16:3.0,17:3.2,18:3.2,19:3.0,20:2.7,21:2.3,22:1.9,23:1.5,24:1.1,25:.7,26:.4,27:.1,28:-.1,29:-.4,30:-.8,31:-1.3,32:-1.8,33:-2.3,34:-2.8,35:-3.3,36:-3.8};
const ageRate=(ag,pos)=>{ const sh=pos==="GK"?3:pos==="DF"?1:0; const a=Math.round(clamp(ag-sh,13,36)); return AGE_RATE[a]!=null?AGE_RATE[a]:-4; };
L.ageRate=ageRate;

/* ================= 생성 ================= */
L.create=function(o){
  const pts0=o.points||{}, t00=o.talent||L.rollTalent(), pos=o.pos, d=POSDEF[pos]; const t0=Object.assign({},t00,{pot:clamp(t00.pot+((pts0.talent|0)-2)*2,55,99)}); const hid=o.hidden!==undefined?o.hidden:L.rollHidden(1+(pts0.talent|0)*.25,o.trait); const hfx=hid?HIDDEN_LIST.find(h=>h.id===hid).fx:{}; const t=Object.assign({},t0,{pot:Math.min(99,t0.pot+(hfx.potAdd||0))}); t.grade=t.pot>=90?"S":t.pot>=82?"A":t.pot>=74?"B":"C";
  const ty=TYPES[pos].find(x=>x[0]===o.type)||TYPES[pos][0];
  const a0=o.route==="mid"?13:o.route==="hs"?16:o.route==="univ"?UNIV_DRAFT:PRO_START;
  const target19=42+(t.pot-60)*.30;                                   // 19세 시점 능력 (재능이 높을수록 높아요)
  const base=Math.max(16,target19-(a0<PRO_START?(PRO_START-a0)*3.1:0)+(a0>PRO_START?(a0-PRO_START)*2.4:0)+rnd(-2,2));
  const HH=o.height||Math.round(POS_AVG[pos][0]+rnd(-6,6)), WW=o.weight||Math.round(POS_AVG[pos][1]+rnd(-6,6)); const bfx=L.bodyFx(pos,HH,WW).stats; const stats={}; d.stats.forEach(([k],i)=>{ stats[k]=clamp(Math.round(base+ty[2][i]+rnd(-3,3)+(bfx[k]||0)),10,95); });
  const S={v:STATE_VER,verStart:(window.KL_VER?window.KL_VER("선수판"):null),startYear:BORN+a0,startAge:a0,points:Object.assign({talent:0,family:0,mentor:0,grit:0,health:0},pts0),year:BORN+a0,
    p:{name:o.name||"이름 없는 선수",pos,sub:o.sub||d.subs[0][0],type:ty[0],typeName:ty[1],born:BORN,pot:t.pot,pot0:t.pot,grade:t.grade,stats,peak:0,route:o.route||"high",trait:o.trait||null,hidden:hid||null,scoutBias:Math.round(rnd(-5,5)*10)/10,res:{},
       height:HH,weight:WW,foot:o.foot||"오른발",number:o.number||(pos==="GK"?1:pick([7,8,9,10,11,14,17,19,20,22]))},
    club:null,salary:0,contractYears:0,trust:.4,military:"none",mildone:0,team:"1군",stage:a0<PRO_START?"youth":"pro",youthTier:0,
    phase:a0<PRO_START?"prep":"draft",offers:[],plan:null,history:[],awards:[],trophies:[],moments:[],feed:[],incentives:[],
    career:{apps:0,starts:0,minutes:0,goals:0,assists:0,cs:0,caps:0,intGoals:0,ratingSum:0,ratingN:0,mom:0,youthApps:0,youthGoals:0,bonus:0},
    drift:{},league:{k1:null,k2:null},rep:50,fame:3,char:50,cond:90,morale:70,funds:.1,sim:null,lastR:null,nat:{},ballon:[],clubYears:{},foreignYears:0,retired:false};
  { const rs=L.rolesOf?L.rolesOf(S.p.sub):[]; const pref={finisher:"poacher",target:"target",dribbler:"inside",playmaker:"maker",box:"b2b",destroyer:"anchor",stopper:"stopper",builder:"ballplay",runner:"overlap",shotstopper:"line",sweeper:"sweeper",commander:"line"}[S.p.type]; S.p.role=o.role||((rs.find(r=>r[0]===pref)||rs[0]||[])[0])||null; if(L.applyStyle) L.applyStyle(S.p); S.styleLog=[{year:S.year,age:a0,text:(L.POSDEF[pos].subs.find(s=>s[0]===S.p.sub)||[0,S.p.sub])[1]+" · "+(L.roleName?L.roleName(S.p):"")+" · "+S.p.foot+" · "+S.p.height+"cm "+S.p.weight+"kg 로 시작"}]; }
  S.p.ovr=ovrOf(S.p); S.p.peak=S.p.ovr;
  L.initLeague(S);
  { const f=L.rollFamily(pts0.family|0); S.family={id:f.id,name:f.name,pts:f.pts,pts0:f.pts,note:f.note,allow:f.allow}; S.funds=r1(f.start!=null?f.start:.1+f.funds*.1); }
  if(a0<PRO_START) L.assignYouthClub(S);
  return S;
};

/* 몸값(이적 가치, 억 원): 연봉과 다른 개념이에요. 능력치·나이·소속 리그 수준으로 정해요. 군 복무 중에도 선수 가치는 그대로 평가돼요 */
L.marketValue=function(S){
  const ag=age(S), p=S.p; const ageF=ag<=19?1.25:ag<=23?1.3:ag<=27?1.1:ag<=30?.8:ag<=33?.45:.2;
  const lg=S.club&&S.club.lg; const lgF=FL[lg]?FL[lg].mv:lg==="K2"?.8:lg==="K3"?.45:lg==="K4"?.25:lg==="YOUTH"||lg==="UNIV"?.3:1;
  return Math.max(.1,r1(1.2*Math.exp((p.ovr-60)/6.2)*ageF*lgF*clamp(.6+S.rep/150,.6,1.3)*(S.valueBoost||1)));
};
L.pushValue=function(S){ (S.valueHist=S.valueHist||[]).push({year:S.year,age:age(S),club:S.club?S.club.name:"",lg:S.club?S.club.lg:"",val:L.marketValue(S),ovr:S.p.ovr,mil:S.military==="sangmu"||S.military==="serving"}); };
/* ================= 세대 계승 =================
 * 은퇴한 선수의 자녀로 새 인생을 시작해요. 부모의 전성기 능력이 재능의 바탕이 되고, 같은 포지션이면 안정적이지만
 * 다른 포지션을 고르면 부모보다 훨씬 좋은 재능을 받을 수도, 덜 좋은 재능을 받을 수도 있어요. 집안 형편은 부모의 커리어 점수로 정해져요. */
L.childTalent=function(S,pos){
  const P=S.p.peak, same=pos===S.p.pos; const base=58+(P-58)*.5;
  const spread=same?9:17; const pot=clamp(Math.round(base+(Math.random()+Math.random()-1)*spread+(same?2:0)),55,97);
  return {pot,grade:pot>=90?"S":pot>=82?"A":pot>=74?"B":"C",same,base:Math.round(base),spread};
};
L.childFamily=function(S){
  const sc=L.legacy(S).total; const id=sc>=2800?"rich":sc>=1900?"upper":sc>=1200?"mid":sc>=700?"tight":"poor"; return FAMILY.find(f=>f.id===id);
};
L.createChild=function(S,o){
  const tal=o.kid?{pot:o.kid.pot,grade:o.kid.grade,same:o.pos===S.p.pos,base:Math.round(58+(S.p.peak-58)*.5),spread:0,kid:true}:L.childTalent(S,o.pos); const trait=Math.random()<.5?S.p.trait:o.trait; const hidden=S.p.hidden&&Math.random()<.3?S.p.hidden:L.rollHidden();
  const C=L.create({name:o.name,pos:o.pos,sub:L.POSDEF[o.pos].subs[0][0],type:L.TYPES[o.pos][Math.floor(Math.random()*3)][0],route:"mid",talent:{pot:tal.pot,grade:tal.grade},trait,hidden,foot:S.p.foot});
  const f=L.childFamily(S); C.family={id:f.id,name:f.name,pts:f.pts,pts0:f.pts,note:f.note,allow:f.allow}; C.funds=r1(f.start!=null?f.start:.1+f.funds*.1);
  if(o.kid&&L.kidApply) L.kidApply(C,o.kid,o.pos);
  C.gen=(S.gen||1)+1; C.parent={name:S.p.name,pos:S.p.pos,peak:S.p.peak,grade:L.legacyGrade(L.legacy(S).total)};
  return {state:C,talent:tal};
};
/* ================= 구단·리그 ================= */
const KDEFS=()=>K.TEAMS26.concat([K.GIMCHEON],K.K2_DEFS);
L.defById=id=>KDEFS().find(d=>d.club===id);
/* 레전드리그3(3부, 세미프로): 가상의 시민구단 14팀. l = 주전급 평균 능력치 */
const K3_DEFS=[
 {id:"k3_hanbit",name:"한빛 시민FC",short:"한빛",l:62,col:"#e8b100"},{id:"k3_sorabol",name:"서라벌 유나이티드",short:"서라벌",l:61,col:"#c0392b"},{id:"k3_nurisi",name:"누리 시티FC",short:"누리",l:60,col:"#2e86de"},
 {id:"k3_geumbit",name:"금빛 FC",short:"금빛",l:59,col:"#f1c40f"},{id:"k3_purun",name:"푸른들 FC",short:"푸른들",l:58,col:"#27ae60"},{id:"k3_haeoreum",name:"해오름 시민축구단",short:"해오름",l:58,col:"#e67e22"},
 {id:"k3_byeollae",name:"별내 어울림FC",short:"별내",l:57,col:"#8e44ad"},{id:"k3_sonamu",name:"소나무 FC",short:"소나무",l:56,col:"#16a085"},{id:"k3_mulgyeol",name:"물결 FC",short:"물결",l:55,col:"#3498db"},
 {id:"k3_ieum",name:"이음 유나이티드",short:"이음",l:54,col:"#d35400"},{id:"k3_baram",name:"바람재 FC",short:"바람재",l:53,col:"#7f8c8d"},{id:"k3_dalbit",name:"달빛 시민FC",short:"달빛",l:52,col:"#34495e"},
 {id:"k3_saebyeok",name:"새벽벌 FC",short:"새벽벌",l:51,col:"#e84393"},{id:"k3_cheongsol",name:"청솔 시티",short:"청솔",l:50,col:"#00b894"}
];
L.K3_DEFS=K3_DEFS; const K3GAP=9;
/* 레전드리그4(4부, 지역 아마추어·세미프로): 가상의 지역 구단 14팀. 3부보다 한 단계 아래라서 전력(l)은 K3보다 평균 8쯤 낮아요 */
const K4_DEFS=[
 {id:"k4_hanul",name:"한울 시민FC",short:"한울",l:48,col:"#2d98da"},{id:"k4_pureum",name:"푸름 유나이티드",short:"푸름",l:47,col:"#20bf6b"},{id:"k4_neulpum",name:"늘품 FC",short:"늘품",l:46,col:"#eb3b5a"},
 {id:"k4_dasom",name:"다솜 시티",short:"다솜",l:45,col:"#a55eea"},{id:"k4_areum",name:"아름 시민축구단",short:"아름",l:44,col:"#fa8231"},{id:"k4_haesol",name:"해솔 FC",short:"해솔",l:43,col:"#0fb9b1"},
 {id:"k4_noeul",name:"노을 유나이티드",short:"노을",l:42,col:"#e17055"},{id:"k4_saeam",name:"새암 FC",short:"새암",l:41,col:"#4b6584"},{id:"k4_boram",name:"보람 시민FC",short:"보람",l:40,col:"#f7b731"},
 {id:"k4_yeoul",name:"여울 FC",short:"여울",l:39,col:"#45aaf2"},{id:"k4_haneui",name:"하늬 시티FC",short:"하늬",l:38,col:"#26de81"},{id:"k4_narae",name:"나래 유나이티드",short:"나래",l:37,col:"#fc5c65"},
 {id:"k4_danbi",name:"단비 FC",short:"단비",l:36,col:"#778ca3"},{id:"k4_goun",name:"고운 시민축구단",short:"고운",l:35,col:"#8854d0"}
];
L.K4_DEFS=K4_DEFS; const K4GAP=8;
/* 리그 사다리: 구단은 '자기 리그의 척도'(K1·K2=0, K3=K3GAP, K4=K3GAP+K4GAP)로 전력이 정해지고, 승강하면 그 차이만큼 새 리그에서 약해지거나 강해져요 */
const TOFF={K1:0,K2:0,K3:K3GAP,K4:K3GAP+K4GAP};
const lowDef=id=>K3_DEFS.find(d=>d.id===id)||K4_DEFS.find(d=>d.id===id);
/* 옛 저장(이전 버전의 구단 이름)이 지금 구단 목록과 안 맞으면 리그·소속 구단을 다시 맞춰요 (시즌 시작·드래프트가 멈추던 문제 방지) */
L.healSave=function(S){ try{ if(!S||!S.league) return; const ok=id=>!!(L.defById(id)||lowDef(id)); let bad=false; [["k1",12],["k2",10],["k3",8],["k4",8]].forEach(([k,min])=>{ const a=(S.league[k]||[]).filter(ok); if(a.length<min) bad=true; else S.league[k]=a; }); if(bad) L.initLeague(S);
  const fixClub=c=>{ if(!c||!c.lg||c.abroad) return; if(c.lg==="K1"||c.lg==="K2"){ if(L.defById(c.id)) return; const d=KDEFS().find(x=>x.short===c.short||x.club===c.name)||L.defById((S.league[c.lg.toLowerCase()]||[])[0]); if(d){ c.id=d.club; c.name=d.club; c.short=d.short||d.club; } } else if(c.lg==="K3"||c.lg==="K4"){ if(lowDef(c.id)) return; const d=(c.lg==="K3"?K3_DEFS:K4_DEFS)[0]; if(d){ c.id=d.id; c.name=d.name; c.short=d.short||d.name; } } };
  fixClub(S.club); if(S.club&&S.club.origin) fixClub(S.club.origin); }catch(e){} };
L.lowTier=lg=>lg==="K3"||lg==="K4";   // 연봉 상한이 있는 세미프로·아마추어 리그
L.initLeague=function(S){ S.league.k1=K.TEAMS26.map(d=>d.club).concat([K.GIMCHEON.club]); S.league.k2=K.K2_DEFS.map(d=>d.club); S.league.k3=K3_DEFS.map(d=>d.id); S.league.k4=K4_DEFS.map(d=>d.id); };
L.strengthOf=function(S,def){ const s=K.oppStrength(def,false,(S.drift[def.club]||0)); return {att:s.att,def:s.def,lvl:(s.att+s.def)/2}; };
L.clubLevel=function(def){ const ps=def.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11); return ps.length?ps.reduce((s,p)=>s+p.ovr,0)/ps.length:60; };
const CODE=n=>(window.KL_CLUB_CODE||{})[n]||null;
const LGNAME={K1:"레전드리그1",K2:"레전드리그2",K3:"레전드리그3",K4:"레전드리그4",MIL:"김천 새벽",YOUTH:"유소년 리그",UNIV:"대학 리그",EPL:"잉글랜드 1부 리그"};
L.lgLabel=lg=>LGNAME[lg]||lg;
L.isForeign=lg=>lg==="EPL";
/* 해외는 잉글랜드 1부 리그만. l = 주전급 평균 능력치. 선수 명단(players)은 js/data_epl.js 가 있으면 거기서 와요 */
const EPL_DEFAULT=[
 {id:"mci",name:"맨체스터 스카이",short:"스카이",l:91,col:"#6cabdd"},{id:"liv",name:"불사조",short:"불사조",l:90,col:"#c8102e"},{id:"ars",name:"거너스",short:"거너스",l:90,col:"#ef0107"},
 {id:"chl",name:"라이언",short:"라이언",l:87,col:"#034694"},{id:"mun",name:"맨체스터 레드",short:"레드",l:86,col:"#da291c"},{id:"tot",name:"북런던 스퍼스",short:"스퍼스",l:85,col:"#132257"},
 {id:"new",name:"타인사이드 피스",short:"피스",l:84,col:"#241f20"},{id:"avl",name:"버밍엄 빌라",short:"빌라",l:82,col:"#670e36"},{id:"bha",name:"시걸",short:"시걸",l:80,col:"#0057b8"},
 {id:"whu",name:"해머스",short:"해머스",l:79,col:"#7a263a"},{id:"cry",name:"남런던 이글스",short:"이글스",l:78,col:"#1b458f"},{id:"ful",name:"코티지",short:"코티지",l:77,col:"#444"},
 {id:"bre",name:"비즈",short:"비즈",l:77,col:"#e30613"},{id:"wol",name:"울브스",short:"울브스",l:76,col:"#fdb913"},{id:"eve",name:"토피",short:"토피",l:76,col:"#003399"},
 {id:"bou",name:"체리",short:"체리",l:76,col:"#da291c"},{id:"nfo",name:"포레스트 포레스트",short:"포레스트",l:75,col:"#dd0000"},{id:"lee",name:"리즈 화이츠",short:"화이츠",l:74,col:"#aaa"},
 {id:"bur",name:"클라렛",short:"클라렛",l:72,col:"#6c1d45"},{id:"sun",name:"블랙캣츠",short:"블랙캣츠",l:72,col:"#eb172b"},
];
const EPL=()=>window.KL_EPL&&window.KL_EPL.length?window.KL_EPL:EPL_DEFAULT;
L.EPL=EPL;
/* ===== 해외 리그 =====
 * 잉글랜드 1부 리그(EPL) · 챔피언십(EPL2) · 독일 1부 리그(BUN) · 스페인 1부 리그(LAL) · 이탈리아 1부 리그(SEA) · 리그 1(L1). 모두 같은 1~99 능력치 척도를 쓰고, 구단 전력(l)으로 난이도가 정해져요.
 * 상위 리그일수록 전력이 높아서 같은 능력치로는 골을 넣기 어렵고, 능력치가 높은 선수가 레전드리그로 돌아오면 득점왕을 노릴 수 있어요.
 * sal = 연봉 배수 · mv = 몸값 배수 · ucl = 유럽 클럽컵 출전 순위(이내) */
const FL={
 EPL:{name:"잉글랜드 1부 리그",sal:5.6,mv:1.6,ucl:4,uel:[5,6]},EPL2:{name:"챔피언십",sal:1.1,mv:.7,ucl:0},LAL2:{name:"세군다 디비시온",sal:1,mv:.6,ucl:0},BUN2:{name:"2. 독일 1부 리그",sal:1.2,mv:.7,ucl:0},SEA2:{name:"이탈리아 1부 리그 B",sal:1,mv:.6,ucl:0},FR2:{name:"리그 2",sal:.9,mv:.55,ucl:0},
 J1:{name:"J1리그",sal:1.9,mv:.9,ucl:0,acl:3,cal:"K"},SPL:{name:"사우디 프로리그",sal:4.4,mv:1.1,ucl:0,acl:3,cal:"E"},J2:{name:"J2리그",sal:.9,mv:.5,ucl:0,cal:"K"},SPL2:{name:"사우디 1부 리그",sal:1.2,mv:.5,ucl:0,cal:"E"},
 BUN:{name:"독일 1부 리그",sal:3.6,mv:1.3,ucl:4,uel:[5,6]},LAL:{name:"스페인 1부 리그",sal:4.2,mv:1.35,ucl:4,uel:[5,6]},SEA:{name:"이탈리아 1부 리그",sal:3.6,mv:1.25,ucl:4,uel:[5,6]},L1:{name:"리그 1",sal:2.6,mv:1.0,ucl:3,uel:[4,5]}
};
L.FL=FL; L.isForeign=lg=>!!FL[lg]; Object.keys(FL).forEach(k=>{ LGNAME[k]=FL[k].name; });
const KFL=()=>window.KL_FL||{};
const ALLENG=()=>EPL().concat(KFL().EPL2||[]);
/* 1부 → [2부 키, 해마다 승강하는 팀 수] */
const PAIRS={EPL:["EPL2",3],LAL:["LAL2",3],BUN:["BUN2",2],SEA:["SEA2",3],L1:["FR2",3],J1:["J2",3],SPL:["SPL2",2]};
L.PAIRS=PAIRS;
const topOf=k=>Object.keys(PAIRS).find(t=>t===k||PAIRS[t][0]===k);
const topList=top=>top==="EPL"?EPL():(KFL()[top]||[]);
const idsOf=(S,top)=>(top==="EPL"?S.eplIds:(S.divIds&&S.divIds[top]))||topList(top).map(c=>c.id);
const setIds=(S,top,ids)=>{ if(top==="EPL") S.eplIds=ids; else (S.divIds=S.divIds||{})[top]=ids; };
L.allFL=()=>{ const o=ALLENG().slice(); ["BUN","LAL","SEA","L1","J1","SPL","BUN2","LAL2","SEA2","FR2","J2","SPL2"].forEach(k=>{ (KFL()[k]||[]).forEach(c=>o.push(c)); }); return o; };
L.flFind=id=>L.allFL().find(c=>c.id===id);
const flClubs=(S,key)=>{ const top=topOf(key); if(top){ const sec=PAIRS[top][0], ids=idsOf(S,top), all=topList(top).concat(KFL()[sec]||[]); return key===top?all.filter(c=>ids.includes(c.id)):all.filter(c=>!ids.includes(c.id)); } return KFL()[key]||[]; };
L.leagueClubs=function(S,key){
  if(FL[key]) return flClubs(S,key).map(c=>{ const d=S.drift["epl_"+c.id]||0; return {id:c.id,name:c.name,short:c.short,l:c.l+d,att:c.l+d,def:c.l+d,code:null,col:c.col,players:c.players||null}; });
  /* 승강으로 아래 리그 구단은 위 리그에, 위 리그 구단은 아래 리그에 들어올 수 있어요(전력 차이는 TOFF 척도로 맞춰요) */
  const low=(c,k)=>{ const d=S.drift[c.id]||0, sh=(K4_DEFS.includes(c)?TOFF.K4:TOFF.K3)-TOFF[k]; return {id:c.id,name:c.name,short:c.short,l:c.l+d+sh,att:c.l+d+sh,def:c.l+d+sh,code:null,col:c.col,players:null}; };
  if(!S.league.k3) S.league.k3=K3_DEFS.map(d=>d.id); if(!S.league.k4) S.league.k4=K4_DEFS.map(d=>d.id);
  const ids=key==="K1"?S.league.k1:key==="K2"?S.league.k2:key==="K3"?S.league.k3:S.league.k4, sh=TOFF[key]||0;
  return ids.map(id=>{ const lc=lowDef(id); if(lc) return low(lc,key); const d=L.defById(id); if(!d) return null; const st=L.strengthOf(S,d); return {id:d.club,name:d.club,short:d.short||d.club,l:L.clubLevel(d)-sh,att:st.att-sh,def:st.def-sh,code:CODE(d.club),def_:d}; }).filter(Boolean);
};
L.clubRef=function(S,c,lg){ return {id:c.id,name:c.name,short:c.short||c.name,lg,code:c.code||null,col:c.col||null}; };

/* ================= 연봉 (억 원) =================
 * 실제 수치(2025): 레전드리그1 평균 3.1억(국내 2.4억·외국인 8.4억), 최고 국내 15.9억·외국인 21억, 레전드리그2 평균 1.4억,
 *                 잉글랜드 1부 리그 평균 약 70억(연 370만 파운드), 최고 약 500억(연 3,660만 달러 이상) */
const LG_SAL={K1:1,K2:.7,K3:.35,K4:.28,MIL:.25,YOUTH:.03,UNIV:0}; Object.keys(FL).forEach(k=>{ LG_SAL[k]=FL[k].sal; });
L.capOf=function(lg,ovr){ if(lg==="K1") return 22+Math.max(0,(ovr||0)-78)*2.2; if(lg==="K3") return Math.round((1.2+Math.max(0,(ovr||0)-60)*.08)*10)/10; if(lg==="K4") return Math.round((.3+Math.max(0,(ovr||0)-52)*.02)*10)/10; return {K2:8,MIL:.4,YOUTH:.1}[lg]||null; };
L.salaryOf=function(ovr,ag,lg){ const base=1.5*Math.exp((ovr-60)/8.5); const ageF=ag<=20?.8:ag<=22?.92:ag<=30?1:ag<=33?.88:.7; const cap=L.capOf(lg,ovr); let v=base*(LG_SAL[lg]!=null?LG_SAL[lg]:1)*ageF;
  if(lg==="K4") v=Math.min(.2+Math.max(0,ovr-40)*.012,Math.max(.3,r1(base*LG_SAL.K3)))*ageF;   // 4부: 2천만~3천만 원대가 대부분이고 같은 능력치의 3부 연봉을 넘지 않아요
  return Math.max(lg==="K4"?.2:.3,r1(cap?Math.min(cap,v):v)); };   // 4부는 연 2천만~3천만 원대가 대부분이에요. 생계가 빠듯해서 다른 일을 병행하는 선수도 많아요
/* 구단별 연봉 현황: 그 구단 선수들의 추정 연봉으로 최고/최저/평균을 보여줘요 */
L.clubPayroll=function(S,clubId,lg){
  const def=L.defById(clubId); let list=null;
  if(def) list=def.players.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,24).map(p=>({name:p.name,pos:p.pos,sal:L.salaryOf(p.ovr,p.age||27,lg==="K2"?"K2":"K1")}));
  else if(L.lowTier(lg)){ const c=L.leagueClubs(S,lg).find(x=>x.id===clubId); list=[]; for(let i=0;i<20;i++){ const o=(c?c.l:lg==="K4"?42:55)+rnd(-8,6); list.push({name:"선수 "+(i+1),pos:"MF",sal:L.salaryOf(o,27,lg)}); } }
  else { const c=L.flFind(clubId); const fl=FL[lg]?lg:"EPL"; if(c&&c.players) list=c.players.slice(0,26).map(p=>({name:p[0],pos:p[1],sal:L.salaryOf(p[2],27,fl)})); else if(c){ list=[]; for(let i=0;i<22;i++){ const o=c.l+rnd(-9,7); list.push({name:"선수 "+(i+1),pos:"MF",sal:L.salaryOf(o,27,fl)}); } } }
  if(!list||!list.length) return null;
  list.sort((a,b)=>b.sal-a.sal); const tot=list.reduce((s,x)=>s+x.sal,0);
  return {top:list[0],low:list[list.length-1],avg:r1(tot/list.length),n:list.length};
};

/* ================= 출전 비중 ================= */
const effOvr=S=>S.p.ovr+(S.cond-75)/12+(S.morale-65)/14;
L.effOvr=effOvr;
L.startRateAt=function(ovr,lvl,trust,p){ const youth=clamp(((p.pot||ovr)-ovr)/40,0,.25), z=(ovr-(lvl-1.5))/3.6, sr0=logistic(z); return clamp(sr0*.8+trust*.2+youth*(sr0<.5?.4:0),.02,.97); };
/* 이적 제의 화면용: 예상 역할에 따른 성장 전망(같은 성장 공식을 단순화해서 어림해요) */
L.outlook=function(S,sr){
  const p=S.p, ag=age(S), tf=L.traitFx(p), rate=ageRate(ag+tf.shift,p.pos);
  const share=sr>=.85?.88:sr>=.6?.7:sr>=.35?.42:sr>=.12?.15:.08;
  const gap=clamp((p.pot-p.ovr)/10,.04,ag<19?1.0:1.7), ageF=ag<=21?1.15:ag<=24?1:ag<=27?.6:.25;
  const pt=((Math.max(sr,.0)-.4)*.4+(share-.45)*(share>.45?1.35:1.0))*ageF*(ag<26?1:.5)-(share<.25&&ag<=28?.25:0);
  let d=rate>0?(rate*gap+pt)*tf.grow:rate*tf.decl;
  if(rate>0) d=Math.min(d,Math.max(0,p.pot-p.ovr)+1);
  const lo=Math.round(d-1), hi=Math.round(d+1), f=n=>(n>0?"+":"")+n;
  const sym=d>=2.2?"▲▲":d>=.8?"▲":d>-.8?"―":d>-2.2?"▼":"▼▼", word=d>=2.2?"크게 성장":d>=.8?"성장":d>-.8?"정체":d>-2.2?"하락 위험":"크게 하락 위험";
  return {d,sym,word,txt:sym+" "+word+" 예상 ("+f(lo)+"~"+f(hi)+")",cls:d>=.8?"up":d>-.8?"":"dn"};
};
L.roleLabel=sr=>sr>=.85?"핵심 주전":sr>=.6?"주전":sr>=.35?"로테이션":sr>=.12?"벤치":"2군";

/* ================= 유소년 · 대학 ================= */
const SCHOOL_REG=["이스트","파도","팔공","포트","무등","사이언스","하이","블루윙","라이트하우스","전남","경북","파인","충남","오름"];
const SCHOOL_SUF=["제일","중앙","한빛","새롬","청솔","대성","동명","미래","푸른","은성"];
L.schoolName=function(ag,univ){ return pick(SCHOOL_REG)+" "+pick(SCHOOL_SUF)+(univ?"대":ag<16?"중":"고"); };
L.gradeLabel=function(ag){ return ag<16?"중학교 "+(ag-12)+"학년":ag<=YOUTH_END?"고등학교 "+(ag-15)+"학년":"대학교 "+(ag-18)+"학년"; };
/* 구단 유스 팀 이름은 나이로 정해요: 13~15세 U15, 16~18세 U18 (해마다 바뀌어요) */
L.youthTeamName=function(short,ag){ return String(short).replace(/\s*\d{4}$/,"")+" "+(ag<16?"U15":"U18"); };
L.assignYouthClub=function(S){
  const d=pick(K.TEAMS26.concat(K.K2_DEFS)); S.youthTier=ri(-3,3);
  S.club={id:d.club,name:L.youthTeamName(d.short,age(S)),short:d.short,lg:"YOUTH",code:CODE(d.club),parent:d.club};
};
const UNIVS=["한빛대학교","푸른대학교","새벽대학교","가람대학교","누리대학교","청솔대학교","미르대학교","항구대학교"];
L.chooseUniv=function(S){ S.stage="univ"; S.club={id:"univ",name:pick(UNIVS),short:"대학",lg:"UNIV",code:null}; S.phase="prep"; S.offers=[]; S.plan=null; L.addMoment(S,"대학 진학","대학 진학",S.club.name+"에 진학했어요."); };
L.youthLevel=ag=>26+(ag-13)*4.3;

/* ================= 기록 ================= */
L.addMoment=function(S,badge,kind,text){ S.moments.push({year:S.year,age:age(S),club:S.club?S.club.name:"",badge,text}); };
L.feedAdd=function(S,when,text,tone){ S.feed.unshift({when,text,tone:tone||0}); if(S.feed.length>140) S.feed.length=140; };

/* ================= 드래프트 ================= */
L.draftOffers=function(S){
  const p=S.p, score=p.ovr+(p.pot-p.ovr)*.35;
  const k1=L.leagueClubs(S,"K1").sort((a,b)=>b.l-a.l), k2=L.leagueClubs(S,"K2").sort((a,b)=>b.l-a.l);
  const hi=clamp((score-50)/22,0,1), out=[], seen=new Set();
  for(let tries=0;out.length<3&&tries<40;tries++){
    const useK1=Math.random()<.25+hi*.7; const arr=useK1?k1:k2;
    const idx=clamp(Math.floor((1-hi)*(arr.length-1)*(useK1?.7:.5)+rnd(0,arr.length*.45)),0,arr.length-1); const c=arr[idx];
    if(seen.has(c.id)) continue; seen.add(c.id); out.push({c,lg:useK1?"K1":"K2"}); }
  return out.sort((a,b)=>b.c.l-a.c.l).map(x=>{ const sr=L.startRateAt(p.ovr,x.c.l,S.trust,p);
    return {club:L.clubRef(S,x.c,x.lg),lvl:r1(x.c.l),salary:L.salaryOf(p.ovr+2,age(S),x.lg),years:2,role:L.roleLabel(sr),sr}; });
};
/* 지명을 못 받은 선수·대학 졸업 미지명자에게 열리는 3부 레전드리그3 입단 제의 */
L.k3Offers=function(S){
  const p=S.p, ag=age(S), cl=L.leagueClubs(S,"K3"); let ok=cl.filter(c=>c.l<=p.ovr+5&&L.startRateAt(p.ovr,c.l,S.trust,p)>=.25);
  return shuffle(ok).slice(0,3).sort((a,b)=>b.l-a.l).map(c=>{ const sr=L.startRateAt(p.ovr,c.l,S.trust,p); return {club:L.clubRef(S,c,"K3"),lvl:r1(c.l),salary:L.salaryOf(p.ovr+2,ag,"K3"),years:2,role:L.roleLabel(sr),sr,tag:"레전드리그3 입단"}; });
};
/* 3부에서도 손을 내밀지 않는 선수(또는 더 낮은 곳에서 시작하려는 선수)에게 열리는 4부 레전드리그4 입단 제의. 지역 아마추어·세미프로 구단이라 연봉은 생계가 빠듯한 수준이에요 */
L.k4Offers=function(S){
  const p=S.p, ag=age(S), cl=L.leagueClubs(S,"K4"); let ok=cl.filter(c=>c.l<=p.ovr+5&&L.startRateAt(p.ovr,c.l,S.trust,p)>=.25);
  if(ok.length<2) ok=cl.slice().sort((a,b)=>a.l-b.l).slice(0,3);
  return shuffle(ok).slice(0,3).sort((a,b)=>b.l-a.l).map(c=>{ const sr=L.startRateAt(p.ovr,c.l,S.trust,p); return {club:L.clubRef(S,c,"K4"),lvl:r1(c.l),salary:L.salaryOf(p.ovr+2,ag,"K4"),years:1,role:L.roleLabel(sr),sr,tag:"레전드리그4 입단"}; });
};
L.signWith=function(S,offer){ if(S.family) S.family.pts=0; offer.bonus=Math.max(.05,r1(offer.salary*.8*((!S.firstSigned&&L.famBonusMul)?L.famBonusMul(S):1))); S.firstSigned=true; S.funds=r1(S.funds+offer.bonus); S.club=offer.club; S.salary=offer.salary; S.contractYears=offer.years; S.phase="prep"; S.offers=[]; S.stage="pro"; S.team=offer.sr<.14?"2군":"1군"; S.plan=null;
  S.cond=90; S.morale=72; if(!S.history.some(h=>!h.youth)) L.addMoment(S,"프로 입단","입단",S.club.name+"과(와) 프로 계약을 맺었어요. (연봉 "+offer.salary+"억)"); };

/* ================= 일정 ================= */
function circle(ids){                       // 라운드 로빈 (홀수면 한 팀은 쉬어요)
  const t=ids.slice(); if(t.length%2) t.push(null); const n=t.length, rounds=[];
  for(let r=0;r<n-1;r++){ const rd=[]; for(let i=0;i<n/2;i++){ const a=t[i], b=t[n-1-i]; if(a&&b) rd.push((r+i)%2?[a,b]:[b,a]); } rounds.push(rd); t.splice(1,0,t.pop()); }
  return rounds;
}
L.makeRounds=function(ids,per,extraRounds){
  let rounds=[]; for(let k=0;k<per;k++){ const rr=circle(shuffle(ids)); rounds=rounds.concat(k%2?rr.map(rd=>rd.map(m=>[m[1],m[0]])):rr); }
  for(let e=0;e<extraRounds;e++){ const sh=shuffle(ids); const rd=[]; for(let i=0;i+1<sh.length;i+=2) rd.push(e%2?[sh[i],sh[i+1]]:[sh[i+1],sh[i]]); rounds.push(rd); }
  return rounds;
};
function playMatch(h,a,homeAdv){ const ha=homeAdv==null?CFG.HOME_ADV:homeAdv, lh=CFG.GOAL_BASE*Math.exp((h.att+ha-a.def)/CFG.SPREAD), la=CFG.GOAL_BASE*Math.exp((a.att-h.def-ha)/CFG.SPREAD); return [K.poisson(lh),K.poisson(la)]; }
L.playMatch=playMatch;

/* ================= 시즌 시작·진행 ================= *
 * 프리시즌에 훈련·투자를 고르면 전반기부터 차례로 진행해요. 구간마다 요약과 이벤트가 나와요. */
/* 리그마다 시즌이 열리는 달이 달라요.
 *   레전드리그·한국 유소년/대학: 3월 개막 ~ 12월 초 (전지훈련 1~2월)
 *   잉글랜드 1부 리그(해외 유스 포함): 8월 개막 ~ 이듬해 5월 (프리시즌 6~7월), 시즌 이름은 2026-27 처럼 두 해에 걸쳐요 */
const CAL_K=[{id:"h1",label:"전반기",months:"3~6월",frac:.36},{id:"h2",label:"중반기",months:"7~8월",frac:.20},{id:"h3",label:"후반기",months:"9~10월",frac:.24},{id:"h4",label:"시즌 마무리",months:"11~12월",frac:.20}];
const CAL_E=[{id:"h1",label:"전반기",months:"8~10월",frac:.30},{id:"h2",label:"중반기",months:"11~12월",frac:.22},{id:"h3",label:"후반기",months:"1~3월",frac:.28},{id:"h4",label:"시즌 마무리",months:"4~5월",frac:.20}];
L.calKey=function(S,key){ key=key||L.leagueKey(S); return (FL[key]?(FL[key].cal||"E")==="E":(key==="YOUTH"&&S.club&&S.club.abroad))?"E":"K"; };
L.segsFor=function(S,key){ return L.calKey(S,key)==="E"?CAL_E:CAL_K; };
L.preMonths=function(S,key){ return L.calKey(S,key)==="E"?"6~7월":"1~2월"; };
L.seasonLabel=function(S,key){ return L.calKey(S,key)==="E"?S.year+"-"+String(S.year+1).slice(2):String(S.year); };
const SEGS=CAL_K; L.SEGS=SEGS;
L.leagueKey=function(S){ if(S.stage==="youth"||S.stage==="univ") return "YOUTH"; const lg=S.club.lg; return lg==="MIL"?"K1":lg; };

L.beginSeason=function(S,plan){
  const p=S.p, ag=age(S); L.setPlan(S,plan);
  const key=L.leagueKey(S), stage=S.stage;
  const sim={key,ovrStart:S.p.ovr,campLv:[],seg:0,r:0,my:{apps:0,starts:0,min:0,g:0,a:0,cs:0,rtSum:0,rtW:0,mom:0},recs:[],out:0,injuries:[],natRecs:[],callups:[],cupTitles:[],capsAuto:0,intGoalsAuto:0};
  let lvl; const myId=S.club.id;
  if(key==="YOUTH"){
    const lv=L.youthLevel(ag)+S.youthTier+(stage==="univ"?2:0); lvl=lv;
    let opp;
    if(stage==="univ") opp=shuffle(UNIVS.concat(["별빛대학교","솔뫼대학교","동녘대학교","이음대학교"])).slice(0,11).map(n=>({id:"u_"+n,name:n,short:n.replace("대학교","대"),l:lv+rnd(-5,5)}));
    else if(S.club.abroad) opp=shuffle(EPL()).filter(c=>c.id!==S.club.parent).slice(0,11).map(c=>({id:c.id,name:L.youthTeamName(c.short,ag),short:L.youthTeamName(c.short,ag),l:lv+rnd(-5,5)}));
    else opp=shuffle(K.TEAMS26.concat(K.K2_DEFS)).filter(d=>d.club!==S.club.parent).slice(0,11).map(d=>({id:d.club,name:L.youthTeamName(d.short,ag),short:L.youthTeamName(d.short,ag),l:lv+rnd(-5,5)}));
    opp.push({id:myId,name:S.club.name,short:S.club.name,l:lv}); sim.teams=opp;
    sim.rounds=L.makeRounds(opp.map(t=>t.id),2,0);
    sim.st={}; opp.forEach(t=>{ sim.st[t.id]={att:t.l,def:t.l}; });
  } else {
    let clubs=L.leagueClubs(S,key); if(!clubs.length){ try{ S.league=S.league||{}; L.initLeague(S); }catch(e){} clubs=L.leagueClubs(S,key); }
    sim.teams=clubs.map(c=>({id:c.id,name:c.name,short:c.short,l:c.l,code:c.code}));
    const me=clubs.find(c=>c.id===myId)||clubs[0]; lvl=me.l; sim.st={}; clubs.forEach(c=>{ sim.st[c.id]={att:c.att,def:c.def}; });
    sim.rounds=L.makeRounds(clubs.map(c=>c.id),key==="K1"||key==="K3"?3:2,key==="K1"?5:0);   // K3 39경기 · K4 26경기
  }
  if(stage==='pro'&&key!=='YOUTH'){ const bst=clamp((p.ovr-lvl)*.12,0,3); const w={FW:[.9,.1],MF:[.6,.3],DF:[.2,.8],GK:[.1,.9]}[p.pos]; const my=sim.st&&sim.st[myId]; if(my&&bst>0){ my.att+=bst*w[0]; my.def+=bst*w[1]; } const wn=L.traitFx(p).winner+(S.playcoach?.5:0)+(S.captain&&S.club&&S.captain.club===S.club.id?.5:0); if(my&&wn){ my.att+=wn; my.def+=wn; } }
  sim.myId=myId; sim.lvl=lvl; sim.tab={}; sim.teams.forEach(t=>{ sim.tab[t.id]={id:t.id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}; });
  sim.segs=L.segsFor(S,key); sim.cal=L.calKey(S,key); const N=sim.rounds.length; let acc=0; sim.segEnd=sim.segs.map((s,i)=>{ acc+=s.frac; return i===sim.segs.length-1?N:Math.round(N*acc); });
  sim.sr=clamp(L.startRateAt(effOvr(S),lvl,S.trust,p),.02,.97); if(S.team==="2군"&&stage==="pro") sim.sr=Math.min(sim.sr,.1);
  if(stage==='youth') sim.sr=clamp(sim.sr+(ag<=15?.06:(p.ovr<lvl?-.04:0)),.02,.97);
  if(stage==='pro'&&L.coachAdjustSr) sim.sr=L.coachAdjustSr(S,sim.sr);
  if(stage==='pro'&&S.playcoach) sim.sr=Math.min(sim.sr,.6);
  if(stage==='pro'){ const tfx0=L.traitFx(p); sim.sr=clamp(sim.sr+tfx0.sr+((L.hasStaff&&L.hasStaff(S,'analyst'))?.02:0),.02,.97); }
  sim.role0=L.roleLabel(sim.sr);
  /* 첫 프로 시즌: 구단 전력 상위 3팀은 아시아 클럽컵 출전권이 있어요 */
  if(key==='K1'&&!S.history.some(h=>!h.youth)){ const cl=L.leagueClubs(S,'K1').sort((a,b)=>b.l-a.l).slice(0,3).map(c=>c.id); S.acl=cl.includes(myId); }
  sim.form=Math.exp(K.randn()*.26); sim.formA=Math.exp(K.randn()*.2);
  if(L.derbyStart) L.derbyStart(S,sim);
  sim.cups=L.planCups(S,sim);
  sim.callups=L.planCallups?L.planCallups(S,sim):[];
  S.sim=sim; S.phase="run"; S.lastR=null;
  L.feedAdd(S,S.year+" 프리시즌","훈련 계획: "+L.planText(S,S.plan)+(S.plan.invest?" · 투자: "+L.investText(S.plan.invest):""),0);
};

/* 훈련·투자: 컨디션/사기/인기와 자금 */
const INVEST={weak:{name:"약점 보강 특훈",cost:.3},strong:{name:"강점 특화 특훈",cost:.3},medical:{name:"메디컬 케어",cost:.2},mental:{name:"멘탈 코칭",cost:.15}};
L.INVEST=INVEST;
L.investText=k=>INVEST[k]?INVEST[k].name:"";
L.planText=function(S,plan){ const d=POSDEF[S.p.pos]; if(plan.focus==="rest") return "휴식·회복"; if(plan.focus==="media") return "미디어 활동"; if(plan.focus==="coach") return "개인 코치"; const s=d.stats.find(x=>x[0]===plan.focus); return s?s[1]+" 훈련":"자율 훈련"; };
L.applyPlan=function(S,plan){
  if(plan.focus==="rest"){ S.cond=clamp(S.cond+28,0,100); S.morale=clamp(S.morale+3,0,100); }
  else if(plan.focus==="media"){ S.fame=Math.max(0,S.fame+ri(5,9)); S.morale=clamp(S.morale+3,0,100); S.cond=clamp(S.cond-5,0,100); }
  else if(plan.focus==="coach"){ if(S.funds>=.2){ S.funds=r1(S.funds-.2); S.cond=clamp(S.cond-6,0,100); plan.coachOk=true; } else { plan.coachOk=false; S.cond=clamp(S.cond+8,0,100); } }
  else { S.cond=clamp(S.cond-12,0,100); }
  if(plan.invest){ const iv=INVEST[plan.invest]; if(iv&&S.funds>=iv.cost){ S.funds=r1(S.funds-iv.cost); plan.investOk=true; if(plan.invest==="medical") S.cond=clamp(S.cond+15,0,100); if(plan.invest==="mental") S.morale=clamp(S.morale+10,0,100); } else plan.investOk=false; }
  S.cond=clamp(S.cond,25,100);
};

/* 내 경기 하나의 기록 */
const SHARE_G={ST:.26,LW:.15,RW:.15,AM:.10,CM:.055,DM:.03,CB:.035,LB:.02,RB:.02,GK:0};
const SHARE_A={ST:.11,LW:.17,RW:.17,AM:.20,CM:.13,DM:.05,CB:.02,LB:.09,RB:.09,GK:.005};
L.shareG=k=>SHARE_G[k]!=null?SHARE_G[k]:.05; L.shareA=k=>SHARE_A[k]!=null?SHARE_A[k]:.05;
function myRec(S,sim,m,comp){
  const p=S.p, ovr=effOvr(S), sub=p.sub, lvl=sim.lvl;
  const rec={comp:comp||"리그",r:m.r,home:m.home,opp:m.opp,f:m.f,a:m.a,res:m.f>m.a?"W":m.f===m.a?"D":"L",min:0,st:false,g:0,as:0,rt:null};
  if(sim.out>0){ sim.out--; rec.inj=true; return rec; }
  /* 큰 경기(컵 8강 이상·결승·유럽 토너먼트)는 주전을 쉬게 하지 않아요 */
  const big=comp!=="리그"&&/(결승|4강|8강|16강)/.test(sim.curRound||""), fin=comp!=="리그"&&/결승/.test(sim.curRound||"");
  const sr=comp==="리그"?sim.sr:(fin&&sim.sr>=.4?clamp(sim.sr+.12,.5,.97):big&&sim.sr>=.55?clamp(sim.sr+.06,.5,.95):clamp(sim.sr*.85+.05,.05,.95)), r=Math.random();
  if(r<sr){ rec.st=true; rec.min=clamp(Math.round(rnd(62,90)),45,90); }
  else if(r<sr+(1-sr)*(S.team==="2군"?.08:sr<.2?.42:.55)&&sr<.9) rec.min=ri(8,32);   // 2군은 1군 경기에 거의 나오지 못해요
  if(rec.min>0){
    const mf=rec.min/90;
    const sfx=L.styleFx?L.styleFx(p):{g:1,a:1}; const tfx=L.traitFx(p); const sb=L.subEdge?L.subEdge(p):{g:1,a:1,r:0}, gm=sb.g*(!rec.st?tfx.joker:1)*tfx.setp*(p.pos==="DF"&&tfx.setp>1?1.25:1), am=sb.a*tfx.assist*(tfx.setp>1?1.08:1)*(p.pos==="FW"&&p.stats.passing!=null?clamp(1+(p.stats.passing-ovr)/110,.8,1.3):1);
    rec.g=binom(m.f,clamp(L.shareG(sub)*sfx.g*gm*sim.form*Math.exp((ovr-lvl)/20)*mf,0,.5));
    rec.as=binom(Math.max(0,m.f-rec.g),clamp(L.shareA(sub)*sfx.a*am*sim.formA*Math.exp((ovr-lvl)/22)*mf,0,.5));
    let rt=6.45+(ovr-lvl)/13*(.5+mf*.5)+(rec.res==="W"?.4:rec.res==="L"?-.35:0)+rec.g*1+rec.as*.6+(!rec.st&&tfx.joker>1?.25:0)+rnd(-.5,.5);
    rt+=sb.r; if(p.pos==="GK"||p.pos==="DF"){ if(m.a===0) rt+=.5; else rt-=Math.min(m.a,4)*.12; }
    rec.rt=r1(clamp(rt,3.5,10)); rec.cs=(rec.st&&m.a===0&&(p.pos==="GK"||p.pos==="DF"))?1:0;
    const my=sim.my; my.apps++; if(rec.st) my.starts++; my.min+=rec.min; my.g+=rec.g; my.a+=rec.as; my.cs+=rec.cs; my.rtSum+=rec.rt*mf; my.rtW+=mf; if(rec.rt>=8.3&&rec.st) my.mom++;
    S.cond=clamp(S.cond-(rec.st?1.1:.4),20,100);
    if(rec.res==="W") S.morale=clamp(S.morale+(rec.g?.6:.3),0,100); else if(rec.res==="L") S.morale=clamp(S.morale-.5,0,100);
  } else if(sr<.35) S.morale=clamp(S.morale-.35,0,100);
  return rec;
}
L.myRec=myRec;

/* 한 구간을 진행: 모든 팀의 라운드를 치르고 내 경기를 기록해요 */
L.playSegment=function(S){
  const sim=S.sim, seg=sim.segs[sim.seg], end=sim.segEnd[sim.seg]; const recs=[];
  const pn=L.applySegPlan(S,seg); if(L.moneySegment) L.moneySegment(S); sim.campLv.push((pn.alloc&&pn.alloc.camp)|0);
  const inj=L.rollInjury(S,sim,seg); if(inj){ sim.injuries.push(inj); sim.out=inj.matches; if(inj.severe) L.injuryHit(S); L.feedAdd(S,S.year+" "+seg.label,"["+inj.part+" 부상] "+inj.matches+"경기 결장 예상",-1); }
  while(sim.r<end){
    const rd=sim.rounds[sim.r]; const rno=sim.r+1;
    rd.forEach(([h,a])=>{ const [gh,ga]=playMatch(sim.st[h],sim.st[a]); const H=sim.tab[h],A=sim.tab[a]; H.p++;A.p++;H.gf+=gh;H.ga+=ga;A.gf+=ga;A.ga+=gh;
      if(gh>ga){H.w++;A.l++;H.pts+=3;}else if(gh<ga){A.w++;H.l++;A.pts+=3;}else{H.d++;A.d++;H.pts++;A.pts++;}
      if(h===sim.myId||a===sim.myId){ const mine=h===sim.myId; const r=myRec(S,sim,{r:rno,home:mine,opp:mine?a:h,f:mine?gh:ga,a:mine?ga:gh}); if(L.derbyMark) L.derbyMark(S,sim,r,mine?a:h); recs.push(r); sim.recs.push(r); } });
    sim.r++;
  }
  L.playCupsAt(S,sim,seg.id).forEach(r=>{ recs.push(r); sim.recs.push(r); });
  { const al0=pn.alloc||{}; S.cond=clamp(S.cond+6+1.5*(al0.care|0),20,100); if((al0.mind|0)>0) S.morale=clamp(S.morale+(al0.mind|0),0,100); } if(L.traitFx(S.p).mind) S.morale=Math.max(45,S.morale);
  const tab=Object.values(sim.tab).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf); const me=sim.tab[sim.myId];
  const sumRecs=recs.filter(x=>x.min>0), lg=recs.filter(x=>x.comp==="리그");
  const out={seg:seg.id,label:seg.label,months:seg.months,idx:sim.seg,last:sim.seg===sim.segs.length-1,recs,
    segStat:{apps:sumRecs.length,g:sumRecs.reduce((a,x)=>a+x.g,0),as:sumRecs.reduce((a,x)=>a+x.as,0),rt:sumRecs.length?r1(sumRecs.reduce((a,x)=>a+x.rt,0)/sumRecs.length):0,W:lg.filter(x=>x.res==="W").length,D:lg.filter(x=>x.res==="D").length,L:lg.filter(x=>x.res==="L").length},
    rank:tab.findIndex(t=>t.id===sim.myId)+1,N:tab.length,pts:me.pts,played:me.p,round:sim.r,rounds:sim.rounds.length,
    cum:{apps:sim.my.apps,g:sim.my.g,a:sim.my.a,rt:sim.my.rtW?r1(sim.my.rtSum/sim.my.rtW):0},
    callups:(sim.callups||[]).filter(c=>c.after===seg.id&&!c.done),cond:Math.round(S.cond),morale:Math.round(S.morale),fame:Math.round(S.fame),inj:inj||null};
  L.feedAdd(S,S.year+" "+seg.label,seg.label+" "+lg.length+"경기 "+out.segStat.W+"승 "+out.segStat.D+"무 "+out.segStat.L+"패 · 출전 "+out.segStat.apps+" · "+out.segStat.g+"골 "+out.segStat.as+"도움",0);
  recs.filter(x=>x.rt>=9).forEach(x=>L.feedAdd(S,S.year+" "+seg.label,(x.r?x.r+"R ":"")+"경기 최우수 선수 선정 (평점 "+x.rt+")",1));
  recs.filter(x=>x.g>=3).forEach(x=>L.feedAdd(S,S.year+" "+seg.label,"해트트릭! ("+L.teamName(sim,x.opp)+"전)",1));
  out.growth=L.growSegment(S,sim,seg); out.notes=pn.notes||[]; out.paid=pn.paid||0; out.tier=pn.tierUsed; out.ovr=S.p.ovr;
  sim.seg++; sim.lastSeg=out; return out;
};
L.teamName=function(sim,id){ const t=sim.teams.find(x=>x.id===id); return t?(t.short||t.name):id; };
L.rollInjury=function(S,sim,seg){
  const pl=S.plan||{}, base=.075*(pl.focus==="rest"?.6:1)*(pl.invest==="medical"&&pl.investOk?.65:1)*L.traitFx(S.p).inj*(1-.07*((S.points&&S.points.health)|0))*(1-.1*((S.plan&&S.plan.alloc&&S.plan.alloc.care)|0))*(age(S)>=31?1.3:1)*(S.cond<60?1+(60-S.cond)/50:1)*(L.hasStaff&&L.hasStaff(S,'chef')?.95:1)*(L.hasStaff&&L.hasStaff(S,'physio')?.85:1)*(L.famInjMul?L.famInjMul(S):1)*(L.bodyInjMul?L.bodyInjMul(S):1)*(L.charInjMul?L.charInjMul(S):1);
  if(Math.random()>base) return null; const x=Math.random(); let matches=x<.6?ri(1,3):x<.9?ri(4,8):ri(9,16); matches=Math.max(1,Math.round(matches*L.traitFx(S.p).heal*(L.hasStaff&&L.hasStaff(S,'physio')?.8:1)));
  return {part:pick(["햄스트링","발목","무릎 인대","종아리","허벅지","어깨","갈비뼈","발등"]),matches,severe:matches>=9,seg:seg.id};
};

/* ================= 컵·대륙 대회 ================= */
const R3=(id,rs)=>rs.map(([at,n])=>({at,n}));
const CUPS={
  K1:[{id:"fa",name:"전국컵",rounds:R3("fa",[["h1","32강"],["h2","16강"],["h3","8강"],["h4","4강"],["h4","결승"]])}],
  K2:[{id:"fa",name:"전국컵",rounds:R3("fa",[["h1","32강"],["h2","16강"],["h3","8강"],["h4","4강"],["h4","결승"]])}],
  /* 잉글랜드 1부 리그: 전국컵은 1~5월(3라운드~결승), EFL컵은 9월~이듬해 2월 */
  EPL:[{id:"fa",name:"전국컵",rounds:R3("fa",[["h3","3라운드"],["h3","4라운드"],["h3","5라운드"],["h3","8강"],["h4","4강"],["h4","결승"]])},
       {id:"efl",name:"EFL컵",rounds:R3("efl",[["h1","3라운드"],["h1","4라운드"],["h2","8강"],["h3","4강"],["h3","결승"]])}],
  K3:[{id:"fa",name:"전국컵",part:"32강 진출",rounds:R3("fa",[["h1","1라운드"],["h2","2라운드"],["h3","3라운드"],["h4","32강 진출전"]])}],
  K4:[{id:"fa",name:"전국컵",part:"3라운드 진출",rounds:R3("fa",[["h1","1라운드"],["h2","2라운드"],["h3","3라운드 진출전"]])}],
  YOUTH:[{id:"nat",name:"전국대회",rounds:R3("nat",[["h1","예선"],["h2","16강"],["h3","8강"],["h4","4강"],["h4","결승"]])}]
};
const GENCUP=n=>[{id:"fa",name:n,rounds:R3("fa",[["h1","1라운드"],["h2","2라운드"],["h3","8강"],["h3","4강"],["h4","결승"]])}];
CUPS.J1=null; CUPS.SPL=null; CUPS.EPL2=CUPS.EPL; CUPS.BUN=GENCUP("독일 컵"); CUPS.LAL=GENCUP("스페인 컵"); CUPS.SEA=GENCUP("코파 이탈리아"); CUPS.L1=GENCUP("프랑스 컵"); CUPS.J1=GENCUP("일왕배");
CUPS.J2=CUPS.J1; CUPS.SPL2=CUPS.SPL; CUPS.LAL2=CUPS.LAL; CUPS.BUN2=CUPS.BUN; CUPS.SEA2=CUPS.SEA; CUPS.FR2=CUPS.L1; CUPS.SPL=GENCUP("킹스컵");
L.cupNames=k=>(CUPS[k]||[]).map(c=>c.name);
L.planCups=function(S,sim){
  const list=(CUPS[sim.key]||[]).map(c=>({id:c.id,name:c.name,rounds:c.rounds.slice(),part:c.part||null,alive:true,round:0,res:null}));
  if((sim.key==="K1"||(FL[sim.key]&&FL[sim.key].acl))&&S.acl){ const gr=n=>({n:"조별리그 "+n}); const E=sim.cal==="E";
    const rounds=E?[1,2,3].map(n=>Object.assign(gr(n),{at:"h2"})).concat([4,5,6].map(n=>Object.assign(gr(n),{at:"h3"})),[{at:"h3",n:"16강"},{at:"h4",n:"8강"},{at:"h4",n:"4강"},{at:"h4",n:"결승"}])
      :[1,2,3].map(n=>Object.assign(gr(n),{at:"h3"})).concat([4,5,6].map(n=>Object.assign(gr(n),{at:"h4"})),[{at:"h4",n:"8강"},{at:"h4",n:"4강"},{at:"h4",n:"결승"}]);
    const names=shuffle(["알 호크스","알 패스파인더","알 그리폰","알 마스터스","요코하마 레인저스","비셀 블레이즈","상하이 그리폰","부리람","알 레인저스","에스테그랄 그리폰","멜버른 시티","바라구에"]).slice(0,3);
    list.push({id:"acl",name:"아시아 클럽컵",rounds,alive:true,round:0,res:null,grp:{opps:names.map(nm=>({name:nm,l:sim.lvl+rnd(-6,5)})),pts:[0,0,0,0],gf:[0,0,0,0],ga:[0,0,0,0]}}); }
  if(FL[sim.key]&&FL[sim.key].uel&&S.uel&&!S.ucl) list.push({id:"uel",name:"유럽 유럽 클럽컵2",rounds:[{at:"h1",n:"리그 페이즈 1"},{at:"h1",n:"리그 페이즈 2"},{at:"h2",n:"리그 페이즈 3"},{at:"h3",n:"리그 페이즈 4"},{at:"h3",n:"16강"},{at:"h4",n:"8강"},{at:"h4",n:"4강"},{at:"h4",n:"결승"}],alive:true,round:0,res:null});
  if(FL[sim.key]&&FL[sim.key].ucl&&S.ucl) list.push({id:"ucl",name:"유럽 유럽 클럽컵",rounds:[{at:"h1",n:"리그 페이즈 1"},{at:"h1",n:"리그 페이즈 2"},{at:"h2",n:"리그 페이즈 3"},{at:"h3",n:"리그 페이즈 4"},{at:"h3",n:"16강"},{at:"h4",n:"8강"},{at:"h4",n:"4강"},{at:"h4",n:"결승"}],alive:true,round:0,res:null});
  return list;
};
function cupOpp(S,sim,cup){ const lvl=sim.lvl;
  if(cup.id==="acl") return {name:pick(["알 호크스","알 패스파인더","요코하마 레인저스","비셀 블레이즈","상하이 그리폰","부리람","알 레인저스","에스테그랄 그리폰"]),l:lvl+rnd(-5,8)};
  if(cup.id==="uel") return {name:pick(["로마 울프","리옹 라이언","레인저스","북부 드래곤","로테르담 레드","빅토리아 플젠","슬라비아 프라하","이스탄불 옐로","PAOK","리스본 그린 브라가"]),l:lvl+rnd(-6,5)};
  if(cup.id==="ucl") return {name:pick(["마드리드 크라운","바바리아 뮌헨","생제르","밀라노 블루블랙","카탈루냐 블라우","도르트","아주리","리스본 레드"]),l:lvl+rnd(-7,4)};
  if(sim.key==="YOUTH") return {name:L.schoolName(age(S),S.stage==="univ"),l:lvl+rnd(-6,6)};
  const t=pick(sim.teams.filter(x=>x.id!==sim.myId)); return {name:t.short||t.name,l:(t.l!=null?t.l:lvl)+rnd(-3,3)}; }
L.playCupsAt=function(S,sim,segId){
  const out=[], segLabel=sim.segs.find(s=>s.id===segId).label;
  (sim.cups||[]).forEach(cup=>{ for(let guard=0;guard<8;guard++){ if(!cup.alive) return; const rd=cup.rounds[cup.round]; if(!rd||rd.at!==segId) return;
    const euro=cup.id==="ucl"||cup.id==="uel"||cup.id==="acl", lp=(cup.id==="ucl"||cup.id==="uel")&&/리그 페이즈/.test(rd.n), grp=cup.id==="acl"&&/조별리그/.test(rd.n), two=euro&&/(16강|8강|4강)/.test(rd.n);
    sim.curRound=rd.n; const gi=grp?((+rd.n.match(/(\d)/)[1]-1)%3):0;
    const o=grp?cup.grp.opps[gi]:cupOpp(S,sim,cup); const my=sim.st[sim.myId]||{att:sim.lvl,def:sim.lvl};
    const oS={att:o.l,def:o.l}; let won, pk=null, rec, lost=false, aggTxt=null;
    if(two){ let aF=0,aA=0; for(let leg=0;leg<2;leg++){ const home=leg===0; const H=home?my:oS, A=home?oS:my; const [gh,ga]=playMatch(H,A); const f=home?gh:ga, a=home?ga:gh; aF+=f; aA+=a;
        const r=myRec(S,sim,{r:0,home,opp:o.name,f,a},cup.name); r.cupRound=rd.n+(leg?" 2차전":" 1차전"); r.cup=cup.id; r.res=f>a?"W":f===a?"D":"L"; out.push(r); rec=r; }
      won=aF>aA; if(aF===aA){ const w=Math.random()<.5+(sim.lvl-o.l)/60; pk=w?[5,4]:[3,4]; won=w; rec.pk=pk; } aggTxt=aF+":"+aA; rec.agg=aggTxt; rec.res=won?"W":"L"; rec.cupRound=rd.n+" 2차전 (합계 "+aF+":"+aA+")"; }
    else { const home=Math.random()<.5; const H=home?my:oS, A=home?oS:my; const [gh,ga]=playMatch(H,A); const f=home?gh:ga, a=home?ga:gh;
      if(f===a&&!lp&&!grp){ const w=Math.random()<.5+(sim.lvl-o.l)/60; pk=w?[5,4]:[3,4]; }
      won=f>a||(f===a&&pk&&pk[0]>pk[1]); lost=f<a;
      rec=myRec(S,sim,{r:0,home,opp:o.name,f,a},cup.name); rec.cupRound=rd.n; rec.pk=pk; rec.res=won?"W":(f===a?"D":"L"); rec.cup=cup.id; out.push(rec); }
    if(grp){ const G=cup.grp; const pts=f2=>f2>0?3:f2===0?1:0; const f=rec.f, a=rec.a; G.pts[0]+=f>a?3:f===a?1:0; G.gf[0]+=f; G.ga[0]+=a; G.pts[gi+1]+=a>f?3:f===a?1:0; G.gf[gi+1]+=a; G.ga[gi+1]+=f;
      const oth=[1,2,3].filter(x=>x!==gi+1); const A1=G.opps[oth[0]-1], B1=G.opps[oth[1]-1]; const [ga1,gb1]=playMatch({att:A1.l,def:A1.l},{att:B1.l,def:B1.l}); G.pts[oth[0]]+=ga1>gb1?3:ga1===gb1?1:0; G.pts[oth[1]]+=gb1>ga1?3:ga1===gb1?1:0; G.gf[oth[0]]+=ga1; G.ga[oth[0]]+=gb1; G.gf[oth[1]]+=gb1; G.ga[oth[1]]+=ga1;
      const mr=+rd.n.match(/(\d)/)[1]; rec.cupRound=rd.n+" · 승점 "+G.pts[0]; if(mr===6){ const order=[0,1,2,3].sort((x,y)=>G.pts[y]-G.pts[x]||(G.gf[y]-G.ga[y])-(G.gf[x]-G.ga[x])); const rank=order.indexOf(0)+1; cup.grpRank=rank; if(rank>2){ cup.alive=false; cup.res="조별리그 탈락 ("+rank+"위)"; } else cup.round++; } else cup.round++; }
    else if(lp){ if(lost) cup.lpLoss=(cup.lpLoss||0)+1; const last=cup.round===3; if(last&&(cup.lpLoss||0)>=3){ cup.alive=false; cup.res="리그 페이즈 탈락"; } else cup.round++; }
    else if(!won){ cup.alive=false; cup.res=rd.n+" 탈락"; }
    else if(cup.round===cup.rounds.length-1){ cup.alive=false; if(cup.part) cup.res=cup.part; else { cup.res="우승"; sim.cupTitles.push(cup.name+" 우승"); } }
    else cup.round++;
    L.feedAdd(S,S.year+" "+segLabel,cup.name+" "+rd.n+" "+((lp||grp)?(rec.res==="W"?"승리":rec.res==="D"?"무승부":"패배"):(won?"통과":"탈락"))+(rec.min?" · "+(rec.g?rec.g+"골 ":"")+(rec.as?rec.as+"도움 ":"")+"평점 "+rec.rt:" · 결장"),won||lp?0:-1);
  } });
  return out;
};

/* ================= 시즌 마무리 ================= */
L.finishSeason=function(S){
  const sim=S.sim, p=S.p, ag=age(S), R={year:S.year,age:ag,ovr0:sim.ovrStart,club:Object.assign({},S.club),plan:S.plan||{},youth:sim.key==="YOUTH",leagueKey:sim.key};
  const tab=Object.values(sim.tab).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);
  const me=sim.tab[sim.myId]; R.rank=tab.findIndex(t=>t.id===sim.myId)+1; R.N=tab.length;
  R.W=me.w;R.D=me.d;R.L=me.l;R.gf=me.gf;R.ga=me.ga; R.pts=me.pts;
  R.table=tab.map(t=>({id:t.id,name:L.teamName(sim,t.id),pts:t.pts,w:t.w,d:t.d,l:t.l,gf:t.gf,ga:t.ga,me:t.id===sim.myId}));
  const m=sim.my; R.apps=m.apps;R.starts=m.starts;R.minutes=m.min;R.goals=m.g;R.assists=m.a;R.cs=m.cs;R.mom=m.mom; R.rating=m.rtW?r1(m.rtSum/m.rtW):0;
  R.sr=r1(sim.sr); R.role=sim.role0; R.lvl=r1(sim.lvl); R.matches=sim.recs;
  R.leagueName=S.stage==="univ"?"대학 리그":sim.key==="YOUTH"?"유소년 리그":sim.key==="K1"&&S.club.lg==="MIL"?"레전드리그1 (김천 새벽)":L.lgLabel(sim.key);
  R.injury=sim.injuries.length?{text:sim.injuries.map(i=>i.part+" 부상 "+i.matches+"경기 결장").join(" · "),severe:sim.injuries.some(i=>i.severe)}:null;
  R.derbies=(sim.derbies||[]).slice(); R.trophies=sim.cupTitles.slice(); R.awards=[]; R.cups=(sim.cups||[]).map(c=>({name:c.name,res:c.res||(c.alive?"진행 중":"-")}));
  if(sim.key==="YOUTH"){ if(R.rank<=2&&Math.random()<.5) R.trophies.push(S.stage==="univ"?"대학 리그 우승":"주말리그 우승"); }
  else if(R.rank===1) R.trophies.push(L.lgLabel(sim.key)+" 우승");
  /* 2군·사실상 못 뛴 시즌에는 1군의 우승 메달을 받지 못해요 */
  if(sim.key!=="YOUTH"&&R.trophies.length&&(S.team==="2군"||sim.sr<.12)&&R.apps<10){ R.trophies=[]; R.noMedal=true; }
  S.nextAcl=(sim.key==="K1"&&R.rank<=3)||!!(FL[sim.key]&&FL[sim.key].acl&&R.rank<=FL[sim.key].acl); S.nextUcl=!!(FL[sim.key]&&R.rank<=FL[sim.key].ucl); S.acl=S.nextAcl; S.ucl=S.nextUcl;
  S.nextUel=!!(FL[sim.key]&&FL[sim.key].uel&&!S.nextUcl&&R.rank>=FL[sim.key].uel[0]&&R.rank<=FL[sim.key].uel[1]); S.uel=S.nextUel;
  /* 다음 해 승강을 위해 두 리그 순위를 저장 */
  if(sim.key==="K1"||sim.key==="K2"||sim.key==="K3"||sim.key==="K4"){ S.lastTables={K1:null,K2:null,K3:null,K4:null}; S.lastTables[sim.key]=tab.map(t=>t.id); ["K1","K2","K3","K4"].forEach(o=>{ if(o!==sim.key) S.lastTables[o]=L.otherTable(S,o); }); }
  { const tp=topOf(sim.key); if(tp){ S.lastFT={}; S.lastFT[sim.key]=tab.map(t=>t.id); const o=sim.key===tp?PAIRS[tp][0]:tp; S.lastFT[o]=L.otherTable(S,o); } }
  R.natEvents=sim.natRecs.slice(); R.caps=sim.capsAuto||0; R.intGoals=sim.intGoalsAuto||0;
  /* 연봉 옵션(인센티브) 정산 */
  R.bonus=L.settleIncentives(S,R);
  R.board=L.buildBoard(S,sim,R);
  L.awardsFor(S,R,sim);
  L.seasonPost(S,R,sim); { const sc=L.scoutCheck(S); if(sc) R.scoutFinal=sc; }
  if(L.coachSeasonEnd) L.coachSeasonEnd(S); if(L.pcSeasonEnd) L.pcSeasonEnd(S);
  R.nextAcl=!!S.nextAcl; R.nextUcl=!!S.nextUcl; R.nextUel=!!S.nextUel;
  if(L.reactions){ try{ R.react=L.reactions(S,R); if(R.react) L.feedAdd(S,S.year+" 반응","📰 "+R.react.headline,0); }catch(e){ R.react=null; } }
  if(S.club&&L.lowTier(S.club.lg)&&S.stage==="pro"){ const cp=L.capOf(S.club.lg,S.p.ovr); if(S.salary>cp) S.salary=cp; }   // 3·4부 연봉 상한(능력치가 떨어지면 함께 조정)
  L.commitSeason(S,R);
  S.lastR=R; S.sim=null; S.phase="result"; return R;
};

/* ================= 연봉 옵션(인센티브) ================= */
/* 계약 때 고르는 조건부 보너스: 기본급이 조금 낮아지는 대신, 조건을 채우면 시즌 끝에 현금으로 받아요 */
L.incentiveOptions=function(S,offerSalary){
  const last=[...S.history].reverse().find(h=>!h.youth)||{apps:20,goals:5,assists:3,cs:6,rating:6.5}; const pos=S.p.pos;
  const bonus=Math.max(.2,r1(offerSalary*.18));
  const mk=(id,type,n,label,exp,spread)=>({id,type,n,label,bonus,prob:Math.round(clamp(logistic((exp-n)/spread),.05,.95)*100)});
  const l=last, opts=[];
  if(pos==="FW"){ opts.push(mk("g",'goals',12,"리그 12골 이상",l.goals,3)); opts.push(mk("a",'assists',6,"도움 6개 이상",l.assists,2.2)); }
  else if(pos==="MF"){ opts.push(mk("a",'assists',6,"도움 6개 이상",l.assists,2.2)); opts.push(mk("g",'goals',5,"골 5개 이상",l.goals,2)); }
  else if(pos==="DF"){ opts.push(mk("c",'cs',10,"무실점 경기 10회 이상 (선발 출전)",l.cs||6,3)); opts.push(mk("g",'goals',3,"골 3개 이상",l.goals,1.5)); }
  else { opts.push(mk("c",'cs',12,"무실점 경기 12회 이상",l.cs||8,3)); }
  opts.push(mk("p",'apps',30,"30경기 이상 출전",l.apps,5));
  opts.push(mk("r",'rating',7.0,"시즌 평점 7.0 이상",l.rating||6.4,.35));
  opts.push(mk("t",'title',1,"리그 우승",l.rank===1?1.2:.2,.8));
  return opts;
};
/* 선택한 옵션의 기대 보너스만큼 기본급을 낮춰요 (기대값의 60%) */
L.applyIncentives=function(S,offer,chosen){
  const opts=L.incentiveOptions(S,offer.offer); S.incentives=chosen.map(id=>opts.find(o=>o.id===id)).filter(Boolean).map(o=>({type:o.type,n:o.n,label:o.label,bonus:o.bonus,prob:o.prob}));
  const ev=S.incentives.reduce((s,o)=>s+o.bonus*o.prob/100,0); return Object.assign({},offer,{offer:Math.max(.3,r1(offer.offer-ev*.6)),incentiveEv:r1(ev)});
};
L.settleIncentives=function(S,R){
  const hit=[]; let total=0; (S.incentives||[]).forEach(o=>{
    const v=o.type==="goals"?R.goals:o.type==="assists"?R.assists:o.type==="cs"?R.cs:o.type==="apps"?R.apps:o.type==="rating"?R.rating:o.type==="title"?(R.rank===1&&!R.youth?1:0):0;
    if(v>=o.n){ hit.push(o.label); total+=o.bonus; } });
  R.bonusHit=hit; if(total>0){ S.funds=r1(S.funds+total); S.career.bonus=r1((S.career.bonus||0)+total); }
  return r1(total);
};

/* ================= 성장 ================= */
L.growth=function(S,R){
  const p=S.p, ag=age(S), plan=S.plan||{}, before=p.ovr, d=POSDEF[p.pos]; const al=plan.alloc||{}; const tf=L.traitFx(p); const rate=ageRate(ag+tf.shift,p.pos);
  const gap=clamp((p.pot-p.ovr)/10,.04,ag<19?1.0:1.7);
  const srG=S.team==="2군"?Math.max(R.sr,.5):R.sr;
  /* 주전으로 뛰는 경험이 성장의 핵심: 리그 경기 대비 실제 출전 시간. 하부 리그 주전이 상위 리그 후보보다 더 크고, 여러 해 못 뛰면 정체·하락해요 */
  const lgG=Math.max(8,(R.W||0)+(R.D||0)+(R.L||0)), share=R.military?.5:clamp((R.minutes||0)/(lgG*90),0,1);
  const sick=!!(R.injury&&R.injury.severe)||R.military;
  if(!sick&&ag>=17&&ag<=28){ if(share<.25) S.benchYrs=(S.benchYrs||0)+1; else if(share>.5) S.benchYrs=0; } else if(share>.5) S.benchYrs=0;
  const ageF=ag<=21?1.15:ag<=24?1:ag<=27?.6:.25, benchF=sick?0:Math.min(3,S.benchYrs||0);
  let ptBonus=((srG-.4)*.4+(share-.45)*1.0)*ageF*(ag<26?1:.5)-(share<.25&&!sick?.25*benchF:0);
  const majors=(R.trophies||[]).filter(t=>/우승/.test(t)&&!/주말리그|유소년|대학/.test(t)).length;
  if(share>=.5&&R.rating>=6.5&&majors>0&&!sick) ptBonus+=Math.min(.36,.12*majors)*ageF*(ag<30?1:.5);   // 우승 경험: 주전으로 기여한 경우에만
  R.playShare=share;
  const ty=TYPES[p.pos].find(x=>x[0]===p.type);
  const sorted=d.stats.map(([k])=>k).sort((a,b)=>p.stats[a]-p.stats[b]); const weakest=sorted[0], strongest=sorted[sorted.length-1];
  d.stats.forEach(([k],i)=>{
    let dv=rate>0?(rate*gap+ptBonus)*tf.grow:rate*tf.decl; if(rate>0) dv+=.22*(PHYS.has(k)?(al.body|0):(al.skill|0)); dv+=PHYS.has(k)?tf.phys:tf.tech;
    if(PHYS.has(k)&&ag>=28) dv-=.5+(ag-28)*.18;
    dv+=(ty?ty[2][i]:0)*.025;
    if(plan.focus===k) dv+=1.0*tf.focus;
    if(plan.focus==="coach"&&plan.coachOk) dv+=.35;
    if(plan.focus==="rest") dv-=.15;
    if(plan.invest&&plan.investOk){ if(plan.invest==="weak"&&k===weakest) dv+=.8; if(plan.invest==="strong"&&k===strongest) dv+=.5; }
    dv+=rnd(-1.1,1.1)*tf.vari*clamp(1-.12*(al.mind|0)+.16*(al.camp|0),.4,2);
    if(R.injury&&R.injury.severe&&PHYS.has(k)) dv-=1.0;
    if(p.ovr>=p.pot+1&&dv>0) dv=Math.min(dv,.2);
    p.stats[k]=clamp(Math.round(p.stats[k]+dv),10,99);
  });
  /* 해외 캠프: 대박(각성) 또는 과열(번아웃) */
  R.famNote=null; if((al.camp|0)>0){ const c=al.camp|0, x=Math.random();
    if(x<.035*c){ d.stats.forEach(([k])=>{ p.stats[k]=clamp(p.stats[k]+ri(1,3),10,99); }); p.pot=Math.min(99,p.pot+ri(2,5)); R.famNote="해외 캠프에서 눈을 떴어요! 능력치가 한 단계 뛰었어요."; L.addMoment(S,"각성","각성","해외 캠프에서 재능이 한 단계 열렸어요."); }
    else if(x>1-.02*c){ d.stats.forEach(([k])=>{ p.stats[k]=clamp(p.stats[k]-1,10,99); }); S.morale=clamp(S.morale-15,0,100); R.famNote="무리한 일정에 몸과 마음이 지쳤어요. 약간 후퇴했어요."; } }
  p.ovr=ovrOf(p); p.peak=Math.max(p.peak,p.ovr); R.ovr1=p.ovr; R.dOvr=p.ovr-before;  if(share>=.5&&R.rating>=6.8&&majors>=1&&ag<=26&&p.pot<(p.pot0||p.pot)+8&&Math.random()<.25) p.pot=Math.min(99,p.pot+1);
  if((S.benchYrs||0)>=2&&ag<=26&&Math.random()<.5) p.pot=Math.max(p.ovr,p.pot-1);
  if(R.rating>=7.3&&ag<=27) p.pot=Math.min(99,(p.pot0||p.pot)+8,p.pot+(Math.random()<.5?1:0)); else if(R.rating>0&&R.rating<6.1&&ag<24) p.pot=Math.max(p.ovr,p.pot-(Math.random()<.4?1:0));
  S.trust=clamp(S.trust+((R.sr-.5)*.25+(R.rating>7?.05:0))*(((R.sr-.5)>0)?tf.trust:1),.05,.95);
  if(L.perkSeason){ R.perkNotes=L.perkSeason(S); }
  S.rep=clamp(S.rep+(R.rating-6.4)*4+(R.awards.length*6)+(R.trophies.length*3),0,100);
  S.fame=Math.max(0,S.fame+L.fameStep(S,((R.goals*.5+R.assists*.3)/Math.max(1,(R.apps/20))+(R.awards.length*6)+R.trophies.length*4)*tf.fame)); S.fameMax=Math.max(S.fameMax||0,S.fame); S.rep=clamp(S.rep+(L.charOf(S)-50)*.04,0,100);
};
L.commitSeason=function(S,R){
  const c=S.career; L.pushValue(S);
  S.history.push(L.slimRecord(R,S));
  R.awards.forEach(a=>S.awards.push({year:S.year,name:a,youth:!!R.youth,comp:L.awardComp(a,R)}));
  R.trophies.forEach(t=>S.trophies.push({year:S.year,name:t,club:S.club.name,youth:!!R.youth}));
  if(!R.youth) S.clubYears[S.club.name]=(S.clubYears[S.club.name]||0)+1;
  if(FL[R.leagueKey]) S.foreignYears++;
  if(R.youth){ c.youthApps+=R.apps; c.youthGoals+=R.goals; R.awards.concat(R.trophies).forEach(t=>L.addMoment(S,t,t,S.year+"년 "+t)); }
  else { c.apps+=R.apps; c.starts+=R.starts; c.minutes+=R.minutes; c.goals+=R.goals; c.assists+=R.assists; c.cs+=R.cs||0; c.mom+=R.mom||0; if(R.rating>0){ c.ratingSum+=R.rating*R.apps; c.ratingN+=R.apps; } L.momentsFor(S,R); }
  S.funds=r1(S.funds+(R.youth?(S.family&&S.family.allow!=null?S.family.allow:(L.familyPts(S)*.035+.04)):S.salary*.7));
  if(!R.youth){ c.earned=r1((c.earned||0)+S.salary); c.peakSal=Math.max(c.peakSal||0,S.salary); }
};
/* 수상이 어느 대회(리그)에서 나온 건지 */
L.awardComp=function(name,R){ if(/^KFA/.test(name)) return "대한축구회"; if(/^AFC/.test(name)) return "AFC"; if(/황금공/.test(name)) return "황금공"; if(/신예 트로피/.test(name)) return "프랑스 풋볼"; if(/황금 신예/.test(name)) return "투토스포르트"; if(/유럽 클럽컵|유럽컵/.test(name)) return "유럽 유럽 클럽컵"; return R.leagueName||""; };
/* 커리어 팀 흐름: 시간 순서대로 (복무 포함) */
L.clubChain=function(S){ const out=[]; S.history.filter(h=>!h.youth).forEach(h=>{ const nm=h.military?"군 복무":h.club; if(!out.length||out[out.length-1].name!==nm) out.push({name:nm,from:h.year,to:h.year,mil:!!h.military||h.lg==="MIL"}); else out[out.length-1].to=h.year; }); return out; };
L.slimRecord=function(R,S){ return {year:R.year,age:R.age,club:R.club.name,clubId:R.club.id,lg:R.club.lg,leagueName:R.leagueName,rank:R.rank,N:R.N,W:R.W,D:R.D,L:R.L,apps:R.apps,starts:R.starts,minutes:R.minutes,goals:R.goals,assists:R.assists,cs:R.cs||0,rating:R.rating,mom:R.mom||0,
  ovr0:R.ovr0,ovr1:R.ovr1,awards:R.awards.slice(),trophies:R.trophies.slice(),role:R.role,salary:S.salary,caps:R.caps||0,military:!!R.military,injury:R.injury?R.injury.text:null,youth:!!R.youth,team:S.team,cups:R.cups,natEvents:R.natEvents,ballon:R.ballon||null,bonus:R.bonus||0,dv:(R.derbies||[]).map(d=>[d.name,d.opp,d.res,d.g||0]),st:POSDEF[S.p.pos].stats.map(([k])=>S.p.stats[k])}; };
L.momentsFor=function(S,R){
  const c=S.career, h=S.history.filter(x=>!x.youth);
  if(h.length===1&&R.apps>0) L.addMoment(S,"1군 데뷔","1군 데뷔","프로 무대에서 "+R.apps+"경기에 출전하며 커리어를 시작했어요.");
  if(R.goals>0&&c.goals-R.goals===0) L.addMoment(S,"첫 골","프로 첫 골","프로 무대에서 첫 골을 터뜨렸어요.");
  R.awards.forEach(a=>L.addMoment(S,a,a,R.year+"시즌 "+a+" 수상"));
  R.trophies.forEach(t=>L.addMoment(S,t,t,t+"의 주인공이 되었어요."));
  [[100,"apps","100경기 출전"],[200,"apps","200경기 출전"],[300,"apps","300경기 출전"],[50,"goals","50골"],[100,"goals","100골"],[200,"goals","200골"],[50,"assists","50도움"],[100,"assists","100도움"]].forEach(([n,k,t])=>{ if(c[k]>=n&&c[k]-R[k==="apps"?"apps":k==="goals"?"goals":"assists"]<n) L.addMoment(S,t,t,"통산 "+t+"을 달성했어요."); });
  if(R.injury&&R.injury.severe) L.addMoment(S,"큰 부상","큰 부상",R.injury.text+" — 긴 재활 끝에 복귀를 준비해요.");
  if(R.dOvr>=4) L.addMoment(S,"급성장","급성장","한 시즌 만에 능력치가 "+R.dOvr+" 올랐어요.");
  const prev=h[h.length-2]; if(prev&&prev.clubId!==R.club.id) L.addMoment(S,"이적","이적",R.club.name+" 유니폼을 입었어요.");
};

/* ================= 계약 · 이적 ================= */
L.contractOffer=function(S){
  const last=S.history[S.history.length-1]||{}; const ag=age(S)+1;
  const lg=S.club.lg==="MIL"?"K1":(S.loan&&S.loan.parent&&S.loan.parent.lg)||S.club.lg; const market=L.salaryOf(S.p.ovr,ag,lg);
  const perf=clamp((last.rating||6.2)-6.4,-1,2)*.07, trustF=clamp(S.trust-.4,-.3,.4)*.25;
  /* 연봉은 해마다 시장가에 서서히 수렴해요 (갑자기 폭등·폭락하지 않게 현재 연봉의 70%~160% 안) */
  let offer=market*(1+perf+trustF)*(1+Math.min(.5,((S.valueBoost||1)-1)*.4))*(S.rep>70?1.06:1)*((L.hasStaff&&L.hasStaff(S,"agent"))?1.04:1)*(L.isStar&&L.isStar(S)?1.06:1); offer=clamp(offer,Math.min(S.salary*.7,market*1.2),Math.min(Math.max(S.salary*1.6,market),market*1.35)); offer=r1(Math.max(lg==="K4"?.2:.3,offer)); { const cap=L.capOf(lg,S.p.ovr); if(cap) offer=Math.min(offer,cap); }
  return {last:S.salary,offer,rate:Math.round((offer/Math.max(.1,S.salary)-1)*100),years:Math.min(lg==="K4"?2:9,ag<=23?3:ag<=30?2:1),market};
};
L.negotiate=function(S,offer){ const x=Math.random(), mult=x<.45?1.12:x<.8?1.0:.93; return {offer:r1(offer.offer*mult),mult,rate:Math.round((offer.offer*mult/Math.max(.1,S.salary)-1)*100),years:offer.years}; };
L.acceptContract=function(S,offer){ if(S.club&&S.club.lg==="MIL"||S.military==="serving"||S.military==="sangmu") return; S.salary=offer.offer; S.contractYears=offer.years; };

/* 이적 제의: 선수의 수준(능력치+평판)에 맞는 구단만 와요. 수준이 한참 낮은 팀은 오지 않고, 해외는 잉글랜드 1부 리그뿐이에요 */
function foreignBench(S){ const h=S.history.filter(x=>!x.youth); const l=h[h.length-1]; return !!l&&L.isForeign(l.lg)&&l.apps<15; }
/* ===== 해외 이적 규정(워크퍼밋·외국인 쿼터) =====
 * 영국: 취업비자(A매치·능력치·해외 경력) · 유럽 4대 리그: 외국인 쿼터(실력이 구단 평균 이상이면 예외) · 일본/사우디: 외국인 쿼터
 * 어릴 때 그 나라 아카데미에서 자란 선수(해외 유스)는 규정을 면제받아요. */
const CTY={EPL:"ENG",EPL2:"ENG",LAL:"ESP",LAL2:"ESP",BUN:"GER",BUN2:"GER",SEA:"ITA",SEA2:"ITA",L1:"FRA",FR2:"FRA"};
L.permit=function(S,lg,club){
  const p=S.p, caps=(S.career&&S.career.caps)||0, fy=S.foreignYears||0, cty=CTY[lg];
  if(cty&&S.youthCty===cty) return {ok:true,why:"유스 시절 그 나라에서 자라 규정이 면제돼요"};
  if(lg==="EPL"||lg==="EPL2"){ const hard=lg==="EPL"; const okc=caps>=(hard?15:10)||p.ovr>=(hard?82:78)||fy>=(hard?2:1);
    return okc?{ok:true,why:""}:{ok:false,why:"영국 취업비자(워크퍼밋) 조건 미달 — A매치 "+(hard?15:10)+"회 또는 능력치 "+(hard?82:78)+" 또는 해외 "+(hard?2:1)+"시즌 경력이 필요해요 (지금 A매치 "+caps+"회 · 능력치 "+p.ovr+")"}; }
  if(cty){ const okq=p.ovr>=club.l-1||fy>=3||caps>=30; return okq?{ok:true,why:""}:{ok:false,why:"외국인 쿼터가 가득 찼어요 — 능력치가 구단 평균("+Math.round(club.l)+") 이상이거나 해외 3시즌·A매치 30회면 예외예요 (지금 "+p.ovr+")"}; }
  if(lg==="J1"||lg==="SPL"){ const ok=p.ovr>=club.l-3||age(S)>=27; return ok?{ok:true,why:""}:{ok:false,why:"외국인 쿼터 때문에 구단 평균("+Math.round(club.l)+")에 근접한 능력치가 필요해요"}; }
  return {ok:true,why:""};
};
L.transferOffers=function(S,opts){
  S.permitBlocked=[];
  opts=opts||{}; const p=S.p, ag=age(S)+1, out=[]; if(S.military==="serving"||S.military==="sangmu"||(S.club&&S.club.lg==="MIL")||S.stage!=="pro") return out;
  const score=p.ovr+S.rep*.03+L.fameEff(S.fame)*.04, cur=S.club.lg==="MIL"?"K1":S.club.lg, foreign=L.isForeign(cur);
  const myLvl=(()=>{ const c=L.leagueClubs(S,cur).find(x=>x.id===S.club.id); return c?c.l:70; })();
  const add=(c,lg,tag)=>{ const sr=L.startRateAt(p.ovr,c.l,S.trust*.8,p); const mkt0=L.salaryOf(clamp(p.ovr+Math.max(0,Math.min(4,(c.l-p.ovr)*.3))+1,p.ovr,99),ag,lg), mkt=Math.min(mkt0,(L.isForeign(lg)&&!foreign)?Math.max(S.salary*9,S.salary+25):Math.max(S.salary*3.2,S.salary+6));   // 레전드리그에서 빛난 선수가 해외 빅리그로 갈 때는 몸값이 크게 뛸 수 있어요   // 제안 연봉은 내 능력치가 기준이고, 현재 연봉에서 갑자기 몇 배로 뛰지 않아요
    if(foreign&&!L.isForeign(lg)&&ag<33&&S.salary>=10&&mkt<S.salary*.35) return;
    const rawSal=L.isForeign(lg)===foreign?Math.max(mkt,r1(S.salary*(c.l>=myLvl-1?1.05:.85))):mkt, capL=(lg==="K1"||lg==="K2"||L.lowTier(lg))?L.capOf(lg,p.ovr):null; const rs2=rawSal*(L.isForeign(lg)&&L.traitFx(p).adapt?1.08:1)*(1+Math.min(.6,((S.valueBoost||1)-1)*.45));
    out.push({club:L.clubRef(S,c,lg),lvl:r1(c.l),salary:r1(capL?Math.min(capL,rs2):rs2),years:lg==="K4"?(ag<=24?2:1):ag<=24?4:3,tag:tag||L.lgLabel(lg),role:L.roleLabel(sr),foreign:L.isForeign(lg),sr}); };
  const domesticOk=!foreign||ag>=30||S.foreignYears>=6||(foreignBench(S)&&ag>=26);
  if(domesticOk){
    let cands=L.leagueClubs(S,"K1").map(c=>Object.assign({},c,{_lg:"K1"})).concat(L.leagueClubs(S,"K2").map(c=>Object.assign({},c,{_lg:"K2"})));
    if((p.ovr<=62||cur==="K3"||cur==="K4")&&!foreign) cands=cands.concat(L.leagueClubs(S,"K3").map(c=>Object.assign({},c,{_lg:"K3"})));   // 능력치가 낮은 선수에게는 3부 구단도 제안해요
    if((p.ovr<=54||cur==="K4")&&!foreign&&S.salary<=1.2) cands=cands.concat(L.leagueClubs(S,"K4").map(c=>Object.assign({},c,{_lg:"K4"})));   // 더 낮은 선수·4부 선수에게는 4부 구단도 제안해요
    cands=cands.filter(c=>c.id!==S.club.id);
    const ok=cands.filter(c=>{ if(c.l<p.ovr-7&&!foreign) return false; if(foreign&&c.l<p.ovr-9) return false; const sr=L.startRateAt(p.ovr,c.l,S.trust*.8,p); return sr>.4&&c.l<=score+6&&!(c._lg==="K2"&&p.ovr>72)&&!(c._lg==="K3"&&(p.ovr>66||(cur==="K1"&&S.salary>3)))&&!(c._lg==="K4"&&(p.ovr>56||cur==="K1"||cur==="K2")); });
    const picked=shuffle(ok).slice(0,opts.max||3);
    /* K3에서 잘한 선수: 레전드리그2 구단의 승격 제안 */
    if(cur==="K3"){ const lh=S.history.filter(x=>!x.youth&&!x.military), lastH=lh[lh.length-1];
      if(lastH&&lastH.rating>=6.6&&lastH.apps>=15&&p.ovr>=54){ const up=shuffle(cands.filter(c=>c._lg==="K2"&&c.l<=p.ovr+9&&L.startRateAt(p.ovr,c.l,S.trust*.8,p)>=.3)).slice(0,2); up.forEach(c=>{ if(!picked.includes(c)) picked.push(c); c._promo=true; }); } }
    /* K4에서 잘한 선수: 레전드리그3 구단의 승격 제안 */
    if(cur==="K4"){ const lh=S.history.filter(x=>!x.youth&&!x.military), lastH=lh[lh.length-1];
      if(lastH&&lastH.rating>=6.6&&lastH.apps>=14&&p.ovr>=44){ const up=shuffle(cands.filter(c=>c._lg==="K3"&&c.l<=p.ovr+8&&L.startRateAt(p.ovr,c.l,S.trust*.8,p)>=.3)).slice(0,2); up.forEach(c=>{ if(!picked.includes(c)) picked.push(c); c._promo="K3"; }); } }
    picked.forEach(c=>add(c,c._lg,c._promo?("승격 제안 · "+(c._promo==="K3"?"레전드리그3":"레전드리그2")):null));
  }
  if(p.ovr>=72&&ag<=32){
    const minL=foreign?myLvl-2:p.ovr-6;
    const fo=[]; ["EPL","BUN","LAL","SEA","L1","J1","SPL"].forEach(k=>{ if(k==="SPL"&&(ag<26||p.ovr<66)) return; L.leagueClubs(S,k).filter(c=>c.id!==S.club.id&&c.l<=p.ovr+6&&c.l>=Math.max(minL,p.ovr-9)&&!((k==="EPL"||k==="LAL"||k==="BUN")&&c.l>p.ovr+3&&S.rep<60)).forEach(c=>fo.push([c,k])); });
    shuffle(fo).filter(([c,k])=>{ const pm=L.permit(S,k,c); if(!pm.ok&&S.permitBlocked.length<4) S.permitBlocked.push({club:c.name,lg:k,why:pm.why}); return pm.ok; }).slice(0,3).forEach(([c,k])=>add(c,k,L.lgLabel(k)));
  }
  out.sort((x,y)=>y.lvl-x.lvl||y.salary-x.salary);
  return out;
};
/* ===== 임대: 벤치에 있는 선수가 1년 동안 다른 팀에서 주전으로 뛰며 경험을 쌓고 돌아와요 ===== */
L.loanOffers=function(S){
  const p=S.p, ag=age(S)+1; if(S.stage!=="pro"||ag>29||S.loan||S.military==="serving"||S.military==="sangmu"||(S.club&&S.club.lg==="MIL")) return [];
  const cur=S.club.lg, myLvl=(()=>{ const c=L.leagueClubs(S,cur).find(x=>x.id===S.club.id); return c?c.l:70; })();
  const srNow=L.startRateAt(p.ovr,myLvl,S.trust*.8,p); if(srNow>=.45) return [];   // 이미 주전·로테이션이면 임대가 필요 없어요
  const pairs={K1:["K2","K1"],K2:["K2","K3"],K3:["K3","K4"],K4:["K4"],EPL:["EPL2","EPL"],LAL:["LAL2","LAL"],BUN:["BUN2","BUN"],SEA:["SEA2","SEA"],L1:["FR2","L1"],J1:["J2","J1"],SPL:["SPL2","SPL"],EPL2:["EPL2"],LAL2:["LAL2"],BUN2:["BUN2"],SEA2:["SEA2"],FR2:["FR2"],J2:["J2"],SPL2:["SPL2"]}[cur]||[];
  const out=[];
  pairs.forEach(lg=>{ try{ L.leagueClubs(S,lg).filter(c=>c.id!==S.club.id&&c.l<=myLvl-2&&c.l>=p.ovr-8).forEach(c=>{ const sr=L.startRateAt(p.ovr,c.l,S.trust*.8+.1,p); if(sr>=.65) out.push({club:L.clubRef(S,c,lg),lvl:r1(c.l),salary:S.salary,years:1,tag:"임대 · "+L.lgLabel(lg),role:L.roleLabel(sr),sr,loan:true,foreign:L.isForeign(lg)}); }); }catch(e){} });
  return shuffle(out).slice(0,3);
};
L.doLoan=function(S,offer){
  if(S.loan) return false; S.loan={parent:S.club,salary:S.salary,years:S.contractYears,from:S.year};
  S.club=offer.club; S.team="1군"; if(L.lowTier(offer.club.lg)){ const cp=L.capOf(offer.club.lg,S.p.ovr); if(S.salary>cp){ S.salary=cp; S.loan.cut=true; } }   // 3·4부로 임대되면 임대 기간 연봉은 그 리그 상한에 맞춰요(복귀하면 원래대로)
  L.addMoment(S,"임대 이적","이적",offer.club.name+"(으)로 1년 임대를 떠나요. 주전으로 뛰며 경험을 쌓을 기회예요.");
  L.feedAdd(S,S.year+" 임대",offer.club.name+" 1년 임대 (원소속 복귀)",0); return true;
};
L.loanReturn=function(S){
  const lo=S.loan; if(!lo) return; const last=S.history[S.history.length-1]||{};
  S.club=lo.parent; S.loan=null; if(lo.cut) S.salary=lo.salary;
  const good=(last.rating||6)>=6.8&&(last.apps||0)>=20, bad=(last.rating||6)<5.8;
  S.trust=clamp(S.trust+(good?.12:bad?-.04:.04),.05,.95); L.addMoment(S,"임대 복귀","복귀",S.club.name+"(으)로 돌아왔어요."+(good?" 임대에서의 활약으로 감독의 눈이 달라졌어요.":bad?" 임대에서 아쉬움이 남았어요.":""));
  L.feedAdd(S,S.year+" 임대 복귀",S.club.name+"(으)로 복귀"+(good?" (감독 신뢰 ▲)":""),good?1:0);
};
L.doTransfer=function(S,offer){
  if(S.military==="serving"||S.military==="sangmu"||(S.club&&S.club.lg==="MIL")) return false;
  const rvMove=L.isRivalMove?L.isRivalMove(S,offer.club):null; const prevLg=S.club&&S.club.lg; if(rvMove){ S.fame=Math.max(0,S.fame-8); S.rep=clamp(S.rep-4,0,100); if(L.charDelta) L.charDelta(S,-4,"의리: 라이벌 구단으로 이적"); L.addMoment(S,"라이벌 이적","이적","라이벌 "+offer.club.name+"(으)로 이적해 팬들이 분노했어요. ("+rvMove+")"); L.feedAdd(S,S.year+" 이적","라이벌 "+offer.club.name+"(으)로 이적! 팬들의 분노 ("+rvMove+")",-1); S.rivalMoves=(S.rivalMoves||0)+1; } S.club=offer.club; S.salary=offer.salary; S.contractYears=offer.years; S.trust=L.traitFx(S.p).adapt?.5:.35; S.team="1군";
  if(L.isForeign(offer.club.lg)&&!L.isForeign(prevLg)) L.addMoment(S,"해외 진출","해외 진출",offer.club.name+"(으)로 이적해 "+L.lgLabel(offer.club.lg)+"에 도전해요. (연봉 "+offer.salary+"억)");
  else if(!L.isForeign(offer.club.lg)&&L.isForeign(prevLg)) L.addMoment(S,"레전드리그 복귀","복귀",offer.club.name+"(으)로 돌아왔어요. (연봉 "+offer.salary+"억)");
};

/* ================= 병역 ================= */
L.militaryPrompt=function(S){ const ag=age(S)+1; if(S.military!=="none"||ag<26) return null; return {must:ag>=29,canMil:S.p.ovr>=66}; };
L.enlist=function(S,kind){ if(L.charDelta) L.charDelta(S,2.5,"병역: 병역 이행");
  S.military="serving"; S.mildone=0;
  if(kind==="sangmu"){ S.milOrigSalary=S.salary; S.milKind="sangmu"; S.club={id:K.GIMCHEON.club,name:"김천 새벽",short:"김천",lg:"MIL",code:CODE("김천 새벽"),origin:S.club}; S.military="sangmu"; S.salary=.3; S.contractYears=2; L.addMoment(S,"입대","군복무","김천 새벽에 입대했어요. 2년 동안 선수 생활과 복무를 병행해요."); }
  else { S.milKind="army"; S.origin=S.club; L.addMoment(S,"입대","군복무","현역으로 입대했어요. 2년 동안 그라운드를 떠나요."); }
};
/* 상무에서 체육요원으로 전환할 때 원래 구단으로 돌려보내요 */
L.sangmuReturn=function(S){ try{ if(S.club&&S.club.lg==="MIL"&&S.club.origin){ S.club=Object.assign({},S.club.origin); S.contractYears=Math.max(1,S.contractYears||1); if(S.milOrigSalary) S.salary=S.milOrigSalary; } }catch(e){} };
function afterMil(S){ if(S.military==="sangmu"){ S.mildone++; if(S.mildone>=2){ S.military="served"; const o=S.club.origin; if(o) S.club=Object.assign({},o); S.contractYears=2; if(S.milOrigSalary){ S.salary=S.milOrigSalary; S.milOrigSalary=null; } L.addMoment(S,"전역","군복무","전역하고 "+S.club.name+"(으)로 복귀해요."); } } }
/* 현역 복무 시즌: 경기에 못 나가고 몸 상태가 조금 떨어져요 */
L.armyYear=function(S){
  const R={year:S.year,age:age(S),ovr0:S.p.ovr,club:Object.assign({},S.club),plan:{},military:true,apps:0,starts:0,minutes:0,goals:0,assists:0,cs:0,mom:0,rating:0,rank:0,N:0,W:0,D:0,L:0,gf:0,ga:0,trophies:[],awards:[],matches:[],leagueName:"군 복무",role:"복무",sr:0,table:null,natEvents:[],cups:[],youth:false};
  S.mildone++; const d=ri(0,2); Object.keys(S.p.stats).forEach(k=>{ S.p.stats[k]=clamp(S.p.stats[k]-(PHYS.has(k)?d:Math.floor(d/2)),10,99); }); S.p.ovr=ovrOf(S.p); R.ovr1=S.p.ovr; R.dOvr=R.ovr1-R.ovr0;
  if(S.mildone>=2){ S.military="served"; L.addMoment(S,"전역","군복무",S.year+"년 전역하고 원소속팀으로 복귀해요."); }
  L.pushValue(S); S.history.push(L.slimRecord(R,S)); S.lastR=R; S.phase="result"; S.sim=null; return R;
};

/* ================= 은퇴·다음 해 ================= */
L.mustRetire=function(S){ const ag=age(S)+1; if(S.playcoach) return ag>=46||S.p.ovr<45; return ag>=45||(ag>=34&&S.p.ovr<54)||(ag>=37&&S.p.ovr<60)||(ag>=41&&S.p.ovr<68); };
L.canRetire=function(S){ return age(S)+1>=30; };
L.nextYear=function(S){
  S.year++; S.plan=null; S.sim=null;
  if(S.military==="sports"){ S.sportsMonths=(S.sportsMonths||34)-12; if(S.sportsMonths<=0){ S.military="exempt"; L.addMoment(S,"체육요원 복무 완료","병역","체육요원 복무를 모두 마쳤어요. 병역 의무가 끝났어요."); } }
  const wasLoan=!!S.loan; if(S.loan) L.loanReturn(S);
  S.valueBoost=S.valueBoost>1.02?1+(S.valueBoost-1)*.45:1;   // 폭등한 몸값은 시간이 지나면 가라앉아요
  if(S.stage==="pro"){ L.applyPromotion(S); if(!wasLoan) L.releaseCheck(S); }
  KDEFS().forEach(d=>{ S.drift[d.club]=clamp((S.drift[d.club]||0)*.7+rnd(-1.2,1.2),-5,5); });
  K3_DEFS.concat(K4_DEFS).forEach(d=>{ S.drift[d.id]=clamp((S.drift[d.id]||0)*.7+rnd(-1.2,1.2),-4,4); });
  L.allFL().forEach(c=>{ S.drift["epl_"+c.id]=clamp((S.drift["epl_"+c.id]||0)*.8+rnd(-1,1),-4,4); });
  afterMil(S); L.syncClubLeague(S); if(L.coachNextYear) L.coachNextYear(S); S.contractYears=Math.max(0,S.contractYears-1);
  S.cond=clamp(S.cond+25,0,100); S.morale=clamp(S.morale*.9+7,0,100);
  if(S.stage==="youth"){ const ag=age(S); if(ag>YOUTH_END){ S.stage="pro"; S.phase="draft"; S.offers=L.draftOffers(S); return; } if(S.club&&S.club.lg==="YOUTH") S.club.name=L.youthTeamName(S.club.short,ag); }
  if(S.stage==="univ"&&age(S)>=UNIV_DRAFT){ S.stage="pro"; S.phase="draft"; S.offers=L.draftOffers(S); return; }
  S.phase="prep";
};
/* 오랫동안 벤치에만 앉은 선수는 구단이 계약을 해지(방출)하기도 해요. 방출된 선수는 자기 수준에 맞는 아래 리그(K2·K3·K4)에서 다시 시작해요 */
L.releaseCheck=function(S){
  const cur=S.club&&S.club.lg, tier={K1:1,K2:2,K3:3}[cur];
  if(!tier||S.stage!=="pro"||S.loan||S.military==="serving"||S.military==="sangmu"||S.military==="sports") return null;
  const h=S.history.filter(x=>!x.youth&&!x.military), last=h[h.length-1]; if(!last) return null;
  const p=S.p, ag=age(S), me=L.leagueClubs(S,cur).find(c=>c.id===S.club.id), lvl=me?me.l:70, gap=lvl-p.ovr;
  const benched=(last.apps||0)<=8&&(gap>=6||S.team==="2군");
  S.benchYears=benched?(S.benchYears||0)+1:0;
  const prob=S.benchYears>=2?(gap>=10?.7:.45):(S.benchYears===1&&gap>=14?.3:0);
  if(ag<21||!prob||Math.random()>=prob) return null;
  let pool=[]; [["K2",2],["K3",3],["K4",4]].forEach(([k,t])=>{ if(t<=tier) return; L.leagueClubs(S,k).forEach(c=>{ if(c.id!==S.club.id&&c.l<=p.ovr+(k==="K4"?5:2)&&L.startRateAt(p.ovr,c.l,S.trust*.8,p)>=.45) pool.push({c,k}); }); });
  if(!pool.length) pool=L.leagueClubs(S,"K4").sort((a,b)=>a.l-b.l).slice(0,3).map(c=>({c,k:"K4"}));
  const pk=pick(pool.sort((a,b)=>b.c.l-a.c.l).slice(0,5)), old=S.club.name, lg=pk.k;
  S.club=L.clubRef(S,pk.c,lg); S.contractYears=lg==="K4"?1:2; S.team="1군"; S.trust=.4; S.morale=clamp(S.morale-6,0,100); S.benchYears=0; S.released=(S.released||0)+1;
  const cap=L.capOf(lg,p.ovr); S.salary=Math.min(cap||99,L.salaryOf(p.ovr+1,ag,lg));
  const note="방출: "+old+"이(가) 계약을 해지했어요. "+S.club.name+"("+L.lgLabel(lg)+")에서 다시 시작해요.";
  S.promoNote=(S.promoNote?S.promoNote+" ":"")+note; L.addMoment(S,"방출","방출",old+"에서 방출되어 "+S.club.name+"("+L.lgLabel(lg)+")에서 다시 시작해요.");
  L.feedAdd(S,S.year+" 방출",old+"에서 방출 → "+S.club.name+"("+L.lgLabel(lg)+")",-1); return lg;
};
L.applyPromotion=function(S){
  S.promoNote=null; const ft=S.lastFT;
  if(ft){ Object.keys(PAIRS).forEach(top=>{ const sec=PAIRS[top][0], n=PAIRS[top][1]; if(!(ft[top]&&ft[sec])) return;
      const down=ft[top].slice(-n), up=ft[sec].slice(0,n); setIds(S,top,idsOf(S,top).filter(i=>!down.includes(i)).concat(up));
      if(S.club.lg===top&&down.includes(S.club.id)){ S.club.lg=sec; S.promoNote="강등: "+S.club.name+"이(가) "+L.lgLabel(sec)+"로 내려가요."; L.addMoment(S,"강등","강등",S.club.name+"이(가) "+L.lgLabel(sec)+"로 강등되었어요."); }
      else if(S.club.lg===sec&&up.includes(S.club.id)){ S.club.lg=top; S.promoNote="승격: "+S.club.name+"이(가) "+L.lgLabel(top)+"로 승격했어요."; L.addMoment(S,"승격","승격",S.club.name+"이(가) "+L.lgLabel(top)+"로 승격했어요."); } });
    S.lastFT=null; }
  const t=S.lastTables; if(!t||!t.K1||!t.K2){ L.syncClubLeague(S); return; } const mil=K.GIMCHEON.club;
  const down=t.K1.filter(c=>c!==mil).slice(-2), up=t.K2.slice(0,2);
  S.league.k1=S.league.k1.filter(c=>!down.includes(c)).concat(up); S.league.k2=S.league.k2.filter(c=>!up.includes(c)).concat(down); S.lastTables=null;
  if(S.club.lg==="K1"&&down.includes(S.club.id)){ S.club.lg="K2"; if(S.salary>8) S.salary=8; S.promoNote="강등: "+S.club.name+"이(가) 레전드리그2로 내려가요."; L.addMoment(S,"강등","강등",S.club.name+"이(가) 레전드리그2로 강등되었어요."); }
  if(S.club.lg==="K2"&&up.includes(S.club.id)){ S.club.lg="K1"; S.promoNote="승격: "+S.club.name+"이(가) 레전드리그1으로 승격했어요."; L.addMoment(S,"승격","승격",S.club.name+"이(가) 레전드리그1으로 승격했어요."); }
  /* 레전드리그2 하위 2팀 ↔ 레전드리그3 상위 2팀 */
  if(t.K3&&S.league.k3){ const down3=t.K2.filter(c=>!up.includes(c)).slice(-2), up3=t.K3.slice(0,2);
    S.league.k2=S.league.k2.filter(c=>!down3.includes(c)).concat(up3); S.league.k3=S.league.k3.filter(c=>!up3.includes(c)).concat(down3);
    if(S.club.lg==="K2"&&down3.includes(S.club.id)){ S.club.lg="K3"; const cp=L.capOf("K3",S.p.ovr); if(S.salary>cp) S.salary=cp; S.promoNote="강등: "+S.club.name+"이(가) 레전드리그3로 내려가요. 연봉이 3부 수준으로 조정돼요."; L.addMoment(S,"강등","강등",S.club.name+"이(가) 레전드리그3로 강등되었어요."); }
    else if(S.club.lg==="K3"&&up3.includes(S.club.id)){ S.club.lg="K2"; S.promoNote="승격: "+S.club.name+"이(가) 레전드리그2로 승격했어요."; L.addMoment(S,"승격","승격",S.club.name+"이(가) 레전드리그2로 승격했어요."); S.k3Promo=(S.k3Promo||0)+1; }
    /* 레전드리그3 하위 2팀 ↔ 레전드리그4 상위 2팀 */
    if(t.K4&&S.league.k4){ const down4=t.K3.filter(c=>!up3.includes(c)).slice(-2), up4=t.K4.slice(0,2);
      S.league.k3=S.league.k3.filter(c=>!down4.includes(c)).concat(up4); S.league.k4=S.league.k4.filter(c=>!up4.includes(c)).concat(down4);
      if(S.club.lg==="K3"&&down4.includes(S.club.id)){ S.club.lg="K4"; const cp=L.capOf("K4",S.p.ovr); if(S.salary>cp) S.salary=cp; S.promoNote="강등: "+S.club.name+"이(가) 레전드리그4로 내려가요. 연봉이 4부 수준으로 조정돼요."; L.addMoment(S,"강등","강등",S.club.name+"이(가) 레전드리그4로 강등되었어요."); S.k4Down=(S.k4Down||0)+1; }
      else if(S.club.lg==="K4"&&up4.includes(S.club.id)){ S.club.lg="K3"; S.promoNote="승격: "+S.club.name+"이(가) 레전드리그3로 승격했어요."; L.addMoment(S,"승격","승격",S.club.name+"이(가) 레전드리그3로 승격했어요."); S.k4Promo=(S.k4Promo||0)+1; } } }
  L.syncClubLeague(S);
};
/* 이적 직후 승강이 일어나도 소속 리그 표시가 어긋나지 않게 맞춰 줘요 */
L.syncClubLeague=function(S){ if(S.club&&S.stage==="pro"){ { const cp=(!S.loan&&(S.club.lg==="K1"||S.club.lg==="K2"||L.lowTier(S.club.lg)))?L.capOf(S.club.lg,S.p.ovr):null; if(cp&&S.salary>cp) S.salary=Math.round(cp*10)/10; } } if(S.club&&topOf(S.club.lg)){ const top=topOf(S.club.lg); S.club.lg=idsOf(S,top).includes(S.club.id)?top:PAIRS[top][0]; return; } if(!S.club||S.club.lg=="MIL"||L.isForeign(S.club.lg)||S.club.lg=="YOUTH"||S.club.lg=="UNIV") return; if(S.league.k1.includes(S.club.id)) S.club.lg="K1"; else if(S.league.k2.includes(S.club.id)) S.club.lg="K2"; else if(S.league.k3&&S.league.k3.includes(S.club.id)) S.club.lg="K3"; else if(S.league.k4&&S.league.k4.includes(S.club.id)) S.club.lg="K4"; };
L.otherTable=function(S,key){
  const clubs=L.leagueClubs(S,key); const st={}, tab={}; clubs.forEach(c=>{ st[c.id]=c; tab[c.id]={id:c.id,pts:0,gf:0,ga:0}; });
  L.makeRounds(clubs.map(c=>c.id),key==="K1"||key==="K3"?3:2,key==="K1"?5:0).forEach(rd=>rd.forEach(([h,a])=>{ const [gh,ga]=playMatch(st[h],st[a]); const H=tab[h],A=tab[a]; H.gf+=gh;H.ga+=ga;A.gf+=ga;A.ga+=gh; if(gh>ga) H.pts+=3; else if(gh<ga) A.pts+=3; else {H.pts++;A.pts++;} }));
  return Object.values(tab).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf).map(t=>t.id);
};
L.isStar=S=>!!(S&&S.p&&(S.p.trait==="star"||S.p.hidden==="star"));
L.legacy=function(S){
  const c=S.career, a=S.awards.filter(x=>!x.youth), t=S.trophies.filter(x=>!x.youth);
  const value=Math.round(S.p.peak*8), WP={FW:[3,2,.5,0],MF:[4,3,.6,1.2],DF:[8,5,.7,3],GK:[0,0,.9,4.5]}[S.p.pos]||[3,2,.5,1.5], rec=Math.round(c.goals*WP[0]+c.assists*WP[1]+c.apps*WP[2]+c.cs*WP[3]);   // 포지션마다 기록의 가치가 달라요(수비수·골키퍼도 전설이 될 수 있게)
  const W={"리그 MVP":60,"올해의 선수":70,"득점왕":45,"공동 득점왕":35,"도움왕":35,"공동 도움왕":25,"올해의 골키퍼":45,"베스트 11":22,"올해의 팀":22,"월드 베스트 11":55,"영플레이어상":18,"팀 올해의 선수":10,"황금 축구화":70,"올해의 골키퍼":45,"PFA 올해의 선수":120,"황금공":260,"황금공 후보":40,"KFA 올해의 선수":30,"AFC 올해의 국제선수":40,"유럽 클럽컵 득점왕":90,"유럽컵 시즌 최다 골 신기록":220,"유럽컵 통산 최다 골 신기록":300};
  const aw=a.reduce((s,x)=>s+(W[x.name]||(/최다 골 신기록/.test(x.name)?150:/최다 도움 신기록/.test(x.name)?120:8)),0);
  const tr=t.reduce((s,x)=>s+(/월드컵|유럽 클럽컵|유럽컵2/.test(x.name)?110:/아시아 종합대회|종합 국제대회/.test(x.name)?55:/아시아 네이션스컵/.test(x.name)?75:/우승/.test(x.name)?45:20),0);
  const nat=c.caps*3+c.intGoals*10;
  const ext=(L.isStar(S)?Math.round((S.fame||0)*.4):0)+(L.honorLegacy?L.honorLegacy(S):0)+(L.charLegacy?L.charLegacy(S):0)+(L.afterLegacy?L.afterLegacy(S):0)+(L.climbLegacy?L.climbLegacy(S):0); /* 낭만 보너스: 타고난 재능 등급이 낮은데도 큰 업적을 쌓았다면 점수를 더 얹어요(스포츠의 낭만) */
  const gr=S.p.grade||(L.GRADES&&L.GRADES[L.gradeOfPot(S.p.pot0||S.p.pot)])||"B"; const rf={C:.35,B:.22,A:.1}[gr]||0; const rom=Math.round((aw+tr+nat)*rf);
  return {total:value+rec+aw+tr+nat+ext+rom,value,rec,aw,tr,nat,ext,rom,grade:gr};
};
L.grade=v=>v>=88?"S":v>=80?"A":v>=70?"B":v>=60?"C":"D";
L.legacyGrade=t=>t>=2600?"S":t>=1800?"A":t>=1200?"B":t>=800?"C":"D";
})();
