/* 언어 전환 (js/i18n.js) — Korean / English
 *  - 기본은 한국어. 설정 화면이나 아래 버튼(KL_I18N.toggle())으로 English 로 바꿔요. 선택은 이 기기에만 저장돼요(localStorage "kl-lang").
 *  - 영어는 '화면에 나온 글자'를 사전(js/i18n_en.js)으로 바꿔요. 사전에 없는 문장은 한국어 그대로 나와요 (번역이 늘수록 영어 비율이 올라가요).
 *  - 구단·선수 이름은 영어에서 로마자로 읽어 줘요. 돈은 ₩ 표기로 바꿔요(1억=₩100M).
 *  - 번역이 필요한 문구 찾기: node tools/i18n_extract.cjs   /  화면에서 KL_I18N.coverage() 로 현재 화면의 번역 비율을 볼 수 있어요. */
(function(){
"use strict";
var lang="ko"; try{ var q=location.search.match(/[?&]lang=(ko|en)/); if(q) localStorage.setItem("kl-lang",q[1]); lang=localStorage.getItem("kl-lang")||"ko"; }catch(e){}
window.KL_LANG=lang;
function toggle(){ try{ localStorage.setItem("kl-lang",lang==="en"?"ko":"en"); }catch(e){} location.reload(); }
window.KL_I18N={lang:lang,toggle:toggle,set:function(l){ try{ localStorage.setItem("kl-lang",l); }catch(e){} location.reload(); },tx:function(s){ return s; },coverage:function(){ return null; }};
if(lang!=="en"){ document.documentElement.setAttribute("lang","ko"); return; }
document.documentElement.setAttribute("lang","en");
function boot(){
  var D=Object.assign({},window.KL_I18N_EN||{}); Object.keys(window).forEach(function(k){ if(/^KL_I18N_EN_/.test(k)) Object.assign(D,window[k]); });
  var norm=function(k){ return k.replace(/#(억 원|억|만 원)/g,"¤"); };
  var denorm=function(v){ return v.replace(/₩?#00M( KRW)?|#0,000 KRW|₩#0,000/g,"¤"); };
  var dict={}, keys=[];
  Object.keys(D).forEach(function(k){ var nk=norm(k); dict[nk]=denorm(D[k]); });
  keys=Object.keys(dict).filter(function(k){ return k.length>=2||/[가-힣]/.test(k); }).sort(function(a,b){ return b.length-a.length; });
  var esc=function(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); };
  var JOSA_RE="(?:전에서|전|행|한테|이다|이에요|예요|입니다|에서|에게|으로|이|가|은|는|을|를|의|에|도|로|와|과|만|께|부터|까지)?";
  /* 한글 단어의 중간·끝 조각은 바꾸지 않도록 앞뒤 경계를 확인해요 (뒤에는 조사만 허용) */
  var phraseRe=keys.length?new RegExp("(^|[^가-힣])("+keys.map(esc).join("|")+")(?="+JOSA_RE+"(?![가-힣]))","g"):null;
  /* "을(를) 고용했어요."처럼 괄호 조사로 시작하는 조각은 앞이 한글 이름이어도 바꿔요 (괄호 조사는 단어 속에 나오지 않아요) */
  var PJ=/^(?:을\(를\)|를\(을\)|이\(가\)|가\(이\)|은\(는\)|는\(은\)|과\(와\)|와\(과\)|\(으\)로|으로\(로\)|로\(으로\)|\(이\)라|\(이\)며)/;
  var keysJ=keys.filter(function(k){ return PJ.test(k); });
  var phraseReJ=keysJ.length?new RegExp("("+keysJ.map(esc).join("|")+")","g"):null;

  var NUM=/\d+(?:\.\d+)?/g;
  function fmtM(m){ if(m>=1000){ var b=m/1000; return "₩"+(b>=10?Math.round(b):(Math.round(b*10)/10))+"B"; } if(m>=1) return "₩"+(Math.round(m*10)/10)+"M"; return "₩"+Math.round(m*1000)+"K"; }
  /* 로마자 표기(국어의 로마자 표기법 단순화) — 이름용 */
  var CHO=["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
  var JUNG=["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
  var JONG=["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"];
  function roman(w){ var o=""; for(var i=0;i<w.length;i++){ var c=w.charCodeAt(i)-0xAC00; if(c<0||c>=11172){ o+=w[i]; continue; } var jo=c%28, ju=Math.floor(c/28)%21, ch=Math.floor(c/588); o+=CHO[ch]+JUNG[ju]+JONG[jo]; } return o.charAt(0).toUpperCase()+o.slice(1); }
  var names={}; var M=window.KL_VMAP; if(M){ ["C","P"].forEach(function(k){ Object.keys(M[k]||{}).forEach(function(a){ String(a).split(/\s+/).forEach(function(t){ if(t) names[t]=1; }); String(M[k][a]).split(/\s+/).forEach(function(t){ if(t) names[t]=1; }); }); }); }
  var nameRe=/[가-힣]{2,12}/g;
  function nameTx(s){ return s.replace(nameRe,function(w){ return names[w]?roman(w):w; }); }
  var JOS=/([A-Za-z0-9)%₩MBK¤\]])(전에서|행|한테|이|가|은|는|을|를|의|에서|에게|에|도|으로|로|와|과|이다|이에요|예요|입니다|이야|부터|까지)(?![가-힣])/g;
  function tx(raw){
    if(!raw||!/[가-힣]/.test(raw)) return raw;
    var s=raw.replace(/\s+/g," ");
    var lead=raw.match(/^\s*/)[0], tail=raw.match(/\s*$/)[0];
    s=s.trim();
    /* 돈 */
    var money=[]; s=s.replace(/(\d[\d,]*(?:\.\d+)?)\s*(억|만)(?! ?명)(?: 원)?/g,function(m,n,u){ var v=parseFloat(n.replace(/,/g,"")); money.push(u==="억"?fmtM(v*100):fmtM(v/100)); return "¤"; });
    var nums=[]; s=s.replace(NUM,function(n){ nums.push(n); return "#"; });
    var out;
    if(dict[s]!=null) out=dict[s];
    else if(phraseRe) out=s.replace(phraseRe,function(m,pre,key){ return pre+dict[key]; });
    else out=s;
    if(phraseReJ&&dict[s]==null) out=out.replace(phraseReJ,function(m,key){ return dict[key]; });
    out=nameTx(out).replace(JOS,"$1").replace(/(?:을\(를\)|를\(을\)|이\(가\)|가\(이\)|은\(는\)|는\(은\)|과\(와\)|와\(과\)|으로\(로\)|로\(으로\)|\(으\)로|\(이\)라)/g,"");
    var ni=0, mi=0;
    out=out.replace(/¤/g,function(){ return money[mi]!=null?money[mi++]:"¤"; });
    out=out.replace(/#/g,function(){ return nums[ni]!=null?nums[ni++]:"#"; });
    return lead+out+tail;
  }
  window.KL_I18N.tx=tx;
  var done=new WeakMap();
  function skip(n){ var p=n.parentNode; if(!p) return true; var t=p.nodeName; if(t==="SCRIPT"||t==="STYLE"||t==="TEXTAREA"||t==="TITLE") return true; return !!(p.closest&&p.closest("[data-noi18n]")); }
  function doText(n){ var v=n.nodeValue; if(!v||done.get(n)===v) return; if(!/[가-힣]/.test(v)||skip(n)) return; var r=tx(v); done.set(n,r); if(r!==v) n.nodeValue=r; }
  function doAttrs(e){ ["placeholder","title","aria-label","alt"].forEach(function(a){ var v=e.getAttribute&&e.getAttribute(a); if(v&&/[가-힣]/.test(v)){ var r=tx(v); if(r!==v) e.setAttribute(a,r); } }); }
  function walk(root){
    if(root.nodeType===3){ doText(root); return; }
    if(root.nodeType!==1||root.nodeName==="SCRIPT"||root.nodeName==="STYLE") return;
    doAttrs(root); root.querySelectorAll&&root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(doAttrs);
    var tw=document.createTreeWalker(root,4,null,false), n; while((n=tw.nextNode())) doText(n);
  }
  window.KL_I18N.coverage=function(){ var tw=document.createTreeWalker(document.body,4), n, tot=0, ko=0; while((n=tw.nextNode())){ if(skip(n)) continue; var v=n.nodeValue.trim(); if(!v) continue; tot++; if(/[가-힣]/.test(v)) ko++; } return {nodes:tot,korean:ko,translatedPct:tot?Math.round((1-ko/tot)*100):100}; };
  function start(){
    try{ if(/[가-힣]/.test(document.title)) document.title=tx(document.title); }catch(e){}
    walk(document.body);
    new MutationObserver(function(ms){ for(var i=0;i<ms.length;i++){ var m=ms[i]; if(m.type==="characterData") doText(m.target); else if(m.type==="attributes") doAttrs(m.target); else for(var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]); } }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
  }
  if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
}
/* 사전은 영어일 때만 불러와요 */
/* 사전 파일(기본 + 이벤트·화면 번역 조각)을 차례로 불러온 뒤 시작해요. 없는 파일은 건너뛰어요. */
(function(){ var files=["js/i18n_en.js","js/i18n_en_xA.js","js/i18n_en_xB.js","js/i18n_en_xC.js","js/i18n_en_xD.js","js/i18n_en_xE.js","js/i18n_en_xF.js","js/i18n_en_xG.js","js/i18n_en_xH.js","js/i18n_en_xI.js","js/i18n_en_xJ.js","js/i18n_en_xK.js","js/i18n_en_xL.js","js/i18n_en_xM.js","js/i18n_en_xN.js"], i=0;  function next(){ if(i>=files.length){ boot(); return; } var f=files[i++]; if(f==="js/i18n_en.js"&&window.KL_I18N_EN){ next(); return; } var sc=document.createElement("script"); sc.src=f; sc.onload=next; sc.onerror=next; document.head.appendChild(sc); }
  next(); })();
})();
