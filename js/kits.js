/*
 * 구단 홈 유니폼 (js/kits.js) — 영구결번 현황 등에서 쓰는 유니폼 그림
 * 색은 대략적인 홈 유니폼 느낌만 따라 한 가상의 도안이에요(엠블럼·스폰서 없음). 나중에 바꿀 수 있게 이 표만 고치면 돼요.
 * 형식: "구단명|메인색|보조색|무늬"  무늬: s=단색 · v=세로 줄무늬 · h=가로 줄무늬 · x=반반 · l=소매 색 다름
 */
(function(){
"use strict";
const T=`서울 이스트|#111111|#d6001c|v
울산 하이|#0a3d91|#f5c400|s
전북 에덴|#0a7a3e|#111111|s
제주 오름|#f58220|#ffffff|s
강원 파인|#f58220|#0b3d91|l
대전 사이언스|#6a1b9a|#0a7a3e|s
포항 해풍|#c8102e|#111111|v
안양 퍼플|#6a1b9a|#fbc02d|s
인천 포트|#0b3d91|#111111|v
광주 무등|#fbc02d|#ffffff|s
부천 비트|#c8102e|#111111|s
김천 새벽|#c8102e|#0b2a5b|x
수원 블루윙|#0b3d91|#ffffff|s
수원 라이트|#1565c0|#ffffff|v
서울 웨스트|#111111|#c8102e|v
대구 팔공|#4fc3f7|#0b3d91|s
화성 시드|#ffa000|#111111|s
부산 파도|#c8102e|#ffffff|s
성남 라이트하우스|#111111|#fbc02d|s
전남 스카이드래곤|#fbc02d|#0b3d91|s
경남 해안|#c8102e|#fbc02d|s
충남 소나무|#0b3d91|#ffffff|s
안산 그린|#2e7d32|#ffffff|s
김포 골드|#0b3d91|#c8102e|s
천안 하모니|#0b3d91|#111111|s
충북 청명|#c8102e|#ffffff|s
파주 선봉|#e53935|#111111|s
용인 에버|#c8102e|#0b3d91|s
김해 가야|#fbc02d|#111111|s
맨체스터 스카이|#6cabdd|#ffffff|s
불사조|#c8102e|#ffffff|s
거너스|#ef0107|#ffffff|l
라이언|#034694|#ffffff|s
맨체스터 레드|#da291c|#111111|s
북런던 스퍼스|#f3f3f3|#132257|s
타인사이드 피스|#ffffff|#111111|v
버밍엄 빌라|#670e36|#95bfe5|l
시걸|#ffffff|#0057b8|v
해머스|#7a263a|#1bb1e7|l
남런던 이글스|#1b458f|#c4122e|v
코티지|#ffffff|#111111|s
비즈|#ffffff|#e30613|v
울브스|#fdb913|#111111|s
토피|#003399|#ffffff|s
체리|#da291c|#111111|v
포레스트 포레스트|#dd0000|#ffffff|s
리즈 화이츠|#ffffff|#1d428a|s
클라렛|#6c1d45|#99d6ea|l
블랙캣츠|#ffffff|#eb172b|v
마드리드 크라운|#ffffff|#e5c36b|s
카탈루냐 블라우|#a50044|#004d98|v
마드리드 매트리스|#ffffff|#cb3524|v
바스크 라이언|#ffffff|#ee2523|v
옐로|#fbe106|#005187|s
산세바스티안 SD|#ffffff|#0067b1|v
세비야 그린|#ffffff|#00954c|v
지로|#ee2523|#ffffff|s
안달루시아|#ffffff|#d71920|s
박쥐|#ffffff|#111111|s
갈리시아 셀타|#8ac3ee|#ffffff|s
나바라|#d91a21|#0a1f44|s
섬|#e20613|#111111|s
겟타|#005999|#ffffff|s
마드리드 번개|#ffffff|#e53935|s
화이트|#ffffff|#0761af|v
올드|#ffffff|#007fc8|v
팜|#ffffff|#0b8c3d|s
문|#b4053f|#0a3d91|v
아스투리아스 블루|#0033a0|#ffffff|s
바바리아 뮌헨|#dc052d|#ffffff|s
라인 레버|#e32221|#111111|s
루르 도르트|#fde100|#111111|s
작센 불스|#ffffff|#dd0741|s
마인 이글스|#e1000f|#111111|s
슈바벤 슈투트|#ffffff|#e32219|s
슈바르츠 프라이|#e32219|#111111|s
니더작센 울프|#65b32e|#ffffff|s
쿠라이 호펜|#1961b5|#ffffff|s
라인 포어스|#ffffff|#2a8b3d|s
마인츠 카니발|#c3141e|#ffffff|s
한자 브레멘|#1d9053|#ffffff|s
베를린 아이언|#eb1923|#ffffff|s
아우크 퓌센|#ba3733|#ffffff|v
함부르크 SV|#005ca9|#ffffff|s
밀라노 블루블랙|#0068a8|#111111|v
나폴리 아주리|#12a0d7|#ffffff|s
밀라노 레드블랙|#fb090b|#111111|v
올드레이디|#ffffff|#111111|v
베르가모|#1e71b8|#111111|v
로마 울프|#8e1f2f|#f0bc42|s
로마 이글|#87d8f7|#ffffff|s
바이올렛|#482e92|#ffffff|s
볼로냐|#1a2f48|#c8102e|v
불|#8a1e1b|#ffffff|s
그리폰|#a30b30|#0a1f44|x
제브라|#ffffff|#111111|v
사수|#00a651|#111111|v
크루세이더|#ffffff|#fcd116|s
파리 생제르|#004170|#da291c|s
모나코 로크|#e51b24|#ffffff|x
마르세유 블루|#ffffff|#2faee0|s
리옹 라이언|#ffffff|#1f3a87|s
릴 마스티프|#e4002b|#ffffff|s
랑스 골드|#ffcf00|#e4002b|s
리비에라 니스|#cc0000|#111111|v
브르타뉴 렌|#e2001a|#111111|s
비셀 블레이즈|#8b0d2e|#ffffff|s
가시마 호크스|#b3001b|#0a1f44|s
FC 선더|#1b4aa0|#f5c400|s
산프레체 그리폰|#4d2a86|#ffffff|s
요코하마 레인저스|#0f2d78|#ffffff|x
우라와 로열스|#d4001a|#111111|s
가와사키 블레이즈|#2b9be0|#111111|v
감바 마스터스|#0b3e8c|#111111|v
세레소 팰컨스|#e0457b|#111111|s
FC 라이더스|#1a3d8f|#c8102e|v
가시와 레드윙|#f5d300|#111111|s
나고야 호크스|#c8102e|#f5d300|s
알 호크스|#0b3e91|#ffffff|s
알 패스파인더|#f5c400|#0b3e91|s
알 그리폰|#0a7a3e|#ffffff|s
알 마스터스|#f2c500|#111111|v
알 마스터스|#f2a900|#0b3e91|s
알 비전|#ffffff|#111111|s`;
const MAP={}; T.split("\n").forEach(l=>{ const p=l.split("|"); if(p.length>=4) MAP[p[0].trim()]={c1:p[1],c2:p[2],p:p[3].trim()}; });
const hue=s=>{ let x=0; for(let i=0;i<s.length;i++) x=(x*31+s.charCodeAt(i))%360; return x; };
function kit(name){
  name=String(name||""); if(MAP[name]) return MAP[name];
  const k=Object.keys(MAP).find(n=>name.indexOf(n)>=0||n.indexOf(name)>=0); if(k&&name.length>=2) return MAP[k];
  const h=hue(name); return {c1:"hsl("+h+",62%,42%)",c2:"#ffffff",p:"s"};
}
let uid=0;
/* 유니폼 SVG: num=등번호, club=구단명 */
window.KL_shirt=function(num,club){
  const k=kit(club), id="kc"+(uid++), t=String(num), fs=t.length>2?34:46;
  const body="M38 8 L18 20 L4 46 L24 58 L32 46 L32 120 Q32 124 36 124 L84 124 Q88 124 88 120 L88 46 L96 58 L116 46 L102 20 L82 8 Q60 24 38 8 Z";
  let over="";
  if(k.p==="v") over='<g clip-path="url(#'+id+')">'+[0,1,2,3,4,5,6].map(i=>'<rect x="'+(i*16+4)+'" y="0" width="8" height="130" fill="'+k.c2+'"/>').join("")+'</g>';
  else if(k.p==="h") over='<g clip-path="url(#'+id+')">'+[0,1,2,3,4,5].map(i=>'<rect x="0" y="'+(i*22+14)+'" width="120" height="11" fill="'+k.c2+'"/>').join("")+'</g>';
  else if(k.p==="x") over='<g clip-path="url(#'+id+')"><rect x="60" y="0" width="60" height="130" fill="'+k.c2+'"/></g>';
  else if(k.p==="l") over='<g clip-path="url(#'+id+')"><rect x="0" y="0" width="30" height="130" fill="'+k.c2+'"/><rect x="90" y="0" width="30" height="130" fill="'+k.c2+'"/></g>';
  const txt=lum(k.c1)>150?"#111":"#fff", stroke=lum(k.c1)>150?"rgba(255,255,255,.7)":"rgba(0,0,0,.45)";
  return '<svg viewBox="0 0 120 130" aria-hidden="true"><defs><clipPath id="'+id+'"><path d="'+body+'"/></clipPath><linearGradient id="'+id+'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.22)"/><stop offset="1" stop-color="rgba(0,0,0,.28)"/></linearGradient></defs>'
   +'<path d="'+body+'" fill="'+k.c1+'"/>'+over+'<path d="'+body+'" fill="url(#'+id+'g)"/><path d="'+body+'" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linejoin="round"/>'
   +'<path d="M38 8 Q60 24 82 8" fill="none" stroke="'+k.c2+'" stroke-width="4"/>'
   +'<text x="60" y="88" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="'+fs+'" fill="'+txt+'" stroke="'+stroke+'" stroke-width="1.4" paint-order="stroke">'+t.replace(/[<>&]/g,"")+'</text></svg>';
};
function lum(c){ let r=0,g=0,b=0; if(/^#/.test(c)){ const h=c.length===4?c.replace(/./g,(m,i)=>i?m+m:m):c; r=parseInt(h.slice(1,3),16); g=parseInt(h.slice(3,5),16); b=parseInt(h.slice(5,7),16); } else return 90; return .299*r+.587*g+.114*b; }
window.KL_kit=kit;
})();
