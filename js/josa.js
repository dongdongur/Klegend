/* 조사 자동 맞춤 (js/josa.js)
 * 문구에 "을(를)", "이(가)" 처럼 적힌 곳을 앞 글자의 받침에 맞게 "을/를" 로 바꿔 보여 줘요. (가상 이름 변환 뒤에 실행)
 * 예) "한빛FC을(를)" → "한빛FC를", "하이를(를)" → "하이를" */
(function(){
"use strict";
var PAIRS={"을(를)":["을","를"],"를(을)":["을","를"],"이(가)":["이","가"],"가(이)":["이","가"],"은(는)":["은","는"],"는(은)":["은","는"],"과(와)":["과","와"],"와(과)":["과","와"],"으로(로)":["으로","로"],"로(으로)":["으로","로"],"이라(라)":["이라","라"],"이에요(예요)":["이에요","예요"],"이야(야)":["이야","야"]};
var RE=/(\S)(을\(를\)|를\(을\)|이\(가\)|가\(이\)|은\(는\)|는\(은\)|과\(와\)|와\(과\)|으로\(로\)|로\(으로\)|이라\(라\)|이에요\(예요\)|이야\(야\))/g;
var DIG={"0":1,"1":1,"2":0,"3":1,"4":0,"5":0,"6":1,"7":1,"8":1,"9":0};   // 영 일 이 삼 사 오 육 칠 팔 구 (받침 있으면 1)
function batchim(c){ var n=c.charCodeAt(0); if(n>=44032&&n<=55203) return (n-44032)%28; if(DIG[c]!=null) return DIG[c]; if(/[LMNRlmnr]/.test(c)) return /[LMNR]/i.test(c)?(/[Rr]/.test(c)?0:1):0; return 0; }
function fix(s){ if(!s||s.indexOf("(")<0) return s; return s.replace(RE,function(m,ch,j){ var p=PAIRS[j]; if(!p) return m; var b=batchim(ch), o=(j.charAt(0)==="로"||j.indexOf("으로")===0)?(b&&b!==8?"으로":"로"):(b?p[0]:p[1]); return ch+o; }); }
window.KL_JOSA={fix:fix};
function walk(root){ var tw=document.createTreeWalker(root,4,null,false), n; while((n=tw.nextNode())){ var v=n.nodeValue; if(v&&v.indexOf("(")>=0){ var r=fix(v); if(r!==v) n.nodeValue=r; } } }
var timer=null, pending=[];
function start(){ walk(document.body);
  new MutationObserver(function(ms){ pending.push.apply(pending,ms); if(timer) return; timer=setTimeout(function(){ var list=pending; pending=[]; timer=null;
    for(var i=0;i<list.length;i++){ var m=list[i]; if(m.type==="characterData"){ var v=m.target.nodeValue; if(v&&v.indexOf("(")>=0){ var r=fix(v); if(r!==v) m.target.nodeValue=r; } } else for(var j=0;j<m.addedNodes.length;j++){ var a=m.addedNodes[j]; if(a.nodeType===3){ var v2=a.nodeValue; if(v2&&v2.indexOf("(")>=0){ var r2=fix(v2); if(r2!==v2) a.nodeValue=r2; } } else if(a.nodeType===1) walk(a); } } },30); }).observe(document.body,{childList:true,subtree:true,characterData:true}); }
if(document.body) start(); else document.addEventListener("DOMContentLoaded",start);
})();
