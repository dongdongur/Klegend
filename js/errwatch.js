/* 오류 알림 (js/errwatch.js)
 * 게임 중 오류가 나면 화면 아래에 작은 알림이 떠요. 누르면 오류 내용과 현재 상태가 복사돼서 라운지나 메일로 보낼 수 있어요.
 * (버튼이 반응하지 않을 때 원인을 바로 찾으려고 만든 거예요. 개인정보는 들어가지 않아요: 선수 이름·이메일은 빼요.) */
(function(){
"use strict";
var errs=[], bar=null;
function state(){ try{ var L=window.__LIFE, S=L&&L.S; if(!S) return {view:L&&L.view}; return {view:L.view,stage:S.stage,phase:S.phase,age:S.year-S.p.born,year:S.year,pos:S.p.pos,ovr:S.p.ovr,club:S.club&&S.club.lg,mil:S.military,contractYears:S.contractYears,hasSim:!!S.sim,seg:S.sim&&S.sim.seg,offers:S.offers&&S.offers.length,dr:!!S.dr}; }catch(e){ return {}; } }
function report(msg,src,line,col,err){ try{ var o={t:new Date().toISOString().slice(0,19),msg:String(msg).slice(0,200),src:String(src||"").split("/").pop(),line:line,col:col,stack:err&&err.stack?String(err.stack).split("\n").slice(0,4).join(" | ").slice(0,400):"",state:state(),ua:navigator.userAgent.slice(0,90),url:location.pathname}; errs.push(o); if(errs.length>8) errs.shift(); try{ localStorage.setItem("kl-errs",JSON.stringify(errs)); }catch(e){} show(); }catch(e){} }
function text(){ return "K-레전드 오류 보고\n"+JSON.stringify(errs.slice(-3),null,1); }
function show(){ if(bar||!document.body) return; bar=document.createElement("button"); bar.type="button"; bar.setAttribute("data-noi18n","1");
  bar.style.cssText="position:fixed;left:12px;bottom:84px;z-index:99999;min-height:44px;padding:0 14px;border-radius:22px;border:2px solid #14305a;background:#ffe3e3;color:#7a0b0b;font:700 13px/1.2 sans-serif;box-shadow:0 3px 0 #14305a;max-width:calc(100vw - 24px)";
  bar.textContent="⚠ 오류가 났어요 · 눌러서 내용 복사"; bar.onclick=function(){ var t=text(); function done(ok){ bar.textContent=ok?"복사했어요! 라운지나 메일로 보내 주세요":"길게 눌러 복사해 주세요"; if(!ok){ try{ window.prompt("아래 내용을 복사해 주세요",t); }catch(e){} } setTimeout(function(){ if(bar){ bar.remove(); bar=null; } },4000); }
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ done(true); },function(){ done(false); }); return; } }catch(e){} done(false); };
  document.body.appendChild(bar); }
window.addEventListener("error",function(e){ if(e&&e.message&&/ResizeObserver|Script error/.test(e.message)) return; report(e.message,e.filename,e.lineno,e.colno,e.error); });
window.addEventListener("unhandledrejection",function(e){ var r=e&&e.reason; report("promise: "+(r&&r.message||r),"",0,0,r&&r.stack?r:null); });
window.KL_ERR={report:function(m,err){ report(m,"",0,0,err); },list:function(){ return errs.slice(); }};
})();
