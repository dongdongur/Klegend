/* 화면 테마 (js/theme.js): 기본은 '매치데이'(깊은 잔디색 + 아이보리 + 앰버) 테마, 설정에서 '야간판(기존 어두운 화면)'으로 바꿀 수 있어요. 첫 화면이 깜빡이지 않게 head 에서 먼저 불러와요. */
(function(){
"use strict";
var KEY="kl-theme", t="arcade";
try{ var v=localStorage.getItem(KEY); if(v==="dark"||v==="matchday"||v==="arcade") t=v; }catch(e){}
document.documentElement.setAttribute("data-theme",t);
window.KL_THEME={ get:function(){ return document.documentElement.getAttribute("data-theme"); },
  set:function(v){ try{ localStorage.setItem(KEY,v); }catch(e){} document.documentElement.setAttribute("data-theme",v); var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute("content",v==="arcade"?"#3d9bff":v==="matchday"?"#0c1c16":"#05070f"); },
  names:{arcade:"아케이드 (밝고 선명)",matchday:"매치데이 (차분한 잔디색)",dark:"야간판 (어두운 화면)"},
  next:function(){ var o=["arcade","matchday","dark"]; return o[(o.indexOf(this.get())+1)%3]; },
  toggle:function(){ this.set(this.next()); return this.get(); } };
})();
/* 모든 화면 오른쪽 위 모서리의 '게임 선택 메뉴' 홈 버튼 (메인·패치노트 제외) */
(function(){
  var p=location.pathname.split("/").pop()||"index.html"; if(/^(index|patch-notes|lounge)(.html)?$/.test(p)||p==="") return;
  function add(){
    if(document.getElementById("klHomeKey")) return;
    var st=document.createElement("style");
    st.textContent="#klHomeKey{position:fixed;top:max(8px,env(safe-area-inset-top));right:8px;z-index:900;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;text-decoration:none;background:rgba(12,28,22,.82);color:#fff;border:1px solid rgba(255,255,255,.28);box-shadow:0 2px 10px rgba(0,0,0,.35);backdrop-filter:blur(6px);opacity:.82}#klHomeKey:active{transform:scale(.94)}body.klhome #klBgm{right:58px!important}.klhome .top,.klhome .topbar,.klhome header.top{padding-right:106px!important}";
    document.head.appendChild(st);
    var a=document.createElement("a"); a.id="klHomeKey"; a.href="index.html"; a.setAttribute("aria-label","게임 선택 메뉴로"); a.title="게임 선택 메뉴"; a.textContent="🏠";
    document.body.appendChild(a); document.body.classList.add("klhome");
  }
  if(document.body) add(); else document.addEventListener("DOMContentLoaded",add);
})();
