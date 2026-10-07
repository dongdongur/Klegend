/*
 * K-라이프: 훈련·트레이너·성장(구간별) · 리그 기록 순위표 · 재능 평가(스카우터) · 소비·후원 · 해외 유스 · 드래프트 판정 · 대표팀 소집 거부
 * (js/life/train.js) — engine.js 의 시즌 진행(playSegment/finishSeason)이 여기 함수를 불러요.
 */
(function(){
"use strict";
const L=window.LIFE, K=window.KLCore;
const {rnd,ri,pick,clamp,logistic,r1,binom,shuffle}=L;
const age=S=>L.age(S);

/* ================= 트레이너 등급 =================
 * 능력치가 높아질수록 일반 코치로는 더 이상 가르칠 수 없어요. 상위 구간은 최상위 트레이너만 효과가 있어요.
 * table: [능력치 미만, 집중 훈련 성공 확률] — 앞에서부터 처음 맞는 칸. gate: 자연 성장이 줄어드는 구간(cap0 이하 100% → cap1 이상 floor) */
const TIERS={
  basic:{id:"basic",name:"하급 코치",desc:"학교·구단 기본 코치. 무료지만 능력치 60대 중반부터는 거의 못 가르쳐요.",cost:0,boost:0,table:[[60,.60],[70,.25],[75,.08],[999,0]],cap0:58,cap1:74,floor:0},
  mid:{id:"mid",name:"중급 전담 트레이너",desc:"70대 초반까지 확실하게, 80대 중반까지는 어느 정도 가르쳐요. 능력치가 낮을 때 성장 +3%.",cost:.04,boost:.03,table:[[70,.70],[78,.45],[85,.20],[999,.04]],cap0:70,cap1:84,floor:.05},
  high:{id:"high",name:"상급 트레이너",desc:"70대 후반까지 안정적으로. 낮은 능력치는 성장 +5%.",cost:.09,boost:.05,table:[[76,.72],[83,.48],[89,.22],[999,.06]],cap0:78,cap1:92,floor:.12},
  top:{id:"top",name:"최상급 트레이너",desc:"세계적인 전문가. 80대 후반 이상은 이 등급 이상이어야 잘 올라요. 낮은 능력치는 성장 +8%.",cost:.16,boost:.08,table:[[80,.75],[88,.55],[94,.30],[999,.12]],cap0:84,cap1:99,floor:.25},
  world:{id:"world",name:"월드클래스 트레이너",desc:"세계 정상급 코치진. 90대에서도 능력치를 올려요. 낮은 능력치는 성장 +12%.",cost:.32,boost:.12,table:[[88,.80],[94,.62],[97,.42],[999,.22]],cap0:90,cap1:99,floor:.4}
};
const TIER_ORDER=["basic","mid","high","top","world"];
L.TIERS=TIERS;
L.priceScale=S=>1+(S.stage==="pro"?Math.max(0,S.salary||0)*.12:0);
L.trainCost=(S,tier)=>r1(Math.max(0,TIERS[tier].cost*L.priceScale(S)*L.traitFx(S.p).learn*100)/100);
L.gritOf=S=>((S.points||{}).grit|0)+((L.hasStaff&&L.hasStaff(S,"coach"))?1:0)+(L.traitFx(S.p).grit|0)+(L.famGrit?L.famGrit(S):0)+(L.charGrit?L.charGrit(S):0);
function gateOf(T,v){ if(v<=T.cap0) return 1; if(v>=T.cap1) return T.floor; return T.floor+(1-T.floor)*(T.cap1-v)/(T.cap1-T.cap0); }
function chanceOf(T,v,tf,grit){ let c=0; for(const [lim,p] of T.table){ if(v<lim){ c=p; break; } } c*=(1+.06*(grit|0)); if(tf&&tf.focus>1) c*=1.2; return clamp(c,0,.95); }
/* 화면에서 보여줄 정보: 이 능력치를 이 등급으로 훈련했을 때 */
L.trainInfo=function(S,k,tier){ const T=TIERS[tier||"basic"], tf=L.traitFx(S.p), v=S.p.stats[k]; const chance=chanceOf(T,v,tf,L.gritOf(S));
  return {chance:Math.round(chance*100),gate:Math.round(gateOf(T,v)*100),value:v,tier:T.id}; };
L.weakStrong=function(S){ const d=L.POSDEF[S.p.pos]; const ks=d.stats.map(([k])=>k).sort((a,b)=>S.p.stats[a]-S.p.stats[b]); return {weak:ks[0],strong:ks[ks.length-1],names:Object.fromEntries(d.stats)}; };

/* ================= 구간 계획 적용 =================
 * 훈련 계획은 구간(전반기·중반기·후반기·시즌 마무리)마다 바꿀 수 있어요. 비용도 구간마다 내요. */
L.INV_SEG={weak:{name:"약점 보강 특훈",cost:.12,desc:"가장 낮은 능력치를 따로 한 번 더 훈련해요. 성공하면 +1."},strong:{name:"강점 특화 특훈",cost:.12,desc:"가장 높은 능력치를 더 갈고닦아요. 이미 높아서 성공 확률은 약점 보강보다 낮아요."},
  medical:{name:"메디컬 케어",cost:.08,desc:"컨디션 +6, 이번 구간 부상 위험 ↓"},mental:{name:"멘탈 코칭",cost:.06,desc:"사기 +4, 기복 ↓"}};
L.setPlan=function(S,plan){
  plan=Object.assign({focus:"",tier:"basic",invest:"",alloc:{}},plan||{}); const cap=L.familyPts(S); const al={}; let used=0;
  L.INV_CATS.forEach(([k])=>{ const v=clamp((plan.alloc&&plan.alloc[k])|0,0,5); const take=Math.min(v,Math.max(0,cap-used)); if(take>0) al[k]=take; used+=take; });
  plan.alloc=al; plan.allocUsed=used; S.plan=plan; return plan;
};
/* 가정 지원 포인트가 줄어들면(유학·집안 사정) 이미 나눠 둔 투자도 남은 포인트에 맞게 줄여요 */
L.trimAlloc=function(S,plan){ const cap=L.familyPts(S); const al=plan.alloc||(plan.alloc={}); let used=0; L.INV_CATS.forEach(([k])=>{ const v=al[k]|0; const take=Math.min(v,Math.max(0,cap-used)); if(take>0) al[k]=take; else delete al[k]; used+=Math.max(0,take); }); plan.allocUsed=used; return plan; };
L.applySegPlan=function(S,seg){
  const plan=S.plan||(S.plan=L.setPlan(S,{})); L.trimAlloc(S,plan); const notes=[]; const sc=L.priceScale(S);
  plan.tierUsed=plan.tier||"basic"; plan.paid=0; plan.investOk=false;
  const special=["rest","media"].includes(plan.focus);
  if(!special&&plan.tierUsed!=="basic"){ let t=plan.tierUsed; while(t!=="basic"&&S.funds<L.trainCost(S,t)) t=TIER_ORDER[Math.max(0,TIER_ORDER.indexOf(t)-1)];
    if(t!==plan.tierUsed) notes.push(TIERS[plan.tierUsed].name+" 비용이 모자라 "+TIERS[t].name+"로 진행했어요."); plan.tierUsed=t;
    const c=L.trainCost(S,plan.tierUsed); if(c>0){ S.funds=r1(S.funds-c); plan.paid=r1(plan.paid+c); } }
  if(plan.invest){ const iv=L.INV_SEG[plan.invest]; const c=r1(iv.cost*sc); if(iv&&S.funds>=c){ S.funds=r1(S.funds-c); plan.paid=r1(plan.paid+c); plan.investOk=true; if(plan.invest==="medical") S.cond=clamp(S.cond+6,0,100); if(plan.invest==="mental") S.morale=clamp(S.morale+4,0,100); } else notes.push(iv.name+" 비용이 모자라 건너뛰었어요."); }
  if(plan.focus==="rest"){ S.cond=clamp(S.cond+10,0,100); S.morale=clamp(S.morale+1,0,100); }
  else if(plan.focus==="media"){ S.fame=Math.max(0,S.fame+ri(2,4)); S.morale=clamp(S.morale+1,0,100); S.cond=clamp(S.cond-1,0,100); }
  else S.cond=clamp(S.cond-3,25,100);
  plan.notes=notes; return plan;
};

/* ================= 구간 성장 =================
 * 능력치는 구간마다 조금씩 변해요. 소수점 변화는 모았다가 1이 넘으면 반영해요. */
L.growSegment=function(S,sim,seg){
  const p=S.p, plan=S.plan||{}, ag=age(S), d=L.POSDEF[p.pos], al=plan.alloc||{}, tf=L.traitFx(p), T=TIERS[plan.tierUsed||plan.tier||"basic"], pts=S.points||{};
  const frac=seg.frac, mentor=pts.mentor|0, grit=L.gritOf(S);
  const rate=L.ageRate(ag+tf.shift,p.pos), gap=clamp((p.pot-p.ovr)/10,.04,ag<19?1.0:1.7);
  const srG=S.team==="2군"?Math.max(sim.sr,.5):sim.sr;
  /* 주전 경험: 지금까지 실제로 뛴 시간 비율(초반엔 예상 역할로 대신), 하부 리그 주전이 상위 리그 후보보다 잘 크고, 여러 해 못 뛰면 정체해요 */
  const gp=sim.r||0, expShare=srG>=.85?.88:srG>=.6?.7:srG>=.35?.42:srG>=.12?.15:.08;
  const share=gp>=4&&sim.my?clamp(sim.my.min/(gp*90),0,1)*Math.min(1,gp/10)+expShare*(1-Math.min(1,gp/10)):expShare;
  const ageF=ag<=21?1.15:ag<=24?1:ag<=27?.6:.25, benchF=Math.min(3,S.benchYrs||0);
  const ptBonus=((srG-.4)*.4+(share-.45)*(share>.45?1.35:1.0))*ageF*(ag<26?1:.5)-(share<.25&&ag<=28?.25*benchF:0);
  const ty=L.TYPES[p.pos].find(x=>x[0]===p.type), ws=L.weakStrong(S);
  p.res=p.res||{}; const before=p.ovr, changes=[]; const PHYS=L.PHYS;
  d.stats.forEach(([k,nm],i)=>{
    const v=p.stats[k]; let dv;
    if(rate>0){ dv=(rate*gap+ptBonus)*tf.grow*(1+.04*mentor*(ag<=20?1:.3)); dv+=.22*(PHYS.has(k)?(al.body|0):(al.skill|0)); dv*=gateOf(T,v)*(1+(T.boost||0)*clamp((78-v)/45,0,1)); if(ag<=15) dv*=1.08; if(S.abroadYouth&&S.stage==="youth") dv*=1.12; }
    else dv=rate*tf.decl;
    dv+=PHYS.has(k)?tf.phys:tf.tech;
    if(PHYS.has(k)&&ag>=28) dv-=.5+(ag-28)*.18;
    dv+=(ty?ty[2][i]:0)*.025; if(plan.focus==="rest") dv-=.15;
    if(L.perkBonus&&rate>0) dv+=L.perkBonus(S,k);
    if(S.slackYears>0) dv-=.3*Math.min(2,S.slackYears);
    if(p.adapt&&p.adapt.left>0&&p.adapt.keys.includes(k)) dv+=.9;   // 새 포지션에 적응하는 동안 새 자리 능력치가 빨리 올라요   // 몸 관리를 소홀히 한 뒤에는 성장이 둔해져요   // 유스 클럽의 특징
    let x=dv*frac+rnd(-1.1,1.1)*tf.vari*clamp(1-.12*(al.mind|0)-.04*grit+.16*(al.camp|0),.35,2)*Math.sqrt(frac)*.9;
    const ch=chanceOf(T,v,tf,grit);
    if(plan.focus===k&&Math.random()<ch) x+=1;
    if(plan.investOk&&plan.invest==="weak"&&k===ws.weak&&Math.random()<Math.min(.95,ch*1.15)) x+=1;   // 약점은 올리기 쉬워요
    if(plan.investOk&&plan.invest==="strong"&&k===ws.strong&&Math.random()<ch*(v>=85?.3:v>=75?.42:.55)) x+=1;   // 이미 높은 강점은 더 오르기 어려워요
    if(p.ovr>=p.pot+1&&x>0) x=Math.min(x,.05);
    p.res[k]=(p.res[k]||0)+x; const dl=Math.trunc(p.res[k]);
    if(dl){ p.res[k]-=dl; const nv=clamp(v+dl,10,S.goat?(S.goatCap||101):99); const real=nv-v; if(real){ p.stats[k]=nv; changes.push({k,name:nm,d:real}); } else p.res[k]=0; }
  });
  p.ovr=L.ovrOf(p); p.peak=Math.max(p.peak,p.ovr);
  return {changes,ovr0:before,ovr1:p.ovr};
};
/* 큰 부상이 나면 체력 능력치가 바로 떨어져요 */
L.injuryHit=function(S){ const d=L.POSDEF[S.p.pos]; d.stats.forEach(([k])=>{ if(L.PHYS.has(k)) S.p.stats[k]=clamp(S.p.stats[k]-1,10,99); }); S.p.ovr=L.ovrOf(S.p); };

/* 시즌이 끝난 뒤 정리: 해외 캠프, 재능 변화, 신뢰·평판·인기, 광고 정산 */
L.seasonPost=function(S,R,sim){
  if(S.slackYears>0&&Math.random()<.6) S.slackYears--;
  const p=S.p, ag=age(S), tf=L.traitFx(p), d=L.POSDEF[p.pos]; const camps=(sim.campLv||[]); const camp=camps.length?Math.round(camps.reduce((a,b)=>a+b,0)/camps.length):0;
  R.famNote=null;
  if(camp>0){ const x=Math.random();
    if(x<.035*camp){ d.stats.forEach(([k])=>{ p.stats[k]=clamp(p.stats[k]+ri(1,3),10,99); }); p.pot=Math.min(99,p.pot+ri(2,5)); R.famNote="해외 캠프에서 눈을 떴어요! 능력치가 한 단계 뛰었어요."; L.addMoment(S,"각성","각성","해외 캠프에서 재능이 한 단계 열렸어요."); }
    else if(x>1-.02*camp){ d.stats.forEach(([k])=>{ p.stats[k]=clamp(p.stats[k]-1,10,99); }); S.morale=clamp(S.morale-15,0,100); R.famNote="무리한 일정에 몸과 마음이 지쳤어요. 약간 후퇴했어요."; } }
  p.ovr=L.ovrOf(p); p.peak=Math.max(p.peak,p.ovr); R.ovr1=p.ovr; R.dOvr=p.ovr-R.ovr0;
  /* 몸값 폭등(바이아웃·이적료 급등): 엄청난 시즌을 보내면 시장 가치가 갑자기 뛰어요. 나이가 많을수록 폭이 작아요(신체 노화 위험) */
  { const aw=R.awards||[]; let sc=0; if(R.rating>0&&R.apps>=15) sc+=Math.max(0,R.rating-6.6)*.55;
    aw.forEach(x=>{ if(/황금공$/.test(x)) sc+=1.0; else if(/MVP|올해의 선수|득점왕|황금 축구화|올해의 골키퍼/.test(x)&&!/후보/.test(x)) sc+=.45; else if(/월드 베스트 11/.test(x)) sc+=.3; else if(/신예 트로피|황금 신예/.test(x)) sc+=.3; });
    (R.trophies||[]).forEach(x=>{ if(/유럽 클럽컵 우승/.test(x)) sc+=.45; else if(/(리그|잉글랜드 1부 리그|스페인 1부 리그|독일 1부 리그|이탈리아 1부 리그) 우승/.test(x)&&!/컵/.test(x)) sc+=.2; });
    if((R.dOvr||0)>=4) sc+=.25;
    const ag2=ag, aG=ag2<=21?1.1:ag2<=25?1:ag2<=28?.75:ag2<=31?.45:ag2<=34?.2:.08;
    const mult=1+Math.min(1.6,Math.max(0,sc))*aG;
    if(S.stage==="pro"&&mult>=1.3&&R.apps>=12&&!R.youth){ const before=L.marketValue(S); S.valueBoost=Math.max(S.valueBoost||1,mult); const after=L.marketValue(S); if(after<before*1.15) S.valueBoost=1; else R.valueSpike={mult:Math.round(mult*100)/100,before,after,why:(R.rating>=7.4?"눈부신 활약":"")+(aw.length?(R.rating>=7.4?" · ":"")+aw[0]:"")}; }
  }
  /* 시즌 출전 비율 → 연속 벤치 연수, 주전으로서의 우승 경험 보너스 */
  { const lgG=Math.max(8,(R.W||0)+(R.D||0)+(R.L||0)), sh=R.military?.5:clamp((R.minutes||0)/(lgG*90),0,1), sick=!!(R.injury&&R.injury.severe)||R.military;
    if(!sick&&ag>=17&&ag<=28){ if(sh<.25) S.benchYrs=(S.benchYrs||0)+1; else if(sh>.5) S.benchYrs=0; } else if(sh>.5) S.benchYrs=0;
    R.playShare=sh;
    const majors=(R.trophies||[]).filter(x=>/우승/.test(x)&&!/주말리그|유소년|대학/.test(x)).length;
    const wf=tf.winner>0;   // 팀 성적형: 벤치에 가까워도(출전 40%+) 우승 경험을 더 크게 얻어요
    if(sh>=(wf?.4:.5)&&R.rating>=(wf?6.2:6.5)&&majors>0&&!sick){ const aF=ag<=21?1.15:ag<=24?1:ag<=27?.6:.25, b=Math.min(wf?.42:.36,(wf?.15:.12)*majors)*aF*(ag<30?1:.5); p.res=p.res||{}; d.stats.forEach(([k])=>{ p.res[k]=(p.res[k]||0)+b; }); R.titleBoost=majors; if(R.rating>=6.8&&ag<=26&&p.pot<(p.pot0||p.pot)+8&&Math.random()<.25) p.pot=Math.min(99,p.pot+1); }
    if((S.benchYrs||0)>=2&&ag<=26&&Math.random()<.5) p.pot=Math.max(p.ovr,p.pot-1); }
  if(R.rating>=7.3&&ag<=27) p.pot=Math.min(99,(p.pot0||p.pot)+8,p.pot+(Math.random()<.5?1:0)); else if(R.rating>0&&R.rating<6.1&&ag<24) p.pot=Math.max(p.ovr,p.pot-(Math.random()<.4?1:0));
  S.trust=clamp(S.trust+((R.sr-.5)*.25+(R.rating>7?.05:0))*(((R.sr-.5)>0)?tf.trust:1),.05,.95);
  S.rep=clamp(S.rep+(R.rating-6.4)*4+(R.awards.length*6)+(R.trophies.length*3),0,100);
  S.fame=Math.max(0,S.fame+L.fameStep(S,((R.goals*.5+R.assists*.3)/Math.max(1,(R.apps/20))+(R.awards.length*6)+R.trophies.length*4)*tf.fame)); /* 인기는 오르기만 하지 않아요: 부진·벤치·비호감이 이어지면 팬이 등을 돌려요 */
  { const f0=S.fame; let loss=0; const ch=L.charOf(S), sick=!!(R.injury&&R.injury.severe)||R.military; const reasons=[];
    if(R.rating>0&&R.rating<5.75&&R.apps>=10){ loss+=(5.75-R.rating)*7*(1+f0/150); reasons.push("부진한 경기력"); }
    if(R.playShare!=null&&R.playShare<.25&&!sick&&ag>=18&&f0>=15){ loss+=2+f0*.035; reasons.push("출전 기회 부족"); }
    if(ch<40){ loss+=(40-ch)*.14*(1+f0/200); reasons.push("비호감 이미지"); }
    if(R.rank&&R.N&&R.rank>R.N-3&&R.apps>=10&&S.stage==="pro"){ loss+=1+f0*.015; reasons.push("팀 강등권"); }
    loss*= tf.fame>1.2?.8:1; loss=Math.min(loss,f0*.25);
    if(S.p.adapt){ S.p.adapt.left--; if(S.p.adapt.left<=0) delete S.p.adapt; }
  if(L.isStar&&L.isStar(S)) loss*=.5; if(loss>=1){ S.fame=Math.max(0,S.fame-loss); R.fameDrop=Math.round(loss); R.fameWhy=reasons.join(" · "); } }
  S.fameMax=Math.max(S.fameMax||0,S.fame); S.rep=clamp(S.rep+(L.charOf(S)-50)*.04,0,100);
  /* 후원 정산 */
  R.endorse=null; R.endorses=[]; L.endorsesOf(S).slice().forEach(e=>{ const chx=L.charOf(S);
    if(chx<35&&Math.random()<.3){ const pay0=r1(e.fee*.3); S.funds=r1(S.funds+pay0); S.career.sponsor=r1((S.career.sponsor||0)+pay0); R.endorses.push({brand:e.brand,ok:false,pay:pay0,cancelled:true}); S.fame=Math.max(0,S.fame-3); S.endorses=S.endorses.filter(x=>x!==e); return; }   // 이미지 조항 위반으로 해지
    const ok=L.endorseCheck(e,R,S); const pay=(ok?e.fee:r1(e.fee*.5))*(chx>=75?1.1:1); S.funds=r1(S.funds+pay); S.career.sponsor=r1((S.career.sponsor||0)+pay);
    R.endorses.push({brand:e.brand,ok,pay}); if(!ok) S.fame=Math.max(0,S.fame-2); e.years--; if(e.years<=0) S.endorses=S.endorses.filter(x=>x!==e); });
  R.endorse=R.endorses[0]||null;
  /* 차량 유지비 */
  const upkeep=r1((S.cars||[]).reduce((a,c)=>a+c.price*.05,0)); if(upkeep>0){ S.funds=r1(Math.max(0,S.funds-upkeep)); R.upkeep=upkeep; }
  if(S.stage==="youth"&&L.isStar&&L.isStar(S)&&S.fame>=6){ const gift=r1(Math.min(.6,S.fame*.012)); S.funds=r1(S.funds+gift); R.starSponsor=gift; L.feedAdd(S,S.year+" 후원","스타 유망주로 알려져 지역 후원금 "+gift+"억을 받았어요 (재능 개발·트레이너에 쓸 수 있어요)",1); }
  if(L.moneyYear) L.moneyYear(S,R);
};

/* ================= 재능 평가 (스카우터) =================
 * 20세가 될 때까지는 '예상 등급 범위'만 알려 줘요. 경기 결과·성장·운에 따라 20세 시즌이 끝나면 하나로 확정돼요. */
const GR=["C","B","A","S"], gi=pot=>pot>=90?3:pot>=82?2:pot>=74?1:0;
L.gradeOfPot=gi; L.GRADES=GR;
L.scoutBand=function(S){
  const p=S.p, g=gi(p.pot);
  if(S.scoutFinal) return {lo:g,hi:g,final:true,label:GR[g]};
  const w=clamp((20-age(S))*1.5,0,10), bias=p.scoutBias||0, c=p.pot+bias*(w/10);
  const lo=Math.min(g,gi(c-w*.6)), hi=Math.max(g,gi(c+w*.6));
  return {lo,hi,final:false,label:lo===hi?GR[lo]:GR[lo]+"~"+GR[hi]};
};
/* 시즌 끝에 호출: 20세 시즌을 마치면 재능 딱지를 확정해요 */
L.scoutCheck=function(S){
  if(S.scoutFinal) return null; const a=age(S); if(a<20&&!(S.startAge>=19&&S.history.length>=1)) return null;
  S.scoutFinal=true; const g=gi(S.p.pot); S.p.grade=GR[g]; return {grade:GR[g],hidden:S.p.hidden};
};

/* ================= 리그 기록 순위 (득점·도움·평점) =================
 * 다른 팀 선수들의 기록은 팀 득점을 전력 있는 공격 자원에게 나눠서 만든 가상 기록이에요. */
const FNAMES=["김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","전"], GNAMES=["민준","서준","도윤","시우","주원","하준","지호","준서","건우","현우","우진","선우","연우","정우","승민","재윤","태양","동현","유찬","시윤"];
L.buildBoard=function(S,sim,R){
  const rosters={}; const key=sim.key;
  const rosterOf=t=>{ if(rosters[t.id]) return rosters[t.id];
    let ps=null; const def=L.defById&&L.defById(t.id); if(def&&def.players) ps=def.players.map(p=>({name:p.name,pos:p.pos,ovr:p.ovr}));
    else { const ec=L.flFind(t.id); if(ec&&ec.players) ps=ec.players.map(p=>({name:p[0],pos:p[1],ovr:p[2]})); }
    if(!ps||ps.length<12){ ps=[]; const mix=["GK","DF","DF","DF","DF","MF","MF","MF","FW","FW","FW","MF","DF","FW"]; mix.forEach(pos=>ps.push({name:pick(FNAMES)+pick(GNAMES),pos,ovr:(t.l||60)+rnd(-8,6)})); }
    ps=ps.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,16); rosters[t.id]=ps; return ps; };
  const gW={GK:0,DF:.5,MF:2.4,FW:5}, aW={GK:.05,DF:.9,MF:3,FW:2.2};
  const pickW=(ps,W)=>{ const ws=ps.map(p=>(W[p.pos]||1)*Math.max(1,p.ovr-62)); const tot=ws.reduce((a,b)=>a+b,0); let r=Math.random()*tot; for(let i=0;i<ps.length;i++){ r-=ws[i]; if(r<=0) return ps[i]; } return ps[ps.length-1]; };
  const rows=new Map(); const rec=(p,t)=>{ const k=t.id+"|"+p.name; let r=rows.get(k); if(!r){ r={name:p.name,team:t.short||t.name,g:0,a:0,ovr:p.ovr,pos:p.pos,rt:null}; rows.set(k,r); } return r; };
  sim.teams.forEach(t=>{ if(t.id===sim.myId) return; const tb=sim.tab[t.id]; const ps=rosterOf(t); if(!ps.length) return;
    for(let i=0;i<tb.gf;i++){ const s=pickW(ps,gW); rec(s,t).g++; if(Math.random()<.74){ const cand=ps.filter(p=>p!==s); const as=pickW(cand,aW); rec(as,t).a++; } }
    const avg=ps.slice(0,11).reduce((a,p)=>a+p.ovr,0)/Math.min(11,ps.length);
    ps.slice(0,13).forEach(p=>{ const r=rec(p,t); r.rt=r1(clamp(6.15+(p.ovr-avg)/22+(tb.pts/Math.max(1,tb.p)-1.3)*.18+r.g*.035+r.a*.02+rnd(-.28,.28),5.6,8.2)); }); });
  const arr=[...rows.values()];
  const me={name:S.p.name,team:(sim.teams.find(t=>t.id===sim.myId)||{}).short||"내 팀",g:R.goals,a:R.assists,rt:R.apps>=Math.min(15,Math.round(sim.rounds.length*.4))?R.rating:null,me:true,pos:S.p.pos,ovr:S.p.ovr};
  arr.push(me);
  const top=(f,minv)=>arr.filter(x=>x[f]!=null&&x[f]>=minv).sort((x,y)=>y[f]-x[f]||(x.me?-1:0)).slice(0,10).map(x=>({name:x.name,team:x.team,v:x[f],me:!!x.me}));
  const board={scorers:top("g",1),assists:top("a",1),ratings:top("rt",5)};
  board.maxG=Math.max(0,...arr.filter(x=>!x.me).map(x=>x.g)); board.maxA=Math.max(0,...arr.filter(x=>!x.me).map(x=>x.a));
  board.maxRt=Math.max(0,...arr.filter(x=>!x.me&&x.rt!=null).map(x=>x.rt));
  return board;
};

/* ================= 소비 · 후원 ================= */
L.CARS=[
 {id:"suv",name:"국산 SUV",price:.4,mood:6,cond:3,fame:0,note:"가족과 함께 타는 든든한 첫 차"},
 {id:"sedan",name:"수입 세단",price:1.2,mood:8,cond:4,fame:2,note:"점잖고 안정적인 선택"},
 {id:"sport",name:"스포츠카",price:3,mood:12,cond:5,fame:4,note:"드라이브가 기분 전환에 최고"},
 {id:"ferrari",name:"페라리",price:9,mood:16,cond:6,fame:7,note:"붉은 말이 새겨진 꿈의 차"},
 {id:"lambo",name:"람보르기니",price:12,mood:18,cond:6,fame:8,note:"황소처럼 달리는 슈퍼카"},
 {id:"rolls",name:"롤스로이스",price:25,mood:22,cond:8,fame:10,note:"움직이는 궁전. 구단 주차장에서 눈에 띄어요"},
];
L.GIFTS=[
 {id:"family",name:"가족 선물·여행",price:1,mood:9,cond:5,fame:0,rep:0,note:"뒷바라지해 준 가족에게 보답해요"},
 {id:"donate",name:"유소년 축구 기부",price:.6,mood:6,cond:0,fame:3,rep:3,note:"지역 유소년 팀에 기부해요. 평판이 올라요"},
 {id:"spa",name:"프리미엄 회복 케어",price:.5,mood:4,cond:14,fame:0,rep:0,note:"컨디션을 크게 끌어올려요"},
 {id:"penthouse",name:"한강뷰 펜트하우스",price:40,mood:20,cond:10,fame:4,rep:0,note:"집이 곧 최고의 회복 시설이에요"},
 {id:"yacht",name:"요트",price:60,mood:25,cond:8,fame:6,rep:0,note:"바다 위에서 완벽한 휴식"},
 {id:"academy",name:"유소년 축구센터 설립",price:80,mood:12,cond:0,fame:6,rep:8,note:"내 이름을 딴 센터를 세워요. 평판이 크게 올라요"},
 {id:"jet",name:"전용기",price:250,mood:30,cond:10,fame:12,rep:0,note:"이동은 전용기로. 인기와 사기가 폭발해요"},
];
L.canSpend=S=>S.stage==="pro"||S.funds>=1;
L.buyItem=function(S,kind,id){
  const it=(kind==="car"?L.CARS:L.GIFTS).find(x=>x.id===id); if(!it) return {ok:false,text:"없는 상품이에요."};
  if(S.funds<it.price) return {ok:false,text:"자금이 부족해요. (필요 "+it.price+"억, 보유 "+S.funds+"억)"};
  if(kind==="car"&&(S.cars||[]).some(c=>c.id===id)) return {ok:false,text:"이미 가지고 있어요."};
  if(it.price>=40){ S.owned=S.owned||[]; if(S.owned.includes(id)) return {ok:false,text:"이미 가지고 있어요."}; S.owned.push(id); }
  S.funds=r1(S.funds-it.price); S.morale=clamp(S.morale+it.mood,0,100); S.cond=clamp(S.cond+it.cond,0,100);
  const lines=["사기 +"+it.mood]; if(it.cond) lines.push("컨디션 +"+it.cond);
  /* 인기가 높을수록 자랑이 되고, 낮은데 사치하면 눈총을 받아요 */
  let fameGain=it.fame; if(kind==="car"){ if(S.fame<20&&it.price>=9){ S.trust=clamp(S.trust-.04,.05,.95); fameGain=Math.round(fameGain/2); lines.push("신인이 사치한다는 말이 나와요 (감독 신뢰 ↓)"); } else if(S.fame>=40) fameGain+=2; S.cars=(S.cars||[]).concat([{id,name:it.name,price:it.price,year:S.year}]); S.vanity=(S.vanity||0)+it.price; }
  if(fameGain) { S.fame=Math.max(0,S.fame+fameGain); lines.push("인기 +"+fameGain); }
  if(it.id==="donate") L.charDelta(S,3,"기부: "+it.name); if(it.id==="academy") L.charDelta(S,6,"기부: "+it.name); if(it.id==="family") L.charDelta(S,1.5,"가족: "+it.name);
  if(it.rep){ S.rep=clamp(S.rep+it.rep,0,100); lines.push("평판 +"+it.rep); }
  L.feedAdd(S,S.year+" 소비",it.name+" 구매 ("+it.price+"억)",1); L.addMoment(S,kind==="car"?"차량 구매":"소비",it.name,it.name+"을(를) 샀어요. ("+it.price+"억)");
  return {ok:true,text:it.name+" 구매 완료! "+lines.join(" · ")};
};
/* 광고 브랜드(전부 가상): 같은 분야는 한 곳과만 계약할 수 있어요(경쟁 업체를 동시에 할 수 없음) */
const CATS={shoe:"스포츠 신발",wear:"의류",home:"가전",beauty:"화장품",drink:"음료",car:"자동차",it:"통신·IT",watch:"시계·패션",food:"식품",game:"게임",bank:"금융"};
L.CATS=CATS;
L.BRANDS=[{id:"nako",name:"나O키",cat:"shoe"},{id:"adios",name:"아O다스",cat:"shoe"},{id:"pumer",name:"퓨머",cat:"shoe"},{id:"nbal",name:"뉴발O스",cat:"shoe"},{id:"undr",name:"언더O머",cat:"shoe"},{id:"mizo",name:"미O노",cat:"shoe"},
 {id:"w_bom",name:"스튜디오 봄",cat:"wear"},{id:"w_coat",name:"모던 코트",cat:"wear"},{id:"w_street",name:"스트릿 노트",cat:"wear"},
 {id:"h_alpha",name:"알파전자",cat:"home"},{id:"h_hanbit",name:"한빛가전",cat:"home"},{id:"h_lumi",name:"루미 테크",cat:"home"},
 {id:"b_soli",name:"솔리 코스메틱",cat:"beauty"},{id:"b_nature",name:"네이처 에이치",cat:"beauty"},{id:"b_bloom",name:"블루밍 스킨",cat:"beauty"},
 {id:"d_ion",name:"시원 이온",cat:"drink"},{id:"d_pang",name:"탄산 팡",cat:"drink"},{id:"d_boost",name:"에너지 부스트",cat:"drink"},
 {id:"c_motor",name:"모터 루미",cat:"car"},{id:"c_hydra",name:"하이드라 모터스",cat:"car"},
 {id:"i_link",name:"링크텔",cat:"it"},{id:"i_nova",name:"노바 모바일",cat:"it"},
 {id:"t_crown",name:"타임 크라운",cat:"watch"},{id:"t_edge",name:"엣지 아이웨어",cat:"watch"},
 {id:"f_chick",name:"바삭 치킨",cat:"food"},{id:"f_ramen",name:"든든 라면",cat:"food"},
 {id:"g_ball",name:"볼터치 게임즈",cat:"game"},{id:"k_bank",name:"한결 은행",cat:"bank"}];
L.brandCat=function(id){ const b=L.BRANDS.find(x=>x.id===id); return b?b.cat:"shoe"; };
/* 광고 슬롯: 인기에 따라 동시에 맺을 수 있는 계약 수가 늘어요 (30·70·150 인기에서 +1) */
L.endorseSlots=S=>(S.fame>=150?4:S.fame>=70?3:S.fame>=30?2:1)+((L.isStar&&L.isStar(S))?1:0);
L.endorsesOf=S=>{ if(!S.endorses) S.endorses=[]; if(S.endorse){ S.endorses.push(S.endorse); S.endorse=null; } return S.endorses; };
L.endorseFree=S=>L.endorseSlots(S)-L.endorsesOf(S).length;
L.endorseOffers=function(S){
  if(S.stage!=="pro"||S.fame<14||L.endorseFree(S)<=0) return [];
  const have=L.endorsesOf(S).map(e=>e.id), haveCat=L.endorsesOf(S).map(e=>e.cat||L.brandCat(e.id)); const n=Math.min(L.endorseFree(S),S.fame>=70?4:S.fame>=40?3:S.fame>=25?2:1); const seen=new Set(), bs=[]; /* 축구 선수의 대표 광고는 스포츠 용품이에요: 아직 없다면 첫 제의는 대부분 신발 브랜드 */
  const pool=shuffle(L.BRANDS.filter(b=>!have.includes(b.id)&&!haveCat.includes(b.cat))); if(!haveCat.includes('shoe')&&Math.random()<.85){ const sb=pool.find(b=>b.cat==='shoe'); if(sb){ seen.add('shoe'); bs.push(sb); } }
  pool.forEach(b=>{ if(bs.length<n&&!seen.has(b.cat)){ seen.add(b.cat); bs.push(b); } }); const p=S.p;
  const lgF=S.club&&L.isForeign(S.club.lg)?(S.club.lg==='EPL'||S.club.lg==='LAL'||S.club.lg==='BUN'||S.club.lg==='SEA'?1:.6):.28;
  return bs.map((b,bi)=>{ const star=Math.pow(L.fameEff(S.fame)/100,3.2)*Math.pow(clamp((p.ovr-72)/25,0,1),1.4); const fee=r1(Math.max(.3,.3+(L.fameEff(S.fame)/100)*3+650*star*lgF)*(b.id==='nako'||b.id==='adios'?1.55:b.cat==='shoe'?1.4:b.cat==='wear'?.8:b.cat==='car'||b.cat==='watch'||b.cat==='bank'?.75:b.cat==='food'||b.cat==='drink'?.5:.6)*rnd(.88,1.12)*L.traitFx(p).endorse*L.charEndorseMul(S)*((L.hasStaff&&L.hasStaff(S,"agent"))?1.1:1)); const yrs=ri(1,4);
    const opt=Math.random();
    const clause=opt<.4?{type:"fame",n:Math.min(95,Math.round(S.fame+6)),label:"시즌 말 인기 "+Math.min(95,Math.round(S.fame+6))+" 이상"}:opt<.75?{type:"apps",n:25,label:"리그 25경기 이상 출전"}:{type:"rating",n:6.9,label:"시즌 평점 6.9 이상"};
    return {brand:b.name,id:b.id,cat:b.cat,catName:CATS[b.cat],fee:(S.club&&S.club.lg==="K4")?Math.max(.1,r1(fee*.3)):fee,years:yrs,clause}; });   // 4부 선수의 광고는 지역 업체 수준이에요
};
L.endorseCheck=function(e,R,S){ const c=e.clause; if(c.type==="fame") return S.fame>=c.n; if(c.type==="apps") return R.apps>=c.n; return R.rating>=c.n; };
L.signEndorse=function(S,o){ L.endorsesOf(S).push({id:o.id,cat:o.cat,brand:o.brand,fee:o.fee,years:o.years,clause:o.clause}); S.fame=Math.max(0,S.fame+3); L.addMoment(S,"광고 계약","광고",o.brand+"와(과) 광고 계약을 맺었어요. (연 "+o.fee+"억)"); };

/* ================= 해외 유스 =================
 * 유소년 때 두각을 나타내거나 집이 부유하면 잉글랜드 1부 리그 구단의 유스로 갈 수 있어요. 환경이 좋아서 성장이 빠르지만 적응이 힘들어요. */
L.overseasYouthOffer=function(S){
  if(S.stage!=="youth"||S.abroadYouth||S.club&&S.club.abroad) return null; const ag=age(S); if(ag<15||ag>17) return null;
  const ref=L.youthLevel(ag)+(S.youthTier||0), rel=S.p.ovr-ref; const rich=S.family&&S.family.pts0>=9;
  const star=rel>=6; if(!star&&!rich) return null;
  const clubs=shuffle(L.EPL().filter(c=>c.l<=88&&c.l>=74)).slice(0,3);
  return {kind:star?"scout":"study",clubs,star,rich,rel:Math.round(rel)};
};
L.goAbroadYouth=function(S,c,kind){
  const ag=age(S); S.abroadYouth=true; S.youthTier=(S.youthTier||0)+4; S.club={id:"abroad_"+c.id,name:L.youthTeamName(c.short,ag),short:c.short,lg:"YOUTH",code:null,parent:c.id,abroad:true};
  S.morale=clamp(S.morale-8,0,100); if(kind==="study"&&S.family) S.family.pts=Math.max(0,S.family.pts-3);
  L.addMoment(S,"해외 유스","해외 유스",c.name+" 아카데미로 건너갔어요.");
};

/* ================= 드래프트 판정 · 해외 직행 · 대표팀 소집 거부 · 중도 포기 ================= */
L.draftChance=function(S){ const p=S.p, score=p.ovr+(p.pot-p.ovr)*.35; const starB=(L.isStar&&L.isStar(S)&&S.fame>=12)?.08:0; return Math.round(clamp(logistic((score-50)/5.5)+starB,.03,.97)*100); };
L.overseasDirect=function(S){
  const p=S.p, ag=age(S); const rich=S.family&&S.family.pts0>=9; if(!(rich||p.ovr>=66)) return [];
  return shuffle(L.EPL().filter(c=>c.l<=Math.max(78,p.ovr+14))).slice(0,2).map(c=>({club:L.clubRef(S,{id:c.id,name:c.name,short:c.short,col:c.col},"EPL"),lvl:c.l,salary:L.salaryOf(Math.max(50,p.ovr-6),ag,"EPL")*.5,years:3,role:"2군(U21)",sr:.1,foreign:true,direct:true,tag:"해외 직행"}));
};
L.declineCall=function(S,c){ if(L.charDelta) L.charDelta(S,-4,"대표팀: 소집 불참");
  c.done=true; S.nat=S.nat||{}; S.nat.refused=(S.nat.refused||0)+1; const t=L.TOURN[c.t];
  S.fame=Math.max(0,S.fame-(t.id==="wc"?6:3)); S.rep=clamp(S.rep-2,0,100); S.morale=clamp(S.morale+2,0,100);
  const r={t:c.t,name:c.name,year:S.year,declined:true,text:"소집에 응하지 않았어요. 여론이 싸늘해졌어요."}; if(S.sim) S.sim.natRecs.push(r);
  L.feedAdd(S,S.year+" 대표팀",c.name+" 소집 불참 — 팬들의 비판이 이어져요",-1);
  if(S.nat.refused===3) L.addMoment(S,"대표팀 기피","대표팀 기피","세 번째 소집을 거부했어요. '대표팀 기피자'라는 비난이 따라붙어요.");
  return r;
};
L.quitCareer=function(S,reason,text){ S.retired=true; S.quit={reason,text,year:S.year,age:age(S)}; S.phase="quit"; L.addMoment(S,"운동 포기","운동 포기",text); };
/* 최종 드래프트(또는 재수 불가)에서 지명이 안 되면 커리어가 끝나요 */
})();
