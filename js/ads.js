/* 광고 칸 (js/ads.js) — 읽는 화면에만 두는 `<div class="adslot" data-slot="이름">` 을 채워요. 결제가 아니라 광고 표시만 맡아요.
 *  - 설정은 js/config.js 의 window.KL_ADS. enabled 가 false 이거나 그 슬롯 설정이 없으면 칸은 보이지도 않고 자리도 차지하지 않아요.
 *  - 켜지면 칸 높이를 먼저 확보해서(광고가 늦게 떠도) 화면이 밀리지 않고, 작게 '광고' 표시를 달아요.
 *  - 후원자 코드를 등록한 사람(localStorage "klife-cos" 의 sup)에게는 켜지지 않아요.
 *  - 팝업(.ov)·미니게임(.mini)·하단 고정 버튼(.cta)·계약서(.sheet) 안이나 곁에는 칸이 있어도 채우지 않는 안전장치가 있어요.
 *  - 선수판은 화면을 통째로 다시 그리기 때문에, 같은 슬롯은 minGapMs(기본 60초) 안에 다시 요청하지 않아요. */
(function(){
"use strict";
var C=window.KL_ADS||{}, last={}, loaded={}, busy=false;
var css=document.createElement("style");
css.textContent=".adslot{display:none}.adslot.on{display:block;margin:14px 0;text-align:center;contain:layout}.adslot .adl{display:block;font-size:10px;letter-spacing:.12em;color:var(--muted,#8d9bc4);margin:0 0 4px;text-align:center}.adslot .adb{margin:0 auto;max-width:100%;overflow:hidden;display:flex;justify-content:center;align-items:center}.adslot ins{display:block}";
document.head.appendChild(css);
function sup(){
  if(C.hideForSupporters===false) return false;
  try{ if(window.KL_COS&&KL_COS.isSupporter()) return true; var s=JSON.parse(localStorage.getItem("klife-cos")||"null"); return !!(s&&s.codes&&s.codes.length&&s.sup); }catch(e){ return false; }
}
function cfg(name){ var s=C.slots||{}; return s[name]||s["*"]||null; }
function script(src,attrs){ if(loaded[src]) return; loaded[src]=1; var s=document.createElement("script"); s.async=true; s.src=src; Object.keys(attrs||{}).forEach(function(k){ s.setAttribute(k,attrs[k]); }); document.head.appendChild(s); }
function lang(){ return window.KL_LANG==="en"?"Ad":"광고"; }
function fill(el){
  if(el.getAttribute("data-ad")==="done") return;
  var name=el.getAttribute("data-slot")||"", c=cfg(name);
  if(!C.enabled||!c||sup()||el.closest(".ov,.mini,.cta,.sheet,.modal")){ el.classList.remove("on"); return; }
  var w=c.w||320, h=c.h||100, now=Date.now();
  if(last[name]&&now-last[name]<(C.minGapMs||60000)){ el.setAttribute("data-ad","done"); el.classList.remove("on"); return; }   // 화면이 다시 그려져도 같은 슬롯은 잦게 요청하지 않아요(칸은 접어 둬요)
  el.style.minHeight=(h+18)+"px"; el.classList.add("on");                       // 높이를 먼저 확보(레이아웃 밀림 없음)
  el.innerHTML='<small class="adl" data-noi18n>'+lang()+'</small><div class="adb" style="min-height:'+h+'px;width:'+w+'px"></div>';
  el.setAttribute("data-ad","done");
  last[name]=now; var box=el.querySelector(".adb");
  try{
    if(C.provider==="adfit"){ var ins=document.createElement("ins"); ins.className="kakao_ad_area"; ins.style.display="none"; ins.setAttribute("data-ad-unit",c.unit||""); ins.setAttribute("data-ad-width",String(w)); ins.setAttribute("data-ad-height",String(h)); box.appendChild(ins); script("//t1.kakaocdn.net/kas/static/ba.min.js"); }
    else if(C.provider==="adsense"){ var a=document.createElement("ins"); a.className="adsbygoogle"; a.style.cssText="display:inline-block;width:"+w+"px;height:"+h+"px"; a.setAttribute("data-ad-client",C.client||""); a.setAttribute("data-ad-slot",c.slot||""); box.appendChild(a); script("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(C.client||""),{crossorigin:"anonymous"}); try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){} }
    else if(C.provider==="custom"&&c.html){ box.innerHTML=c.html; }
  }catch(e){}
}
function scan(){ busy=false; var list=document.querySelectorAll(".adslot[data-slot]"); for(var i=0;i<list.length;i++) fill(list[i]); }
function soon(){ if(busy) return; busy=true; (window.requestAnimationFrame||setTimeout)(scan); }
window.KL_ADS_SCAN=scan;
if(!C.enabled) return;                                   // 꺼져 있으면 감시도 하지 않아요
function start(){ scan(); try{ new MutationObserver(soon).observe(document.body,{childList:true,subtree:true}); }catch(e){} }
if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
})();
