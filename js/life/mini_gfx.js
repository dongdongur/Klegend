/* 미니게임 공통 그래픽 (js/life/mini_gfx.js) — 경기장 관중석·광고판·조명·골대·공·'GOAL!' 글자를 한 곳에서 그려요.
 * 캔버스는 2배 해상도로 그려서(hires) 폰에서도 또렷해요. 좌표는 그대로 360×250 기준을 써요. */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SHIRT=["#c0392b","#e8e8ee","#c0392b","#2e86c1","#f2b84b","#e8e8ee","#27ae60","#8e44ad","#c0392b","#14305a"], SKIN=["#f3cfae","#e8b88f","#c98f66","#8d5a3b"];
const BOARD=[["#e0b13a","#14305a"],["#2f6fd6","#f4f4f4"],["#c0392b","#f4f4f4"],["#1a9a5a","#f4f4f4"],["#f4f4f4","#14305a"],["#8e44ad","#f4f4f4"]];
const G=L.gfx={};
/* 캔버스를 2배로: 이후 그리기 좌표는 원래 크기(360×250) 기준 그대로 */
G.hires=function(c,g){ const W=c.width,H=c.height; c.width=W*2; c.height=H*2; g.setTransform(2,0,0,2,0,0); g.imageSmoothingEnabled=true; return {W,H}; };
/* 관중 데이터: 앞줄은 크고 뒷줄은 작게 3겹 */
G.crowd=function(W,HOR){ const a=[]; let seed=11; const r=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let row=0;row<6;row++){ const sz=3.3-row*.2, y=HOR-15-row*6.4, step=sz*1.55; for(let x=-2+r()*3;x<W+4;x+=step){ if(r()<.06) continue; a.push({x:x+r()*1.2,y:y+r()*1.2,s:sz,c:SHIRT[Math.floor(r()*SHIRT.length)],k:SKIN[Math.floor(r()*SKIN.length)],ph:r()*6.28,arm:r()<.35}); } }
  return a; };
/* 관중석 + 광고판 + 조명 (지평선 HOR 위쪽 전체) */
G.stands=function(g,W,HOR,crowd,cheer){
  const now=performance.now();
  const sk=g.createLinearGradient(0,0,0,HOR); sk.addColorStop(0,"#050c1d"); sk.addColorStop(.6,"#0f2447"); sk.addColorStop(1,"#1b3a66"); g.fillStyle=sk; g.fillRect(-10,-10,W+20,HOR+12);
  /* 스탠드 뼈대와 지붕 */
  g.fillStyle="#0b1630"; g.fillRect(-10,HOR-60,W+20,52); g.fillStyle="#0a1226"; g.fillRect(-10,HOR-66,W+20,7);
  g.fillStyle="#16294b"; for(let i=0;i<3;i++) g.fillRect(-10,HOR-48+i*14,W+20,1);
  /* 조명탑 불빛 */
  [[28,Math.max(12,HOR-58)],[W-28,Math.max(12,HOR-58)],[W*.5,Math.max(8,HOR-62)]].forEach(([x,y],i)=>{ const rg=g.createRadialGradient(x,y,0,x,y,i===2?46:62); rg.addColorStop(0,"rgba(255,250,225,.55)"); rg.addColorStop(.25,"rgba(255,244,200,.16)"); rg.addColorStop(1,"rgba(255,244,200,0)"); g.fillStyle=rg; g.fillRect(x-70,y-70,140,150); g.fillStyle="#fffbe8"; for(let k=0;k<3;k++) for(let m=0;m<2;m++) g.fillRect(x-5+k*4,y-3+m*3,3,2); });
  /* 관중 */
  crowd.forEach(d=>{ const j=cheer?Math.sin(now/90+d.ph)*2.4:Math.sin(now/900+d.ph)*.3; const y=d.y+j; g.fillStyle=d.c; g.fillRect(d.x,y+d.s*.55,d.s,d.s*.9); g.fillStyle=d.k; g.fillRect(d.x+d.s*.15,y,d.s*.7,d.s*.6); if(cheer&&d.arm){ g.fillStyle=d.k; g.fillRect(d.x-.4,y-d.s*.9,.9,d.s*1.1); g.fillRect(d.x+d.s-.5,y-d.s*.9,.9,d.s*1.1); } });
  if(cheer){ for(let i=0;i<5;i++){ if(Math.random()<.5){ const d=crowd[Math.floor(Math.random()*crowd.length)]; g.fillStyle="rgba(255,255,255,"+(.5+Math.random()*.5)+")"; g.fillRect(d.x-2,d.y-3,5,5); g.fillRect(d.x,d.y-5,1,9); g.fillRect(d.x-4,d.y-1,9,1); } } }
  /* 광고판(LED) */
  const bw=36, off=Math.floor(now/90)%(bw*BOARD.length);
  for(let x=-off%bw-bw;x<W+bw;x+=bw){ const idx=Math.floor((x+off)/bw); const b=BOARD[((idx%BOARD.length)+BOARD.length)%BOARD.length]; g.fillStyle="#0a0f1c"; g.fillRect(x,HOR-10,bw,9); g.fillStyle=b[0]; g.fillRect(x+1,HOR-9,bw-2,7); g.fillStyle=b[1]; g.fillRect(x+4,HOR-7,bw*.42,2); g.fillRect(x+4,HOR-4,bw*.62,1.4); g.fillStyle="rgba(255,255,255,.28)"; g.fillRect(x+1,HOR-9,bw-2,1.4); }
  g.fillStyle="#d9d9d9"; g.fillRect(-10,HOR-1,W+20,1.4);
};
/* 화면 가장자리를 어둡게(밤 경기 느낌) */
G.vig=function(g,W,H){ const rg=g.createRadialGradient(W/2,H*.52,H*.28,W/2,H*.52,W*.78); rg.addColorStop(0,"rgba(0,0,0,0)"); rg.addColorStop(1,"rgba(0,8,20,.5)"); g.fillStyle=rg; g.fillRect(0,0,W,H); };
/* 잔디 위 조명 반사(가운데가 살짝 밝게) */
G.sheen=function(g,W,H,HOR){ const rg=g.createRadialGradient(W/2,HOR+20,10,W/2,HOR+20,W*.7); rg.addColorStop(0,"rgba(255,255,220,.10)"); rg.addColorStop(1,"rgba(255,255,220,0)"); g.fillStyle=rg; g.fillRect(0,HOR,W,H-HOR); };
/* 골대 기둥: 입체감 있는 흰 막대(그림자 + 하이라이트) */
G.post=function(g,a,b,w){ g.save(); g.lineCap="round"; g.strokeStyle="rgba(0,0,0,.35)"; g.lineWidth=w+2.4; g.beginPath(); g.moveTo(a.x+1,a.y+1); g.lineTo(b.x+1,b.y+1); g.stroke();
  g.strokeStyle="#cfd5de"; g.lineWidth=w; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke();
  g.strokeStyle="#ffffff"; g.lineWidth=w*.55; g.beginPath(); g.moveTo(a.x-w*.12,a.y); g.lineTo(b.x-w*.12,b.y); g.stroke(); g.restore(); };
/* 공: 은은한 입체감 + 회전하는 검은 조각 */
G.ball=function(g,x,y,r,spin){ g.save(); const rg=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.05); rg.addColorStop(0,"#ffffff"); rg.addColorStop(1,"#c9d0da"); g.fillStyle=rg; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  g.beginPath(); g.arc(x,y,r,0,7); g.clip(); g.fillStyle="#1c212b"; spin=spin||0;
  for(let k=0;k<5;k++){ const a=spin+k*1.2566, cx=x+Math.cos(a)*r*.62, cy=y+Math.sin(a*1.0)*r*.5; g.beginPath(); g.arc(cx,cy,r*.27,0,7); g.fill(); }
  g.beginPath(); g.arc(x+Math.cos(spin+.6)*r*.1,y+Math.sin(spin+.6)*r*.1,r*.3,0,7); g.fill(); g.restore();
  g.strokeStyle="rgba(0,0,0,.35)"; g.lineWidth=Math.max(.5,r*.08); g.beginPath(); g.arc(x,y,r,0,7); g.stroke(); };
/* 골 글자: 금빛 그라데이션 + 팝(작게→크게) */
G.goalText=function(g,W,H,left,word){ const k=clamp((60-left)/10,0,1), sc=.7+.3*Math.min(1,k*1.4)+(k<1?.25*(1-k):0); g.save(); g.translate(W/2,H*.5); g.scale(sc,sc); g.font="900 34px 'Black Han Sans',sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.lineJoin="round";
  const gr=g.createLinearGradient(0,-18,0,18); gr.addColorStop(0,"#fff6c0"); gr.addColorStop(.5,"#ffcf4a"); gr.addColorStop(1,"#e8860c"); g.strokeStyle="rgba(10,16,34,.85)"; g.lineWidth=7; g.strokeText(word||"GOAL!",0,0); g.shadowColor="rgba(255,207,74,.8)"; g.shadowBlur=12; g.fillStyle=gr; g.fillText(word||"GOAL!",0,0); g.restore(); };
})();
