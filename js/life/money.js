/*
 * K-라이프 돈 쓸 곳 (js/life/money.js)
 *  1) 전담 스태프: 해마다 비용을 내면 훈련·부상·컨디션 등에서 계속 도움을 줘요 (자금이 모자라면 자동 해지)
 *  2) 투자: 예금·부동산·주식·가상자산·카페·내 브랜드. 해마다 수익률이 정해지고 팔 수 있어요
 *  3) 명예: 자서전·재단·동상·구단 지분·구단 인수. 커리어 점수가 오르고 평판·인기가 올라요
 * 소비·후원 창의 탭에서 쓸 수 있어요.
 */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const {clamp,r1,rnd,ri}=L;
const randn=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };

/* ---------- 1) 스태프 ---------- */
L.STAFF=[
 {id:"chef",icon:"🍳",name:"개인 요리사",cost:.3,desc:"구간마다 컨디션 +3, 부상 확률 −5%"},
 {id:"physio",icon:"🩺",name:"전담 의료팀",cost:.9,desc:"부상 확률 −15%, 결장 기간 −20%"},
 {id:"coach",icon:"🧑‍🏫",name:"개인 기술 코치",cost:1.4,desc:"집중 훈련 성공 확률 +6%p"},
 {id:"mental",icon:"🧘",name:"멘탈 코치",cost:.6,desc:"구간마다 사기 +2, 슬럼프에 강해져요"},
 {id:"analyst",icon:"📊",name:"데이터 분석팀",cost:1.8,desc:"출전 비중 +2%p, 상대 분석으로 평점 소폭 상승"},
 {id:"agent",icon:"🤝",name:"프리미엄 에이전트",cost:1.2,desc:"재계약 연봉 +4%, 광고 계약금 +10%"},
 {id:"pr",icon:"📣",name:"홍보·SNS 팀",cost:1.0,desc:"시즌마다 인기 +2"}
];
L.hasStaff=(S,id)=>!!(S.staff&&S.staff.includes(id));
L.staffCost=(S,s)=>r1(s.cost*(1+Math.max(0,S.salary||0)*.06));
L.hire=function(S,id){ const s=L.STAFF.find(x=>x.id===id); if(!s) return {ok:false,text:"없는 스태프예요."}; S.staff=S.staff||[]; if(S.staff.includes(id)) return {ok:false,text:"이미 고용했어요."};
  const c=L.staffCost(S,s); if(S.funds<c) return {ok:false,text:"자금이 부족해요. (첫 해 비용 "+c+"억)"}; S.staff.push(id); S.funds=r1(S.funds-c); S.hired=S.hired||{}; S.hired[id]=S.year; L.feedAdd(S,S.year+" 소비",s.name+" 고용 (연 "+c+"억)",1); return {ok:true,text:s.name+"을(를) 고용했어요. 해마다 "+c+"억이 들어요."}; };
L.fire=function(S,id){ S.staff=(S.staff||[]).filter(x=>x!==id); const s=L.STAFF.find(x=>x.id===id); return {ok:true,text:(s?s.name:"스태프")+"와(과) 계약을 끝냈어요."}; };
/* 구간마다 */
L.moneySegment=function(S){ const notes=[]; if(S.stage!=="pro") return notes;
  if(L.hasStaff(S,"chef")){ S.cond=clamp(S.cond+3,0,100); }
  if(L.hasStaff(S,"mental")){ S.morale=clamp(S.morale+2,0,100); }
  return notes; };

/* ---------- 2) 투자 ---------- */
L.ASSETS=[
 {id:"bond",icon:"🏦",name:"예금·국채",mean:.03,vol:.006,min:1,desc:"거의 안 변해요. 연 3% 안팎."},
 {id:"estate",icon:"🏢",name:"이스트 건물(부동산)",mean:.07,vol:.09,min:10,desc:"임대 수익과 시세 차익. 연 7% 안팎, 가끔 크게 출렁여요."},
 {id:"stock",icon:"📈",name:"주식 ETF",mean:.08,vol:.22,min:2,desc:"평균 연 8%, 해마다 ±22%쯤 출렁여요."},
 {id:"coin",icon:"🪙",name:"가상자산",mean:.12,vol:.65,min:1,desc:"대박과 쪽박이 모두 가능해요. 한 해에 반토막도 나요."},
 {id:"cafe",icon:"☕",name:"카페 창업",mean:.18,vol:.35,fail:.08,min:3,desc:"성공하면 짭짤하지만 폐업 위험(해마다 8%)이 있어요."},
 {id:"brand",icon:"👕",name:"내 이름 브랜드(의류)",mean:.15,vol:.5,fail:.06,fameScaled:true,min:15,desc:"인기가 높을수록 잘 팔려요. 실패하면 사라져요(해마다 6%)."}
];
L.assetDef=id=>L.ASSETS.find(a=>a.id===id);
L.buyAsset=function(S,id,amt){ const d=L.assetDef(id); if(!d) return {ok:false,text:"없는 상품이에요."}; amt=r1(+amt); if(!isFinite(amt)||amt<=0) return {ok:false,text:"투자 금액이 올바르지 않아요."}; if(!isFinite(S.funds)) S.funds=0;
  if(amt<d.min) return {ok:false,text:"최소 "+d.min+"억부터 투자할 수 있어요."}; if(S.funds<amt) return {ok:false,text:"자금이 부족해요."};
  S.assets=S.assets||[]; let a=S.assets.find(x=>x.id===id); if(!a){ a={id,cost:0,value:0,last:null,year:S.year}; S.assets.push(a); }
  const fr=(S.sim&&S.sim.segs&&S.sim.segs.length)?Math.max(0,Math.min(1,1-S.sim.seg/S.sim.segs.length)):1;   /* 시즌 도중에 넣은 돈은 남은 기간만큼만 수익이 붙어요 */
  a.fresh=r1((a.fresh||0)+amt); a.freshW=(a.freshW||0)+amt*fr;
  a.cost=r1(a.cost+amt); a.value=r1(a.value+amt); S.funds=r1(S.funds-amt); L.feedAdd(S,S.year+" 투자",d.name+" "+amt+"억 투자",1); return {ok:true,text:d.name+"에 "+amt+"억을 투자했어요."}; };
L.sellAsset=function(S,id){ const a=(S.assets||[]).find(x=>x.id===id); if(!a) return {ok:false,text:"가진 자산이 아니에요."}; const d=L.assetDef(id); S.funds=r1(S.funds+a.value); const gain=r1(a.value-a.cost);
  S.assets=S.assets.filter(x=>x!==a); S.assetProfit=r1((S.assetProfit||0)+gain); L.feedAdd(S,S.year+" 투자",d.name+" 매각 ("+(gain>=0?"+":"")+gain+"억)",gain>=0?1:-1); return {ok:true,text:d.name+"을(를) 팔았어요. "+r1(a.value)+"억 회수 ("+(gain>=0?"+":"")+gain+"억)"}; };
L.assetValue=S=>r1((S.assets||[]).reduce((s,a)=>s+a.value,0));

/* ---------- 3) 명예 ---------- */
L.HONORS=[
 {id:"bio",icon:"📖",name:"자서전 출간",price:3,legacy:25,fame:5,rep:2,note:"내 이야기를 책으로 남겨요."},
 {id:"doc",icon:"🎬",name:"다큐멘터리 제작",price:8,legacy:45,fame:8,rep:3,note:"선수 인생을 담은 다큐가 공개돼요."},
 {id:"found",icon:"🎗️",name:"개인 재단 설립",price:30,legacy:90,rep:8,fame:3,yearly:-1.5,note:"해마다 1.5억씩 기부금이 나가요. 평판과 커리어 점수가 올라요."},
 {id:"statue",icon:"🗿",name:"구단 앞 동상 건립",price:120,legacy:120,fame:10,rep:5,needYears:5,note:"한 구단에서 5시즌 이상 뛰어야 세울 수 있어요."},
 {id:"stake",icon:"📑",name:"소속 구단 지분 인수(약 5%)",price:300,legacy:180,rep:6,fame:6,yield:.03,note:"해마다 지분 가치의 3%가 배당으로 들어와요."},
 {id:"owner",icon:"🏟️",name:"구단 인수 (구단주)",price:1500,legacy:420,rep:12,fame:12,yield:.02,note:"한 구단의 구단주가 돼요. 은퇴 후 '구단주' 칭호가 붙어요."}
];
L.honorDef=id=>L.HONORS.find(h=>h.id===id);
L.hasHonor=(S,id)=>!!(S.honors&&S.honors.some(h=>h.id===id));
L.buyHonor=function(S,id){ const h=L.honorDef(id); if(!h) return {ok:false,text:"없는 항목이에요."}; if(L.hasHonor(S,id)) return {ok:false,text:"이미 했어요."};
  if(S.funds<h.price) return {ok:false,text:"자금이 부족해요. (필요 "+h.price+"억)"};
  if(h.needYears){ const yrs=S.club?(S.clubYears||{})[S.club.name]||0:0; if(yrs<h.needYears) return {ok:false,text:"현재 구단에서 "+h.needYears+"시즌 이상 뛰어야 해요. (지금 "+yrs+"시즌)"}; }
  S.honors=S.honors||[]; S.honors.push({id,year:S.year,club:S.club?S.club.name:"",price:h.price});
  S.funds=r1(S.funds-h.price); if(h.fame) S.fame=Math.max(0,S.fame+h.fame); if(h.rep) S.rep=clamp(S.rep+h.rep,0,100);
  if(id==="found") L.charDelta(S,8,"기부: "+h.name); else if(id==="statue"||id==="stake"||id==="owner") L.charDelta(S,1,"명예: "+h.name);
  L.addMoment(S,"명예",h.name,h.name+" ("+h.price+"억)"); L.feedAdd(S,S.year+" 명예",h.name,1); return {ok:true,text:h.name+" 완료! 커리어 점수 +"+h.legacy}; };
L.honorLegacy=S=>(S.honors||[]).reduce((s,x)=>s+((L.honorDef(x.id)||{}).legacy||0),0);

/* ---------- 해마다 정산 (시즌 결과 직후) ---------- */
L.moneyYear=function(S,R){
  const notes=[]; if(S.stage!=="pro"||R.youth) return notes; const tf=L.traitFx(S.p);
  /* 스태프 비용 */
  (S.staff||[]).slice().forEach(id=>{ const s=L.STAFF.find(x=>x.id===id); if(!s) return; const c=L.staffCost(S,s);
    if(S.funds>=c){ S.funds=r1(S.funds-c); notes.push(s.icon+" "+s.name+" 비용 −"+c+"억"); if(id==="pr"){ S.fame=Math.max(0,S.fame+2); } }
    else { S.staff=S.staff.filter(x=>x!==id); notes.push("⚠ 자금이 부족해 "+s.name+"와(과) 계약이 끝났어요"); } });
  /* 투자 수익 */
  (S.assets||[]).slice().forEach(a=>{ const d=L.assetDef(a.id); if(!d) return; let mean=d.mean*(d.fameScaled?clamp(S.fame/60,.2,1.8):1), vol=d.vol;
    if(tf.invest>1){ mean*=tf.invest; vol*=.85; }
    const fresh=Math.min(a.fresh||0,a.value), freshW=a.freshW||0, base=a.value-fresh;
    if(d.fail&&Math.random()<d.fail*(tf.invest>1?.6:1)){ const lost=r1(base+freshW); S.assetProfit=r1((S.assetProfit||0)-lost); a.value=r1(fresh-freshW); a.cost=r1(Math.max(0,a.cost-base-freshW)); a.fresh=0; a.freshW=0; notes.push(d.icon+" "+d.name+" 실패! 투자금 "+lost+"억이 사라졌어요"); if(a.value<=0.05) S.assets=S.assets.filter(x=>x!==a); return; }
    const ret=clamp(mean+vol*clamp(randn(),-2.2,2.2),-.85,2.5); const before=a.value; a.value=r1(Math.max(0,base*(1+ret)+fresh+freshW*ret)); a.fresh=0; a.freshW=0; a.last=ret;
    notes.push(d.icon+" "+d.name+" "+(ret>=0?"+":"")+Math.round(ret*100)+"% ("+r1(before)+" → "+a.value+"억)"); });
  S.assets=(S.assets||[]).filter(a=>a.value>0.05);
  /* 명예 항목: 재단 기부금·구단 배당 */
  (S.honors||[]).forEach(x=>{ const h=L.honorDef(x.id); if(!h) return;
    if(h.yearly){ const c=-h.yearly; if(S.funds>=c){ S.funds=r1(S.funds-c); L.charDelta(S,2,"기부: "+h.name+" 기부금"); notes.push(h.icon+" "+h.name+" 기부금 −"+c+"억"); } else { S.rep=clamp(S.rep-2,0,100); notes.push("⚠ 재단 기부금을 못 내 평판이 조금 떨어졌어요"); } }
    if(h.yield){ const d=r1(x.price*h.yield); S.funds=r1(S.funds+d); notes.push(h.icon+" "+h.name+" 배당 +"+d+"억"); } });
  R.moneyNotes=notes; return notes;
};

/* ===== 재능 개발: 돈으로 잠재력을 키우는 길 (잠재력은 숨기지 않고, 노력으로 올릴 수 있어요) =====
 * 시즌마다 한 번, 29세까지. 단계가 높을수록 비용이 크고 성공 확률이 낮아요.
 * 실패하면 '재능 게이지'가 쌓여서 다음 성공 확률이 올라가요(성공하면 비워져요). 처음 잠재력보다 최대 +12까지만 올릴 수 있어요. */
L.POT_PROG=[
 {id:"basic",name:"기본 재능 훈련",icon:"🌱",cost:2,p:.72,gain:1,note:"부담 없는 개인 지도"},
 {id:"mid",name:"정밀 재능 코칭",icon:"🎯",cost:6,p:.46,gain:2,note:"전문 코치와 영상 분석"},
 {id:"top",name:"해외 특별 코스",icon:"🚀",cost:16,p:.26,gain:3,note:"유럽 아카데미 단기 과정"}
];
L.potProgInfo=function(S){
  const p=S.p, ag=L.age(S), sc=L.priceScale(S), base=(p.pot0||p.pot), room=Math.max(0,Math.min(99,base+12+((S.potBreak|0)>0?4:0))-p.pot);
  const used=S.potYear===S.year, ok=ag<=29&&ag>=15&&!used&&room>0&&S.stage!=="military";
  const luck=S.potLuck|0;
  return {ok,used,room,luck,ag,tiers:L.POT_PROG.map(t=>({id:t.id,name:t.name,icon:t.icon,note:t.note,gain:Math.min(t.gain,room),cost:Math.round(t.cost*sc*10)/10,p:Math.min(.92,t.p+.04*luck)}))};
};
L.potUp=function(S,id){
  const info=L.potProgInfo(S), t=info.tiers.find(x=>x.id===id); if(!t) return {ok:false,text:"없는 과정이에요"};
  if(info.used) return {ok:false,text:"이번 시즌에는 이미 시도했어요"}; if(info.ag>29) return {ok:false,text:"30세부터는 재능 개발을 받을 수 없어요"}; if(info.room<=0) return {ok:false,text:"이 선수가 키울 수 있는 재능은 모두 끌어올렸어요"};
  if(S.funds<t.cost) return {ok:false,text:"자금이 부족해요 ("+t.cost+"억 필요)"};
  S.funds=Math.round((S.funds-t.cost)*10)/10; S.potYear=S.year; S.potSpent=Math.round(((S.potSpent||0)+t.cost)*10)/10;
  if(Math.random()<t.p){ S.p.pot=Math.min(99,S.p.pot+t.gain); S.potLuck=0; S.potUps=(S.potUps||0)+t.gain; if(S.scoutFinal){ S.p.grade=L.GRADES[L.gradeOfPot(S.p.pot)]; }
    L.addMoment&&L.addMoment(S,"재능 개발","재능","재능 개발에 성공해 잠재력이 "+t.gain+" 올랐어요."); return {ok:true,text:"성공! 잠재력이 +"+t.gain+" 올랐어요 ("+S.p.pot+")"}; }
  S.potLuck=Math.min(5,(S.potLuck|0)+1); return {ok:false,fail:true,text:"이번엔 효과가 없었어요. 재능 게이지가 쌓여서 다음엔 성공 확률이 올라가요 ("+S.potLuck+"/5)"};
};
/* ===== 재능 개발 센터: 3단계 집중 캠프 (단계마다 선택·위기 이벤트 + 마지막 타이밍 도전) ===== */
L.CAMP_EVENTS=[
 [ /* 1단계: 입소 */
  {t:"첫날의 평가",b:"코치가 당신의 약점을 하나하나 짚어요. \"지금 이대로는 한계가 뻔해.\"",c:[["약점부터 정면 돌파",2,10,"가장 아픈 곳을 먼저 파고들었어요."],["기본기부터 차근차근",1,3,"차분히 몸을 풀며 시작했어요."],["코치 말을 반박한다",0,0,"자존심은 지켰지만 분위기가 어색해졌어요."]]},
  {t:"새벽 러닝",b:"해도 뜨기 전, 숙소 문 앞에서 코치가 기다리고 있어요.",c:[["끝까지 따라 달린다",2,12,"숨이 턱까지 찼지만 완주했어요."],["절반만 달리고 쉰다",1,4,"무리하지 않고 페이스를 지켰어요."],["늦잠을 잔다",0,-3,"몸은 편했지만 코치의 눈빛이 차가워요."]]},
  {t:"동료 연습생",b:"같은 캠프의 연습생이 당신에게 도전장을 내밀었어요.",c:[["받아들인다",2,8,"치열한 1대1이 서로를 끌어올렸어요."],["함께 연습하자고 제안",1,3,"의외로 좋은 파트너가 됐어요."],["무시한다",0,0,"혼자 조용히 훈련했어요."]]}
 ],
 [ /* 2단계: 벽 */
  {t:"벽에 부딪히다",b:"며칠째 실력이 제자리예요. 영상 속 자신이 너무 느려 보여요.",c:[["밤새 영상을 분석한다",3,14,"머릿속 답답함이 풀리는 순간이 왔어요."],["하루 쉬면서 머리를 식힌다",1,-6,"몸과 마음이 한결 가벼워졌어요."],["더 무겁게 몰아붙인다",3,20,"한계를 넘는 느낌이 왔지만 몸이 비명을 질러요."]]},
  {t:"전설의 깜짝 방문",b:"은퇴한 전설이 캠프를 찾아와 당신의 훈련을 지켜봐요.",legend:1,c:[["가르침을 구한다",3,8,"단 한마디가 모든 걸 바꿨어요.","tip"],["보란 듯이 실력을 보인다",2,12,"전설의 입꼬리가 살짝 올라갔어요."],["긴장해서 굳는다",0,6,"실수를 연발하고 말았어요."]]},
  {t:"부상의 그림자",b:"허벅지에 뻐근한 통증이 와요. 하지만 캠프는 이제 막 절정이에요.",c:[["참고 계속한다",3,22,"버텨냈지만 몸에 부담이 쌓였어요."],["치료를 받고 이어 간다",2,-4,"트레이너가 몸을 챙겨 줬어요."],["하루를 통째로 쉰다",1,-8,"안전하게 회복했어요."]]}
 ],
 [ /* 3단계: 결전 (타이밍 도전 전 선택) */
  {t:"마지막 시험 전야",b:"내일은 캠프의 마지막 평가전이에요. 잠이 오지 않아요.",c:[["이미지 트레이닝",2,2,"머릿속으로 수십 번 장면을 돌렸어요."],["가볍게 볼을 찬다",2,6,"감각을 끌어올렸어요."],["일찍 눈을 붙인다",1,-8,"컨디션을 최상으로 맞췄어요."]]}
 ]
];
L.campInfo=function(S){ const i=L.potProgInfo(S); i.camp=S.camp||null; return i; };
L.campStart=function(S,id){
  const info=L.potProgInfo(S), t=info.tiers.find(x=>x.id===id); if(!t) return {ok:false,text:"없는 과정이에요"};
  if(info.used) return {ok:false,text:"이번 시즌에는 이미 캠프에 들어갔어요"}; if(info.ag>29) return {ok:false,text:"30세부터는 입소할 수 없어요"}; if(info.room<=0) return {ok:false,text:"키울 수 있는 재능은 모두 끌어올렸어요"};
  if(S.funds<t.cost) return {ok:false,text:"자금이 부족해요 ("+t.cost+"억 필요)"};
  S.funds=Math.round((S.funds-t.cost)*10)/10; S.potYear=S.year; S.potSpent=Math.round(((S.potSpent||0)+t.cost)*10)/10;
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  S.camp={id,phase:0,score:0,ev:[pick(L.CAMP_EVENTS[0]),pick(L.CAMP_EVENTS[1]),L.CAMP_EVENTS[2][0]],log:[],tier:t};
  return {ok:true};
};
L.campChoose=function(S,i){
  const c=S.camp; if(!c||c.phase>2) return null; const ch=c.ev[c.phase].c[i]; if(!ch) return null;
  if(ch[4]==="tip"){ const d=L.POSDEF[S.p.pos], st=d.stats[Math.floor(Math.random()*d.stats.length)]; S.p.stats[st[0]]=Math.min(S.goat?(S.goatCap||101):99,(S.p.stats[st[0]]||50)+1); S.p.ovr=L.ovrOf(S.p); c.tip=st[1]; }
  c.score+=ch[1]; if(c.ev[c.phase].legend&&L.LEGENDS){ const ls=L.LEGENDS.filter(x=>x.pos===S.p.pos); const lg=ls.length?ls[Math.floor(Math.random()*ls.length)]:null; if(lg){ c.log.push(lg.n+" 전설이 직접 지도해 줬어요"+(c.tip?" ("+c.tip+" +1)":"")); } } S.cond=Math.max(0,Math.min(100,(S.cond||70)-ch[2])); c.log.push(ch[3]); c.last=ch[3]; c.phase++; return ch;
};
/* 타이밍: 0~1 위치. 가운데 .5 에 가까울수록 좋아요 */
L.campTiming=function(S,pos){
  const c=S.camp; const d=Math.abs(pos-.5); const q=d<.07?"perfect":d<.18?"good":"miss"; c.timing=q; c.score+=q==="perfect"?3:q==="good"?1:0; c.phase=4; return q;
};
L.campFinish=function(S){
  const c=S.camp; if(!c) return null; const t=c.tier; const info=L.potProgInfo(S);
  const p=Math.max(.05,Math.min(.95,t.p+.04*(S.potLuck|0)+(c.score-6)*.05));
  const win=Math.random()<p; let gain=0, brk=false;
  if(win){ gain=Math.min(t.gain+(c.score>=10&&c.timing==="perfect"?1:0),info.room); S.p.pot=Math.min(99,S.p.pot+gain); S.potLuck=0; S.potUps=(S.potUps||0)+gain; if(c.score>=10&&c.timing==="perfect"){ S.potBreak=(S.potBreak||0)+1; brk=true; } if(S.scoutFinal) S.p.grade=L.GRADES[L.gradeOfPot(S.p.pot)]; L.addMoment&&L.addMoment(S,"재능 개발","재능","재능 개발 캠프에서 잠재력이 "+gain+" 올랐어요."); }
  else { S.potLuck=Math.min(5,(S.potLuck|0)+1); }
  const res={win,gain,brk,p:Math.round(p*100),score:c.score,pot:S.p.pot,luck:S.potLuck|0,name:t.name,log:c.log.slice()}; S.camp=null; return res;
};

})();
