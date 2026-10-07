/* 미니게임 2: 코너킥 직접 차기(cn) · 골키퍼 페널티 선방(gk). 내 도트 선수가 직접 나와요. (mini.js 다음에 불러와요)
 * 규칙·시간은 L.GKS 에 모아 두고 tools/tests/minigame.cjs 가 사람이 누를 수 있는 창(0.8초 이상)인지 검사해요. */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L._mini||!L.gfx) return;
const G=L.gfx;
const {drawPix,kickPose,grassTex}=L._mini;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const CCOL=["#c0392b","#f2b84b","#ecf0f1","#2e86c1","#27ae60","#8e44ad"];
const drawBall=(g,x,y,r,spin)=>{ g.fillStyle="rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(x,y+r*.9,r*1.1,r*.4,0,0,7); g.fill(); G.ball(g,x,y,r,spin||0); };
const bandsFrom=(g,W,H,top,col1,col2)=>{ let y=top, h=7, k=0; while(y<H){ g.fillStyle=k%2?col1:col2; g.fillRect(0,y,W,h+1); y+=h; h*=1.16; k++; } g.globalAlpha=.9; g.drawImage(grassTex(W,H),0,top,W,H-top); g.globalAlpha=1; };

/* 골키퍼 페널티 선방 규칙: 시간(ms)·확률을 한 곳에 */
const GKS={ready:700, run:1100, early:600, grace:260, fly:380};
GKS.contact=GKS.ready+GKS.run;                       // 공을 차는 순간
GKS.window=GKS.early+GKS.grace;                      // 늦지도 이르지도 않게 누를 수 있는 시간(ms) — 800 이상이어야 해요
L.GKS=GKS;
/* 막을 확률: 방향을 맞췄을 때 / 가운데로 뛰었는데 가운데 슛 / 그 외 */
L.gkSaveChance=function(q,kind){ return kind==="same"?clamp(.5+q*.3,.45,.85):kind==="mid"?clamp(.72+q*.2,.6,.92):kind==="late"?clamp(.18+q*.2,.1,.4):clamp(.03+q*.06,.02,.12); };

const oh=L.miniHtml, ob=L.miniBind;
L.miniHtml=function(type){
  if(type==="cn") return `<div class="mini" data-novirt><p class="muted c" id="mtxt">코너킥! 공을 보낼 곳을 먼저 골라요</p>
    <canvas id="cnc" width="360" height="250" class="fkc"></canvas>
    <div class="fkctl" id="cnz"><button type="button" data-z="0">가까운 포스트</button><button type="button" data-z="1">문전 한가운데</button><button type="button" data-z="2">먼 포스트</button></div>
    <div class="pkpow" hidden><div class="ptrack"><i class="pzone"></i><i class="pmark"></i></div><button type="button" class="big" id="cnkick"><span>킥!</span><b>⚡</b></button><p class="muted c">표시가 가운데 칸에 있을 때 눌러요. 정확할수록 동료 머리에 정확히 떨어져요</p></div></div>`;
  if(type==="gk") return `<div class="mini" data-novirt><p class="muted c" id="mtxt">상대 키커가 공을 놓아요… 달려오는 방향을 잘 봐요</p>
    <canvas id="gkc" width="360" height="250" class="fkc"></canvas>
    <div class="fkctl gkbtns"><button type="button" data-d="-1">◀ 왼쪽</button><button type="button" data-d="0">▲ 가운데</button><button type="button" data-d="1">오른쪽 ▶</button></div>
    <p class="muted c">키커가 달려오는 걸 보고 몸을 던질 쪽을 눌러요. 너무 일찍 던지면 키커가 반대쪽으로 차요!</p></div>`;
  return oh(type);
};

/* ===== 코너킥 직접 차기 =====
 * 가노 플래그 뒤에서 본 장면: 내 선수는 가노 아크 옆에서 공을 놓고 차요. 골라인이 멀리 뻗고, 페널티 박스 안에 동료·수비수가 모여 있어요.
 * 월드 좌표: u = 골라인을 따라 가노에서 골대 쪽으로(m), v = 골라인에서 필드 안쪽으로(m). 골대 가운데는 (34, 0). */
function cnGame(root,S,finish){
  const c=root.querySelector("#cnc"), g=c.getContext("2d"), W=c.width, H=c.height; G.hires(c,g);
  const st=(S.p&&S.p.stats)||{}, pas=st.passing||60, txt=root.querySelector("#mtxt");
  const pow=root.querySelector(".pkpow"), mark=root.querySelector(".pmark"), kickBtn=root.querySelector("#cnkick"), zb=[...root.querySelectorAll("#cnz button")];
  const cam={u:-11,v:-3.2,yaw:.36,F:430,HOR:76,CY:3.3,XC:W*.40}; const cs=Math.cos(cam.yaw), sn=Math.sin(cam.yaw);
  const PJ=(u,v,h)=>{ const dx=u-cam.u, dy=v-cam.v, d=Math.max(.5,dx*cs+dy*sn), lat=dx*sn-dy*cs; return {x:cam.XC+cam.F*lat/d,y:cam.HOR+cam.F*(cam.CY-(h||0))/d,s:cam.F/d,d}; };
  const ZS=[{u:27.5,v:3.4,base:.30,d:2,name:"가까운 포스트"},{u:34,v:8.4,base:.40,d:2,name:"문전 한가운데"},{u:41.5,v:4.6,base:.32,d:1,name:"먼 포스트"}];
  const kimg=L.pixelCanvasImg(S,{back:true,field:true}), gkI=L.pixelCanvasImg(S,{name:"상대키퍼",kit:"#e2b23a",gk:true});
  const mate=ZS.map((z,i)=>L.pixelCanvasImg(S,{name:"동료"+i,kit:"#2f6fd6"})), defI=ZS.map((z,i)=>L.pixelCanvasImg(S,{name:"수비"+i,kit:"#c0392b"}));
  const extraA=L.pixelCanvasImg(S,{name:"동료x",kit:"#2f6fd6"}), extraD=[0,1,2].map(i=>L.pixelCanvasImg(S,{name:"수비x"+i,kit:"#c0392b"}));
  const crowd=G.crowd(W,cam.HOR);
  const PM=2.15;                                                    // 먼 선수는 도트라서 조금 크게 그려요
  let sel=-1, anim=null, kick=null, flight=null, out=null, cheer=0, dead=false, locked=false, net=0;
  const K0={u:.85,v:.85}, KS={u:-2.6,v:-.6};                         // 공 자리 / 킥커 출발 자리
  const poly=(pts,fill,stroke,lw)=>{ g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.closePath(); if(fill){ g.fillStyle=fill; g.fill(); } if(stroke){ g.strokeStyle=stroke; g.lineWidth=lw||1; g.stroke(); } };
  const ln=(u1,v1,u2,v2,col,lw,h)=>{ const a=PJ(u1,v1,h||0), b=PJ(u2,v2,h||0); g.strokeStyle=col||"rgba(255,255,255,.88)"; g.lineWidth=lw||1.4; g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); };
  const arc=(cu,cv,r,a0,a1,col,lw,vmin)=>{ g.strokeStyle=col||"rgba(255,255,255,.88)"; g.lineWidth=lw||1.4; g.beginPath(); let on=false; for(let i=0;i<=24;i++){ const a=a0+(a1-a0)*i/24, u=cu+Math.cos(a)*r, v=cv+Math.sin(a)*r; if(vmin!=null&&v<vmin){ on=false; continue; } const p=PJ(u,v,0); if(!on){ g.moveTo(p.x,p.y); on=true; } else g.lineTo(p.x,p.y); } g.stroke(); };
  const manAt=(img,u,v,hm,yoff,tilt)=>{ const f=PJ(u,v,yoff||0), hh=Math.max(8,f.s*hm*PM); g.save(); g.translate(f.x,f.y); if(tilt) g.rotate(tilt); drawPix(g,img,0,0,hh,{}); g.restore(); };
  const wpos=()=>{ if(!flight) return null; const u=clamp((performance.now()-flight.t0)/flight.dur,0,1); return {u:K0.u+(flight.tu-K0.u)*u,v:K0.v+(flight.tv-K0.v)*u,h:flight.th*u+flight.lift*4*u*(1-u),k:u}; };
  const scene=()=>{
    const now=performance.now(), HOR=cam.HOR;
    G.stands(g,W,HOR,crowd,cheer>0);
    g.save(); g.beginPath(); g.rect(-5,HOR,W+10,2000); g.clip();
    g.fillStyle="#17502f"; g.fillRect(0,HOR,W,H-HOR);
    /* 잔디 줄무늬: 골라인과 나란히 */
    for(let k=-3;k<9;k++){ const v0=k*5.5, v1=v0+5.5; poly([PJ(-40,v0,0),PJ(110,v0,0),PJ(110,v1,0),PJ(-40,v1,0)],(k&1)?"#2c7f45":"#256f3b"); }
    g.globalAlpha=.55; g.drawImage(grassTex(W,H),0,HOR,W,H-HOR); g.globalAlpha=1; G.sheen(g,W,H,HOR);
    /* 경기장 밖 광고판(골라인 뒤·터치라인 쪽) */
    { const bl=(u1,v1,u2,v2)=>{ const n=14; for(let i=0;i<n;i++){ const a=i/n,b=(i+1)/n; const p1=PJ(u1+(u2-u1)*a,v1+(v2-v1)*a,0), p2=PJ(u1+(u2-u1)*b,v1+(v2-v1)*b,0), p3=PJ(u1+(u2-u1)*b,v1+(v2-v1)*b,1.1), p4=PJ(u1+(u2-u1)*a,v1+(v2-v1)*a,1.1); const col=["#e0b13a","#2f6fd6","#c0392b","#1a9a5a","#f4f4f4","#8e44ad"][i%6]; poly([p1,p2,p3,p4],"#0a0f1c"); const q=(f)=>({x:p1.x+(p2.x-p1.x)*f,y:p1.y+(p2.y-p1.y)*f}); poly([p1,p2,{x:p2.x,y:p2.y-(p2.y-p3.y)*.8},{x:p1.x,y:p1.y-(p1.y-p4.y)*.8}],col); } };
      bl(6,-2.6,70,-2.6); bl(-2.6,12,-2.6,50); }
    /* 라인 */
    ln(0,0,68,0); ln(0,0,0,50); ln(13.84,0,13.84,16.5); ln(54.16,0,54.16,16.5); ln(13.84,16.5,54.16,16.5);
    ln(24.84,0,24.84,5.5); ln(43.16,0,43.16,5.5); ln(24.84,5.5,43.16,5.5);
    arc(34,11,9.15,.93,2.21,null,1.4,16.5); { const sp=PJ(34,11,0); g.fillStyle="rgba(255,255,255,.9)"; g.beginPath(); g.ellipse(sp.x,sp.y,2.4,1.1,0,0,7); g.fill(); }
    arc(0,0,1,0,Math.PI/2,"#fff",1.8);
    /* 골대 */
    { const gl=30.34, gr=37.66, gh=2.44, nd=-2.0; const A=PJ(gl,0,0),B=PJ(gl,0,gh),C=PJ(gr,0,gh),D=PJ(gr,0,0), A2=PJ(gl,nd,0),B2=PJ(gl,nd,gh*.85),C2=PJ(gr,nd,gh*.85),D2=PJ(gr,nd,0);
      g.strokeStyle="rgba(255,255,255,.3)"; g.lineWidth=.7; for(let i=0;i<=8;i++){ const f=i/8; const t1=PJ(gl+(gr-gl)*f,0,gh), t2=PJ(gl+(gr-gl)*f,nd,gh*.85), t3=PJ(gl+(gr-gl)*f,nd,0); g.beginPath(); g.moveTo(t1.x,t1.y); g.lineTo(t2.x,t2.y); g.lineTo(t3.x,t3.y); g.stroke(); }
      for(let j=1;j<5;j++){ const f=j/5, a=PJ(gl,nd,gh*.85*f), b=PJ(gr,nd,gh*.85*f); g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke(); }
      G.post(g,B2,B,2.4); G.post(g,C2,C,2.4); G.post(g,A,B,3.2); G.post(g,D,C,3.2); G.post(g,B,C,3.2); }
    if(net>0){ const a=PJ(30.34,0,2.44), b=PJ(37.66,0,0); g.fillStyle="rgba(255,255,255,"+(net/40*.3)+")"; g.fillRect(Math.min(a.x,b.x),a.y,Math.abs(b.x-a.x),b.y-a.y); net--; }
    /* 선수(먼 곳부터) */
    const jump=out&&out.reached?clamp((now-out.t0-out.arrive)/340,0,1):0;
    const act=[]; const gkx=out&&out.gk||0;
    act.push({d:PJ(34+gkx,.9,0).d,fn:()=>manAt(gkI,34+gkx,.9,1.88,0,out&&out.gkTilt||0)});
    ZS.forEach((z,i)=>{ act.push({d:PJ(z.u+1.1,z.v+.3,0).d,fn:()=>manAt(defI[i],z.u+1.1,z.v+.3,1.82)}); if(z.d>1) act.push({d:PJ(z.u-1.2,z.v-.7,0).d,fn:()=>manAt(extraD[i],z.u-1.2,z.v-.7,1.8)}); const up=(out&&out.zi===i&&out.reached)?Math.sin(jump*Math.PI)*.8:0; act.push({d:PJ(z.u,z.v,0).d,fn:()=>manAt(mate[i],z.u,z.v,1.84,up)}); });
    act.push({d:PJ(21,9,0).d,fn:()=>manAt(extraA,21,9,1.82)}); act.push({d:PJ(46,10.5,0).d,fn:()=>manAt(extraD[1],46,10.5,1.8)});
    act.sort((a,b)=>b.d-a.d); act.forEach(a=>a.fn());
    /* 고른 지점 표시(바닥에 놓인 원) */
    ZS.forEach((z,i)=>{ const on=i===sel; g.strokeStyle=on?"#ffcf4a":"rgba(255,255,255,.55)"; g.lineWidth=on?2.6:1.4; g.setLineDash(on?[]:[3,3]); const pu=on?1+Math.sin(now/130)*.1:1; g.beginPath(); for(let k=0;k<=24;k++){ const a=k/24*Math.PI*2, p=PJ(z.u+Math.cos(a)*1.9*pu,z.v+Math.sin(a)*1.9*pu,0); k?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y); } g.stroke(); g.setLineDash([]);
      const lp=PJ(z.u,z.v-2.4,0); g.fillStyle=on?"#ffcf4a":"rgba(255,255,255,.8)"; g.font="700 11px 'Noto Sans KR',sans-serif"; g.textAlign="center"; g.fillText(i+1,lp.x,lp.y+4); });
    g.restore();
    /* 가노 플래그 */
    { const fb=PJ(0,0,0), ft=PJ(0,0,1.6), wv=Math.sin(now/200)*2; g.strokeStyle="#f4f4f4"; g.lineWidth=2; g.beginPath(); g.moveTo(fb.x,fb.y); g.lineTo(ft.x,ft.y); g.stroke(); g.fillStyle="#ffcf4a"; g.beginPath(); g.moveTo(ft.x,ft.y); g.lineTo(ft.x+11+wv,ft.y+3); g.lineTo(ft.x,ft.y+8); g.fill(); }
    /* 공 */
    let bp, br;
    const w=wpos(); const kk=kick?now-kick.t0:-1;
    if(w){ const q=PJ(w.u,w.v,w.h); bp=q; br=Math.max(2.2,q.s*.2);
      g.strokeStyle="rgba(255,255,255,.3)"; g.lineWidth=1.6; g.beginPath(); for(let i=0;i<=Math.round(w.k*22);i++){ const f=i/22; const hh=flight.th*f+flight.lift*4*f*(1-f); const p=PJ(K0.u+(flight.tu-K0.u)*f,K0.v+(flight.tv-K0.v)*f,hh); i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y); } g.stroke(); }
    else if(out&&out.after){ const a=out.after, v=clamp((now-out.t0-out.arrive)/a.dur,0,1); const q=PJ(flight.tu+(a.u-flight.tu)*v,flight.tv+(a.v-flight.tv)*v,flight.th+(a.h-flight.th)*v+(a.lift||0)*4*v*(1-v)); bp=q; br=Math.max(2.2,q.s*.2); }
    else { bp=PJ(K0.u,K0.v,0); br=Math.max(3,bp.s*.2); }
    drawBall(g,bp.x,bp.y-br*.6,br,(w||out&&out.after)?now/60:0);
    /* 내 도트 선수: 출발 자리에서 달려와 가노 아크 옆에서 찬다 */
    { const kp=kickPose(kick,0,1); const e=kp.ox; const ku=KS.u+(K0.u-.75-KS.u)*e, kv=KS.v+(K0.v-.65-KS.v)*e; const f=PJ(ku,kv,0); drawPix(g,kimg,f.x,f.y,f.s*1.82,kp); }
    G.vig(g,W,H); if(cheer>0){ cheer--; G.goalText(g,W,H,cheer); }
  };
  const loop=()=>{ if(dead||!root.isConnected) return; scene(); setTimeout(loop,16); }; loop();
  const pick=i=>{ if(locked||kick) return; sel=i; zb.forEach((b,j)=>b.classList.toggle("on",j===i)); pow.hidden=false; if(anim) anim.stop(); anim=L.animMark(mark,1100); if(txt) txt.textContent=ZS[i].name+"! 표시가 가운데 칸일 때 '킥!'"; };
  zb.forEach(b=>b.addEventListener("click",()=>pick(+b.dataset.z)));
  c.addEventListener("click",e=>{ const r=c.getBoundingClientRect(), x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height; let bi=-1,bd=48; ZS.forEach((z,i)=>{ const p=PJ(z.u,z.v,.9), d=Math.hypot(x-p.x,y-p.y); if(d<bd){ bd=d; bi=i; } }); if(bi>=0) pick(bi); });
  kickBtn.addEventListener("click",()=>{
    if(locked||sel<0||!anim) return; locked=true; const pos=anim.pos(); anim.stop(); anim=null; pow.hidden=true; zb.forEach(b=>b.disabled=true);
    const acc=clamp(1-Math.abs(pos-.5)*2.4,0,1), z=ZS[sel];
    const sigma=1.1+(1-acc)*5.6-(pas-60)*.025; const du=gauss()*sigma, dv=gauss()*sigma*.7;
    const tu=z.u+du, tv=z.v+dv, th=1.95;
    kick={t0:performance.now()};
    const reach=Math.hypot(du,dv*1.3)<2.7, goalP=clamp(z.base+acc*.14+(pas-60)*.002-(z.d-1)*.05,.12,.75);
    const goal=reach&&Math.random()<goalP;
    let msg, after, gk=0, gkTilt=0, arrive=1250;
    if(!reach){ const longB=du>0||tv<0; msg=longB?"크로스가 너무 길어서 모두의 머리 위로 넘어갔어요.":"공이 수비수 머리에 먼저 닿아 걷어내졌어요."; after=longB?{u:tu+9,v:tv-4,h:1,lift:5,dur:520}:{u:tu-8,v:tv+11,h:.4,lift:4,dur:520}; }
    else if(goal){ msg="동료의 머리에 정확히 맞았어요! 헤더가 골망을 흔들었어요! 도움!"; after={u:34+(Math.random()-.5)*5,v:-1.2,h:.9,lift:0,dur:380}; gk=(Math.random()<.5?-1:1)*1.6; gkTilt=gk>0?.5:-.5; }
    else { const bar=Math.random()<.5; msg=bar?"동료의 헤더가 크로스바 위로 넘어갔어요.":"동료의 헤더를 골키퍼가 쳐냈어요."; after=bar?{u:34+(Math.random()-.5)*6,v:-2.5,h:4.6,lift:0,dur:430}:{u:Math.random()<.5?24:44,v:6,h:.8,lift:3,dur:430}; gk=bar?0:(after.u<34?-1.8:1.8); gkTilt=gk>0?.6:gk<0?-.6:0; }
    flight={t0:performance.now()+L.KICK_RUN,tu,tv,th,lift:5.2,dur:1250}; out={t0:performance.now()+L.KICK_RUN,arrive:1250,reached:reach,zi:sel,after,gk:0,gkTilt:0};
    if(txt) txt.textContent="코너킥이 올라가요!";
    setTimeout(()=>{ if(dead) return; out.gk=gk; out.gkTilt=gkTilt; if(goal){ cheer=60; net=40; } if(txt) txt.textContent=msg; },L.KICK_RUN+1250+120);
    setTimeout(()=>{ if(!dead) finish(goal,msg); },L.KICK_RUN+1250+120+950);
  });
  return {destroy(){ dead=true; }};
}


/* ===== 골키퍼 페널티 선방 ===== */
function gkGame(root,S,finish){
  const c=root.querySelector("#gkc"), g=c.getContext("2d"), W=c.width, H=c.height, HOR=70; G.hires(c,g);
  const st=(S.p&&S.p.stats)||{}; const q=clamp((((st.saving||60)+(st.reflex||60))/2-60)/40,-.5,.5);   // 선방·순발력(60 기준)
  const btns=[...root.querySelectorAll(".gkbtns button")], txt=root.querySelector("#mtxt");
  const me=L.pixelCanvasImg(S,{back:true}), kk=L.pixelCanvasImg(S,{name:"키커"+Math.floor(Math.random()*9),kit:"#d63a3a",back:false});
  const crowd=G.crowd(W,HOR);
  const side0=Math.random()<.5?-1:1;                       // 키커가 달려오는 쪽(힌트)
  const T0=performance.now(); let dive=null, shot=null, res=null, dead=false, cheer=0;
  const KX=(t)=>{ const u=clamp((t-GKS.ready)/GKS.run,0,1), e=u*u*(3-2*u); return 180+side0*46*(1-e); };
  const KY=(t)=>{ const u=clamp((t-GKS.ready)/GKS.run,0,1); return 108+14*u; };
  const decide=()=>{            // 공을 차는 순간 키커가 고른 방향(막는 쪽을 보고 바꾸기도 해요)
    let d; const r=Math.random();
    if(dive&&dive.t<GKS.contact-GKS.early){ d=r<.5?-dive.d:r<.75?0:dive.d; if(dive.d===0) d=r<.5?side0:r<.8?-side0:0; }      // 너무 일찍 뛰면 읽혀요
    else d=r<.5?side0:r<.8?-side0:0;
    const m=Math.random(); shot={d,out:m<.08?"wide":m<.14?"post":"on"};
  };
  const judge=()=>{
    let kind, p, saved=false, msg;
    if(shot.out==="wide"){ msg="키커가 골대 밖으로 날렸어요! 행운이에요."; saved=true; }
    else if(shot.out==="post"){ msg="공이 골대를 맞고 튕겨 나왔어요!"; saved=true; }
    else { const late=!dive||dive.t>GKS.contact+GKS.grace; const dd=late?null:dive.d;
      if(late){ kind="late"; p=shot.d===0?.55:L.gkSaveChance(q,"late"); }
      else if(dd===shot.d){ kind=dd===0?"mid":"same"; p=L.gkSaveChance(q,kind); }
      else { kind="miss"; p=L.gkSaveChance(q,"miss"); }
      saved=Math.random()<p; msg=saved?(shot.d===dd?"방향을 읽었어요! 정확히 막아냈어요!":"손끝으로 겨우 걷어냈어요!"):(late?"몸을 던지기엔 너무 늦었어요.":"반대쪽으로 들어갔어요. 키커가 한 수 위였어요."); }
    res={saved,msg,at:performance.now()};
    if(txt) txt.textContent=msg; if(saved) cheer=50;
    setTimeout(()=>{ if(!dead) finish(saved,msg); },1300);
  };
  const press=d=>{ if(dive||res) return; const t=performance.now()-T0; dive={d,t}; btns.forEach(b=>{ b.disabled=true; b.classList.toggle("on",+b.dataset.d===d); }); if(txt&&!shot) txt.textContent="몸을 던졌어요! 공은…"; };
  btns.forEach(b=>b.addEventListener("click",()=>press(+b.dataset.d)));
  const scene=()=>{
    const t=performance.now()-T0;
    if(!shot&&t>=GKS.contact) decide();
    if(!dive&&t>GKS.contact+GKS.grace&&!res){ if(!shot) decide(); }
    if(shot&&!res&&t>=GKS.contact+GKS.fly) judge();
    G.stands(g,W,HOR,crowd,cheer>0);
    bandsFrom(g,W,H,HOR,"#1f6a43","#1a5c3a"); G.sheen(g,W,H,HOR);
    g.strokeStyle="rgba(255,255,255,.7)"; g.lineWidth=1.4; g.beginPath(); g.moveTo(60,H-6); g.lineTo(100,152); g.lineTo(260,152); g.lineTo(300,H-6); g.stroke();
    g.fillStyle="rgba(255,255,255,.85)"; g.beginPath(); g.ellipse(180,128,3,1.3,0,0,7); g.fill();
    /* 키커(정면)와 공 */
    const kx=KX(t), ky=KY(t), moving=t>GKS.ready&&t<GKS.contact; const kp=t<GKS.contact-120?0:clamp((t-(GKS.contact-120))/320,0,1);
    drawPix(g,kk,kx,ky+14,50,{run:moving?t/90:0,kick:0});
    let bx=180, by=128, br=3.6;
    if(shot){ const u=clamp((t-GKS.contact)/GKS.fly,0,1); const tx=180+shot.d*118, ty=shot.out==="wide"?196:196; bx=180+(tx-180)*u*(shot.out==="wide"?1.4:1); by=128+(ty-128)*u*u; br=3.6+7*u; if(shot.out==="post"){ by=128+(150-128)*u; } }
    /* 골대 틀(내 쪽에서 본 모습) */
    g.strokeStyle="#fff"; g.lineWidth=5; g.lineCap="round"; g.beginPath(); g.moveTo(18,H-2); g.lineTo(18,92); g.lineTo(W-18,92); g.lineTo(W-18,H-2); g.stroke();
    g.strokeStyle="rgba(255,255,255,.18)"; g.lineWidth=.8; for(let i=1;i<10;i++){ g.beginPath(); g.moveTo(18+i*32.4,92); g.lineTo(18+i*32.4,H); g.stroke(); } for(let j=1;j<5;j++){ g.beginPath(); g.moveTo(18,92+j*32); g.lineTo(W-18,92+j*32); g.stroke(); }
    /* 공이 키퍼 쪽으로 오는 동안 */
    if(!res||!res.saved) drawBall(g,bx,by,br); else if(res){ const v=clamp((performance.now()-res.at)/500,0,1); const sx=180+(shot?shot.d:0)*60+(dive?dive.d:0)*40; drawBall(g,bx+(shot&&shot.out==="post"?0:(Math.sign(shot?shot.d||1:1))*60*v),by-50*4*v*(1-v)-10*v,br); }
    else drawBall(g,bx,by,br,shot?performance.now()/60:0);
    /* 내 골키퍼(뒷모습): 몸을 던지면 눕듯이 기울어요 */
    let gx=180, rot=0, lift=0; if(dive){ const u=clamp((performance.now()-T0-dive.t)/330,0,1), e=1-(1-u)*(1-u); gx=180+dive.d*86*e; rot=dive.d*1.15*e; lift=dive.d===0?-34*Math.sin(Math.PI*clamp(u,0,1)):-18*Math.sin(Math.PI*u*.8); }
    g.save(); g.translate(gx,H-6+lift*.4); g.rotate(rot); drawPix(g,me,0,0,112,{}); g.restore();
    G.vig(g,W,H); if(cheer>0){ cheer--; G.goalText(g,W,H,cheer,"SAVE!"); }
  };
  const loop=()=>{ if(dead||!root.isConnected) return; scene(); if(!res||performance.now()-res.at<1600) setTimeout(loop,16); }; loop();
  setTimeout(()=>{ if(!dead&&!dive&&txt) txt.textContent="키커가 달려와요! 어느 쪽으로 찰까요?"; },GKS.ready);
  return {destroy(){ dead=true; }};
}

L.miniBind=function(root,type,S,done){
  if(type!=="cn"&&type!=="gk") return ob(root,type,S,done);
  const txt=root.querySelector("#mtxt"); let over=false;
  const finish=(ok,msg)=>{ if(over) return; over=true; if(txt) txt.innerHTML='<b style="color:'+(ok?"var(--gold,#ffcf4a)":"#ff8a8a")+'">'+msg+'</b>'; setTimeout(()=>done(ok,msg),1100); };
  if(type==="cn") cnGame(root,S,finish); else gkGame(root,S,finish);
};
})();
