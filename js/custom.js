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
function load(){ try{ const o=JSON.parse(localStorage.getItem(KEY)||"{}"); return {names:o.names||{},logos:o.logos||{},dom:o.dom||{}}; }catch(e){ return {names:{},logos:{},dom:{}}; } }
function save(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
let C=load();
function allFL(){ const out=[]; try{ if(window.KL_FL) Object.keys(window.KL_FL).forEach(k=>window.KL_FL[k].forEach(c=>out.push(c))); const E=window.KL_EPL; if(E) (E.clubs||E).forEach(c=>out.push(c)); }catch(e){} return out; }
function apply(){ const m=C.names||{}; allFL().forEach(c=>{ const o=m[c.id]; if(o){ if(o[0]) c.name=o[0]; if(o[1]) c.short=o[1]; } }); }
apply();
/* 화면에 보이는 글자에서 원래 이름을 내가 정한 이름으로 바꿔 보여 줘요(국내 구단·K3·K4 이름용: 내부 기록은 그대로, 보이는 글자만 바뀌어요) */
let DOM=null, doneTx=new WeakMap();
function buildDom(){ const m=C.dom||{}; const ks=Object.keys(m).filter(k=>k&&m[k]&&m[k]!==k).sort((a,b)=>b.length-a.length); DOM=ks.length?ks.map(k=>[k,m[k]]):null; }
function repl(s){ if(!DOM||!s) return s; let o=s; for(let i=0;i<DOM.length;i++){ if(o.indexOf(DOM[i][0])>=0) o=o.split(DOM[i][0]).join(DOM[i][1]); } return o; }
function walkDom(root){ if(!DOM) return; const tw=document.createTreeWalker(root,4,null,false); let n; while((n=tw.nextNode())){ const p=n.parentNode; if(!p||/^(SCRIPT|STYLE|TEXTAREA|TITLE)$/.test(p.nodeName)||(p.closest&&p.closest("[data-nocustom]"))) continue; const v=n.nodeValue; if(!v||doneTx.get(n)===v) continue; const r=repl(v); doneTx.set(n,r); if(r!==v) n.nodeValue=r; } }
buildDom();
function startDom(){ if(!document.body) return; walkDom(document.body); new MutationObserver(function(ms){ if(!DOM) return; for(let i=0;i<ms.length;i++){ const m=ms[i]; if(m.type==="characterData"){ const n=m.target, v=n.nodeValue; if(v&&doneTx.get(n)!==v){ const r=repl(v); doneTx.set(n,r); if(r!==v) n.nodeValue=r; } } else for(let j=0;j<m.addedNodes.length;j++){ const a=m.addedNodes[j]; if(a.nodeType===3){ const v=a.nodeValue, r=repl(v); doneTx.set(a,r); if(r!==v) a.nodeValue=r; } else if(a.nodeType===1) walkDom(a); } } }).observe(document.body,{childList:true,subtree:true,characterData:true}); }
if(document.body) startDom(); else document.addEventListener("DOMContentLoaded",startDom);
window.KL_CUSTOM={
  get:()=>C,
  logo:function(club){ if(!club) return null; const k=club.id||club.name; return (C.logos&&(C.logos[k]||C.logos[club.name]))||null; },
  setName:function(id,name,short){ C.names[id]=[String(name||"").trim().slice(0,20),String(short||name||"").trim().slice(0,10)]; if(!C.names[id][0]) delete C.names[id]; return save(C); },
  setLogo:function(key,url){ if(url) C.logos[key]=url; else delete C.logos[key]; return save(C); },
  setDisplay:function(orig,name){ name=String(name||"").trim().slice(0,20); if(name&&name!==orig) C.dom[orig]=name; else delete C.dom[orig]; const ok=save(C); buildDom(); doneTx=new WeakMap(); try{ walkDom(document.body); }catch(e){} return ok; },
  resetAll:function(){ C={names:{},logos:{},dom:{}}; DOM=null; try{ localStorage.removeItem(KEY); localStorage.removeItem("kl-alias"); }catch(e){} },
  alias:function(on){ try{ if(on) localStorage.setItem("kl-alias","1"); else localStorage.removeItem("kl-alias"); }catch(e){} },
  aliasOn:function(){ try{ return localStorage.getItem("kl-alias")==="1"; }catch(e){ return false; } },
  /* 이미지 파일 → 96px 정사각 PNG data URL */
  shrink:function(file,cb){ const fr=new FileReader(); fr.onload=function(){ const im=new Image(); im.onload=function(){ const s=96, cv=document.createElement("canvas"); cv.width=cv.height=s; const x=cv.getContext("2d"); const r=Math.min(s/im.width,s/im.height); x.drawImage(im,(s-im.width*r)/2,(s-im.height*r)/2,im.width*r,im.height*r); cb(cv.toDataURL("image/png")); }; im.onerror=function(){ cb(null); }; im.src=fr.result; }; fr.onerror=function(){ cb(null); }; fr.readAsDataURL(file); }
};
})();
