/*
 * K-라이프 수상 · 황금공 · 영구결번 (js/life/awards.js)
 * 시즌이 끝나면 L.awardsFor 가 호출돼요. 다른 선수들의 기록은 리그 수준에 맞춰 만든 가상 경쟁자예요.
 */
(function(){
"use strict";
const L=window.LIFE, {rnd,ri,pick,clamp,logistic,r1,shuffle}=L;

/* 리그 1위 기록 기준 (K1/K2/EPL) */
const LEADERS={K1:{g:[15,23],a:[9,14],cs:[13,19]},K2:{g:[14,22],a:[8,13],cs:[12,17]},K3:{g:[14,22],a:[7,12],cs:[11,16]},K4:{g:[11,18],a:[6,10],cs:[9,13]},EPL:{g:[20,32],a:[12,20],cs:[14,20]},EPL2:{g:[18,28],a:[11,17],cs:[13,19]},BUN:{g:[22,36],a:[12,20],cs:[12,17]},LAL:{g:[20,32],a:[11,18],cs:[14,20]},SEA:{g:[19,30],a:[10,16],cs:[14,20]},L1:{g:[18,30],a:[10,16],cs:[12,17]},J1:{g:[16,26],a:[9,14],cs:[13,18]},SPL:{g:[20,32],a:[10,16],cs:[12,17]}};
const mvpScore=(R,S)=>{
  const pos=S.p.pos, lead=LEADERS[R.leagueKey]||LEADERS.K1;
  const out=(R.rating-6.4)*2.4+(R.rank<=3?1.0:R.rank<=6?.4:0)+(R.rank===1?.8:0);
  const prod=pos==="FW"?R.goals/lead.g[1]*2.2+R.assists/lead.a[1]*.5:pos==="MF"?R.goals/lead.g[1]*1.2+R.assists/lead.a[1]*1.5:pos==="DF"?R.goals/6*.5+R.cs/lead.cs[1]*.8:R.cs/lead.cs[1]*1.6;
  return out+prod+(R.apps<18?-2:0);
};

L.awardsFor=function(S,R,sim){
  const A=R.awards, lg=R.leagueKey, p=S.p, lead=LEADERS[lg]||LEADERS.K1;
  if(R.youth){
    if(R.rank===1&&R.rating>=7.2&&Math.random()<.6) A.push(S.stage==="univ"?"대학 리그 MVP":"유소년 리그 MVP");
    const topG=ri(10,17); if(R.goals>=topG&&p.pos!=="GK") A.push("유소년 득점왕");
    /* 천재 소리 듣는 유망주에게 주는 상 (가상의 시상) */
    if(S.stage!=="univ"&&(R.rating>=7.2||(R.dOvr||0)>=4)&&Math.random()<.5) A.push(R.age<=15?"차남곤 축구상 유망주 부문":"차남곤 축구상");
    else if(S.stage!=="univ"&&R.age>=16&&R.rating>=7.3&&Math.random()<.3) A.push("전국 고교 최우수선수상");
    return;
  }
  if(R.apps<10) { L.ballonCheck(S,R); return; }
  const ag=L.age(S), K1=lg==="K1", K2=lg==="K2", K3=lg==="K3", K4=lg==="K4", E=lg==="EPL";
  /* 득점·도움·클린시트 */
  const bd=R.board; const tg=bd?Math.max(1,bd.maxG):ri(lead.g[0],lead.g[1]), ta=bd?Math.max(1,bd.maxA):ri(lead.a[0],lead.a[1]), tc=ri(lead.cs[0],lead.cs[1]);
  const goalTitle=E?"황금 축구화":"득점왕", assistTitle=E?"플레이메이커상":"도움왕";
  if(p.pos!=="GK"){
    if(R.goals>=tg&&R.goals>=8) A.push(R.goals===tg&&Math.random()<.18?"공동 "+goalTitle:goalTitle);
    if(R.assists>=ta&&R.assists>=6) A.push(R.assists===ta&&Math.random()<.18?"공동 "+assistTitle:assistTitle);
  } else if(R.cs>=tc&&R.cs>=9) A.push("올해의 골키퍼");
  /* 올해의 선수(MVP) */
  const tfA=L.traitFx(p); const sc=mvpScore(R,S)+(R.board&&R.board.maxRt&&R.rating>=R.board.maxRt?.8:0)+(tfA.fame>1.2?.35:0)+(tfA.winner>0&&R.rank<=3?.4*Math.min(1.5,tfA.winner):0), need=2.9+rnd(-.5,.7);
  if(sc>=need){ A.push(E?"PFA 올해의 선수":K2?"레전드리그2 MVP":K3?"레전드리그3 MVP":K4?"레전드리그4 MVP":"리그 MVP"); }
  /* 베스트 11 · 올해의 팀 */
  const pa=p.pos==="GK"?R.rating-.0:R.rating; const bx=(pa-6.5)*1.6+(R.rank<=4?.6:0)+(tfA.winner>0&&R.rank<=3?.4:0)+(tfA.fame>1.2?.2:0)+(R.apps>=24?.4:-.6)+rnd(-.5,.5);
  if(bx>=1.5&&!A.includes("PFA 올해의 선수")&&!A.includes("리그 MVP")) A.push(E?"PFA 올해의 팀":"베스트 11");
  else if(A.includes("PFA 올해의 선수")||A.includes("리그 MVP")){ A.push(E?"PFA 올해의 팀":"베스트 11"); }
  /* 영플레이어 */
  if(ag<=(E?21:22)&&R.apps>=15&&R.rating>=6.8&&Math.random()<.45+(R.rating-6.8)*.8) A.push(E?"PFA 영플레이어상":"영플레이어상");
  /* 팀 올해의 선수 (클럽 내 평가) */
  if(R.rating>=7.1&&!A.length&&Math.random()<.5) A.push("팀 올해의 선수");
  /* 연말 시상 (국내 선수 대상) */
  if(!E&&(K1||K2)&&(A.includes("리그 MVP")||sc>=need+1.2)&&Math.random()<.5) A.push("KFA 올해의 선수");
  if(!K3&&!K4&&sc>=need+(E?.2:.8)&&Math.random()<.35) A.push("AFC 올해의 국제선수");
  /* 어린 선수 최고 영예: 신예 트로피(21세 이하 최고 선수), 황금 신예(유럽 1부 21세 이하 유망주) — 가상의 시상
     실제로 활약(주전·공격포인트/클린시트)이 있어야 받아요. 황금 신예는 평생 한 번만, 신예 트로피는 최대 두 번 */
  const had=n=>S.awards.filter(x=>x.name===n).length;
  const contrib=p.pos==="GK"?(R.cs||0)*.8:p.pos==="DF"?R.goals+R.assists+(R.cs||0)*.4:R.goals+R.assists;
  const starter=R.apps>=18&&(R.starts==null||R.starts>=R.apps*.55);
  if(ag<=21&&starter&&R.rating>=6.6&&p.ovr>=74&&contrib>=7&&had("신예 트로피")<2){
    const eu=["EPL","LAL","BUN","SEA","L1"].includes(lg), q=Math.min(.55,.12+(p.ovr-74)*.025+(R.rating-6.6)*.5+(eu?.12:0));
    if(Math.random()<q) A.push("신예 트로피");
  }
  /* 황금 신예는 황금공보다 문턱이 낮아요: 유럽 1부 무대에서 주전급으로 뛰며 눈에 띄는 21세 이하 */
  if(ag<=21&&["EPL","LAL","BUN","SEA","L1"].includes(lg)&&R.apps>=15&&R.rating>=6.4&&p.ovr>=70&&contrib>=5&&!had("황금 신예")&&(R.starts==null||R.starts>=R.apps*.4)){
    const g=Math.min(.6,.18+(p.ovr-70)*.025+(R.rating-6.4)*.4+(A.includes("신예 트로피")?.3:0));
    if(Math.random()<g) A.push("황금 신예");
  }
  L.ballonCheck(S,R,sc);
  if(!R.awards.includes("월드 베스트 11")&&(p.pos==="GK"||p.pos==="DF")&&p.ovr>=84&&R.apps>=22&&R.rating>=6.9&&["EPL","LAL","BUN","SEA","L1"].includes(lg)&&Math.random()<(p.ovr>=88?.5:.3)) R.awards.push("월드 베스트 11");
};

/* ================= 황금공 후보 30인 ================= */
/* 점수 = 능력치·시즌 활약·팀 성과(리그/유럽컵)·국제대회·인지도. 가상 경쟁자 30명의 점수와 비교해 순위를 정해요 */
L.ballonCheck=function(S,R,sc){
  const p=S.p; if(p.ovr<76||R.apps<15||R.youth) return;
  const lgBonus={EPL:0,LAL:0,BUN:-.5,SEA:-1,L1:-2.5,EPL2:-8,J2:-8,SPL2:-8,LAL2:-8,BUN2:-8,SEA2:-8,FR2:-8,K1:-6,K2:-10,K3:-14,K4:-18,J1:-6,SPL:-5}[R.leagueKey]||-6;
  const nat=R.natEvents||[]; let natB=0; nat.forEach(n=>{ if(n.skipped) return; natB+=n.t==="wc"?(n.title?6:/준우승|4강/.test(n.stage)?2.5:.6):n.t==="ac"?(n.title?1.5:.4):0; });
  const cup=R.trophies.reduce((a,t)=>a+(/(잉글랜드 1부 리그|스페인 1부 리그|독일 1부 리그|이탈리아 1부 리그) 우승/.test(t)?2.2:/리그 1 우승/.test(t)?1.5:/유럽 클럽컵 우승/.test(t)?3:0),0);
  const prod=p.pos==="FW"?R.goals*.12+R.assists*.05:p.pos==="MF"?R.goals*.1+R.assists*.1:p.pos==="DF"?R.goals*.15+R.cs*.04:R.cs*.12;
  const tfB=L.traitFx(p); const s=(p.ovr-80)*.35+(R.rating-6.9)*3.2+prod*.7+lgBonus+cup*(tfB.winner>0?1.12:1)+natB+L.fameEff(S.fame)*.02+(tfB.fame>1.2?1.0:0);
  const comps=[]; for(let i=0;i<30;i++) comps.push(9.5-i*.3+rnd(-1.1,1.1));
  comps.sort((a,b)=>b-a);
  let rank=1+comps.filter(c=>c>s).length;
  if(rank>30) return;
  R.ballon={rank,score:r1(s)}; S.ballon.push({year:R.year,rank,club:R.club.name});
  if(rank<=11&&!R.awards.includes("월드 베스트 11")) R.awards.push("월드 베스트 11");
  R.awards.push(rank===1?"황금공":"황금공 후보 "+rank+"위"); if(rank===1) R.trophies.push("황금공 수상");
};
/* 후보 30인 명단 (연도별 · 내 이름이 들어가요) */
/* 실존 스타 [이름, 출생연도, 전성기 평가, 포지션]. 나이에 따라 평가가 변하고, 후보 순위는 그 평가로 정해져요 */
const STARS=[["글라운 음부버",1998,94,"FW"],["애브 후룬",2000,93,"FW"],["버마 어물",2007,95,"FW"],["즌무 밸릉옴",2003,91,"MF"],["븐나즈아주 즌가가롤",2000,91,"FW"],["오스만 텀밸런",1997,90,"FW"],["하라 건안",1993,90,"FW"],["하파너",1996,89,"FW"],["루디브",1996,89,"MF"],["므머버돌 술더",1992,88,"FW"],["서몰 번살올루",2003,90,"MF"],["필바드온 브리준",2003,89,"MF"],["번도르",2002,88,"MF"],["믄타너",2000,88,"MF"],["부쿠구 소쿨",2001,88,"FW"],["루거머루 몬리므내구",1997,88,"FW"],["마아굴 을다선",2001,88,"FW"],["콜 포무",2002,88,"MF"],["필 바돈",2000,87,"MF"],["퍼대르가 멀배론대",1998,87,"MF"],["컨바 더 빈덜거노",1991,87,"MF"],["마로튼 어낼사로",1998,86,"MF"],["손힝마",1992,86,"FW"],["하운 울멀버소",2000,87,"FW"],["히나초 코부번초헐다오",2001,87,"FW"],["서웅 넌배구",2004,87,"MF"],["김만사",1996,85,"DF"],["이렁간",2001,84,"MF"],["트말 거로탄우",1992,87,"GK"],["거르숭",1992,86,"GK"],["마자 판 두살코",1991,86,"DF"],["서투느을 던다구",1993,85,"DF"],["윌리엄 절라분",2001,87,"DF"],["서볼르앨 걸굴랑쯔소",1997,86,"DF"],["푸서 크너둔사",2007,86,"DF"],["조자온 크마므",1995,87,"MF"],["우럭손난 이삭",1999,86,"FW"],["박다리 우캐런줄",1998,86,"FW"],["는가 윌리엄스",2002,85,"FW"],["더자더 든개",2005,87,"FW"],["른사널 머사",1987,92,"FW"],["키바주타온늘 마놀드",1985,89,"FW"],["코람 버재버",1987,85,"FW"],["란쿠 문디르탈",1985,83,"MF"],["너알무부",1992,86,"FW"],["바배로틸 러먼타포군카",1988,87,"FW"],["번론 트댈손",2000,82,"FW"],["건다우부드 걸문방서",2002,85,"MF"],["우버다앙 츠서거나",2000,85,"MF"],["티밴토 쩔럭순도올알누",1998,85,"DF"],["오버자시 맥알리스터",1998,86,"MF"],["만말느키 슨나솔루으",2000,85,"MF"]].map(x=>x.slice(0,4));
const FOREIGN_FIRST=["던콜시","거타오실","언즈","므애근","흐재","코릴르주","은분","미하일","갈라부","잭","하라","투무주","더운","벅스말브온","안툴느","프애두","마두쿠","우러소","도나설","전보시마온","에밀리오","근쿠로시","버볼르","르누브구","박다리","안도러","쥘리앙","밸르시","터가","던포얼","건모드","므머버돌","그보룬말문","사나우","웁다벌","유사피","토라구","코람","쿠마","운눌주","안데르스","주태푼","얀","마매우","젠나로","른거부둘","앙헬","건다우부드"];
const FOREIGN_LAST=["몬리므내구","로시","머루","신가소","스너","퍼배쯘로","군불즈오","르배소","드우준","베르나르","뒤랑","그마티","바이스","어둘노대소","구수러구","가소투","퍼리건대구","넌배구","우라너아루","소우자","리바스","모배누","벨루치","콘티","비더누","흐개어소","산체스","루매다","콘시트솔","오카포","든서루","큰짜터","티버짠래","엔디아예","건다","보리구주","젠센","한센","닐센","코발","노바크","퍼무단폴","이바노프","슈나이더","헤르만","피셔","베커","바그너"];
function poolName(){ if(Math.random()<.12) return pick(["김","이","박","최","정","강","조","윤","장","임"])+pick(["민","서","지","현","우","준","도","승","재","태"])+pick(["호","혁","우","훈","성","민","진","수","환","영"]); return pick(FOREIGN_FIRST)+" "+pick(FOREIGN_LAST); }
const starRate=(s,yr)=>{ const ag=yr-s[1]; return s[2]-(ag<22?(22-ag)*2.2:0)-(ag>31?(ag-31)*2.6:0)-(s[3]==="GK"?3:s[3]==="DF"?2.5:0); };
L.ballonList=function(S,rank){
  const names=new Set([S.p.name]); const yr=S.lastR?S.lastR.year:S.year;
  const act=STARS.filter(s=>{ const ag=yr-s[1]; return ag>=18&&ag<=37; }).map(s=>({n:s[0],r:starRate(s,yr)+rnd(-1.5,1.5)})).sort((x,y)=>y.r-x.r).filter(x=>x.r>=76);
  const others=[]; act.forEach(x=>{ if(others.length<29&&!names.has(x.n)){ names.add(x.n); others.push(x.n); } });
  while(others.length<29){ let n; do { n=poolName(); } while(names.has(n)); names.add(n); others.push(n); }
  const arr=[]; let k=0; for(let i=1;i<=30;i++){ if(i===rank) arr.push({rank:i,name:S.p.name,me:true}); else arr.push({rank:i,name:others[k++]}); }
  return arr;
};
/* ================= 영구결번 ================= */
/* 한 구단에서 오래 뛰고, 우승·수상으로 기여한 선수에게 은퇴 때 영구결번 제안이 와요. 자동은 아니에요. */
/* 영구결번은 '오래 뛰었다'만으로는 안 돼요. 구단의 역사에 남긴 기여와, 팬에게 채워 준 낭만이 있어야 해요.
 * 기본 조건: 한 구단에서 8시즌 이상. 그 위에 우승·개인 수상·기록·어려운 시절의 잔류·원클럽맨·팬이 사랑한 인성이 쌓이고,
 * 라이벌 구단으로 떠났거나 이미지가 나쁘면 받을 수 없어요. */
L.jerseyCandidates=function(S){
  const MAJOR=/MVP|올해의 선수|득점왕|도움왕|황금 축구화|올해의 골키퍼|PFA 올해의 선수|황금공$/; const SKIP=/후보|베스트|팀 올해|영플레이어/;
  const pro=S.history.filter(h=>!h.youth&&!h.military&&h.clubId); const by={};
  const rivals=id=>{ const nm={}; try{ L.allFL().forEach(c=>{ nm[c.id]=c.name; }); }catch(e){} const out=new Set(); (L.RIVALS||[]).forEach(p=>{ if(p[0]===id||p[0]===nm[id]) out.add(p[1]); if(p[1]===id||p[1]===nm[id]) out.add(p[0]); }); return out; };
  pro.forEach(h=>{ const k=h.clubId; const o=by[k]||(by[k]={id:k,name:h.club,yrs:0,apps:0,goals:0,assists:0,lg:0,cup:0,ucl:0,major:0,minor:0,rt:0,hard:0,last:h.year,first:h.year});
    o.yrs++; o.apps+=h.apps; o.goals+=h.goals; o.assists+=h.assists; o.rt+=h.rating||0; o.last=h.year;
    h.trophies.forEach(t=>{ if(/유럽 클럽컵 우승/.test(t)) o.ucl++; else if(/(리그 1|리그1|잉글랜드 1부 리그|스페인 1부 리그|독일 1부 리그|이탈리아 1부 리그|레전드리그[12]?|리그 우승|J1|J리그|사우디)/.test(t)&&/우승/.test(t)&&!/컵|포칼|코파|슈퍼/.test(t)) o.lg++; else if(/우승/.test(t)&&!/월드컵|아시안|종합 국제대회|발롱/.test(t)) o.cup++; });
    h.awards.forEach(x=>{ if(SKIP.test(x)) return; if(MAJOR.test(x)) o.major++; else o.minor++; });
    if(h.rank&&h.N&&h.rank>h.N-3&&h.apps>=20) o.hard++; });
  const ch=L.charOf(S), proClubs=Object.keys(by).length, fame=S.fameMax||S.fame;
  return Object.values(by).map(o=>{
    const why=[]; const avg=o.yrs?o.rt/o.yrs:0; let score=0;
    const loyal=Math.min(26,o.yrs*1.9); score+=loyal;
    const tro=o.lg*8+o.cup*3.5+o.ucl*14; score+=tro; if(o.lg+o.ucl) why.push("리그 우승 "+o.lg+"회"+(o.ucl?" · 유럽컵 우승 "+o.ucl+"회":"")); else if(o.cup) why.push("컵 우승 "+o.cup+"회");
    const ind=o.major*5+o.minor*1.2; score+=ind; if(o.major) why.push("올해의 선수·득점왕 등 주요 수상 "+o.major+"회");
    const prod=Math.min(24,o.apps/55+(o.goals+o.assists)/28); score+=prod; if(o.apps>=300) why.push("통산 "+o.apps+"경기"); if(o.goals+o.assists>=120) why.push((o.goals)+"골 "+o.assists+"도움");
    if(avg>=6.7){ score+=6; why.push("꾸준한 활약(평균 평점 "+avg.toFixed(1)+")"); } else if(avg>=6.4) score+=3;
    const hard=Math.min(8,o.hard*2.5); if(hard>=2.5){ score+=hard; why.push("어려운 시절에도 팀을 지켰어요"); }
    if(proClubs===1){ score+=8; why.push("원클럽맨"); }
    if(ch>=70){ score+=6; why.push("팬이 사랑한 인성"); } else if(ch>=55) score+=2; else if(ch<40) score-=20;
    if(fame>=100) score+=4;
    /* 라이벌 구단으로 떠난 적이 있으면 팬이 번호를 주지 않아요 */
    const rv=rivals(o.id); const betray=pro.some(h=>h.year>o.last&&(rv.has(h.clubId)||rv.has(h.club)));
    return Object.assign(o,{score:r1(score),why,betray,ch});
  }).filter(o=>o.yrs>=8&&o.score>=72&&!o.betray&&o.ch>=40&&(o.lg+o.ucl>=2||o.major>=3||(o.lg+o.ucl>=1&&o.major>=1))&&(o.yrs>=12||o.yrs/Math.max(1,pro.length)>=.45))
    .map(o=>Object.assign(o,{titles:o.lg+o.ucl+o.cup})).sort((x,y)=>y.score-x.score);
};
/* 은퇴 시점: 영구결번 구단 목록과 번호 */
L.jerseyRetired=function(S){ return L.jerseyCandidates(S).map(o=>({club:o.name,id:o.id,number:(S.numByClub&&S.numByClub[o.id])||S.p.number,yrs:o.yrs,titles:o.titles,score:o.score,why:(o.why||[]).slice(0,4)})); };
/* 시즌 도중 예고 (한 구단 8년 이상 + 점수 높음) — 다음 시즌 오프시즌에 한 번만 이벤트로 */
L.jerseyHint=function(S){
  if(S.jerseyHinted) return null; const c=L.jerseyCandidates(S).find(o=>o.id===(S.club&&S.club.id)&&o.yrs>=9&&o.score>=50);
  if(!c) return null; S.jerseyHinted=true; return c;
};

/* 은퇴 칭호: 커리어의 특징을 한 마디로 */
/* 4부(레전드리그4)에서 시작해 위로 올라간 이야기는 커리어 점수에 낭만 보너스로 조금 얹어요 */
L.climbLegacy=function(S){
  const h=S.history.filter(x=>!x.youth&&!x.military), i4=h.findIndex(x=>x.lg==="K4"); if(i4<0) return 0; const later=h.slice(i4+1); let b=0;
  if(later.some(x=>x.lg==="K3")) b+=15; if(later.some(x=>x.lg==="K2")) b+=35; if(later.some(x=>x.lg==="K1"||L.isForeign(x.lg))) b+=60; return b;
};
L.titlesOf=function(S){
  const c=S.career, tr=S.trophies.filter(t=>!t.youth), pos=S.p.pos, out=[]; const clubs=Object.keys(S.clubYears||{}).length, yrs=S.history.filter(h=>!h.youth).length, sc=L.legacy(S).total;
  if(S.ballon.some(b=>b.rank===1)||tr.some(t=>/월드컵 우승/.test(t.name))) out.push("월드 아이콘");
  if(L.hasHonor&&L.hasHonor(S,"owner")) out.push("구단주 출신 레전드");
  if(L.hasHonor&&L.hasHonor(S,"found")) out.push("기부왕");
  if((S.assetProfit||0)>=150) out.push("투자의 귀재");
  { const ch=L.charOf(S); if(ch>=90) out.push("성인군자 레전드"); else if(ch>=75) out.push("모범 선수"); else if(ch<=15) out.push("악동으로 기억되는"); }
  { const ft=L.fameTier(S.fameMax||S.fame); if(ft.i>=5) out.push("G.O.A.T"); else if(ft.i>=4) out.push("월드스타"); }
  if(sc>=3600) out.push("역대 최고의 전설");
  { const hh=S.history.filter(h=>!h.youth&&!h.military), i4=hh.findIndex(h=>h.lg==="K4"), n4=hh.filter(h=>h.lg==="K4").length;
    if(i4>=0&&hh.slice(i4+1).some(h=>h.lg==="K1"||L.isForeign(h.lg))) out.push("4부에서 정상에 오른");
    else if(n4>=6) out.push("지역 축구의 버팀목");
    if((S.released||0)>=1&&S.p.peak>=70) out.push("방출을 딛고 일어선"); }
  if(clubs===1&&yrs>=12) out.push("원클럽맨");
  if(pos!=="GK"&&c.goals>=200) out.push("골 머신");
  if(c.assists>=150) out.push("도움 기계");
  if(pos==="GK"&&c.cs>=200) out.push("철벽 수문장"); else if(pos==="DF"&&c.cs>=150) out.push("철벽 수비수");
  if(c.caps>=100) out.push("센추리 클럽");
  if(tr.length>=15) out.push("트로피 수집가");
  if(clubs>=7) out.push("방랑자");
  if((S.jersey||[]).length) out.push("영구결번의 주인공");
  if(((S.nat&&S.nat.refused)||0)>=3) out.push("대표팀 기피자 ('매국노' 소리를 들은)");
  if(!out.length) out.push(sc>=1200?"믿음직한 프로":"묵묵한 선수");
  return out.slice(0,4);
};
/* ================= 리그 기록 · 유럽 클럽컵 기록 =================
 * 수치는 공개 기록을 바탕으로 한 근사치예요. 내 시즌 기록이 리그 역대 기록을 넘으면 '신기록' 업적이 붙어요. */
const REC={K1:{g:28,a:17},K2:{g:24,a:14},EPL:{g:34,a:20},EPL2:{g:31,a:16},LAL:{g:50,a:21},BUN:{g:41,a:21},SEA:{g:36,a:17},L1:{g:44,a:21},J1:{g:30,a:16},SPL:{g:35,a:17}};
L.LEAGUE_REC=REC; L.UCL_REC={season:17,career:140,leader:[7,12]};
L.recordsFor=function(S,R){
  const out=R.records=[]; if(R.youth||R.military) return; const rc=REC[R.leagueKey], ln=L.lgLabel(R.leagueKey);
  if(rc){
    if(R.goals>rc.g){ R.awards.push(ln+" 시즌 최다 골 신기록"); out.push(ln+" 시즌 최다 골 신기록! ("+R.goals+"골, 종전 "+rc.g+"골)"); }
    else if(R.goals===rc.g&&R.goals>0){ out.push(ln+" 시즌 최다 골 타이기록 ("+R.goals+"골)"); }
    if(R.assists>rc.a){ R.awards.push(ln+" 시즌 최다 도움 신기록"); out.push(ln+" 시즌 최다 도움 신기록! ("+R.assists+"도움, 종전 "+rc.a+"도움)"); }
  }
  const u=(R.matches||[]).filter(m=>m.cup==="ucl"), ug=u.reduce((s,m)=>s+(m.g||0),0), ua=u.reduce((s,m)=>s+(m.as||0),0);
  R.uclGoals=ug; R.uclAssists=ua; if(!u.length) return;
  const c=S.career, was=c.uclG||0; c.uclG=was+ug; c.uclA=(c.uclA||0)+ua;
  if(ug>=5&&ug>=ri(L.UCL_REC.leader[0],L.UCL_REC.leader[1])){ R.awards.push("유럽 클럽컵 득점왕"); out.push("유럽 유럽 클럽컵 득점왕 ("+ug+"골)"); }
  if(ug>L.UCL_REC.season){ R.awards.push("유럽컵 시즌 최다 골 신기록"); out.push("유럽 클럽컵 한 시즌 최다 골 신기록! ("+ug+"골)"); }
  if(c.uclG>L.UCL_REC.career&&was<=L.UCL_REC.career){ R.awards.push("유럽컵 통산 최다 골 신기록"); out.push("유럽 클럽컵 통산 최다 골 신기록! (통산 "+c.uclG+"골, 종전 "+L.UCL_REC.career+"골)"); }
};
const _base=L.awardsFor; L.awardsFor=function(S,R,sim){ _base(S,R,sim); L.recordsFor(S,R); };
L.calendarAwards=L.awardsFor;

/* ================= 베스트 11 명단 =================
 * 그 시즌 리그 최고의 11명. 실존 선수가 있는 리그(레전드리그·잉글랜드 1부 리그)는 실제 이름으로, 그 밖의 리그는 가상 선수로 채워요. */
L.bestXI=function(S,R){
  const key=R.leagueKey, slots=["GK","LB","CB","CB","RB","DM","CM","AM","LW","ST","RW"];
  const GRP={GK:"GK",LB:"DF",CB:"DF",RB:"DF",DM:"MF",CM:"MF",AM:"MF",LW:"FW",ST:"FW",RW:"FW"};
  const pool=[];
  if(key==="K1"||key==="K2") L.leagueClubs(S,key).forEach(c=>{ if(c.def_) c.def_.players.forEach(p=>pool.push({name:p.name,det:p.det||null,pos:p.pos,ovr:p.ovr,club:c.short})); });
  else if(L.isForeign(key)) L.leagueClubs(S,key).forEach(c=>{ (c.players||[]).forEach(p=>pool.push({name:p[0],det:null,pos:p[1],ovr:p[2],club:c.short})); });
  const used=new Set(), me=S.p, out=[]; let meIdx=slots.indexOf(me.sub); if(meIdx<0) meIdx=slots.findIndex(s=>GRP[s]===me.pos);
  slots.forEach((slot,i)=>{
    if(i===meIdx){ out.push({slot,name:me.name,club:R.club.short||R.club.name,ovr:me.ovr,me:true}); return; }
    let cand=pool.filter(p=>!used.has(p.name)&&(p.det===slot)); if(!cand.length) cand=pool.filter(p=>!used.has(p.name)&&p.pos===GRP[slot]);
    cand.sort((x,y)=>y.ovr-x.ovr);
    if(cand.length){ const c=cand[Math.min(cand.length-1,Math.floor(Math.random()*2))]; used.add(c.name); out.push({slot,name:c.name,club:c.club,ovr:c.ovr}); }
    else out.push({slot,name:poolName(),club:"",ovr:Math.round(R.lvl+ri(0,5))});
  });
  return out;
};

})();
