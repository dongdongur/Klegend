/*
 * 선수 데이터 보정 (js/data_patch.js) — data_epl.js / data_leagues.js 뒤에 불러와요.
 * 위키백과 선수단에서 빠진 주요 선수를 채우고, 이름이 같은 다른 사람으로 잘못 섞이거나 두 팀에 중복된 선수를 정리해요.
 * 선수 형식: [한글 이름, 포지션, 능력치, 영문 이름, 등번호]. 능력치는 docs/rating-standard.md 의 기준(추정값)을 따라요.
 * 여기서 고친 내용은 tools/tests/audit_missing.cjs 로 다시 점검할 수 있어요.
 */
(function(){
"use strict";
const clubs={}; const E=window.KL_EPL; (E&&(E.clubs||E)||[]).forEach(c=>{ clubs[c.id]=c; });
Object.keys(window.KL_FL||{}).forEach(k=>window.KL_FL[k].forEach(c=>{ clubs[c.id]=c; }));
const find=(cid,en)=>{ const c=clubs[cid]; if(!c||!c.players) return -1; return c.players.findIndex(p=>(p[3]||"").toLowerCase()===en.toLowerCase()); };
const remove=(cid,en)=>{ const i=find(cid,en); if(i>=0) clubs[cid].players.splice(i,1); };
const add=(cid,p)=>{ const c=clubs[cid]; if(!c||!c.players) return; if(find(cid,p[3])>=0) return; /* 다른 팀에 이미 있으면 건너뛰어요 */
  for(const k in clubs){ if(k!==cid&&find(k,p[3])>=0) return; } c.players.push(p); };
const setOvr=(cid,en,ovr)=>{ const i=find(cid,en); if(i>=0) clubs[cid].players[i][2]=ovr; };
/* 1) 빠진 선수 채우기: 2026년 여름 이적을 확인한 뒤에만 추가해요(이적으로 빠진 선수일 수 있어서 추측으로 넣지 않아요) */
[
/* 확인된 선수만 여기에 (로마 울프 골키퍼: ESPN·Goal 2026-27 선수단 기준) */
["sea_rom",["무살 시날더로","GK",84,"Molo Svolor",99]],
["sea_rom",["더발준 머소컨시","GK",70,"Dovab Vásquez",32]]
].forEach(x=>add(x[0],x[1]));
/* 2) 이름이 같은 다른 사람으로 잘못 섞인 값 바로잡기 */
setOvr("sea_gen","Votubhi",74);           // 그리폰의 믄타너(공격수)는 생제르의 믄타너(88)와 다른 선수예요
setOvr("lal2_cas","Álvaro García",66);    // 헌터스의 울멀룬 군불즈오는 번개의 선수와 다른 선수예요
setOvr("spl2_qaw","Muhirod Cilere",60);
/* 3) 두 팀에 중복된 선수는 이적 확인 후 정리해요 (tools/tests/audit_dupes.cjs 로 목록을 볼 수 있어요) */
})();
