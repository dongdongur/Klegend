/* 주간 도전 (js/life/weekly.js) — 매주 모두에게 같은 시작 조건이 주어져요(포지션 · 시작 시점 · 가정환경).
 * 같은 조건에서 누가 더 멋진 커리어를 만들었는지 커리어 점수로 겨뤄요. 주가 바뀌면 조건도 바뀌어요(월요일 시작, 한국 시간 기준 달력). */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const POS=["FW","MF","DF","GK"], ROUTE=["mid","hs","high","univ"];
const FAM=[["poor",.22],["tight",.26],["mid",.28],["upper",.14],["rich",.10]];
/* ISO 주차: 2026-W41 */
L.weekId=function(d){ d=d||new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)); const w=Math.ceil(((t-y0)/86400000+1)/7); return t.getUTCFullYear()+"-W"+String(w).padStart(2,"0"); };
/* 같은 주에는 누가 불러도 같은 조건이 나오게 주차 글자로 숫자를 만들어요 */
L.weekly=function(d){ const id=L.weekId(d); let h=2166136261; for(let i=0;i<id.length;i++){ h^=id.charCodeAt(i); h=Math.imul(h,16777619); }
  const r=()=>{ h=Math.imul(h^(h>>>15),2246822519)>>>0; h=Math.imul(h^(h>>>13),3266489917)>>>0; h=(h^(h>>>16))>>>0; return h/4294967296; };
  r(); r();
  const pos=POS[Math.floor(r()*4)], route=ROUTE[Math.floor(r()*4)]; let x=r(), fam="mid"; for(const [k,w] of FAM){ if(x<w){ fam=k; break; } x-=w; }
  const end=new Date(d||new Date()); const dow=(end.getDay()+6)%7; end.setDate(end.getDate()+(6-dow)); return {id,pos,route,fam,endsOn:(end.getMonth()+1)+"월 "+end.getDate()+"일"}; };
/* 이번 주 기록: 이 기기에서 이번 주에 은퇴한 인생 중 가장 높은 커리어 점수 */
const KEY="klife-weekly";
L.weeklyBest=function(id){ try{ const o=JSON.parse(localStorage.getItem(KEY)||"{}"); return o[id]||null; }catch(e){ return null; } };
L.weeklyRecord=function(id,score,name){ try{ const o=JSON.parse(localStorage.getItem(KEY)||"{}"); const b=o[id]; if(!b||score>b.score){ o[id]={score,name}; localStorage.setItem(KEY,JSON.stringify(o)); return true; } }catch(e){} return false; };
window.KL_I18N_EN_WK={"출신으로 시작해요. 이 조건은 바꿀 수 없고, 이름·특성·포인트는 마음대로 정할 수 있어요.":"background. These conditions are fixed; you can still choose the name, trait and points freely.","출신. 같은 조건으로 시작해 커리어 점수로 겨뤄요.":"background. Everyone starts from the same conditions and competes on career score.","달성한 업적 # / #":"Achievements unlocked # / #","🏅 업적 # / # · 기록·이야기·도전":"🏅 Achievements # / # · records, stories, challenges","마감":"Ends","이번 주 도전":"This week's challenge","도전 시작":"Take the challenge","이번 주 순위":"This week's ranking","아직 기록이 없어요. 첫 번째 도전자가 되어 보세요!":"No records yet. Be the first challenger!","순위를 불러오는 중…":"Loading ranking…","순위를 불러오지 못했어요":"Couldn't load the ranking","순위 서버를 준비하고 있어요":"The ranking server is being prepared","이번 주 내 최고 기록":"My best this week","이번 주 도전은 포지션과 시작 시점이 정해져 있어요":"This week's challenge fixes your position and starting point","같은 조건으로 시작해 커리어 점수로 겨뤄요":"Everyone starts from the same conditions and competes on career score"};
})();
