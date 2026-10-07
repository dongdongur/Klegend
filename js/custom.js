/*
 * 내 구단 이름·로고 설정 (js/custom.js)
 * 설정 화면에서 바꾼 이름·로고를 브라우저에 저장하고, 게임이 시작될 때 해외 구단 이름에 덮어써요.
 *  - 이름: 해외 리그 구단(id 기준)만 바꿀 수 있어요. 레전드리그는 내부 기록 때문에 이름은 그대로, 로고만 바꿀 수 있어요.
 *  - 로고: 이미지를 골라 올리면 작게 줄여서 이 기기에만 저장해요(서버로 올라가지 않아요).
 *  - '앱용 이름 세트'를 켜면 js/alias.js 의 가상 이름이 적용돼요.
 * 저장 위치: localStorage "kl-custom" = {names:{id:[이름,짧은이름]}, logos:{키:dataURL}}, "kl-alias"="1"
 */
(function(){
"use strict";
const KEY="kl-custom";
function load(){ try{ const o=JSON.parse(localStorage.getItem(KEY)||"{}"); return {names:o.names||{},logos:o.logos||{}}; }catch(e){ return {names:{},logos:{}}; } }
function save(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
let C=load();
function allFL(){ const out=[]; try{ if(window.KL_FL) Object.keys(window.KL_FL).forEach(k=>window.KL_FL[k].forEach(c=>out.push(c))); const E=window.KL_EPL; if(E) (E.clubs||E).forEach(c=>out.push(c)); }catch(e){} return out; }
function apply(){ const m=C.names||{}; allFL().forEach(c=>{ const o=m[c.id]; if(o){ if(o[0]) c.name=o[0]; if(o[1]) c.short=o[1]; } }); }
apply();
window.KL_CUSTOM={
  get:()=>C,
  logo:function(club){ if(!club) return null; const k=club.id||club.name; return (C.logos&&(C.logos[k]||C.logos[club.name]))||null; },
  setName:function(id,name,short){ C.names[id]=[String(name||"").trim().slice(0,20),String(short||name||"").trim().slice(0,10)]; if(!C.names[id][0]) delete C.names[id]; return save(C); },
  setLogo:function(key,url){ if(url) C.logos[key]=url; else delete C.logos[key]; return save(C); },
  resetAll:function(){ C={names:{},logos:{}}; try{ localStorage.removeItem(KEY); localStorage.removeItem("kl-alias"); }catch(e){} },
  alias:function(on){ try{ if(on) localStorage.setItem("kl-alias","1"); else localStorage.removeItem("kl-alias"); }catch(e){} },
  aliasOn:function(){ try{ return localStorage.getItem("kl-alias")==="1"; }catch(e){ return false; } },
  /* 이미지 파일 → 96px 정사각 PNG data URL */
  shrink:function(file,cb){ const fr=new FileReader(); fr.onload=function(){ const im=new Image(); im.onload=function(){ const s=96, cv=document.createElement("canvas"); cv.width=cv.height=s; const x=cv.getContext("2d"); const r=Math.min(s/im.width,s/im.height); x.drawImage(im,(s-im.width*r)/2,(s-im.height*r)/2,im.width*r,im.height*r); cb(cv.toDataURL("image/png")); }; im.onerror=function(){ cb(null); }; im.src=fr.result; }; fr.onerror=function(){ cb(null); }; fr.readAsDataURL(file); }
};
})();
