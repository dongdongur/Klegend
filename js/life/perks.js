/*
 * 집안 기질 · 인성 효과 (js/life/perks.js)
 *  가정환경과 인성 점수가 '숫자'로만 있지 않고 플레이에서 티 나게 작동하도록 모아 둔 곳.
 *  - 집안 기질: 부유(인프라→부상↓·컨디션 회복) / 평범(균형) / 빠듯·어려움(독기→훈련 성공↑, 첫 계약 보너스↑)
 *  - 인성 효과: 높으면 감독·동료의 신뢰가 쌓이고 컨디션이 안정, 낮으면 신뢰가 깎이고 사기가 흔들려요.
 *  화면: 상태 카드 아래 '나의 기질' 칩 (L.perkList)
 */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fid=S=>S.family&&S.family.id;
/* 집안 기질 */
const FAM={
 rich :{icon:"💎",name:"금수저 인프라",desc:"전담 의료·영양 지원. 부상 위험 −12%, 성장기(인기 60 미만)엔 시즌 끝 컨디션 +3",inj:.88,cond:3},
 upper:{icon:"🏡",name:"든든한 뒷받침",desc:"안정된 환경. 부상 위험 −6%",inj:.94,cond:0},
 mid  :{icon:"🧢",name:"평범한 균형",desc:"큰 이점은 없지만 마음이 안정돼요. 시즌 끝 사기 +2",inj:1,cond:0,morale:2},
 tight:{icon:"🔥",name:"허리띠 독기",desc:"훈련 성공 확률 +6%p, 첫 프로 계약 보너스 +15%",inj:1,cond:0,grit:1,bonus:1.15},
 poor :{icon:"⛏️",name:"배고픈 승부욕",desc:"훈련 성공 확률 +12%p, 첫 프로 계약 보너스 +30%. 대신 부상이 잦아요(+5%)",inj:1.05,cond:0,grit:2,bonus:1.3}
};
L.FAMILY_PERK=FAM;
L.famPerk=S=>FAM[fid(S)]||null;
/* 부상 확률 곱 (engine 부상 공식에서 사용) */
L.famInjMul=S=>{ const f=L.famPerk(S); return f?f.inj:1; };
L.famGrit=S=>{ const f=L.famPerk(S); return f&&f.grit?f.grit:0; };
L.famBonusMul=S=>{ const f=L.famPerk(S); return f&&f.bonus?f.bonus:1; };
/* 인성 구간 */
L.charPerk=S=>{ const c=L.charOf?L.charOf(S):50;
  if(c>=85) return {id:"saint",icon:"😇",name:"모두의 신뢰",desc:"감독 신뢰 시즌 +3%, 컨디션 +3, 부상 위험 −5%",trust:.03,cond:3,inj:.95};
  if(c>=70) return {id:"good",icon:"😊",name:"든든한 동료",desc:"감독 신뢰 시즌 +2%, 컨디션 +2",trust:.02,cond:2,inj:1};
  if(c>=55) return {id:"ok",icon:"🙂",name:"무난한 평판",desc:"신뢰·사기에 영향 없음",trust:0,cond:0,inj:1};
  if(c>=38) return {id:"cool",icon:"😐",name:"조금 서먹한 사이",desc:"감독 신뢰 시즌 −1%",trust:-.01,cond:0,inj:1};
  if(c>=20) return {id:"bad",icon:"😒",name:"구설에 오르는 선수",desc:"신뢰 −3%, 사기 −3, 컨디션 −2. 하지만 독기로 훈련 성공 +6%p, 논란도 화제라 시즌 인기 +1",trust:-.03,cond:-2,morale:-3,inj:1,grit:1,fame:1};
  return {id:"worst",icon:"💢",name:"팀의 골칫거리",desc:"신뢰 −5%, 사기 −5, 컨디션 −3, 부상 +5%. 대신 '악동' 승부욕으로 훈련 성공 +12%p, 시즌 인기 +2",trust:-.05,cond:-3,morale:-5,inj:1.05,grit:2,fame:2}; };
L.charInjMul=S=>L.charPerk(S).inj;
L.charGrit=S=>L.charPerk(S).grit||0;
/* 시즌이 끝날 때 한 번 적용 (engine 시즌 정산에서 호출). 결과 문구를 돌려줘서 시즌 요약에 쓸 수 있어요 */
L.perkSeason=function(S){
  const out=[], f=L.famPerk(S), c=L.charPerk(S); let dc=0, dm=0, dt=0;
  if(f&&f.cond&&(S.stage==="youth"||S.stage==="univ"||S.fame<60)) dc+=f.cond;
  dc+=c.cond||0; dm+=(c.morale||0)+((f&&f.morale)||0); dt+=c.trust||0;
  if(dt) S.trust=clamp(S.trust+dt,.05,.95);
  if(dc) S.cond=clamp(S.cond+dc,0,100);
  if(dm) S.morale=clamp(S.morale+dm,0,100);
  const hf=L.hometownFans(S); let df=(c.fame||0)+(hf?hf.fame:0);
  if(df) S.fame=Math.max(0,S.fame+df);
  if(hf){ S.funds=Math.round((S.funds+hf.funds)*10)/10; S.morale=clamp(S.morale+3,0,100); out.push("🏠 고향 팬들이 응원 현수막을 걸었어요 (인기 +"+hf.fame+", 후원 +"+hf.funds+"억)"); if(!S.hometownFlag){ S.hometownFlag=true; if(L.addMoment) L.addMoment(S,"고향 팬클럽","고향 팬","어려운 환경을 딛고 올라선 모습에 고향 사람들이 팬클럽을 만들었어요."); } }
  if(c.fame>0) out.push(c.icon+" 논란도 화제! 인기 +"+c.fame);
  if(dt>0) out.push(c.icon+" 인성 덕에 감독 신뢰 +"+Math.round(dt*100)+"%");
  if(dt<0) out.push(c.icon+" 구설 탓에 감독 신뢰 "+Math.round(dt*100)+"%");
  return out; };
/* 어려운 집안 출신이 성공하면 고향 팬이 생겨요: 빠듯/어려운 집안 + 인기 40 이상(프로) */
L.hometownFans=function(S){ const id=S.family&&S.family.id; if(!(id==="tight"||id==="poor")||S.stage!=="pro"||S.fame<40) return null; const k=id==="poor"?1:.6; return {fame:Math.round((id==="poor"?1.5:1)*10)/10,funds:Math.round(k*(.1+Math.min(1,S.fame/150)*.4)*10)/10}; };
/* 인성 높은 선수의 은퇴: 후배들이 헌정 영상을 만들어 줘요 (null 이면 없음) */
L.retireTribute=function(S){ const ch=L.charOf?L.charOf(S):50; if(ch<70) return null; const juniors=["신인 시절 함께 뛰던 후배","당신에게 배운 막내","같은 포지션의 후배","주장 완장을 이어받은 후배"]; const pick=juniors[Math.floor(Math.random()*juniors.length)]; const big=ch>=85;
  S.fame=Math.max(0,S.fame+(big?6:3)); S.rep=clamp(S.rep+(big?4:2),0,100); if(L.charDelta) L.charDelta(S,1,"헌정 영상");
  if(L.addMoment) L.addMoment(S,"헌정 영상","은퇴",pick+"를 비롯한 후배들이 헌정 영상을 만들어 줬어요.");
  return {title:"후배들이 만든 헌정 영상",body:pick+"가 제작을 이끌었어요. 라커룸에서 찍은 짧은 인터뷰와 함께 뛴 순간들이 이어지고, 마지막엔 \"형 덕분에 이 자리까지 왔습니다\"라는 자막이 떠요."+(big?" 영상은 하루 만에 수백만 뷰를 넘겼고 상대 팀 선수들까지 댓글로 인사를 남겼어요.":" 팬들이 댓글로 감사 인사를 남겼어요.")+" (인기 +"+(big?6:3)+", 평판 +"+(big?4:2)+")"}; };
/* 상태 카드에 보여 줄 칩 */
L.perkList=function(S){ const a=[]; const f=L.famPerk(S); if(f&&S.family) a.push({icon:f.icon,name:f.name,desc:f.desc,kind:"fam"});
  { const hf=L.hometownFans(S); if(hf) a.push({icon:"🏠",name:"고향 팬클럽",desc:"어려운 환경에서 올라선 이야기에 고향 팬이 생겼어요. 시즌마다 인기 +"+hf.fame+", 후원 +"+hf.funds+"억, 사기 +3",kind:"fam"}); }
  if(S.char!=null||L.charOf){ const c=L.charPerk(S); a.push({icon:c.icon,name:c.name,desc:c.desc,kind:"char"}); } return a; };
})();
