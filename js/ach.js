/* K-레전드 38 업적 · 배지: 시즌이 끝날 때마다 조건을 검사하고, 처음 달성한 것만 저장해요 (브라우저 localStorage) */
(function(){
"use strict";
const KEY="kl38-ach";
const read=()=>{ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } };
const write=v=>{ try{ localStorage.setItem(KEY,JSON.stringify(v)); }catch(e){} };

/* tier: bronze / silver / gold (배지 색). test(R, c): R = 시즌 결과, c = {career, mode, diff, moves} */
const champ=R=>R.div===1&&R.rank===1;
const cur=c=>c.career.history[c.career.history.length-1]||{};
const DEFS=[
 {id:"first_title",  icon:"🏆", tier:"bronze", name:"첫 우승",       desc:"리그 우승을 차지했어요", test:champ},
 {id:"unbeaten",     icon:"🛡️", tier:"silver", name:"무패 우승",     desc:"리그를 한 번도 지지 않고 우승했어요", test:R=>champ(R)&&R.flags.league.l===0},
 {id:"perfect",      icon:"👑", tier:"gold",   name:"38전 38승",     desc:"리그 38경기를 전부 이겼어요", test:R=>R.flags.perfect},
 {id:"fa_cup",       icon:"🥉", tier:"bronze", name:"전국컵 우승",     desc:"전국컵 결승에서 이겼어요", test:R=>R.fa.champion},
 {id:"double",       icon:"✌️", tier:"silver", name:"더블",          desc:"같은 시즌에 리그와 전국컵을 모두 우승했어요", test:R=>champ(R)&&R.fa.champion},
 {id:"acl_debut",    icon:"🌏", tier:"bronze", name:"아시아 무대",   desc:"아시아컵에 처음 출전했어요", test:R=>R.acl.qualified},
 {id:"acl_champ",    icon:"🌟", tier:"gold",   name:"아시아의 왕",   desc:"아시아컵에서 우승했어요", test:R=>R.acl.champion&&R.acl.tier===1},
 {id:"treble",       icon:"🔱", tier:"gold",   name:"트레블",        desc:"리그·전국컵·아시아컵를 한 시즌에 모두 우승했어요", test:R=>champ(R)&&R.fa.champion&&R.acl.champion&&R.acl.tier===1},
 {id:"three_peat",   icon:"♾️", tier:"gold",   name:"리그 3연패",    desc:"리그 우승을 3시즌 연속으로 했어요", test:(R,c)=>{ const h=c.career.history; return h.length>=3 && h.slice(-3).every(x=>x.div===1&&x.rank===1); }},
 {id:"veteran",      icon:"📅", tier:"silver", name:"장기 집권",     desc:"한 팀으로 5시즌을 치렀어요", test:(R,c)=>c.career.history.length>=5},
 {id:"hundred",      icon:"💯", tier:"silver", name:"100점 클럽",    desc:"한 시즌 승점 100점 이상", test:R=>R.flags.league.pts>=100},
 {id:"goal_machine", icon:"⚽", tier:"silver", name:"득점 머신",     desc:"리그에서 110골 이상 넣었어요", test:R=>R.flags.league.gf>=110},
 {id:"iron_wall",    icon:"🧱", tier:"silver", name:"철벽 수비",     desc:"리그 실점 20골 이하", test:R=>R.flags.league.ga<=20},
 {id:"gentleman",    icon:"🤝", tier:"bronze", name:"신사 축구",     desc:"한 시즌 동안 퇴장이 한 번도 없었어요", test:R=>R.cards.r===0},
 {id:"clean_book",   icon:"📒", tier:"silver", name:"깨끗한 시즌",   desc:"경고 25장 이하, 퇴장 0명", test:R=>R.cards.r===0&&R.cards.y<=25},
 {id:"deep_bench",   icon:"🪑", tier:"silver", name:"깊은 벤치",     desc:"후보 5명이 모두 10경기 이상 뛰었어요", test:R=>R.stam.filter(x=>!x.starter).length>=5 && R.stam.filter(x=>!x.starter).every(x=>x.apps>=10)},
 {id:"iron_man",     icon:"🦾", tier:"bronze", name:"철인",          desc:"한 선수가 시즌 전 경기에 출전했어요", test:R=>R.mine.ironman && R.mine.ironman.apps===R.log.length},
 {id:"injury_free",  icon:"🩺", tier:"silver", name:"부상 청정",     desc:"한 시즌 동안 부상자가 없었어요", test:R=>R.inj.n===0},
 {id:"hard_champ",   icon:"🔥", tier:"gold",   name:"전성기도 이긴다",desc:"어려움 난이도에서 리그 우승", test:(R,c)=>c.diff==="hard"&&champ(R)},
 {id:"pos_champ",    icon:"🎯", tier:"silver", name:"포지션 장인",   desc:"연도+포지션 드래프트로 리그 우승", test:(R,c)=>c.mode==="pos"&&champ(R)},
 {id:"golden_boot",  icon:"👟", tier:"silver", name:"득점왕 배출",   desc:"우리 선수가 리그 득점왕이 됐어요", test:R=>R.awards.scorer&&R.awards.scorer.mine},
 {id:"playmaker",    icon:"🎩", tier:"silver", name:"도움왕 배출",   desc:"우리 선수가 리그 도움왕이 됐어요", test:R=>R.awards.assister&&R.awards.assister.mine},
 {id:"mvp",          icon:"⭐", tier:"gold",   name:"리그 MVP",      desc:"우리 선수가 리그 MVP가 됐어요", test:R=>R.awards.mvp&&R.awards.mvp.mine},
 {id:"shootout",     icon:"🥅", tier:"bronze", name:"승부차기 승리", desc:"승부차기에서 이겼어요", test:R=>R.log.some(e=>e.pk&&e.res==="W")},
 {id:"big_win",      icon:"💥", tier:"bronze", name:"대승",          desc:"한 경기에서 6골 차 이상으로 이겼어요", test:R=>R.log.some(e=>e.res==="W"&&e.f-e.a>=6)},
 {id:"rotation",     icon:"🔄", tier:"bronze", name:"로테이션 마스터",desc:"체력 교체를 40번 이상 했어요", test:R=>R.rotations>=40},
 {id:"winter_boom",  icon:"❄️", tier:"silver", name:"겨울의 승부수", desc:"겨울 이적시장에서 3명을 영입하고 우승했어요", test:(R,c)=>c.moves>=3&&champ(R)},
 {id:"promoted",    icon:"⬆️", tier:"silver", name:"1부 승격",       desc:"레전드리그2에서 레전드리그1으로 올라갔어요", test:R=>R.div===2&&(R.promo.status==="promoted"||R.promo.status==="po_promoted")},
 {id:"k2_title",    icon:"🥈", tier:"bronze", name:"레전드리그2 우승",    desc:"레전드리그2에서 우승했어요", test:R=>R.div===2&&R.rank===1},
 {id:"relegated",   icon:"⬇️", tier:"bronze", name:"쓴맛",           desc:"레전드리그2로 강등됐어요 (복귀가 더 값져요)", test:R=>R.promo.status==="relegated"},
 {id:"survivor",    icon:"🛟", tier:"silver", name:"생존왕",         desc:"승강 플레이오프에서 이겨 1부에 남았어요", test:R=>R.promo.status==="po_stay"},
 {id:"duel_win",     icon:"🤺", tier:"silver", name:"친구 격파",     desc:"친구 팀과의 맞대결에서 이겼어요", test:()=>false},
 /* ---- 감독 커리어 이야기 (기록 업적: 시즌 기록 c.career.history 의 마지막 항목 = 이번 시즌) ---- */
 {id:"streak10",    icon:"🚀", tier:"silver", name:"10연승 질주",    desc:"리그에서 10연승을 달렸어요", test:(R,c)=>cur(c).ws>=10},
 {id:"wall18",      icon:"🚪", tier:"silver", name:"무실점의 벽",    desc:"한 시즌에 무실점 경기를 18번 이상 했어요", test:(R,c)=>cur(c).cs>=18},
 {id:"photo_finish",icon:"📸", tier:"bronze", name:"한 끗 차이 우승",desc:"승점 2점 차 이내로 리그 우승을 차지했어요", test:(R,c)=>R.div===1&&R.rank===1&&cur(c).gap<=2},
 {id:"crisis_over", icon:"🚒", tier:"bronze", name:"위기 극복",      desc:"강등권 근처에서 한 시즌을 보낸 뒤 이듬해 중위권 이상으로 반등했어요", test:(R,c)=>cur(c).crisis&&R.promo.status!=="po_stay"},
 {id:"comeback_title",icon:"💪",tier:"silver",name:"연패를 딛고 우승",desc:"한 시즌에 4연패 이상을 겪고도 리그 우승을 차지했어요", test:(R,c)=>champ(R)&&cur(c).ls>=4},
 {id:"quick_return",icon:"↩️", tier:"silver", name:"1년 만의 복귀",  desc:"강등된 바로 다음 시즌에 레전드리그2를 우승해 1부로 돌아왔어요", test:(R,c)=>{ const h=c.career.history, p=h[h.length-2]; return R.div===2&&R.promo.status==="promoted"&&!!p&&p.st==="relegated"; }},
 {id:"win28",       icon:"💯", tier:"silver", name:"이기는 습관",    desc:"한 시즌 리그에서 28승 이상을 거뒀어요", test:(R,c)=>cur(c).w>=28},
 {id:"cup_repeat",  icon:"🏅", tier:"silver", name:"컵 2연패",       desc:"전국컵을 2시즌 연속 우승했어요", test:(R,c)=>{ const h=c.career.history, p=h[h.length-2]; return R.fa.champion&&!!p&&(p.trophies||[]).includes("전국컵 우승"); }},
 {id:"decade",      icon:"🕰️", tier:"gold",   name:"10년 장기 집권", desc:"한 팀에서 10시즌을 치렀어요", test:(R,c)=>c.career.history.length>=10},
 {id:"five_titles", icon:"⭐", tier:"gold",   name:"리그 5회 우승",  desc:"감독 커리어 통산 리그 우승 5회", test:(R,c)=>c.career.trophies.league>=5},
 {id:"collector",   icon:"🧩", tier:"gold",   name:"트로피 컬렉터",  desc:"리그·전국컵·아시아컵 우승을 모두 경험했어요", test:(R,c)=>{ const t=c.career.trophies; return t.league+t.k2>=1&&t.fa>=1&&t.acl>=1; }},
 {id:"story_teller",icon:"📖", tier:"bronze", name:"사연 많은 감독", desc:"한 커리어에서 시즌 이야기 이벤트를 10번 겪었어요", test:(R,c)=>Object.values(c.career.storyLog||{}).reduce((s,a)=>s+a.length,0)>=10},
 {id:"title_given", icon:"🎖️", tier:"silver", name:"감독 평가 칭호", desc:"기록으로 감독 평가 칭호를 하나 얻었어요", test:(R,c)=>!!window.KLStory&&KLStory.titles(c.career).earned>=1}
];

function unlocked(){ return read(); }
/* 시즌 결과로 새로 달성한 업적을 저장하고 목록을 돌려줘요 */
function check(R,c){
  const have=read(); const fresh=[];
  DEFS.forEach(d=>{ if(have[d.id]) return; let ok=false; try{ ok=!!d.test(R,c); }catch(e){} if(ok){ have[d.id]={no:c.career.no,t:Date.now()}; fresh.push(d); } });
  if(fresh.length) write(have);
  return fresh;
}
/* 친구 맞대결 승리처럼 시즌과 상관없이 주는 업적 */
function grant(id){
  const have=read(); if(have[id]) return null; const d=DEFS.find(x=>x.id===id); if(!d) return null;
  have[id]={no:0,t:Date.now()}; write(have); return d;
}
window.KLAch={DEFS,unlocked,check,grant};
})();
