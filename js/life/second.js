/*
 * K-라이프 은퇴 후 '두 번째 인생' (js/life/second.js)
 * 은퇴 후의 길(지도자·구단주)을 자동으로 돌리지 않고, 갈림길마다 직접 고르면서 이야기를 만들어요.
 *  - 지도자: 모교 중학교 감독에서 끝날 수도 있고, 프로 코치 → 감독 → 명문 구단·대표팀까지 갈 수도 있어요. 경질도 있어요.
 *  - 구단주: 투자·감독 선임·위기 대응에 따라 우승 왕조가 되기도, 구단을 팔고 떠나기도 해요.
 *  - 선수로도 감독으로도 정상에 서면 '즈둔' 같은 최종 업적이 생겨요.
 * 상태는 S.second 에 저장되고, 끝나면 S.after (기존 은퇴 후 결과)로 정리돼요.
 */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.afterPaths) return;
const {clamp,pick,ri,rnd,r1}=L;
const age=S=>L.age(S);
const mainClub=S=>{ const e=Object.entries(S.clubYears||{}).sort((a,b)=>b[1]-a[1])[0]; return e?e[0]:(S.club?S.club.name:"고향 팀"); };

/* ---------------- 지도자 ---------------- */
const JOBS=[
 {id:"school_mid",lvl:1,name:"모교 중학교 감독",desc:"작은 학교 운동장이지만 아이들의 하루가 당신의 한마디에 달려 있어요.",need:()=>true,title:"전국 중등 대회 우승"},
 {id:"school_high",lvl:1,name:"고등학교 축구부 감독",desc:"입시와 프로 입단 사이에서 아이들을 이끌어요.",need:S=>S.second.rep>=10,title:"전국 고교 대회 우승"},
 {id:"youth",lvl:2,name:"프로 산하 유스팀(U18) 감독",desc:"미래의 프로 선수를 키우는 자리예요. 제자가 프로에 입단하면 이름이 알려져요.",need:S=>S.second.rep>=20,title:"유스 리그 우승"},
 {id:"asst",lvl:3,name:"프로 구단 코치",desc:"감독 곁에서 훈련과 전술을 맡아요. 경질되는 감독을 따라 같이 나갈 수도 있어요.",need:S=>S.second.rep>=32,title:"팀 우승 기여"},
 {id:"head2",lvl:4,name:"2부 구단 감독",desc:"승격이 목표인 팀이에요. 예산은 적지만 자유가 많아요.",need:S=>S.second.rep>=46,title:"2부 우승·승격"},
 {id:"head1",lvl:5,name:"1부 구단 감독",desc:"레전드리그1 중위권 팀이에요. 성적이 나쁘면 시즌 중에도 경질돼요.",need:S=>S.second.rep>=60,title:"리그 우승"},
 {id:"top",lvl:6,name:"명문 구단 감독",desc:"우승이 의무인 자리예요. 기대만큼 압박도 커요.",need:S=>S.second.rep>=76,title:"리그 우승"},
 {id:"elite",lvl:7,name:"해외 빅클럽·대표팀 감독",desc:"세계 무대의 지휘봉이에요. 성공하면 전설이 돼요.",need:S=>S.second.rep>=89,title:"세계 무대 우승"}
];
const LVNAME=["","학교 지도자","유소년 지도자","프로 코치","2부 감독","1부 감독","명문 감독","월드클래스 감독"];
const DIFF=[0,0,.08,.25,.45,.7,1.0,1.3];

/* 감독으로 갈 수 있는 구단: 선수 시절 뛴 팀이 우선이고, 뛰었던 팀의 라이벌 구단에는 갈 수 없어요 */
function rivalBlock(S){
  const played=Object.keys(S.clubYears||{}), nm={}; try{ L.allFL().forEach(c=>{ nm[c.name]=c.id; }); }catch(e){}
  const keys=new Set(); played.forEach(n=>{ keys.add(n); if(nm[n]) keys.add(nm[n]); });
  const bad=new Set(); (L.RIVALS||[]).forEach(p=>{ if(keys.has(p[0])&&!keys.has(p[1])) bad.add(p[1]); if(keys.has(p[1])&&!keys.has(p[0])) bad.add(p[0]); });
  return {played,bad};
}
function pickClub(S,lvl,not){
  const {played,bad}=rivalBlock(S); const leagues=lvl<=4?["K2","K1"]:lvl===5?["K1"]:lvl===6?["K1","EPL","LAL","BUN","SEA"]:["EPL","LAL","BUN","SEA","L1"];
  let pool=[]; leagues.forEach(lg=>{ try{ L.leagueClubs(S,lg).forEach(c=>pool.push({name:c.name,id:c.id,l:c.l,lg,mine:played.includes(c.name)})); }catch(e){} });
  pool=pool.filter(c=>!bad.has(c.id)&&!bad.has(c.name)&&c.name!==not);
  if(lvl===6) pool=pool.filter(c=>c.l>=(c.lg==="K1"?72:82)); if(lvl===7) pool=pool.filter(c=>c.l>=86); if(lvl===5) pool=pool.filter(c=>c.l<=76);
  if(lvl<=4) pool=pool.filter(c=>c.l<=(lvl===4?70:74));
  const mine=pool.filter(c=>c.mine); if(mine.length&&Math.random()<.55) return pick(mine);
  return pool.length?pick(pool):null;
}
function skillBase(S){
  const ch=L.charOf(S), lg=L.legacy(S).total, tf=L.traitFx(S.p);
  const lead=(tf.winner>0?.25:0)+(S.p.hidden==="iq"?.25:0)+(S.p.hidden==="captain"?.2:0);
  return (S.p.peak-62)/32+(ch-50)/110+lg/6000+lead+Math.min(.6,(S.pcYears||0)*.12);
}
const line=(S,t)=>{ S.second.lines.push({y:S.second.age,t}); };

function startCoach(S){
  const ft=L.fameTier(S.fameMax||S.fame), ch=L.charOf(S);
  const rep=clamp(8+ft.i*7+(S.p.peak-70)*.6+(ch-50)*.2+(S.pcYears||0)*3,5,62);
  S.second={path:"coach",icon:"🧑‍🏫",name:"지도자의 길",age:age(S)+1,lvl:0,maxLvl:0,rep,skillAdd:0,exp:0,tr:{lg:0,cup:0,ucl:0,nat:0,promo:0},grads:0,fired:0,steps:0,jobs:[],lines:[],node:null,done:false,style:null};
  S.second.node={kind:"course"};
}
function coachNode(S){
  const c=S.second, n=c.node;
  if(n.kind==="course") return {title:"지도자 자격 과정",body:"은퇴한 지금, 지도자가 되려면 자격증이 필요해요. 어떤 방식으로 준비할까요?",opts:[
    {label:"국내에서 차근차근 (B→A→Pro 라이선스)",hint:"안정적 · 2년"},
    {label:"유럽 선진 축구 연수 (5억)",hint:"전술 이해 ▲ · 비용 필요",disabled:S.funds<5},
    {label:"바로 현장에 뛰어든다",hint:"빠른 시작 · 경험 부족"}]};
  if(n.kind==="offers") return {title:c.steps?"새로운 제안이 도착했어요":"첫 일자리 제안",body:n.text||"당신의 이름과 평판 덕분에 몇 곳에서 연락이 왔어요. ("+age(S)+"세 · 지도자 평판 "+Math.round(c.rep)+")",opts:n.jobs.map(j=>j.act==="wait"?{label:"조금 쉬면서 기다린다",hint:"1년 흐름 · 평판이 조금 식어요 · 대표팀 제안이 올 수도 있어요"}:j.act==="quit"?{label:"지도자를 그만두고 방송으로 간다",hint:"이야기를 마무리해요"}:{label:j.label||j.name,hint:j.desc})};
  if(n.kind==="nat_round") return natNode(S);
  if(n.kind==="crisis") return {title:n.ev.t,body:n.ev.b,opts:n.ev.o.map(o=>({label:o.l,hint:o.h}))};
  return null;
}
const CRISES=[
 {t:"에이스와의 불화",b:"팀의 핵심 선수가 훈련 태도 문제로 공개적으로 당신과 부딪혔어요.",o:[
  {l:"원칙대로 엄하게 다스린다",h:"위험하지만 팀 기강 ▲",d:()=>Math.random()<.55?.25:-.35,r:1},
  {l:"단둘이 대화로 푼다",h:"안전 · 무난",d:()=>.1,r:2},
  {l:"에이스의 편을 들어 준다",h:"당장은 성적 ▲, 팀 분위기 ▼",d:()=>Math.random()<.5?.3:-.2,r:-1}]},
 {t:"구단 프런트와의 갈등",b:"프런트가 당신의 선수 기용에 간섭하며 이적 정책을 바꾸라고 요구해요.",o:[
  {l:"내 방식을 고집한다",h:"성공하면 신뢰 ▲ · 실패하면 경질 위험",d:()=>Math.random()<.45?.3:-.45,r:2},
  {l:"절충안을 제시한다",h:"무난",d:()=>.05,r:0},
  {l:"프런트의 요구를 따른다",h:"편하지만 색이 사라져요",d:()=>-.05,r:1}]},
 {t:"시즌 도중 연패",b:"팀이 갑자기 5연패에 빠졌어요. 기자들은 매일 질문을 쏟아내요.",o:[
  {l:"전술을 과감히 바꾼다",h:"도박",d:()=>Math.random()<.5?.35:-.3,r:1},
  {l:"선수들을 믿고 간다",h:"신뢰 ▲ · 반등은 운",d:()=>Math.random()<.6?.15:-.15,r:1},
  {l:"휴식과 합숙으로 분위기를 바꾼다",h:"안전",d:()=>.08,r:0}]},
 {t:"언론의 호평과 비판",b:"인터뷰에서 한 말이 크게 화제가 됐어요.",o:[
  {l:"솔직하게 모든 걸 밝힌다",h:"인기 ▲ · 논란 위험",d:()=>Math.random()<.6?.15:-.2,r:2},
  {l:"말을 아낀다",h:"무난",d:()=>.03,r:0}]}
];
function labelJob(S,j){
  const kinds={asst:"코치",head2:"감독 (2부)",head1:"감독",top:"감독",elite:"감독"};
  if(!kinds[j.id]&&j.id!=="youth") return j;
  const cl=pickClub(S,j.lvl,null); if(!cl) return j;
  return Object.assign({},j,{club:cl.name,mine:cl.mine,label:cl.name+" "+(j.id==="youth"?"유스팀(U18) 감독":kinds[j.id])+(cl.mine?" · 친정":"")});
}
/* 대표팀 월드컵: 라운드마다 전술을 골라요. 압박 > 점유 > 역습 > 압박 (가위바위보). 상대 분석은 가끔 틀려요. */
const NROUNDS=["조별리그","16강","8강","4강","결승"], TACT=["압박","점유","역습"];
const BEATS={압박:"점유",점유:"역습",역습:"압박"};   // 왼쪽이 오른쪽을 이겨요
function natInit(c,job){ c.node={kind:"nat_round",job,round:0,wins:0}; natOpp(c.node); }
function natOpp(n){ n.opp=pick(TACT); n.hint=Math.random()<.78?n.opp:pick(TACT.filter(x=>x!==n.opp)); n.oppName=pick(["브라질","프랑스","독일","스페인","아르헨티나","잉글랜드","포르투갈","네덜란드","크로아티아","모로코","일본","미국","이탈리아","우루과이"]); }
function natNode(S){
  const n=S.second.node, rd=NROUNDS[n.round];
  return {title:"월드컵 "+rd+" · vs "+n.oppName,body:"대표팀 분석관 보고: '상대는 "+n.hint+" 축구를 할 가능성이 높습니다.' (분석이 틀릴 수도 있어요)\n압박은 점유를, 점유는 역습을, 역습은 압박을 이겨요.",opts:[
    {label:"높은 압박",hint:"점유 팀에 강하고 역습에 약해요"},{label:"점유 축구",hint:"역습 팀에 강하고 압박에 약해요"},{label:"수비 후 역습",hint:"압박 팀에 강하고 점유에 약해요"},{label:"균형 잡힌 운영",hint:"어떤 상대에게도 무난해요"}]};
}
function natChoose(S,i){
  const c=S.second, n=c.node, mine=i<3?TACT[i]:null; let delta=0, txt="";
  if(mine){ if(BEATS[mine]===n.opp){ delta=.22; txt="전술이 정확히 맞아떨어졌어요!"; } else if(BEATS[n.opp]===mine){ delta=-.2; txt="상대 전술에 읽혔어요."; } else { delta=0; txt="팽팽하게 맞섰어요."; } } else { delta=.03; txt="안정적으로 경기를 풀었어요."; }
  const base=skillBase(S)+c.skillAdd+c.exp*.04, p=clamp(.52+base*.1-n.round*.045+delta,.12,.9);
  const win=Math.random()<p; const rd=NROUNDS[n.round];
  line(S,"월드컵 "+rd+" vs "+n.oppName+" ("+(mine||"균형")+" 전술): "+(win?"승리!":"패배"));
  if(win){ n.wins++; n.round++; if(n.round>=NROUNDS.length){ return natFinish(S,true,txt); } natOpp(n); return txt+" 다음 라운드로 올라갔어요."; }
  return natFinish(S,false,txt+" "+rd+"에서 탈락했어요.");
}
function natFinish(S,champ,msg){
  const c=S.second, n=c.node, job=n.job; c.age+=4; c.exp+=4; c.steps++; c.lastJob=null;
  if(champ){ c.tr.nat++; line(S,"대표팀 감독으로 월드컵 우승! 나라 전체가 들썩였어요."); c.rep=clamp(c.rep+18,0,100); }
  else { const reached=NROUNDS[Math.min(NROUNDS.length-1,n.round)]; line(S,"대표팀은 월드컵 "+reached+"까지 진출했어요."); c.rep=clamp(c.rep+n.wins*3-(n.wins===0?6:0),0,100); if(n.wins===0){ c.fired++; c.lastFired=true; } }
  if(c.age>=66){ line(S,"나이가 들어 지도자 생활을 마무리했어요."); endCoach(S); return msg; }
  c.node={kind:"offers",jobs:jobOffers(S),text:champ?"월드컵 우승 감독에게 러브콜이 쏟아졌어요.":null}; return msg;
}
function jobOffers(S){
  const c=S.second; const elig=JOBS.filter(j=>j.need(S)&&j.lvl>=Math.max(1,c.lvl-2)).sort((a,b)=>b.lvl-a.lvl);
  const out=[];
  const top=elig.filter(j=>j.lvl>c.lvl||c.lvl===0).slice(0,2);
  top.forEach(j=>out.push(j));
  const same=elig.find(j=>j.lvl===c.lvl&&!out.includes(j)); if(same&&out.length<3) out.push(same);
  const safe=JOBS[0]; if(!out.length||(c.lvl<=1&&!out.some(j=>j.lvl<=1))) out.push(safe.id===out[0]?.id?JOBS[1]:safe);
  const uniq=[]; out.forEach(j=>{ if(!uniq.find(x=>x.id===j.id)) uniq.push(j); });
  const lab=uniq.map(j=>labelJob(S,j));
  uniq.length=0; lab.forEach(j=>uniq.push(j));
  if(c.rep>=60&&(c.waited||c.fired>0)&&Math.random()<.55) uniq.unshift({id:"nat",lvl:7,name:"국가대표팀 감독",label:"국가대표팀 감독",desc:"협회가 당신을 대표팀 사령탑 후보로 올렸어요. 한 번의 대회가 평가의 전부예요.",title:"대표팀 메이저 대회 우승"});
  if(c.lastJob&&!c.lastFired&&c.lastJob.club) uniq.push(Object.assign({},c.lastJob,{act:"stay",label:c.lastJob.club+"에 남아 재계약",desc:"익숙한 팀에서 한 번 더 도전해요. 경험이 쌓여요."}));
  if(c.fired>0||c.steps>=1) uniq.push({act:"wait"});
  if(c.steps>=1) uniq.push({act:"quit"});
  return uniq.slice(0,5);
}
function tenure(S,job){
  const c=S.second, years=ri(2,4); const base=skillBase(S)+c.skillAdd+c.exp*.05; let tit=[], sum=0, crisisBonus=0;
  c.lvl=job.lvl; c.maxLvl=Math.max(c.maxLvl,job.lvl);
  const crisis=job.lvl>=3&&Math.random()<.45;
  return {years,base,job,crisis};
}
function runTenure(S,job,extra){
  const c=S.second, years=ri(2,4), base=skillBase(S)+c.skillAdd+c.exp*.05+(extra||0), lv=job.lvl; let sum=0; const wins=[]; let grads=0;
  for(let y=0;y<years;y++){
    const s=base+rnd(-.6,.6)-DIFF[lv]; sum+=s;
    const win=(k,p,name)=>{ if(Math.random()<clamp(p,0,.7)){ c.tr[k]++; wins.push(name); } };
    if(lv===1) win("cup",.12+s*.14,job.title);
    if(lv===2){ win("cup",.12+s*.12,job.title); grads+=Math.max(0,Math.round(rnd(0,2)+(s>.5?1:0))); }
    if(lv===3) win("lg",.05+s*.05,job.title);
    if(lv===4){ if(Math.random()<clamp(.1+s*.16,0,.55)){ c.tr.promo++; wins.push(job.title); } win("cup",.05+s*.05,"컵대회 우승"); }
    if(lv===5){ win("lg",.03+s*.07,"리그 우승"); win("cup",.07+s*.06,"컵대회 우승"); }
    if(lv===6){ win("lg",.1+s*.12,"리그 우승"); win("cup",.1+s*.08,"컵대회 우승"); win("ucl",.02+s*.05,"유럽 클럽컵 우승"); }
    if(job.id==="nat"){ win("nat",.06+s*.1,"대표팀 메이저 대회 우승"); }
    else if(lv===7){ win("lg",.18+s*.14,"리그 우승"); win("ucl",.07+s*.1,"유럽 클럽컵 우승"); win("nat",.02+s*.05,"월드컵 우승"); }
  }
  const avg=sum/years; c.grads+=grads; c.exp+=years;
  const fired=avg<-.12-(lv>=5?.05:0)&&lv>=3;
  return {years,avg,wins,grads,fired};
}
function endCoach(S,why){
  const c=S.second, lg=L.legacy(S).total, T=c.tr; c.done=true;
  const lvT=["","동네 학교의 영원한 감독님","유소년을 키운 지도자","믿음직한 프로 코치","승격을 이끈 감독","레전드리그 감독","명문의 지휘자","월드클래스 명장"];
  let title=lvT[c.maxLvl]||"지도자로 짧은 시간을 보냈어요"; let special="";
  if(lg>=1200&&c.maxLvl>=6&&(T.ucl>=1||T.lg>=3||T.nat>=1)){ special="legend_both"; title="선수로도 감독으로도 정상에 선 전설"; }
  else if(lg>=700&&c.maxLvl>=5&&(T.lg>=1||T.cup>=2||T.ucl>=1)){ special="both"; title="선수와 감독, 두 번의 성공"; }
  else if(T.ucl>=1) title="유럽 정상에 선 명장";
  else if(T.lg>=3) title="우승을 모으는 감독";
  else if(T.lg>=1) title="우승 감독";
  const bonus=clamp(Math.round(c.maxLvl*22+T.lg*45+T.cup*20+T.ucl*90+T.nat*80+T.promo*18+c.grads*5+(special==="legend_both"?300:special?140:0)),10,560);
  line(S,"최종 평가: "+title+" (최고 "+(LVNAME[c.maxLvl]||"지도자")+" · 리그 "+T.lg+" · 컵 "+T.cup+(T.ucl?" · 유럽컵 "+T.ucl:"")+")");
  finish(S,{title,bonus,special});
}
function finish(S,o){
  const c=S.second; S.after={path:c.path,name:c.name,icon:c.icon,title:o.title,lines:c.lines.slice(),bonus:o.bonus,special:o.special||""};
  L.feedAdd&&L.feedAdd(S,S.year+" 은퇴 후",c.name+" — "+o.title+" (+"+o.bonus+")",1);
  S.second=null;
}
function coachChoose(S,i){
  const c=S.second, n=c.node; let msg="";
  if(n.kind==="course"){
    if(i===1&&S.funds>=5){ S.funds=r1(S.funds-5); c.skillAdd+=.22; c.rep+=3; c.age+=2; line(S,"유럽에서 선진 축구를 배우고 돌아왔어요."); }
    else if(i===2){ c.skillAdd-=.05; c.age+=0; line(S,"자격증은 일하면서 따기로 하고 현장에 뛰어들었어요."); }
    else { c.skillAdd+=.08; c.rep+=1; c.age+=2; line(S,"지도자 자격증(Pro 라이선스)을 차근차근 땄어요."); }
    c.node={kind:"offers",jobs:jobOffers(S)}; return "자격 과정을 마쳤어요.";
  }
  if(n.kind==="offers"){
    const j=n.jobs[i]; if(!j) return "";
    if(j.act==="wait"){ c.waited=true; c.age+=1; c.rep=Math.max(0,c.rep-2); line(S,"잠시 쉬며 다음 기회를 기다렸어요."); c.steps++; c.node={kind:"offers",jobs:jobOffers(S),text:"쉬는 동안 몇 곳에서 소식이 들려왔어요."}; if(c.age>=66) { endCoach(S); } return "한 해를 쉬었어요."; }
    if(j.act==="quit"){ line(S,"지도자 생활을 접고 해설가로 방송 마이크를 잡았어요."); endCoach(S); return "지도자 생활을 마무리했어요."; }
    c.steps++; c.jobs.push(j.id); c.lastJob=j; c.lastFired=false; c.lvl=j.lvl; c.maxLvl=Math.max(c.maxLvl,j.lvl);
    const club=j.lvl>=3?mainClub(S):null;
    line(S,(j.act==="stay"?"같은 팀에서 재계약했어요: ":"")+(j.label||j.name)+(j.act==="stay"?"":" 자리에 부임했어요.")); if(j.act==="stay") c.exp+=1;
    if(j.id==="nat"){ natInit(c,j); return "대표팀 사령탑에 앉았어요. 월드컵이 다가와요."; }
    c.node={kind:"crisis",job:j,ev:null};
    if(j.lvl>=3&&Math.random()<.5){ c.node.ev=pick(CRISES); return j.name+" 자리에 앉았어요."; }
    return resolveTenure(S,j,0);
  }
  if(n.kind==="nat_round") return natChoose(S,i);
  if(n.kind==="crisis"){
    const o=n.ev.o[i]; const d=o?o.d():0; if(o&&o.r) c.rep=clamp(c.rep+o.r,0,100);
    return resolveTenure(S,n.job,d);
  }
  return "";
}
function resolveTenure(S,job,extra){
  const c=S.second, r=runTenure(S,job,extra); c.age+=r.years;
  r.wins.forEach(w=>{ /* 연도별 기록 */ });
  const cnt={}; r.wins.forEach(w=>{ cnt[w]=(cnt[w]||0)+1; }); const winTxt=Object.keys(cnt).map(k=>k+(cnt[k]>1?" "+cnt[k]+"회":"")).join(" · ");
  const tText=r.wins.length?winTxt+" 달성!":(r.avg>.35?"좋은 성적으로 마쳤어요.":r.avg>-.1?"무난하게 마쳤어요.":"부진했어요.");
  line(S,(job.label||job.name)+"에서 "+r.years+"년 — "+tText+(r.grads?" 제자 "+r.grads+"명이 프로에 입단했어요.":""));
  c.rep=clamp(c.rep-1.2+r.avg*4+r.wins.length*(3+job.lvl*.6)+(r.grads?r.grads*.8:0),0,100);
  let out=job.name+" "+r.years+"년: "+tText;
  if(r.fired){ c.lastFired=true; c.fired++; c.lvl=Math.max(0,c.lvl-1); c.rep=Math.max(0,c.rep-9); line(S,"성적 부진으로 경질됐어요."); out+=" 경질됐어요."; }
  if(c.age>=66||(c.fired>=3&&c.rep<20)){ line(S,c.age>=66?"나이가 들어 지도자 생활을 마무리했어요.":"계속된 실패로 지도자 생활을 접었어요."); endCoach(S); return out; }
  c.node={kind:"offers",jobs:jobOffers(S),text:r.fired?"경질 소식이 전해진 뒤, 몇 곳에서 연락이 왔어요.":null};
  return out;
}

/* ---------------- 구단주 ---------------- */
/* 구단주가 되려면 막대한 자산이 필요해요: 최소 5,000억(현금+투자 자산). 인수가는 실제 구단 가치를 단순화한 값(억 원)이에요. */
const OWNER_MIN=5000;
const PRICE_BASE={K2:220,K1:700,J2:350,J1:1000,SPL2:800,SPL:2600,EPL2:2200,LAL2:1800,BUN2:1600,SEA2:1500,FR2:1100,L1:4500,SEA:7000,BUN:7500,LAL:8000,EPL:16000};
const ownerAssets=S=>r1(S.funds+(L.assetValue?L.assetValue(S):0));
L.ownerMin=OWNER_MIN; L.ownerAssets=ownerAssets;
function clubPrice(lg,l){ const f=clamp(.6+(l-60)/50,.5,2.4); return Math.round((PRICE_BASE[lg]||1000)*f/10)*10; }
function ownerCandidates(S){
  const have=ownerAssets(S), played=Object.keys(S.clubYears||{}); const pool=[];
  ["K2","K1","J1","SPL","EPL2","FR2","L1","SEA2","LAL2","BUN2","SEA","BUN","LAL","EPL"].forEach(lg=>{ try{ L.leagueClubs(S,lg).forEach(c=>pool.push({name:c.name,id:c.id,l:c.l,lg,price:clubPrice(lg,c.l),mine:played.includes(c.name)})); }catch(e){} });
  const ok=pool.filter(c=>c.price<=have*.95); const out=[];
  const mine=ok.filter(c=>c.mine).sort((a,b)=>b.price-a.price)[0]; if(mine) out.push(mine);
  const big=ok.slice().sort((a,b)=>b.price-a.price).filter(c=>!out.includes(c)); if(big[0]) out.push(big[0]);
  shuffle(ok.filter(c=>!out.includes(c))).slice(0,2).forEach(c=>out.push(c));
  return out.slice(0,4);
}
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function startOwner(S){
  if(ownerAssets(S)<OWNER_MIN) return;
  S.second={path:"owner",icon:"🏟️",name:"구단주",age:age(S)+1,power:55,fans:50,titles:0,cups:0,spent:0,rounds:0,sold:false,lines:[],node:{kind:"o_buy"},done:false,club:"",k:1,price:0};
}
/* 이 구단주 길의 돈 단위: 구단이 클수록 투자·운영비도 커요 */
const OPLAN=[
 {n:"대형 투자: 스타 선수 영입",c:40,h:"전력 ▲▲ · 위험 ▲",pw:10,fans:4},
 {n:"유소년 아카데미 투자",c:12,h:"전력 ▲ · 오래 지속",pw:4,fans:2},
 {n:"긴축 경영: 지출을 줄인다",c:-10,h:"자금 + · 전력 ▼",pw:-3,fans:-2},
 {n:"새 경기장 개선 공사",c:25,h:"팬 ▲▲ · 전력 ▲",pw:3,fans:7}];
const cst=(o,x)=>Math.round(x*o.k);
function ownerNode(S){
  const o=S.second, n=o.node;
  if(n.kind==="o_buy"){ const cs=ownerCandidates(S); n.cs=cs;
    return {title:"구단을 인수하다",body:"보유 자산 "+ownerAssets(S)+"억(최소 "+OWNER_MIN+"억 필요). 어느 구단의 주인이 될까요? 인수가는 실제 구단 가치를 단순화한 값이에요.",opts:cs.map(c=>({label:c.name+(c.mine?" · 뛰었던 팀":""),hint:L.lgLabel(c.lg)+" · 전력 "+c.l+" · 인수가 "+c.price+"억"}))}; }
  if(n.kind==="o_plan") return {title:"올해의 경영 방침",body:o.club+"의 새 시즌 예산을 정해야 해요. 보유 자금 "+r1(S.funds)+"억 · 구단 전력 "+Math.round(o.power)+" · 팬심 "+Math.round(o.fans)+".",opts:OPLAN.map(p=>{ const c=cst(o,p.c); return {label:p.n+" ("+(c>0?"-":"+")+Math.abs(c)+"억)",hint:p.h,disabled:c>0&&S.funds<c}; })};
  if(n.kind==="o_coach") return {title:"감독 선임",body:"성적 부진으로 감독이 물러났어요. 누구를 앉힐까요?",opts:[
    {label:"유명한 외국인 명장 ("+cst(o,20)+"억)",hint:"전력 ▲▲ · 비용",disabled:S.funds<cst(o,20)},
    {label:"검증된 국내 감독",hint:"무난"},
    {label:"젊은 유망 코치를 발탁",hint:"성공하면 크게 ▲, 실패하면 ▼"},
    {label:"내가 직접 구단 운영에 간여한다",hint:"선수 시절 경험 ▲ · 갈등 위험"}]};
  if(n.kind==="o_proj") return {title:"구단의 미래를 건 프로젝트",body:o.club+"의 다음 10년을 바꿀 큰 결정을 해야 해요. 보유 자금 "+r1(S.funds)+"억.",opts:OPROJ.map(p=>{ const c=cst(o,p.c); return {label:p.n+(c?" ("+(c>0?"-":"+")+Math.abs(c)+"억)":""),hint:p.h,disabled:c>0&&S.funds<c}; })};
  if(n.kind==="o_crisis") return {title:n.ev.t,body:n.ev.b,opts:n.ev.o.map(x=>{ const c=x.cost?cst(o,x.cost):0; return {label:x.l+(c?" ("+(c>0?"-":"+")+Math.abs(c)+"억)":""),hint:x.h,disabled:c>0&&S.funds<c}; })};
  return null;
}
const OPROJ=[
 {n:"신구장 건설",c:120,h:"팬 ▲▲▲ · 해마다 수입 ▲ · 전력 ▲",do:o=>{ o.fans=clamp(o.fans+12,0,100); o.power=clamp(o.power+2,10,98); o.rev=(o.rev||0)+.0025*o.price; o.stadium=true; return "새 경기장이 문을 열었어요. 개장 경기에 만원 관중이 들어찼어요."; }},
 {n:"세계적 유소년 아카데미 설립",c:80,h:"해마다 전력 ▲ · 스타 배출",do:o=>{ o.academy=true; o.power=clamp(o.power+1,10,98); return "아카데미 1기가 입학했어요. 몇 년 뒤 팀의 중심이 될 거예요."; }},
 {n:"지역 사회 재단 설립",c:40,h:"팬 ▲ · 구단 이미지 ▲ · 최종 평가 보너스",do:o=>{ o.found=true; o.fans=clamp(o.fans+6,0,100); return "지역 재단이 출범했어요. 도시가 구단을 더 사랑하게 됐어요."; }},
 {n:"대형 스폰서·중계권 계약",c:-60,h:"자금 ▲▲ · 상업화 논란(팬심 ▼)",do:o=>{ o.fans=clamp(o.fans-4,0,100); return "큰 계약으로 재정이 단단해졌어요. 일부 팬은 '너무 상업적'이라고 불평했어요."; }},
 {n:"지금은 보류한다",c:0,h:"무난",do:o=>"이번엔 프로젝트를 접어 두기로 했어요."}
];
const OCRISES=[
 {t:"스폰서 이탈",b:"메인 스폰서가 갑자기 계약을 해지했어요. 구단 재정에 구멍이 났어요.",o:[
  {l:"사재를 출연해 메운다",h:"안정 · 자금 ▼",cost:30,pw:0,fans:3},
  {l:"주축 선수를 매각한다",h:"자금 ▲ · 전력 ▼▼",cost:-25,pw:-8,fans:-4},
  {l:"구단을 매각하고 떠난다",h:"이야기를 마무리해요",sell:true}]},
 {t:"서포터즈 시위",b:"성적 부진에 분노한 서포터즈가 구단주 퇴진을 요구하며 경기장 앞에 모였어요.",o:[
  {l:"직접 나가서 사과하고 약속한다",h:"위험 · 팬심 크게 변동",pw:0,fans:0,gamble:true},
  {l:"즉각 대대적 개편",h:"전력 ▲ · 비용",cost:20,pw:6,fans:5},
  {l:"모른 척한다",h:"팬심 ▼▼",pw:0,fans:-10}]},
 {t:"빅클럽의 에이스 영입 제안",b:"해외 빅클럽이 우리 에이스를 큰 이적료로 원해요.",o:[
  {l:"거절하고 지킨다",h:"전력 유지 · 팬심 ▲",pw:2,fans:5},
  {l:"이적료를 받고 판다",h:"자금 ▲▲ · 전력 ▼",cost:-45,pw:-6,fans:-3}]},
 {t:"구단 가치 평가",b:"투자사가 구단 지분 일부를 높은 가격에 사고 싶다고 제안했어요.",o:[
  {l:"지분을 일부 매각한다",h:"자금 ▲▲ · 구단 영향력 ▼(팬심 ▼)",cost:-60,pw:0,fans:-5},
  {l:"거절하고 직접 키운다",h:"무난",pw:1,fans:2}]},
 {t:"경기장 증설 기회",b:"시에서 구장 증설 부지를 구단에 넘기겠다고 해요. 큰돈이 들지만 수입이 늘 수 있어요.",o:[
  {l:"증설에 투자한다",h:"팬 ▲▲ · 장기 수입 ▲",cost:50,pw:2,fans:8},
  {l:"지금은 보류한다",h:"무난",pw:0,fans:0}]}
];
function ownerChoose(S,i){
  const o=S.second, n=o.node;
  if(n.kind==="o_buy"){
    const c=(n.cs||[])[i]; if(!c) return ""; let need=c.price;
    if(S.funds<need){ const sell=Math.round(((L.assetValue?L.assetValue(S):0)*.92)*10)/10; if(S.funds+sell<need) return "자금이 부족해요."; S.funds=r1(S.funds+sell); S.assets=[]; line(S,"보유 투자 자산을 정리해 인수 자금을 마련했어요."); }
    S.funds=r1(S.funds-need); o.spent+=need; o.club=c.name; o.price=c.price; o.k=clamp(c.price/900,.35,12); o.power=clamp(30+(c.l-55)*1.45,25,95);
    line(S,c.name+"을(를) "+c.price+"억에 인수했어요. 구단주 "+S.p.name+"의 새 시대가 열렸어요.");
    o.node={kind:"o_plan"}; return c.name+" 인수 완료!";
  }
  if(n.kind==="o_plan"){
    const p=OPLAN[i]; if(!p) return ""; const c=cst(o,p.c);
    if(c>0){ if(S.funds<c) return "자금이 부족해요."; S.funds=r1(S.funds-c); o.spent+=c; } else if(c<0) S.funds=r1(S.funds-c);
    o.power=clamp(o.power+p.pw,10,98); o.fans=clamp(o.fans+p.fans,0,100);
    return ownerSeason(S,p.n);
  }
  if(n.kind==="o_coach"){
    const r=Math.random();
    if(i===0&&S.funds>=cst(o,20)){ const c=cst(o,20); S.funds=r1(S.funds-c); o.spent+=c; o.power=clamp(o.power+8,10,98); line(S,"외국인 명장을 영입해 팀 전력이 확 올랐어요."); }
    else if(i===1){ o.power=clamp(o.power+2,10,98); line(S,"검증된 국내 감독을 선임했어요."); }
    else if(i===2){ if(r<.45){ o.power=clamp(o.power+9,10,98); line(S,"발탁한 젊은 코치가 팀을 완전히 바꿔 놓았어요!"); } else { o.power=clamp(o.power-5,10,98); line(S,"젊은 감독의 경험 부족이 드러나 시즌 초반 고전했어요."); } }
    else { if(r<.4){ o.power=clamp(o.power+5,10,98); o.fans=clamp(o.fans+3,0,100); line(S,"구단주가 직접 챙긴 덕분에 선수단이 하나로 뭉쳤어요."); } else { o.power=clamp(o.power-4,10,98); o.fans=clamp(o.fans-4,0,100); line(S,"구단주의 지나친 간섭이 논란이 되었어요."); } }
    o.node={kind:"o_plan"}; return "새 감독과 함께 출발해요.";
  }
  if(n.kind==="o_proj"){
    const p=OPROJ[i]; if(!p) return ""; const c=cst(o,p.c); if(c>0){ if(S.funds<c) return "자금이 부족해요."; S.funds=r1(S.funds-c); o.spent+=c; } else if(c<0) S.funds=r1(S.funds-c);
    const msg=p.do(o); line(S,p.n+(p.c?"":"")+": "+msg); o.node={kind:"o_plan"}; return msg;
  }
  if(n.kind==="o_crisis"){
    const x=n.ev.o[i]; if(!x) return "";
    if(x.sell){ o.sold=true; const back=Math.round(o.price*.8); S.funds=r1(S.funds+back); line(S,"구단을 "+back+"억에 매각하고 축구계를 떠났어요. 아쉬움이 남았지만 홀가분했어요."); endOwner(S); return "구단을 매각했어요."; }
    const c=x.cost?cst(o,x.cost):0;
    if(c>0){ if(S.funds<c) return "자금이 부족해요."; S.funds=r1(S.funds-c); o.spent+=c; } else if(c<0) S.funds=r1(S.funds-c);
    if(x.gamble){ if(Math.random()<.5){ o.fans=clamp(o.fans+14,0,100); line(S,"진심 어린 사과가 통해 팬들이 박수를 보냈어요."); } else { o.fans=clamp(o.fans-14,0,100); line(S,"사과가 오히려 비난을 키웠어요."); } }
    else { o.power=clamp(o.power+(x.pw||0),10,98); o.fans=clamp(o.fans+(x.fans||0),0,100); line(S,n.ev.t+": "+x.l.replace(/\s*\(.*\)/,"")+" 방식으로 넘겼어요."); }
    o.node={kind:"o_plan"}; return "위기를 넘겼어요.";
  }
  return "";
}
function ownerSeason(S,plan){
  const o=S.second; o.rounds++; const years=3; o.age+=years;
  let t=0,c=0;
  for(let y=0;y<years;y++){ const s=(o.power-64)/22+(o.fans-50)/150+rnd(-.8,.8); if(Math.random()<clamp(.012+s*.05,0,.3)){ t++; o.titles++; } if(Math.random()<clamp(.04+s*.07,0,.3)){ c++; o.cups++; } }
  o.power=clamp(o.power-3+(o.academy?2.2:0),10,98); S.funds=r1(S.funds+(o.rev||0)*3-Math.max(.002*o.price,(.006-o.fans/20000)*o.price)*1);   // 해마다 전력이 식고 운영비가 나가요
  if(S.funds<-.02*o.price){ line(S,"자금난으로 구단 운영이 불가능해 구단을 팔아야 했어요."); o.sold=true; S.funds=r1(S.funds+Math.round(o.price*.6)); endOwner(S); return "자금난으로 구단을 팔았어요."; }
  const rank=o.power>=75?"상위권":o.power>=60?"중위권":"하위권";
  line(S,plan+" — "+rank+(t?"에서 리그 우승 "+t+"회":c?"에서 컵 우승 "+c+"회":"에서 시즌을 보냈어요"));
  if(o.power<48&&Math.random()<.5){ line(S,"부진으로 강등의 아픔을 겪었어요."); o.power=clamp(o.power-4,10,98); o.fans=clamp(o.fans-8,0,100); }
  if(o.rounds>=5||o.age>=76){ endOwner(S); return "구단주 생활의 마지막 장을 넘겨요."; }
  const r=Math.random();
  if(r<.34) o.node={kind:"o_crisis",ev:pick(OCRISES)}; else if(r<.52&&o.rounds>=2&&!(o.stadium&&o.academy&&o.found)) o.node={kind:"o_proj"}; else if(r<.7||o.power<55) o.node={kind:"o_coach"}; else o.node={kind:"o_plan"};
  return rank+"에서 시즌을 마쳤어요."+(t?" 리그 우승 "+t+"회!":"");
}
function endOwner(S){
  const o=S.second; let title, bonus=Math.round(40+o.titles*55+o.cups*22+o.power*.8+o.fans*.4+Math.min(80,o.spent*.02/Math.max(.5,o.k)));
  if(!o.sold) { /* 구단을 끝까지 보유하면 구단 가치 일부가 자산으로 남아요 */ S.funds=r1(S.funds+Math.round(o.price*(.7+o.power/200))); }
  const worth=Math.round(o.price*(.6+o.power/100+o.fans/300+o.titles*.12+(o.stadium?.15:0)));
  if(o.found){ bonus+=25; if(L.charDelta) L.charDelta(S,3,"구단 재단"); }
  if(o.sold&&o.titles===0) { title="구단을 떠난 구단주"; bonus=Math.round(bonus*.5); }
  else if(o.titles>=4) title="왕조를 세운 구단주"; else if(o.titles>=1) title="우승 구단주"; else if(o.cups>=1) title="컵의 구단주"; else title=o.power>=65?"구단을 키운 구단주":"고군분투한 구단주";
  line(S,"최종 평가: "+title+" ("+o.club+" · 리그 우승 "+o.titles+" · 컵 "+o.cups+" · 구단 가치 "+worth+"억 · 인수가 "+o.price+"억)");
  finish(S,{title,bonus:clamp(bonus,15,420)});
}

/* ---------------- 공개 함수 ---------------- */
L.SECOND_PATHS=["coach","owner"];
L.secStart=function(S,id){
  if(S.after||S.second) return null;
  if(id==="coach") startCoach(S); else if(id==="owner") startOwner(S); else return null; if(!S.second) return null;
  return S.second;
};
L.secNode=function(S){
  const s=S.second; if(!s||!s.node) return null;
  return s.path==="coach"?coachNode(S):ownerNode(S);
};
L.secChoose=function(S,i){
  const s=S.second; if(!s) return {text:""};
  const txt=s.path==="coach"?coachChoose(S,i):ownerChoose(S,i);
  return {text:txt,done:!S.second,after:S.after};
};
})();
