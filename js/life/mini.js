/* 미니게임: 페널티킥(방향 + 타이밍)과 프리킥(드래그로 조준·휘어 차기). 이벤트 선택지와 슈팅 연습에서 열려요. */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const ZN=["왼쪽 위","가운데 위","오른쪽 위","왼쪽 아래","가운데 아래","오른쪽 아래"];

/* 게이지 표시를 CSS 애니메이션 대신 자바스크립트로 움직여요 (기기 설정에 영향받지 않게) */
/* 천연잔디 질감: 촘촘한 알갱이 잔디결 + 부드러운 얼룩 (선 모양은 쓰지 않아요). 한 번 만들어 두고 경기장 바닥 위에 덧그려요 */
let _gt=null;
function grassTex(W,H){ if(_gt&&_gt.width===W&&_gt.height===H) return _gt; const t=document.createElement("canvas"); t.width=W; t.height=H; const x=t.getContext("2d"); let seed=7; const rnd2=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  /* 큰 얼룩(밝고 어두운 구역) */
  for(let i=0;i<34;i++){ const px=rnd2()*W, py=rnd2()*H, r=22+rnd2()*60; const g=x.createRadialGradient(px,py,0,px,py,r); const dark=rnd2()<.5; g.addColorStop(0,dark?"rgba(0,50,10,.16)":"rgba(210,255,150,.10)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(px-r,py-r,r*2,r*2); }
  /* 촘촘한 잔디결: 아주 작은 알갱이를 빽빽하게 */
  const n=Math.round(W*H/5.5); for(let i=0;i<n;i++){ const px=rnd2()*W, py=rnd2()*H, k=rnd2(); x.fillStyle=k<.5?"rgba(0,45,8,"+(.07+rnd2()*.1)+")":k<.85?"rgba(150,230,110,"+(.05+rnd2()*.08)+")":"rgba(255,255,200,.05)"; x.fillRect(px,py,1+(rnd2()<.3?1:0),1+(rnd2()<.5?1:0)); }
  _gt=t; return t; }
L.animMark=function(mark,period){
  const t0=performance.now(); period=period||1100; let stop=false;
  const tick=()=>{ if(stop||!mark.isConnected) return; const k=((performance.now()-t0)/period)%2, pos=k<1?k:2-k; mark.style.left=(pos*100)+"%"; mark.dataset.pos=pos.toFixed(3); setTimeout(tick,16); };
  mark.style.animation="none"; setTimeout(tick,16);
  return {stop:()=>{ stop=true; }, pos:()=>+mark.dataset.pos||0};
};

/* 페널티킥 3D 장면: 골대를 눌러 조준 → 타이밍 게이지 → 슛. 한 번 차고 cb(성공, 메시지) 를 불러요. reset() 으로 다시 차기(승부차기). */
function pk3d(root,comp,cb){
  const c=root.querySelector("#pkc"), g=c.getContext("2d"), W=c.width, H=c.height;
  const F=440, HOR=50, CY=1.4, CZ=-4, ZG=11, GW=7.32, GH=2.44;
  const pow=root.querySelector(".pkpow"), shootBtn=root.querySelector("#pkshoot"), mark=root.querySelector(".pmark");
  let aim=null, locked=false, anim=null, flight=null, gkx=0, gkTo=0, gkh=0, shake=0, ripple=null, cheer=0, dead=false, dragging=false;
  const P=(x,y,z)=>{ const d=z-CZ; return {x:W/2+F*x/d, y:HOR-F*(y-CY)/d, s:F/d}; };
  const poly=(pts,fill)=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.closePath(); g.fillStyle=fill; g.fill(); };
  const line=(a,b,col,lw)=>{ g.strokeStyle=col; g.lineWidth=lw||1; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); };
  const CCOL=["#c0392b","#f2b84b","#ecf0f1","#2e86c1","#27ae60","#8e44ad"]; const crowd=[]; for(let i=0;i<190;i++) crowd.push([Math.random()*W,HOR-3-Math.random()*40,CCOL[Math.floor(Math.random()*6)],Math.random()*6]);
  const bez=t=>({x:flight.tx*t,y:flight.ty*t+flight.apex*4*t*(1-t),z:ZG*t});
  const keeper=()=>{ const f=P(gkx,0,ZG-.3), t=P(gkx,1.88,ZG-.3), w=Math.max(8,.55*f.s); const dive=flight?Math.min(1,Math.max(0,(flight.t-.08)*2.6)):0; g.save(); g.translate(f.x,f.y-(t.y>0?0:0)); const dir=gkTo>gkx?1:gkTo<gkx?-1:0; g.rotate(dir*dive*1.1); g.translate(-f.x,-f.y);
    g.fillStyle="#ffcf4a"; g.fillRect(f.x-w/2,t.y+f.s*.25,w,f.y-t.y-f.s*.25); g.fillStyle="#e8c9a0"; g.beginPath(); g.arc(f.x,t.y+f.s*.12,Math.max(3,f.s*.14),0,7); g.fill();
    g.strokeStyle="#ffcf4a"; g.lineWidth=Math.max(3,f.s*.1); g.lineCap="round"; const up=dive>0?-1.5:0; g.beginPath(); g.moveTo(f.x-w/2,t.y+f.s*.4); g.lineTo(f.x-w*1.1-dive*w*.5,t.y+f.s*(.2+up*.2)+f.s*.2); g.moveTo(f.x+w/2,t.y+f.s*.4); g.lineTo(f.x+w*1.1+dive*w*.5,t.y+f.s*(.2+up*.2)+f.s*.2); g.stroke(); g.restore(); };
  const scene=()=>{
    g.save(); if(shake>0){ g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); shake*=.88; if(shake<.4) shake=0; }
    const sk=g.createLinearGradient(0,0,0,HOR); sk.addColorStop(0,"#0a1d3a"); sk.addColorStop(1,"#1b3d66"); g.fillStyle=sk; g.fillRect(-10,-10,W+20,HOR+12);
    g.fillStyle="#12233d"; g.fillRect(-10,HOR-46,W+20,46); crowd.forEach(d=>{ g.fillStyle=d[2]; const j=cheer>0?Math.sin(performance.now()/80+d[3])*2.4:0; g.fillRect(d[0],d[1]+j,3,3); });
    g.fillStyle="#d9d9d9"; g.fillRect(-10,HOR-2,W+20,2);
    for(let z=-8,k=0;z<30;z+=3,k++){ poly([P(-30,0,z),P(30,0,z),P(30,0,z+3),P(-30,0,z+3)],k%2?"#1f6a43":"#1a5c3a"); } g.globalAlpha=.9; g.drawImage(grassTex(W,H),0,HOR,W,H-HOR); g.globalAlpha=1;
    const L1=(x1,z1,x2,z2)=>line(P(x1,0,z1),P(x2,0,z2),"rgba(255,255,255,.85)",1.4);
    L1(-30,ZG,30,ZG); L1(-9.16,ZG-5.5,9.16,ZG-5.5); L1(-9.16,ZG-5.5,-9.16,ZG); L1(9.16,ZG-5.5,9.16,ZG); L1(-20,ZG-16.5,20,ZG-16.5);
    g.fillStyle="rgba(255,255,255,.9)"; const sp=P(0,0,0); g.beginPath(); g.ellipse(sp.x,sp.y,6,2.2,0,0,7); g.fill();
    const gl=-GW/2, gr=GW/2, nz=ZG+1.8; poly([P(gl,0,nz),P(gr,0,nz),P(gr,GH,nz),P(gl,GH,nz)],"rgba(255,255,255,.08)");
    const rp=ripple?Math.max(0,1-(performance.now()-ripple.t)/650):0;
    for(let i=0;i<=16;i++){ const x=gl+GW*i/16, a=P(x,0,nz), b=P(x,GH,nz); const dz=rp?Math.sin(i*.9+performance.now()/55)*rp*4*Math.exp(-Math.abs(x-ripple.x)/1.3):0; line({x:a.x+dz,y:a.y},{x:b.x+dz,y:b.y},"rgba(255,255,255,.3)",.8); }
    for(let j=0;j<=7;j++){ const y=GH*j/7; line(P(gl,y,nz),P(gr,y,nz),"rgba(255,255,255,.3)",.8); }
    line(P(gl,GH,ZG),P(gl,GH,nz),"rgba(255,255,255,.4)",1); line(P(gr,GH,ZG),P(gr,GH,nz),"rgba(255,255,255,.4)",1);
    keeper();
    const a1=P(gl,0,ZG), a2=P(gl,GH,ZG), b1=P(gr,0,ZG), b2=P(gr,GH,ZG); line(a1,a2,"#fff",4); line(b1,b2,"#fff",4); line(a2,b2,"#fff",4);
    /* 공 */
    let bp={x:0,y:0,z:0}; if(flight){ bp=flight.reb?rebPos(flight.reb):bez(flight.t); g.strokeStyle="rgba(255,255,255,.3)"; g.lineWidth=2; g.beginPath(); for(let i=0;i<=Math.round(flight.t*24);i++){ const q=bez(i/24),pp=P(q.x,q.y,q.z); i?g.lineTo(pp.x,pp.y):g.moveTo(pp.x,pp.y); } g.stroke(); }
    const bs=P(bp.x,bp.y,bp.z), gd=P(bp.x,0,bp.z), r=Math.max(3,bs.s*.115);
    g.fillStyle="rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(gd.x+1,gd.y+1,r*1.1,r*.45,0,0,7); g.fill(); g.fillStyle="#fff"; g.beginPath(); g.arc(bs.x,bs.y,r,0,7); g.fill(); g.fillStyle="#222"; g.beginPath(); g.arc(bs.x-r*.2,bs.y-r*.1,r*.4,0,7); g.fill();
    /* 조준점 */
    if(aim&&!flight){ const q=P(aim.x,aim.y,ZG); g.strokeStyle=locked?"#ffcf4a":"rgba(255,255,255,.9)"; g.lineWidth=2; g.beginPath(); g.arc(q.x,q.y,9,0,7); g.moveTo(q.x-14,q.y); g.lineTo(q.x+14,q.y); g.moveTo(q.x,q.y-14); g.lineTo(q.x,q.y+14); g.stroke(); }
    if(!aim&&!flight){ g.font="600 13px 'Noto Sans KR',sans-serif"; g.textAlign="center"; g.fillStyle="rgba(255,255,255,.9)"; g.fillText("골대의 노리는 곳을 눌러요",W/2,H-14); }
    if(cheer>0){ cheer--; g.font="700 28px 'Black Han Sans',sans-serif"; g.textAlign="center"; g.fillStyle="rgba(255,207,74,.95)"; g.strokeStyle="rgba(0,0,0,.6)"; g.lineWidth=4; g.strokeText("GOAL!",W/2,H*.62); g.fillText("GOAL!",W/2,H*.62); }
    g.restore();
  };
  const toWorld=e=>{ const r=c.getBoundingClientRect(); const t=e.touches&&e.touches[0]?e.touches[0]:(e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e); const sx=(t.clientX-r.left)*W/r.width, sy=(t.clientY-r.top)*H/r.height; const d=ZG-CZ; return {x:Math.max(-4.4,Math.min(4.4,(sx-W/2)*d/F)), y:Math.max(.1,Math.min(3,CY-(sy-HOR)*d/F))}; };
  const down=e=>{ if(dead||locked||flight) return; e.preventDefault(); dragging=true; aim=toWorld(e); scene(); };
  const move=e=>{ if(!dragging||locked) return; e.preventDefault(); aim=toWorld(e); scene(); };
  const up=e=>{ if(!dragging) return; dragging=false; if(!aim||locked||flight) return; locked=true; pow.hidden=false; anim=L.animMark(mark,950); scene(); };
  c.addEventListener("mousedown",down); c.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
  c.addEventListener("touchstart",down,{passive:false}); c.addEventListener("touchmove",move,{passive:false}); c.addEventListener("touchend",up,{passive:false});
  const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  shootBtn.addEventListener("click",()=>{
    if(dead||!locked||!anim||flight) return; const pos=anim.pos(); anim.stop(); anim=null; pow.hidden=true;
    const acc=Math.max(0,Math.min(1,1-Math.abs(pos-.5)*2.4+comp*.12)); const sigma=.12+(1-acc)*1.15-comp*.06;
    let tx=aim.x+gauss()*sigma, ty=Math.max(0,aim.y+gauss()*sigma*.7);
    let res, ok=false, deflect=false; const gkChoices=[-2.4,0,2.4]; const read=Math.random()<.34; gkTo=read?Math.max(-3.2,Math.min(3.2,tx)):gkChoices[Math.floor(Math.random()*3)]; gkh=ty;
    if(Math.abs(tx)>GW/2+.06) res="슛이 골대 옆으로 빗나갔어요!"; else if(ty>GH+.06) res="슛이 크로스바 위로 넘어갔어요!"; else if(Math.abs(Math.abs(tx)-GW/2)<.1||Math.abs(ty-GH)<.08) { res="골대를 때리고 튕겨 나왔어요!"; deflect=true; }
    else { const R=1.65*(1-.3*ty/GH); const d=Math.abs(tx-gkTo); const pSave=d<R?(Math.abs(tx)>2.7&&ty>1.7?.5:.92):(d<R*1.25?.2:.02); ok=Math.random()>pSave; res=ok?"골~~~인!":"골키퍼가 막아냈어요! 공이 튕겨 나가요."; if(!ok) deflect=true; }
    flight={t:0,tx,ty,apex:.35,deflect}; const gk0=gkx, t0=performance.now(), dur=520;
    const step=()=>{ if(dead) return; flight.t=Math.max(0,Math.min(1,(performance.now()-t0)/dur)); gkx=gk0+(gkTo-gk0)*Math.max(0,Math.min(1,(flight.t-.05)*1.8)); if(flight.t>=1&&flight.deflect&&!flight.reb){ const sd=(tx>=gkTo?1:-1); flight.reb=reb(tx,ty,ZG,sd*(1.5+Math.random()*3.2),1.5+Math.random()*3,-(3+Math.random()*4)); shake=5; } if(flight.t>=1&&ok&&!ripple){ ripple={t:performance.now(),x:tx}; shake=8; cheer=55; } scene(); if(flight.t<1||(ok&&performance.now()-t0<dur+800)||(flight.deflect&&performance.now()-t0<dur+1000)) setTimeout(step,16); else setTimeout(()=>cb(ok,res),350); };
    setTimeout(step,16);
  });
  scene();
  return {reset(){ aim=null; locked=false; flight=null; gkx=0; gkTo=0; ripple=null; cheer=0; if(anim){ anim.stop(); anim=null; } pow.hidden=true; scene(); },destroy(){ dead=true; }};
}

/* 공이 튕겨 나가는 움직임(벽·골키퍼·골대): 충돌 지점에서 속도를 주고 중력과 바운드를 계산해요 */
function reb(x,y,z,vx,vy,vz){ return {t0:performance.now(),x,y,z,vx,vy,vz}; }
function rebPos(r){ const t=(performance.now()-r.t0)/1000; let y=r.y+r.vy*t-4.9*t*t; if(y<0){ y=-y*.55; } const d=Math.exp(-t*.35); return {x:r.x+r.vx*t*d,y:Math.min(6,Math.max(0,y)),z:r.z+r.vz*t*d}; }

/* 코너킥 공 궤적: 가로로는 빠르게 날아와 목표 지점 위에서 천천히 내려와요(헤딩할 수 있는 시간이 길어요) */
const HD_ZG=20, HD_T=3.0, HD_YMIN=.9, HD_YMAX=4.6, HD_REACH=2.0;
function hdBall(t,side,lx,lz){ const f=1-Math.pow(1-t,2.6); return {x:side*34+(lx-side*34)*f,y:.3+20*t*(1-t),z:HD_ZG+(lz-HD_ZG)*f}; }
/* 사람이 누를 수 있는 '초록 창'의 길이(초): 목표 지점에 서 있을 때 공이 머리 높이·가까운 거리에 있는 시간 */
L.hdWindowSecs=function(){ let min=9; for(let k=0;k<60;k++){ const side=k%2?1:-1, lx=(Math.random()<.5?1:-1)*(1+Math.random()*2.6), lz=HD_ZG-5.5-Math.random()*3.5; let s=0; for(let t=0;t<1;t+=.001){ const b=hdBall(t,side,lx,lz); if(b.y>HD_YMIN&&b.y<HD_YMAX&&Math.hypot(lx-b.x,lz-b.z)<HD_REACH) s+=.001*HD_T; } if(s<min) min=s; } return min; };
/* 코너킥 헤딩 3D 장면 (쉬운 방식): 선수들이 자동으로 달려가고, 공이 초록 원에 내려올 때 '지금!' 버튼만 누르면 돼요 */
function hd3d(root,S,cb){
  const c=root.querySelector("#hdc"), g=c.getContext("2d"), W=c.width, H=c.height;
  const F=500, HOR=78, CY=2.7, CZ=-7, ZG=20, GW=7.32, GH=2.44;
  const st=(S.p&&S.p.stats)||{}; const power=(((st.physical||60)+(st.finishing||st.defending||60))/2)/100;
  const side=Math.random()<.5?-1:1;
  const lx=(Math.random()<.5?1:-1)*(1+Math.random()*2.6), lz=ZG-5.5-Math.random()*3.5;
  const T=HD_T;                                              // 공 체공 시간(초)
  const jumpBtn=root.querySelector("#hdjump"), info=root.querySelector("#mtxt");
  let started=false, tLaunch=0, jumpAt=null, jumpDone=false, header=null, gkx=0, gkTo=0, shake=0, ripple=null, cheer=0, dead=false, resultSent=false, rebd=null;
  const me={x:lx+(Math.random()<.5?-2.6:2.6),z:lz-2.4+Math.random()*1.2,col:"#ffcf4a",spd:5.4,ph:2}; me.x0=me.x; me.z0=me.z;
  const P=(x,y,z)=>{ const d=z-CZ; return {x:W/2+F*x/d, y:HOR-F*(y-CY)/d, s:F/d}; };
  const poly=(pts,fill)=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.closePath(); g.fillStyle=fill; g.fill(); };
  const line=(a,b,col,lw)=>{ g.strokeStyle=col; g.lineWidth=lw||1; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); };
  const CCOL=["#c0392b","#f2b84b","#ecf0f1","#2e86c1","#27ae60","#8e44ad"]; const crowd=[]; for(let i=0;i<200;i++) crowd.push([Math.random()*W,HOR-3-Math.random()*40,CCOL[Math.floor(Math.random()*6)],Math.random()*6]);
  const mk=(x,z,col,role)=>({x0:x,z0:z,x,z,col,role,ph:Math.random()*6,spd:3.6+Math.random()*1.8});
  const mates=[mk(-4,ZG-8,"#2f6fd6","a"),mk(5,ZG-10,"#2f6fd6","a"),mk(0,ZG-14,"#2f6fd6","a")];
  const defs=[mk(-2.5,ZG-6,"#c0392b","d"),mk(2.2,ZG-7,"#c0392b","d"),mk(-6,ZG-9,"#c0392b","d"),mk(6.5,ZG-9.5,"#c0392b","d")];
  const ballAt=(t)=>hdBall(t,side,lx,lz);
  const ball=()=>{ if(!started) return {x:side*34,y:.12,z:ZG}; if(rebd) return rebPos(rebd); if(header){ const k=Math.min(1,(performance.now()-header.at)/header.dur); if(k<=0) return ballAt(Math.min(1,(header.at-tLaunch)/1000/T)); return {x:header.x0+(header.tx-header.x0)*k,y:header.y0+(header.ty-header.y0)*k+Math.sin(k*Math.PI)*.4,z:header.z0+(ZG-header.z0)*k}; } return ballAt(Math.min(1,(performance.now()-tLaunch)/1000/T)); };
  const man=(x,z,h,col,yoff,run,ring)=>{ const f=P(x,yoff||0,z), t=P(x,(yoff||0)+h,z), w=Math.max(4,.5*f.s), bob=run?Math.sin(performance.now()/90+run)*f.s*.07:0; g.fillStyle="rgba(0,0,0,.28)"; const gd=P(x,0,z); g.beginPath(); g.ellipse(gd.x,gd.y,w*.9,w*.28,0,0,7); g.fill(); g.fillStyle=col; g.fillRect(f.x-w/2,t.y+f.s*.25+bob,w,f.y-t.y-f.s*.25); g.fillStyle="#e8c9a0"; g.beginPath(); g.arc(f.x,t.y+f.s*.12+bob,Math.max(3,f.s*.14),0,7); g.fill(); if(run){ g.strokeStyle=col; g.lineWidth=Math.max(2,f.s*.08); const sw=Math.sin(performance.now()/90+run)*f.s*.18; g.beginPath(); g.moveTo(f.x-w*.25,f.y); g.lineTo(f.x-w*.25-sw,f.y+f.s*.02); g.moveTo(f.x+w*.25,f.y); g.lineTo(f.x+w*.25+sw,f.y+f.s*.02); g.stroke(); } if(ring){ g.strokeStyle="#ffcf4a"; g.lineWidth=2.5; g.beginPath(); g.ellipse(gd.x,gd.y,w*1.3,w*.45,0,0,7); g.stroke(); g.fillStyle="#ffcf4a"; g.beginPath(); g.moveTo(f.x,t.y-10); g.lineTo(f.x-6,t.y-20); g.lineTo(f.x+6,t.y-20); g.closePath(); g.fill(); } };
  /* 점프 가능한 순간인지 */
  const windowNow=()=>{ if(!started||jumpAt!=null) return 0; const t=(performance.now()-tLaunch)/1000/T; if(t<.5||t>1.02) return 0; const b=ballAt(Math.min(1,t)); const hd=Math.hypot(me.x-b.x,me.z-b.z); if(hd>HD_REACH) return 1; return (b.y>HD_YMIN&&b.y<HD_YMAX)?2:1; };
  const scene=()=>{
    g.save(); if(shake>0){ g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); shake*=.88; if(shake<.4) shake=0; }
    const sk=g.createLinearGradient(0,0,0,HOR); sk.addColorStop(0,"#0a1d3a"); sk.addColorStop(1,"#1b3d66"); g.fillStyle=sk; g.fillRect(-10,-10,W+20,HOR+12);
    g.fillStyle="#12233d"; g.fillRect(-10,HOR-46,W+20,46); crowd.forEach(d=>{ g.fillStyle=d[2]; const j=cheer>0?Math.sin(performance.now()/80+d[3])*2.4:0; g.fillRect(d[0],d[1]+j,3,3); });
    g.fillStyle="#d9d9d9"; g.fillRect(-10,HOR-2,W+20,2);
    for(let z=-8,k=0;z<36;z+=4,k++){ poly([P(-45,0,z),P(45,0,z),P(45,0,z+4),P(-45,0,z+4)],k%2?"#1f6a43":"#1a5c3a"); } g.globalAlpha=.9; g.drawImage(grassTex(W,H),0,HOR,W,H-HOR); g.globalAlpha=1;
    const L1=(x1,z1,x2,z2)=>line(P(x1,0,z1),P(x2,0,z2),"rgba(255,255,255,.85)",1.3); L1(-45,ZG,45,ZG); L1(-20.16,ZG-16.5,20.16,ZG-16.5); L1(-20.16,ZG-16.5,-20.16,ZG); L1(20.16,ZG-16.5,20.16,ZG); L1(-9.16,ZG-5.5,9.16,ZG-5.5); L1(-9.16,ZG-5.5,-9.16,ZG); L1(9.16,ZG-5.5,9.16,ZG);
    const gl=-GW/2, gr=GW/2, nz=ZG+1.8; poly([P(gl,0,nz),P(gr,0,nz),P(gr,GH,nz),P(gl,GH,nz)],"rgba(255,255,255,.08)");
    const rp=ripple?Math.max(0,1-(performance.now()-ripple.t)/650):0;
    for(let i=0;i<=14;i++){ const x=gl+GW*i/14, a=P(x,0,nz), b=P(x,GH,nz); const dz=rp?Math.sin(i*.9+performance.now()/55)*rp*3*Math.exp(-Math.abs(x-ripple.x)/1.3):0; line({x:a.x+dz,y:a.y},{x:b.x+dz,y:b.y},"rgba(255,255,255,.3)",.8); }
    for(let j=0;j<=6;j++){ const y=GH*j/6; line(P(gl,y,nz),P(gr,y,nz),"rgba(255,255,255,.3)",.8); }
    man(gkx,ZG-.3,1.88,"#ffcf4a",0,0);
    const a1=P(gl,0,ZG), a2=P(gl,GH,ZG), b1=P(gr,0,ZG), b2=P(gr,GH,ZG); line(a1,a2,"#fff",4); line(b1,b2,"#fff",4); line(a2,b2,"#fff",4);
    const all=mates.map(m=>({m,mine:false})).concat(defs.map(m=>({m,mine:false}))); all.push({m:me,mine:true}); all.sort((p,q)=>q.m.z-p.m.z);
    all.forEach(({m,mine})=>{ const running=started&&(performance.now()-tLaunch)/1000<T+.2&&!jumpDone; let yoff=0; if(mine&&jumpAt!=null){ const k=(performance.now()-jumpAt)/380; if(k<1) yoff=Math.sin(k*Math.PI)*.75; } man(m.x,m.z,1.82,mine?"#ffcf4a":m.col,yoff,running?m.ph+1:0,mine); });
    /* 떨어질 자리 표시: 멀 때 회색 → 곧 노랑 → 지금 초록 */
    if(started&&!header&&!rebd){ const w=windowNow(), lp=P(lx,0,lz); const pulse=1+Math.sin(performance.now()/120)*.12; g.strokeStyle=w===2?"#3cff7a":w===1?"#ffd84a":"rgba(255,255,255,.55)"; g.lineWidth=w===2?4:2.5; g.beginPath(); g.ellipse(lp.x,lp.y,22*pulse,8*pulse,0,0,7); g.stroke(); if(w===2){ g.fillStyle="rgba(60,255,122,.22)"; g.fill(); } }
    const b=ball(), bs=P(b.x,b.y,b.z), gd=P(b.x,0,b.z), r=Math.max(2.6,bs.s*.115);
    g.fillStyle="rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(gd.x,gd.y,r*1.1,r*.45,0,0,7); g.fill(); g.fillStyle="#fff"; g.beginPath(); g.arc(bs.x,bs.y,r,0,7); g.fill(); g.fillStyle="#222"; g.beginPath(); g.arc(bs.x-r*.2,bs.y-r*.1,r*.4,0,7); g.fill();
    if(cheer>0){ cheer--; g.font="700 28px 'Black Han Sans',sans-serif"; g.textAlign="center"; g.fillStyle="rgba(255,207,74,.95)"; g.strokeStyle="rgba(0,0,0,.6)"; g.lineWidth=4; g.strokeText("GOAL!",W/2,H*.6); g.fillText("GOAL!",W/2,H*.6); }
    g.restore();
  };
  const finishOnce=(ok,msg)=>{ if(resultSent) return; resultSent=true; setTimeout(()=>{ if(!dead) cb(ok,msg); },1000); };
  const loop=()=>{
    if(dead) return; const el=(performance.now()-tLaunch)/1000;
    const run=(m,tx,tz,sp)=>{ const dx=tx-m.x0, dz=tz-m.z0, dist=Math.hypot(dx,dz)||1, k=Math.min(1,el*sp/dist); m.x=m.x0+dx*k; m.z=m.z0+dz*k; };
    if(!jumpDone){ mates.forEach((m,i)=>run(m,lx+(i-1)*1.5,lz+(i%2?1:-1),m.spd)); defs.forEach((m,i)=>run(m,lx+(i-1.5)*1.2,lz+(i%2?-.8:.8),m.spd)); run(me,lx,lz,me.spd); }
    if(header){ gkx+=(gkTo-gkx)*.2; const k=Math.min(1,(performance.now()-header.at)/header.dur); if(k>=1&&header.ok&&!ripple){ ripple={t:performance.now(),x:header.tx}; shake=8; cheer=55; } if(k>=1&&header.deflect&&!rebd){ const bb=ball(); rebd=reb(bb.x,bb.y,bb.z,(Math.random()<.5?-1:1)*(2+Math.random()*3),1.5+Math.random()*2.5,-(3+Math.random()*3)); } }
    const w=windowNow(); if(jumpBtn){ jumpBtn.classList.toggle("hot",w===2); const sp=jumpBtn.querySelector("span"); if(sp) sp.textContent=w===2?"지금!":"점프!"; }
    scene();
    if(started&&!header&&el/T>=1.06&&!jumpAt&&!resultSent){ finishOnce(false,"공이 그대로 떨어졌어요. 초록 원이 될 때 '지금!'을 눌러 보세요."); }
    if(!resultSent||performance.now()<(header?header.at+header.dur+1500:0)) setTimeout(loop,16);
  };
  jumpBtn.addEventListener("click",()=>{
    if(dead||!started||jumpAt!=null) return; jumpAt=performance.now(); const el=(jumpAt-tLaunch)/1000, t=Math.min(1,el/T), b=ballAt(t);
    const dx=me.x-b.x, dz=me.z-b.z, hd=Math.hypot(dx,dz), reach=hd<HD_REACH, high=b.y>HD_YMIN&&b.y<HD_YMAX; const setj=()=>setTimeout(()=>{ jumpDone=true; },380);
    if(!reach||!high){ setj(); return finishOnce(false,hd>=HD_REACH?(t<.5?"너무 일찍 뛰었어요! 공이 아직 멀리 있어요.":"공이 머리 위를 지나갔어요!"):(b.y>=HD_YMAX?"너무 일찍! 공이 아직 높이 떠 있어요.":"조금 늦었어요! 공이 이미 내려왔어요.")); }
    const timing=1-Math.abs(b.y-2.4)/2.3, close=1-hd/HD_REACH;
    const near=defs.filter(d=>Math.hypot(d.x-me.x,d.z-me.z)<1.3).length; const win=Math.random()<Math.max(.4,Math.min(.97,.72+power*.18+timing*.1-near*.1));
    if(!win){ setj(); return finishOnce(false,"수비수와의 공중 경합에서 밀렸어요!"); }
    const q=Math.max(.25,Math.min(1,timing*.5+close*.15+power*.35)); const tx=(Math.random()-.5)*(5.2-q*2.4), ty=.5+Math.random()*(1.8-q*.3); const onTarget=Math.abs(tx)<GW/2-.05&&ty<GH-.05;
    gkTo=Math.max(-3.2,Math.min(3.2,tx+(Math.random()-.5)*3*(1.05-q))); const R=1.6*(1-.3*ty/GH); const saved=onTarget&&Math.abs(tx-gkTo)<R&&Math.random()<.2;
    const ok=onTarget&&!saved&&Math.random()<.82+q*.15; header={at:performance.now()+170,dur:560,x0:b.x,y0:b.y+.2,z0:b.z,tx,ty,ok,deflect:saved,t:0};
    jumpDone=true; setTimeout(()=>{ jumpDone=true; },380);
    finishOnce(ok,ok?"헤딩 골~~~인!":(!onTarget?"헤더가 골대를 빗나갔어요!":"골키퍼가 쳐냈어요!"));
  });
  scene();
  /* 자동 시작: 잠깐 준비하고 코너킥이 올라와요 */
  if(info) info.textContent="코너킥이 올라와요! 공이 떨어질 초록 원 쪽으로 선수가 달려가요.";
  setTimeout(()=>{ if(dead) return; started=true; tLaunch=performance.now(); if(jumpBtn) jumpBtn.closest(".pkpow").hidden=false; if(info) info.textContent="원이 초록색으로 바뀌면 '지금!' 버튼을 눌러요. (약 1초 동안 초록이에요)"; loop(); },1200);
  return {destroy(){ dead=true; }};
}

/* ===== GOAT 각성 미니게임 =====
 * 새벽 훈련 3세트. 움직이는 표시가 초록 구간에 있을 때 '지금!'을 눌러요(가운데 금빛은 퍼펙트).
 * 점수 합(퍼펙트 1, 굿 .6, 놓침 0)으로 각성 확률이 정해지고, 마지막에 그 확률로 한 번 굴려요 — 실력과 운이 함께 필요해요.
 * 규칙은 한 곳에: AWAKE (tools/tests/minigame.cjs 가 초록 구간 시간이 0.8초 이상인지 검사해요) */
const AWAKE={period:1800, zone:[.22,.78], perfect:[.36,.64], rounds:3, base:.15, per:.22, max:.88};
L.AWAKE=AWAKE;
L.awakeWindowSecs=()=>(AWAKE.zone[1]-AWAKE.zone[0])*AWAKE.period/1000;
L.awakeChance=score=>Math.max(AWAKE.base,Math.min(AWAKE.max,AWAKE.base+AWAKE.per*score));
function awakeGame(root,S,cb){
  const tr=root.querySelector(".ptrack"), mark=root.querySelector(".pmark"), btn=root.querySelector("#awbtn"), info=root.querySelector("#awinfo"), pips=root.querySelector("#awpips");
  const z=AWAKE.zone, pf=AWAKE.perfect; let round=0, score=0, anim=null, res=[]; const txt=root.querySelector("#mtxt");
  const showPips=()=>{ pips.innerHTML=res.map(r=>'<i class="'+r.c+'">'+r.t+'</i>').join("")+'<i class="wait">·</i>'.repeat(AWAKE.rounds-res.length); };
  const next=()=>{ if(anim) anim.stop(); info.textContent=(round+1)+"세트 / "+AWAKE.rounds+"세트 — 초록 구간에서 '지금!'"; showPips(); anim=L.animMark(mark,AWAKE.period); };
  tr.insertAdjacentHTML("beforeend",'<i class="pzone" style="left:'+(z[0]*100)+'%;width:'+((z[1]-z[0])*100)+'%"></i><i class="pzone gold" style="left:'+(pf[0]*100)+'%;width:'+((pf[1]-pf[0])*100)+'%"></i>');
  btn.onclick=()=>{ if(!anim) return; const pos=anim.pos(); anim.stop(); anim=null; let c,t,pt; if(pos>=pf[0]&&pos<=pf[1]){ c="perfect"; t="★"; pt=1; } else if(pos>=z[0]&&pos<=z[1]){ c="good"; t="○"; pt=.6; } else { c="miss"; t="✕"; pt=0; } res.push({c,t}); score+=pt; round++; showPips();
    if(round<AWAKE.rounds){ setTimeout(next,450); return; }
    const p=L.awakeChance(score); btn.disabled=true; info.innerHTML='각성 확률 <b>'+Math.round(p*100)+'%</b> … 운명의 순간!';
    setTimeout(()=>{ const ok=Math.random()<p; cb(ok, ok?"각성 성공!":"몸이 따라 주지 못했어요"); },900); };
  next();
}
L.miniHtml=function(type){
  if(type==="awake") return `<div class="mini" data-novirt><p class="muted c" id="mtxt">새벽 각성 훈련 3세트. 타이밍이 좋을수록 각성 확률이 올라가요</p>
    <div class="pkpow"><div class="ptrack"><i class="pmark"></i></div><div id="awpips" class="awpips"></div><button type="button" class="big" id="awbtn"><span>지금!</span><b>⚡</b></button><p class="muted c" id="awinfo"></p></div></div>`;
  if(type==="pk") return `<div class="mini" data-novirt><p class="muted c" id="mtxt">골대에서 노리는 곳을 누르고, 타이밍을 맞춰 슛!</p>
    <canvas id="pkc" width="360" height="250" class="fkc"></canvas>
    <div class="pkpow" hidden><div class="ptrack"><i class="pzone"></i><i class="pmark"></i></div><button type="button" class="big" id="pkshoot"><span>슛!</span><b>⚡</b></button><p class="muted c">표시가 가운데 칸에 있을 때 눌러요</p></div></div>`;
  if(type==="so") return `<div class="mini" data-novirt><div class="sob" id="sob"></div><p class="muted c" id="mtxt">골대에서 노리는 곳을 누르고, 타이밍을 맞춰 슛!</p>
    <canvas id="pkc" width="360" height="250" class="fkc"></canvas>
    <div class="pkpow" hidden><div class="ptrack"><i class="pzone"></i><i class="pmark"></i></div><button type="button" class="big" id="pkshoot"><span>슛!</span><b>⚡</b></button><p class="muted c">표시가 가운데 칸에 있을 때 눌러요</p></div></div>`;
  if(type==="hd") return `<div class="mini" data-novirt><p class="muted c" id="mtxt">코너킥! 곧 공이 올라와요</p>
    <canvas id="hdc" width="360" height="250" class="fkc"></canvas>
    <div class="pkpow" hidden><button type="button" class="big" id="hdjump"><span>점프!</span><b>⬆</b></button><p class="muted c">선수는 자동으로 달려가요. 바닥 원이 <b style="color:#3cff7a">초록색</b>이 되면 누르세요.</p></div></div>`;
  return `<div class="mini" data-novirt><p class="muted c" id="mtxt">공 가까이를 누르고, 공이 날아갈 길을 손가락으로 그려요</p>
    <div class="fkctl"><button type="button" data-knuckle="1">🌀 무회전 슛 (불규칙하게 흔들려요)</button></div>
    <canvas id="fkc" width="360" height="240" class="fkc"></canvas><p class="muted c">위로 크게 휘어 그리면 벽을 넘고, 옆으로 휘어 그리면 감겨 들어가요. 점선이 공이 날아갈 실제 길이에요.</p></div>`;
};

/* done(성공 여부, 설명) */
L.miniBind=function(root,type,S,done){
  const st=(S.p&&S.p.stats)||{}, comp=(st.composure||st.finishing||60)/100;
  const txt=root.querySelector("#mtxt"); let over=false;
  const finish=(ok,msg)=>{ if(over) return; over=true; if(txt) txt.innerHTML=`<b style="color:${ok?"var(--gold,#ffcf4a)":"#ff8a8a"}">${msg}</b>`; setTimeout(()=>done(ok,msg),1100); };
  if(type==="awake"){ awakeGame(root,S,(ok,msg)=>finish(ok,msg)); return; }
  if(type==="pk"){ pk3d(root,comp,(ok,msg)=>finish(ok,msg)); return; }
  if(type==="so"){
    /* 승부차기: 내가 먼저 5번, 상대도 5번. 비기면 서든데스 */
    let mine=[], opp=[], round=0; const sob=root.querySelector("#sob");
    const draw=()=>{ const f=a=>a.map(x=>x?"⚽":"❌").join(" ")||"–"; sob.innerHTML='<div><small>나</small><b>'+f(mine)+'</b></div><div><small>상대</small><b>'+f(opp)+'</b></div>'; }; draw();
    const endCheck=()=>{ const m=mine.filter(Boolean).length, o=opp.filter(Boolean).length, n=mine.length, k=opp.length;
      if(n<=5&&k<=5){ const mr=5-n, or=5-k; if(m>o+or) return true; if(o>m+mr) return true; if(n===5&&k===5) return m!==o; return false; }
      return n===k&&m!==o; };
    const res=()=>{ const m=mine.filter(Boolean).length, o=opp.filter(Boolean).length; return finish(m>o,m>o?"승부차기 승리! "+m+"–"+o:"승부차기 패배… "+m+"–"+o); };
    const h=pk3d(root,comp,(ok)=>{
      mine.push(ok); round++; draw(); if(endCheck()) return res();
      if(txt) txt.textContent="상대 키커가 공을 놓아요…";
      setTimeout(()=>{ const og=Math.random()<.74; opp.push(og); draw(); if(endCheck()) return res(); if(txt) txt.textContent=(og?"상대가 성공했어요. ":"상대가 실축했어요! ")+(round>=5?"서든데스! ":"")+"이제 내 차례!"; h.reset(); },1100);
    });
    return;
  }
  if(type==="hd"){ hd3d(root,S,(ok,msg)=>finish(ok,msg)); return; }
  /* ===== 프리킥 (원근 3D): 손가락으로 공이 날아갈 길을 그리면, 그 길이 3D 궤적(높이·휘어짐)이 돼요 ===== */
  const c=root.querySelector("#fkc"), g=c.getContext("2d"), Wc=c.width, Hc=c.height;
  const F=400, HOR=62, CAMY=2.4, CAMZ=-7, GW=7.32, GH=2.44;
  const shoot=st.finishing||st.passing||st.composure||60, lgGap=S.club&&S.club.l&&S.p.ovr?clamp((S.club.l-S.p.ovr)*.6,-5,8):0;
  const bx=rnd([-6,-4,-2,2,4,6]), Zg=rnd([19,21,23,25]), camx=bx*.7;
  const wallH=clamp(1.88-(shoot-60)*.0035+lgGap*.012,1.7,2.05), wn=Zg>22?5:4, wz=9.15, wc=bx*(1-wz/Zg);
  const gkR=clamp(1.55+(S.club&&S.club.l?(S.club.l-70)/60:0),1.25,2.0);
  let gkx=(Math.random()-.5)*2.6, knuckle=false, path=[], drawing=false, flight=null, gkTo=0, shake=0, ripple=null, cheer=0, preview=null;
  const P=(x,y,z)=>{ const d=z-CAMZ; return {x:Wc/2+F*(x-camx)/d, y:HOR-F*(y-CAMY)/d, s:F/d}; };
  root.querySelectorAll("[data-knuckle]").forEach(b=>b.addEventListener("click",()=>{ if(over||flight) return; knuckle=!knuckle; b.classList.toggle("on",knuckle); if(txt) txt.textContent=knuckle?"무회전: 공이 마지막에 흔들려서 골키퍼도 예측하기 어려워요":"손가락으로 공이 날아갈 길을 그려요"; }));
  const poly=(pts,fill,stroke,lw)=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.closePath(); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=lw||1; g.stroke(); } };
  const line=(a,b,col,lw)=>{ g.strokeStyle=col; g.lineWidth=lw||1; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); };
  const CCOL=["#c0392b","#f2b84b","#ecf0f1","#2e86c1","#27ae60","#8e44ad"]; const crowd=[]; for(let i=0;i<170;i++) crowd.push([Math.random()*Wc,HOR-4-Math.random()*38,CCOL[Math.floor(Math.random()*6)],Math.random()*6]);
  /* 3D 궤적은 점 목록(pts)이에요: 깊이(z)는 0→골라인으로 균일하게 가고, 그 순간 공의 화면 위치로부터 가로(x)·높이(h)를 거꾸로 계산해요 */
  const bezF=(f,t)=>{ const n=f.pts.length-1, k=clamp(t,0,1)*n, i=Math.min(n-1,Math.floor(k)), u=k-i, a=f.pts[i], b=f.pts[i+1]; return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u}; };
  const quad=(A,C,B,u)=>({x:(1-u)*(1-u)*A.x+2*(1-u)*u*C.x+u*u*B.x,y:(1-u)*(1-u)*A.y+2*(1-u)*u*C.y+u*u*B.y});
  const build=(raw,noise,power)=>{
    const A=raw[0], B=raw[raw.length-1]; const lo=Math.floor(raw.length*.35), hi=Math.max(lo+1,Math.ceil(raw.length*.65)); let mx=0,my=0,n=0; for(let i=lo;i<hi;i++){ mx+=raw[i].x; my+=raw[i].y; n++; } const M={x:mx/n,y:my/n};
    const dg=Zg-CAMZ, dm=Zg/2-CAMZ;
    let tx=camx+(B.x-Wc/2)*dg/F, th=Math.max(0,CAMY-(B.y-HOR)*dg/F);                // 도착 지점(골문 평면의 가로·높이)
    const Mc={x:(A.x+B.x)/2,y:(A.y+B.y)/2};
    let bend=clamp((M.x-Mc.x)*dm/F*1.25,-3.4,3.4);                                   // 옆으로 휜 정도(m): 길이 오른쪽으로 볼록하면 +
    let apex=clamp(.45+Math.max(0,(Mc.y-M.y))*dm/F*1.35,.45,4.6);                    // 위로 솟은 정도(m): 위로 볼록하게 그리면 벽을 넘는 높은 공
    if(knuckle){ bend=0; apex=clamp(apex*.55,.5,1.4); }
    if(noise){ tx+=noise.x; th=Math.max(0,th+noise.h); }
    const N=28, pts=[]; const ph=Math.random()*6.28, wa=knuckle?(.55+Math.random()*.55):0, fr=2.6+Math.random()*1.6;
    for(let i=0;i<=N;i++){ const u=i/N; let x=bx+(tx-bx)*u+bend*4*u*(1-u), h=th*u+apex*4*u*(1-u);
      if(noise&&knuckle){ const env=Math.sin(Math.PI*u); x+=wa*Math.sin(u*Math.PI*2*fr+ph)*env*(.4+.6*u)+wa*.35*Math.sin(u*Math.PI*2*fr*1.9+ph*2)*env; h+=.18*Math.sin(u*Math.PI*2*(fr+.8)+ph)*env; }
      pts.push({x,y:Math.max(0,Math.min(9,h)),z:Zg*u}); }
    return {t:0,pts,tx:pts[N].x,th:pts[N].y,knuckle};
  };
  const man=(x,z,h,col,tilt)=>{ const f=P(x,0,z), t=P(x,h,z), w=Math.max(2,.42*f.s); g.save(); if(tilt){ g.translate(f.x,f.y); g.rotate(tilt); g.translate(-f.x,-f.y); } g.fillStyle=col; g.fillRect(f.x-w/2,t.y+f.s*.22,w,f.y-t.y-f.s*.22); g.fillStyle="#e8c9a0"; g.beginPath(); g.arc(f.x,t.y+f.s*.12,Math.max(1.6,f.s*.11),0,7); g.fill(); g.restore(); };
  const scene=()=>{
    g.save(); if(shake>0){ g.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); shake*=.88; if(shake<.4) shake=0; }
    const sk=g.createLinearGradient(0,0,0,HOR); sk.addColorStop(0,"#0a1d3a"); sk.addColorStop(1,"#1b3d66"); g.fillStyle=sk; g.fillRect(-10,-10,Wc+20,HOR+12);
    g.fillStyle="#12233d"; g.fillRect(-10,HOR-44,Wc+20,44); crowd.forEach(d=>{ g.fillStyle=d[2]; const j=cheer>0?Math.sin(performance.now()/90+d[3])*2.2:0; g.fillRect(d[0],d[1]+j,3,3); });
    g.fillStyle="#d9d9d9"; g.fillRect(-10,HOR-2,Wc+20,2);
    for(let z=-8,k=0;z<44;z+=4,k++){ const a=P(-40,0,z),b=P(40,0,z),c2=P(40,0,z+4),d2=P(-40,0,z+4); poly([a,b,c2,d2],k%2?"#2c7f45":"#26733d"); }
    g.drawImage(grassTex(Wc,Hc),0,HOR,Wc,Hc-HOR);
    const L1=(x1,z1,x2,z2)=>line(P(x1,0,z1),P(x2,0,z2),"rgba(255,255,255,.8)",1.3);
    L1(-40,Zg,40,Zg); L1(-20.16,Zg-16.5,20.16,Zg-16.5); L1(-20.16,Zg-16.5,-20.16,Zg); L1(20.16,Zg-16.5,20.16,Zg); L1(-9.16,Zg-5.5,9.16,Zg-5.5); L1(-9.16,Zg-5.5,-9.16,Zg); L1(9.16,Zg-5.5,9.16,Zg);
    const gl=-GW/2, gr=GW/2, nz=Zg+1.8; poly([P(gl,0,nz),P(gr,0,nz),P(gr,GH,nz),P(gl,GH,nz)],"rgba(255,255,255,.07)");
    const rp=ripple?Math.max(0,1-(performance.now()-ripple.t)/600):0;
    for(let i=0;i<=14;i++){ const x=gl+GW*i/14; const a=P(x,0,nz),b=P(x,GH,nz); const dz=rp?Math.sin(i*.9+performance.now()/55)*rp*3*Math.exp(-Math.abs(x-ripple.x)/1.2):0; line({x:a.x+dz,y:a.y},{x:b.x+dz,y:b.y},"rgba(255,255,255,.32)",.8); }
    for(let j=0;j<=6;j++){ const y=GH*j/6; line(P(gl,y,nz),P(gr,y,nz),"rgba(255,255,255,.32)",.8); }
    line(P(gl,GH,Zg),P(gl,GH,nz),"rgba(255,255,255,.4)",1); line(P(gr,GH,Zg),P(gr,GH,nz),"rgba(255,255,255,.4)",1);
    man(gkx,Zg-.2,1.88,"#ffcf4a",flight&&flight.t>.55&&!flight.wallHit?(gkTo>gkx?.9:-.9)*Math.min(1,(flight.t-.55)*3):0);
    const gpl=P(gl,0,Zg), gpl2=P(gl,GH,Zg), gpr=P(gr,0,Zg), gpr2=P(gr,GH,Zg); line(gpl,gpl2,"#fff",3.4); line(gpr,gpr2,"#fff",3.4); line(gpl2,gpr2,"#fff",3.4);
    for(let i=0;i<wn;i++){ man(wc+(i-(wn-1)/2)*.58,wz,wallH,"#2d3350"); }
    /* 내가 그리는 길의 3D 미리보기: 점선 = 공이 실제로 날아갈 길, 벽 위로 넘는지 알려 줘요 */
    if(preview&&!flight){ g.setLineDash([3,4]); g.strokeStyle="rgba(255,255,255,.9)"; g.lineWidth=2; g.beginPath(); preview.pts.forEach((q,i)=>{ const pp=P(q.x,q.y,q.z); i?g.lineTo(pp.x,pp.y):g.moveTo(pp.x,pp.y); }); g.stroke(); g.setLineDash([]);
      const tp=P(preview.tx,preview.th,Zg); g.strokeStyle="#ffcf4a"; g.lineWidth=2; g.beginPath(); g.arc(tp.x,tp.y,7,0,7); g.moveTo(tp.x-11,tp.y); g.lineTo(tp.x+11,tp.y); g.moveTo(tp.x,tp.y-11); g.lineTo(tp.x,tp.y+11); g.stroke();
      const wq=bezF(preview,wz/Zg); const hit=Math.abs(wq.x-wc)<(wn*.58)/2+.12&&wq.y<wallH+.04; g.font="700 12px 'Noto Sans KR',sans-serif"; g.textAlign="center"; g.fillStyle=hit?"#ff8a8a":"#8affb0"; g.strokeStyle="rgba(0,0,0,.7)"; g.lineWidth=3; const msg=hit?"벽에 걸려요! 더 높이 올려 그려 보세요":"벽 통과 ✓"; g.strokeText(msg,Wc/2,Hc-12); g.fillText(msg,Wc/2,Hc-12); }
    let bp={x:bx,y:0,z:0}; if(flight){ const tb=Math.min(flight.t,flight.tHit||1); bp=flight.reb?rebPos(flight.reb):bezF(flight,tb); g.strokeStyle="rgba(255,255,255,.35)"; g.lineWidth=2; g.beginPath(); for(let i=0;i<=Math.round(tb*28);i++){ const q2=bezF(flight,i/28),pp=P(q2.x,q2.y,q2.z); i?g.lineTo(pp.x,pp.y):g.moveTo(pp.x,pp.y); } g.stroke(); }
    const bs=P(bp.x,bp.y,bp.z), gnd=P(bp.x,0,bp.z), r=Math.max(2.4,.22*bs.s*.5+1.6);
    g.fillStyle="rgba(0,0,0,.32)"; g.beginPath(); g.ellipse(gnd.x+1,gnd.y+1,r*1.1,r*.45,0,0,7); g.fill();
    g.fillStyle="#fff"; g.beginPath(); g.arc(bs.x,bs.y,r,0,7); g.fill(); g.fillStyle="#222"; g.beginPath(); g.arc(bs.x-r*.2,bs.y-r*.1,r*.38,0,7); g.fill();
    if(!flight){ g.strokeStyle="rgba(255,207,74,.85)"; g.setLineDash([4,4]); g.lineWidth=1.6; g.beginPath(); g.arc(bs.x,bs.y,r+14,0,7); g.stroke(); g.setLineDash([]); }
    if(drawing&&path.length>1){ g.strokeStyle="rgba(255,207,74,.95)"; g.lineWidth=3; g.lineCap="round"; g.lineJoin="round"; g.beginPath(); g.moveTo(path[0].x,path[0].y); path.forEach(p=>g.lineTo(p.x,p.y)); g.stroke(); }
    if(cheer>0){ cheer--; g.font="700 26px 'Black Han Sans',sans-serif"; g.textAlign="center"; g.fillStyle="rgba(255,207,74,.95)"; g.strokeStyle="rgba(0,0,0,.6)"; g.lineWidth=4; g.strokeText("GOAL!",Wc/2,HOR+60); g.fillText("GOAL!",Wc/2,HOR+60); }
    g.restore();
  };
  const ballScr=()=>P(bx,0,0);
  scene();
  const pt=e=>{ const r=c.getBoundingClientRect(); const t=e.touches&&e.touches[0]?e.touches[0]:(e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e); return {x:(t.clientX-r.left)*Wc/r.width,y:(t.clientY-r.top)*Hc/r.height}; };
  const refresh=()=>{ if(path.length>3){ const L0=Math.hypot(path[path.length-1].x-path[0].x,path[path.length-1].y-path[0].y); preview=L0>30?build(path,null,1):null; } else preview=null; };
  const start=e=>{ if(over||flight) return; e.preventDefault(); const p=pt(e), b=ballScr(); if(Math.hypot(p.x-b.x,p.y-b.y)>56){ if(txt) txt.textContent="공 가까이를 눌러서, 공이 날아갈 길을 손가락으로 그려요"; return; } drawing=true; path=[{x:b.x,y:b.y},p]; scene(); };
  const move=e=>{ if(!drawing) return; e.preventDefault(); path.push(pt(e)); refresh(); scene(); };
  const retry=m=>{ path=[]; preview=null; drawing=false; scene(); if(txt) txt.textContent=m; };
  const end=e=>{
    if(!drawing) return; drawing=false; if(e&&e.preventDefault) e.preventDefault();
    const A=path[0], B0=path[path.length-1]; let len=0; for(let i=1;i<path.length;i++) len+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
    if(len<50||B0.y>A.y-24) return retry("공에서 골문 쪽(위)으로 조금 더 길게 그려 보세요");
    const power=clamp(len/170,.45,1.25);
    const sigma=clamp(.17+Math.max(0,power-.95)*.5-(shoot-60)*.004+(knuckle?.22:0),.1,1.0);
    flight=build(path,{x:gauss()*sigma,h:gauss()*sigma*.6},power); preview=null;
    const tx=flight.tx, th=flight.th, tw=wz/Zg, wp=bezF(flight,tw);
    let res, ok=false, gkReach=gkx, kind=null;
    if(Math.abs(wp.x-wc)<(wn*.58)/2+.12&&wp.y<wallH+.04){ res="벽에 맞고 튕겨 나왔어요!"; kind="wall"; flight.tHit=tw; flight.wallHit=true; }
    else if(th>GH+.1) res="크로스바를 넘어갔어요!";
    else if(Math.abs(tx)>GW/2+.08) res="골문 옆으로 빗나갔어요!";
    else if(Math.abs(Math.abs(tx)-GW/2)<.1||Math.abs(th-GH)<.08){ res="골대를 때리고 튕겨 나왔어요!"; kind="post"; flight.tHit=1; }
    else {
      const read=Math.random()<.5+(S.club&&S.club.l?clamp((S.club.l-70)/120,-.1,.2):0)-(knuckle?.18:0);
      gkReach=read?clamp(tx,-3.4,3.4):(Math.random()-.5)*5; const R=gkR*(1-.32*th/GH)*(power>1.05?.85:1);
      const corner=Math.abs(tx)>2.6&&th>1.7; const pSave=Math.abs(tx-gkReach)<R?(corner?.45:.88):(Math.abs(tx-gkReach)<R*1.3?.25:.03);
      ok=Math.random()>pSave; res=ok?"골~~~인! 환상적인 프리킥!":"골키퍼가 몸을 날려 막아냈어요! 공이 튕겨 나가요."; if(!ok){ kind="save"; flight.tHit=1; }
    }
    gkTo=gkReach; const t0=performance.now(), dur=clamp(1250-power*420,620,1100), gk0=gkx;
    const rv=(k)=>{ const p=bezF(flight,flight.tHit||1); if(k==="wall") return reb(p.x,p.y,p.z,(Math.random()-.5)*8,1.5+Math.random()*2.5,-(3+Math.random()*3)); if(k==="save") return reb(p.x,p.y,p.z,(tx>=gkTo?1:-1)*(2+Math.random()*3),1.5+Math.random()*3,-(3.5+Math.random()*3)); return reb(p.x,p.y,p.z,(Math.random()<.5?-1:1)*(2+Math.random()*2),2+Math.random()*2,-(2+Math.random()*3)); };
    const step=()=>{ const el=performance.now()-t0; flight.t=clamp(el/dur,0,1); gkx=gk0+(gkTo-gk0)*clamp((flight.t-.12)*1.5,0,1)*(kind==="wall"?.15:1); if(kind&&!flight.reb&&flight.t>=(flight.tHit||1)){ flight.reb=rv(kind); shake=5; } if(flight.t>=1&&ok&&!ripple){ ripple={t:performance.now(),x:tx}; shake=7; cheer=60; } scene(); const wait=kind?1000:(ok?700:0); if(el<dur+wait) setTimeout(step,16); else finish(ok,res); };
    setTimeout(step,16);
  };
  c.addEventListener("mousedown",start); c.addEventListener("mousemove",move); window.addEventListener("mouseup",end);
  c.addEventListener("touchstart",start,{passive:false}); c.addEventListener("touchmove",move,{passive:false}); c.addEventListener("touchend",end,{passive:false});
};
})();
