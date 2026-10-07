/* 시즌 하이라이트 카드 (js/life/highlight.js)
 * 시즌 결과 맨 위에, 그 해의 가장 빛난 장면을 내 도트 선수가 연기하는 짧은 움직임 카드로 보여 줘요.
 * 장면 종류: 우승(트로피) · 수상(스포트라이트) · 신기록 · 골 · 도움(패스) · 선방 · 꾸준함(드리블) · 성장 · 군 복무 · 유소년 훈련 · 기본.
 * 규칙(어떤 시즌에 어떤 장면인지)은 L.highlightOf 한 곳에 있고, 그림은 L.hlDraw 가 그려요. */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L._mini||!L.gfx) return;
const {drawPix}=L._mini, G=L.gfx;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(Math.random()*a.length)];
/* 이번 시즌의 하이라이트 고르기 */
L.highlightOf=function(S,R){
  if(!R) return null; const gk=S.p.pos==="GK", club=R.club?R.club.name:"", nm=S.p.name;
  const stat=R.military?"":(R.apps?R.apps+"경기 · "+(gk?R.cs+"무실점":R.goals+"골 "+R.assists+"도움"):"");
  const tr=(R.trophies||[]).filter(t=>/우승/.test(t)), aw=(R.awards||[]).filter(a=>!/후보/.test(a));
  if(R.ballon&&R.ballon.rank===1) return {type:"award",title:"세계 최고의 선수",line:nm+", 올해의 황금공을 들어 올렸어요.",sub:stat};
  if(tr.length) return {type:"title",title:tr[0].replace(/ 우승$/,"")+" 우승",line:club+"이(가) 트로피를 들어 올렸어요.",sub:stat};
  if(aw.length) return {type:"award",title:aw[0],line:pick([nm+"의 이름이 호명됐어요.","박수 속에 무대에 올랐어요.","한 시즌의 노력이 인정받았어요."]),sub:stat};
  if(R.injury&&R.injury.severe) return {type:"rehab",title:"다시 일어서기 위한 한 해",line:pick(["재활실에서 보낸 시간이 더 단단한 몸을 만들어요.","한 걸음 한 걸음, 그라운드로 돌아가는 길이에요."]),sub:R.injury.text};
  if((R.records||[]).length) return {type:"record",title:"기록을 새로 썼어요",line:R.records[0],sub:stat};
  if(R.military) return {type:"mil",title:"군 복무의 한 해",line:"그라운드를 잠시 떠나 나라를 지켰어요.",sub:""};
  if(!gk&&R.goals>=15) return {type:"goal",title:R.goals+"골, 골문을 흔든 시즌",line:pick(["수비수들이 가장 두려워한 이름이었어요.","공이 닿는 곳마다 골망이 출렁였어요."]),sub:stat};
  if(!gk&&R.assists>=10) return {type:"assist",title:R.assists+"도움, 동료를 빛낸 시즌",line:pick(["마지막 패스는 늘 정확했어요.","동료들이 골을 넣을 때마다 뒤에서 웃고 있었어요."]),sub:stat};
  if(gk&&R.cs>=12) return {type:"save",title:R.cs+"번의 무실점",line:pick(["골문 앞에는 늘 철벽이 서 있었어요.","결정적인 순간마다 손끝이 공을 막아 냈어요."]),sub:stat};
  if((R.rating||0)>=7.4) return {type:"run",title:"꾸준함이 빛난 시즌",line:"평점 "+R.rating+", 흔들림 없이 달린 한 해였어요.",sub:stat};
  if((R.ovr1||0)-(R.ovr0||0)>=4) return {type:"grow",title:"한 뼘 더 자랐어요",line:"능력치 "+R.ovr0+" → "+R.ovr1+", 땀이 숫자로 남았어요.",sub:stat};
  if(R.youth) return {type:"youth",title:R.year+" 시즌, 배우는 중",line:pick(["콘이 한 줄로 서 있는 운동장에서 하루가 저물었어요.","넘어지고 일어나며 한 뼘씩 자랐어요."]),sub:stat};
  return {type:"ball",title:R.year+" 시즌, "+club+"에서",line:pick(["평범한 날들이 모여 커리어가 돼요.","오늘도 공을 쫓아 달렸어요."]),sub:stat};
};
const imgs={};
function img(S,key,o){ if(!imgs[key]) imgs[key]=L.pixelCanvasImg(S,o); return imgs[key]; }
/* 그림: 360×190 캔버스에 장면을 계속 그려요(캔버스가 화면에서 사라지면 멈춰요) */
L.hlDraw=function(cv,S,R,opt){
  const H0=(opt&&opt.type)?{type:opt.type}:L.highlightOf(S,R); if(!H0||!cv) return null; const g=cv.getContext("2d"), W=cv.width, H=cv.height; G.hires(cv,g);
  const IM={}; const I=age=>IM[age||0]||(IM[age||0]={me:L.pixelCanvasImg(S,{field:true,age:age||undefined}),mate:L.pixelCanvasImg(S,{name:"동료하이라이트",kit:"#2f6fd6"}),meGk:L.pixelCanvasImg(S,{age:age||undefined}),mil:L.pixelCanvasImg(S,{military:true}),suit:L.pixelCanvasImg(S,{suit:true,age:Math.max(L.age(S),30)})});
  const cur={type:H0.type,age:(opt&&opt.age)||null}; let stopped=false;
  const crowd=G.crowd(W,86), HOR=86, GY=168; let t0=performance.now();
  const conf=[]; for(let i=0;i<46;i++) conf.push({x:Math.random()*W,y:-Math.random()*H,v:30+Math.random()*50,c:["#ffd45a","#fff","#ec6a55","#86d7c0","#9ec8ff"][i%5],r:Math.random()*6});
  const trophy=(x,y,s)=>{ g.fillStyle="#ffcf4a"; g.fillRect(x-5*s,y-9*s,10*s,7*s); g.fillRect(x-1.5*s,y-2*s,3*s,5*s); g.fillRect(x-5*s,y+3*s,10*s,2.5*s); g.fillStyle="#fff2b0"; g.fillRect(x-4*s,y-8*s,2*s,4*s); g.fillStyle="#e8a000"; g.fillRect(x-8*s,y-8*s,3*s,2*s); g.fillRect(x+5*s,y-8*s,3*s,2*s); };
  const cone=(x)=>{ g.fillStyle="#ff7a2e"; g.beginPath(); g.moveTo(x-5,GY+4); g.lineTo(x+5,GY+4); g.lineTo(x,GY-8); g.fill(); g.fillStyle="#fff"; g.fillRect(x-3,GY-2,6,2); };
  const ball=(x,y,r,sp)=>{ g.fillStyle="rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(x,GY+6,r,r*.35,0,0,7); g.fill(); G.ball(g,x,y,r,sp); };
  const loop=()=>{ if(stopped||!cv.isConnected) return; const type=cur.type, M=I(cur.age), me=M.me, mate=M.mate, meGk=M.meGk; const gkI=null; const t=(performance.now()-t0)/1000; const T=t%6;
    G.stands(g,W,HOR,crowd,type==="title"||type==="award"||type==="goal"||type==="record");
    g.fillStyle="#1d5c37"; g.fillRect(0,HOR,W,H-HOR); for(let i=0;i<8;i++){ g.fillStyle=i%2?"rgba(255,255,255,.04)":"rgba(0,0,0,.05)"; g.fillRect(i*W/8,HOR,W/8,H-HOR); }
    g.fillStyle="rgba(255,255,255,.55)"; g.fillRect(0,GY+9,W,1.2);
    const hop=Math.abs(Math.sin(t*5.2))*10;
    if(type==="title"){ drawPix(g,me,W/2,GY+8-hop,92,{}); trophy(W/2,GY-96-hop+Math.sin(t*3)*2,2.4); conf.forEach(c=>{ c.y=(c.y+c.v*(1/60))%(H+10); g.fillStyle=c.c; g.fillRect(c.x,c.y,3,5); }); }
    else if(type==="award"){ const sp=g.createLinearGradient(0,0,0,H); sp.addColorStop(0,"rgba(255,244,200,.55)"); sp.addColorStop(1,"rgba(255,244,200,.05)"); g.fillStyle=sp; g.beginPath(); g.moveTo(W/2-14,0); g.lineTo(W/2+14,0); g.lineTo(W/2+78,GY+8); g.lineTo(W/2-78,GY+8); g.fill(); drawPix(g,me,W/2,GY+8,92,{}); trophy(W/2+58,GY-6,1.6); g.fillStyle="#ffd45a"; for(let i=0;i<6;i++){ const a=t*1.4+i, x=W/2+Math.cos(a)*60,y=70+Math.sin(a*1.3)*26; g.fillRect(x,y,2.5,2.5); } }
    else if(type==="record"){ g.fillStyle="#0d1a2e"; g.fillRect(W/2-70,26,140,36); g.strokeStyle="#ffd45a"; g.lineWidth=2; g.strokeRect(W/2-70,26,140,36); g.fillStyle="#ffd45a"; g.font="900 22px 'Black Han Sans',sans-serif"; g.textAlign="center"; g.fillText("NEW RECORD",W/2,52); drawPix(g,me,W/2,GY+8-hop,92,{}); }
    else if(type==="goal"){ const k=(T%2.4)/2.4; const gx=W-64; g.strokeStyle="#fff"; g.lineWidth=3; g.beginPath(); g.moveTo(gx,GY+8); g.lineTo(gx,GY-44); g.lineTo(gx+46,GY-44); g.lineTo(gx+46,GY+8); g.stroke(); g.strokeStyle="rgba(255,255,255,.25)"; g.lineWidth=.8; for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(gx+i*8,GY-44); g.lineTo(gx+i*8,GY+8); g.stroke(); }
      const px=60+k*70; drawPix(g,me,px,GY+8-(k>.55?hop:0),92,{run:k<.5?t*9:0,kick:k>.4&&k<.7?(k-.4)/.3*.9:0}); if(k<.45) ball(px+26,GY+2,6,t*20); else { const u=clamp((k-.45)/.35,0,1); ball(px+26+(gx+22-px-26)*u,GY+2-(30*4*u*(1-u))-u*20,6,t*30); } if(k>.8){ G.goalText(g,W,H*.7,60-(k-.8)*80); } }
    else if(type==="assist"){ const k=(T%2.6)/2.6; drawPix(g,me,80,GY+8,92,{run:k<.3?t*9:0,kick:k>.3&&k<.5?(k-.3)/.2*.8:0}); drawPix(g,mate,W-86,GY+8-(k>.82?hop:0),92,{}); const u=clamp((k-.32)/.45,0,1); ball(k<.32?106:106+(W-86-110-106+110)*u*.85,GY+2-Math.sin(u*Math.PI)*34,6,t*25); }
    else if(type==="save"){ const k=(T%2.2)/2.2, d=Math.sin(Math.min(1,k/.5)*Math.PI/2); const side=Math.floor(t/2.2)%2?1:-1; g.save(); g.translate(W/2+side*d*70,GY+8-Math.sin(d*Math.PI)*26); g.rotate(side*d*1.1); drawPix(g,meGk,0,0,92,{}); g.restore(); const bx=W/2+side*(30+d*90)+(k>.5?side*(k-.5)*-40:0); ball(bx,GY-40+k*40-(k>.5?(k-.5)*50:0),6,t*30); }
    else if(type==="run"){ const x=((t*70)%(W+80))-40; drawPix(g,me,x,GY+8,92,{run:t*10}); ball(x+30,GY+4,6,t*20); g.fillStyle="rgba(255,255,255,.3)"; for(let i=1;i<6;i++) g.fillRect(x-24-i*12,GY+2-(i%2)*3,5,2); }
    else if(type==="grow"){ const s=.82+.18*Math.min(1,(T%4)/2); drawPix(g,me,W/2,GY+8,92*s,{}); g.strokeStyle="rgba(255,255,255,.5)"; g.setLineDash([4,3]); g.beginPath(); g.moveTo(W/2-46,GY+8-92); g.lineTo(W/2+46,GY+8-92); g.stroke(); g.setLineDash([]); g.fillStyle="#86d7c0"; g.font="700 20px sans-serif"; g.textAlign="center"; g.fillText("▲",W/2,GY-104-(Math.sin(t*4)*3)); }
    else if(type==="mil"){ drawPix(g,M.mil,W/2,GY+8,92,{}); g.strokeStyle="#cfd3dc"; g.lineWidth=2; g.beginPath(); g.moveTo(W/2+30,GY-70); g.lineTo(W/2+30,GY-40); g.stroke(); g.fillStyle="#d63a3a"; g.fillRect(W/2+30,GY-70,18+Math.sin(t*4)*2,12); }
    else if(type==="kid"){ const sk=g.createLinearGradient(0,0,0,HOR); sk.addColorStop(0,"#3a2a5a"); sk.addColorStop(1,"#e8925a"); g.fillStyle=sk; g.fillRect(0,0,W,HOR); g.fillStyle="#fff3c4"; g.beginPath(); g.arc(300,34,12,0,7); g.fill(); g.fillStyle="#2a1f1a"; g.fillRect(0,HOR-30,W,30); g.fillStyle="#8a5a3a"; g.fillRect(W-80,GY-62,62,72); g.fillStyle="rgba(0,0,0,.18)"; for(let y=GY-60;y<GY+8;y+=10) g.fillRect(W-80,y,62,1.5); const k=(t%1.6)/1.6, bx=96+(W-98-96)*(k<.5?k*2:2-k*2); drawPix(g,me,66,GY+8,70,{kick:k<.1?.6:0}); ball(bx,GY-4-Math.sin((k<.5?k*2:2-k*2)*Math.PI)*8,5,t*14); }
    else if(type==="farewell"){ const sp=g.createLinearGradient(0,0,0,H); sp.addColorStop(0,"rgba(255,244,200,.6)"); sp.addColorStop(1,"rgba(255,244,200,.08)"); g.fillStyle=sp; g.beginPath(); g.moveTo(W/2-16,0); g.lineTo(W/2+16,0); g.lineTo(W/2+92,GY+8); g.lineTo(W/2-92,GY+8); g.fill(); drawPix(g,M.suit,W/2,GY+8,96,{}); conf.forEach(c=>{ c.y=(c.y+c.v*(1/60))%(H+10); g.fillStyle=c.c; g.fillRect(c.x,c.y,3,5); }); }
    else if(type==="rehab"){ const k=(t%8)/8; const inj=L.pixelCanvasImg(S,{injured:true}); const doc=L.pixelCanvasImg(S,{name:"치료사",kit:"#f4f4f4"}); g.fillStyle="#2a3a4a"; g.fillRect(0,HOR,W,H-HOR); g.fillStyle="#3a4e62"; g.fillRect(0,HOR+8,W,6); g.fillStyle="#8aa0b4"; g.fillRect(W/2-90,GY-34,4,42); g.fillRect(W/2+86,GY-34,4,42); g.fillRect(W/2-90,GY-34,180,4); const px=W/2-70+k*140; drawPix(g,inj,px,GY+8,88,{run:t*3.2}); drawPix(g,doc,W/2+104,GY+8,84,{}); g.fillStyle="rgba(255,255,255,.15)"; g.fillRect(40,H-26,W-80,8); g.fillStyle="#86d7c0"; g.fillRect(40,H-26,(W-80)*k,8); g.fillStyle="#d6f5ea"; g.font="700 11px sans-serif"; g.textAlign="left"; g.fillText("회복 "+Math.round(k*100)+"%",40,H-32); }
    else if(type==="youth"){ [60,130,200,270].forEach(cone); const x=60+((t*38)%210), zig=Math.sin((x-60)/32*Math.PI)*10; drawPix(g,me,x,GY+8-Math.abs(zig)*.3,86,{run:t*10}); ball(x+22,GY+3+zig*.3,5.5,t*20); }
    else { const x=((t*52)%(W+80))-40; drawPix(g,me,x,GY+8,92,{run:t*9}); ball(x+30+Math.sin(t*9)*5,GY+4,6,t*18); }
    G.vig(g,W,H); setTimeout(loop,16); };
  loop();
  return {set(type,age){ cur.type=type; cur.age=age||null; t0=performance.now(); },stop(){ stopped=true; }};
};
/* 카드 HTML (결과 화면 맨 위) */
L.hlHtml=function(S,R,esc){ const h=L.highlightOf(S,R); if(!h) return ""; return '<section class="card hlcard"><canvas class="hlc" width="360" height="190"></canvas><div class="hltxt"><small>SEASON HIGHLIGHT · '+R.year+'</small><b>'+esc(h.title)+'</b><span>'+esc(h.line)+'</span>'+(h.sub?'<em>'+esc(h.sub)+'</em>':"")+'</div></section>'; };
window.KL_I18N_EN_HL=(()=>{ const NUM=s=>String(s).replace(/[0-9][0-9,]*(?:.[0-9]+)?/g,"#"), nd=o=>{ const r={}; Object.keys(o).forEach(k=>{ r[NUM(k)]=NUM(o[k]); }); return r; };
return nd({"다시 일어서기 위한 한 해":"A year spent getting back up","재활실에서 보낸 시간이 더 단단한 몸을 만들어요.":"Time in the rehab room builds a sturdier body.","한 걸음 한 걸음, 그라운드로 돌아가는 길이에요.":"One step at a time, the road back to the pitch.","회복 #%":"Recovery #%","🇰🇷 대표팀":"🇰🇷 National team","세계 최고의 선수":"The world's best player","후보":"nominee","기록을 새로 썼어요":"You set a new record","군 복무의 한 해":"A year of military service","그라운드를 잠시 떠나 나라를 지켰어요.":"You stepped off the pitch for a while to serve the country.","수비수들이 가장 두려워한 이름이었어요.":"Yours was the name defenders feared most.","공이 닿는 곳마다 골망이 출렁였어요.":"Wherever the ball went, the net rippled.","마지막 패스는 늘 정확했어요.":"The final pass was always precise.","동료들이 골을 넣을 때마다 뒤에서 웃고 있었어요.":"Every time a teammate scored, you were smiling right behind.","골문 앞에는 늘 철벽이 서 있었어요.":"A wall always stood in front of the goal.","결정적인 순간마다 손끝이 공을 막아 냈어요.":"Your fingertips stopped the ball at every decisive moment.","꾸준함이 빛난 시즌":"A season where consistency shone","한 뼘 더 자랐어요":"You've grown a little more","땀이 숫자로 남았어요.":"The sweat stayed behind as numbers.","콘이 한 줄로 서 있는 운동장에서 하루가 저물었어요.":"The day faded on a pitch with a line of cones.","넘어지고 일어나며 한 뼘씩 자랐어요.":"Falling and getting up, you grew a little at a time.","평범한 날들이 모여 커리어가 돼요.":"Ordinary days add up to a career.","오늘도 공을 쫓아 달렸어요.":"You chased the ball again today.","박수 속에 무대에 올랐어요.":"You stepped on stage amid applause.","한 시즌의 노력이 인정받았어요.":"A season of effort was recognised.","배우는 중":"still learning","SEASON HIGHLIGHT":"SEASON HIGHLIGHT"}); })();
})();
