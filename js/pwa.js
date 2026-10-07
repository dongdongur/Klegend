/* 앱 설치(PWA) 도우미 (js/pwa.js): 서비스 워커 등록 + '홈 화면에 추가' 안내 버튼.
 * 안드로이드(크롬)는 설치 창을 바로 띄우고, 아이폰(사파리)은 '공유 → 홈 화면에 추가' 방법을 알려 줘요. 이미 앱처럼 실행 중이면 버튼을 숨겨요. */
(function(){
"use strict";
try{ if("serviceWorker" in navigator && /^https?:/.test(location.protocol) && location.hostname!=="localhost"){ navigator.serviceWorker.register("/sw.js").catch(function(){}); } }catch(e){}
var standalone=false; try{ standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true; }catch(e){}
var ev=null; window.addEventListener("beforeinstallprompt",function(e){ e.preventDefault(); ev=e; show(); });
function ios(){ return /iphone|ipad|ipod/i.test(navigator.userAgent||"")&&!/crios|fxios/i.test(navigator.userAgent||""); }
function show(){ var b=document.getElementById("pwaBtn"); if(b&&!standalone) b.hidden=false; }
document.addEventListener("DOMContentLoaded",function(){
  var b=document.getElementById("pwaBtn"); if(!b||standalone) return;
  if(ios()) b.hidden=false;
  b.addEventListener("click",function(){
    if(ev){ ev.prompt(); ev.userChoice&&ev.userChoice.then(function(){ ev=null; b.hidden=true; }); return; }
    alert(ios()?"사파리 아래쪽 '공유' 버튼(□↑)을 누르고 '홈 화면에 추가'를 고르면 앱처럼 쓸 수 있어요.":"브라우저 메뉴(⋮)에서 '앱 설치' 또는 '홈 화면에 추가'를 고르면 앱처럼 쓸 수 있어요.");
  });
});
})();
