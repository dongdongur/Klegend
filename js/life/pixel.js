/* 도트 선수 (js/life/pixel.js) — 우리가 직접 그린 16×24 도트 캐릭터
 * 체격에 따라 몸 모양도 달라져요: 단단한 선수는 몸통·다리가 굵고, 마른 선수는 가늘고, 키가 크면 한 칸 더 크고 작으면 한 칸 작아요.
 * 나이에 따라 모습이 변해요: 유소년(작은 체격) → 대학(젊은 얼굴) → 프로 → 30대 중반 구레나룻이 희끗 → 30대 후반 흰머리 → 40대 주름·수염.
 * 소속 구단 색으로 유니폼을 입고, 다치면 목발, 입대하면 짧은 머리, 은퇴하면 정장에 꽃다발. 얼굴(머리 모양·피부·머리색)은 선수 이름으로 정해져서 커리어마다 달라요. */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const hash=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
const SKIN=["#f3cfae","#e8b88f","#c98f66"], HAIR=["#1d1712","#3a2618","#5a3b22","#14110f"];
const PAL=["#2f6fd6","#d63a3a","#2c9a5a","#f2b84b","#8e44ad","#1f9aa8","#e2681a","#c0392b","#274f9a","#14305a"];
function hexToRgb(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function shade(hex,k){ const c=hexToRgb(hex).map(v=>Math.max(0,Math.min(255,Math.round(v*k)))); return "rgb("+c.join(",")+")"; }
const cache={};
/* o: {꾸미기 hs(머리 모양 0~9)·hc(머리색)·band·gl·cap·pat 도 받아요(js/life/cosmetics.js), name, age, kit:"#hex", injured, military, suit, pos, bodyMass, bodyTall} → data URL  (bodyMass: 근육량 단계(+단단/−마름), bodyTall: 키 단계) */
L.pixelSprite=function(o){
  const heavy=(o.bodyMass||0)>=1.2, lean=(o.bodyMass||0)<=-1.2, tallB=(o.bodyTall||0)>=1.3?1:(o.bodyTall||0)<=-1.3?-1:0;
  const key=[o.name,o.age,o.kit,o.injured?1:0,o.military?1:0,o.suit?1:0,o.gk?1:0,heavy?"H":lean?"T":"M",tallB,o.hs==null?"":o.hs,o.hc||"",o.band||"",o.gl||"",o.cap||"",o.pat||"",o.back?"B":""].join("|"); if(cache[key]) return cache[key];
  const h=hash(o.name||"x"), skin=SKIN[h%3], hairStyle=o.hs!=null?o.hs:(h>>>3)%4, hair0=o.hc||HAIR[(h>>>5)%4], dyed=!!o.hc, boy=o.age<=15, teen=o.age<=18, uni=o.age>=19&&o.age<=22, old1=o.age>=34, old2=o.age>=38, old3=o.age>=41;
  const hair=(old2&&!dyed)?"#e9e9ec":hair0, gray="#b9bcc4", kit=o.kit||PAL[h%PAL.length], kitD=shade(kit,.7), kitL=shade(kit,1.25);
  const c=document.createElement("canvas"); c.width=16; c.height=24; const g=c.getContext("2d");
  const px=(x,y,w,hh,col)=>{ g.fillStyle=col; g.fillRect(x,y,w||1,hh||1); };
  const dT=tallB>0?-1:tallB<0?1:0;                   // 키가 크면 한 칸 위로, 작으면 한 칸 아래로
  const top=Math.max(0,(boy?5:teen?3:1)+dT);            // 어릴수록 키가 작아서 머리가 아래에서 시작해요
  const bx=heavy?3:lean?5:4, bw=heavy?10:lean?6:8, legW=heavy?4:lean?2:3, l1=heavy?4:lean?6:5, l2=heavy?8:lean?8:8;   // 몸통 왼쪽 끝·너비, 다리 굵기·위치
  /* 그림자 */ px(3,23,10,1,"rgba(0,0,0,.22)");
  /* 다리·양말·축구화 */
  const legTop=(boy?17:15)+dT;
  if(o.suit){ px(l1,legTop,legW,6,"#1c2233"); px(l2,legTop,legW,6,"#1c2233"); }
  else { px(l1,legTop,legW,1,kitD); px(l2,legTop,legW,1,kitD); px(l1,legTop+1,legW,2+(tallB>0?1:0),skin); px(l2,legTop+1,legW,2+(tallB>0?1:0),skin); px(l1,legTop+3+(tallB>0?1:0),legW,2,kit); px(l2,legTop+3+(tallB>0?1:0),legW,2,kit); }
  px(l1,22,legW,1,"#15151b"); px(l2,22,legW,1,"#15151b"); px(l1-1,22,1,1,"#15151b"); px(l2+legW,22,1,1,"#15151b");
  if(o.injured){ px(l2,legTop+3,legW,2,"#f4f4f4"); px(l2+1,legTop+1,legW-1,2,"#f4f4f4"); }          // 붕대
  /* 몸통 */
  const bodyTop=top+7, bodyH=boy?6:7;
  if(o.suit){ px(bx,bodyTop,bw,bodyH,"#1c2233"); px(7,bodyTop,2,bodyH,"#f4f4f4"); px(8,bodyTop+1,1,4,"#d63a3a"); px(bx,bodyTop,1,bodyH,"#262d42"); }
  else { px(bx,bodyTop,bw,bodyH,o.gk?"#2f2f3a":kit); px(bx,bodyTop,bw,1,kitL); px(7,bodyTop,2,1,skin); px(bx,bodyTop+bodyH-2,bw,1,kitD); px(7,bodyTop+2,2,2,kitL); px(bx+1,bodyTop+bodyH-1,bw-2,1,kitD); if(heavy){ px(bx+1,bodyTop+2,1,bodyH-4,kitL); px(bx+bw-2,bodyTop+2,1,bodyH-4,kitL); } }
  /* 유니폼 무늬(구단색 기반): 깃 줄과 맨 아랫줄은 그대로 두고 가슴 부분만 칠해요 */
  if(o.pat&&!o.suit){ const base=o.gk?"#2f2f3a":kit, rgb=hexToRgb(base), lum=.3*rgb[0]+.59*rgb[1]+.11*rgb[2], sec=lum>150?shade(base,.55):lum<70?"#cfd3dc":"#f4f4f4", y0=bodyTop+1, y1=bodyTop+bodyH-2;
    for(let yy=y0;yy<=y1;yy++) for(let xx=bx;xx<bx+bw;xx++){ const i=xx-bx, j=yy-y0; let on=false;
      if(o.pat==="stripe") on=Math.floor(i/2)%2===1; else if(o.pat==="hoop") on=j%2===1; else if(o.pat==="check") on=(Math.floor(i/2)+j)%2===0; else if(o.pat==="sash") on=(i-j===1||i-j===2); else if(o.pat==="half") on=i>=bw/2;
      if(on) px(xx,yy,1,1,sec); }
    px(7,bodyTop+2,2,2,kitL); }
  /* 팔 */
  px(bx-1,bodyTop+1,1,bodyH-2,o.suit?"#1c2233":kit); px(bx+bw,bodyTop+1,1,bodyH-2,o.suit?"#1c2233":kit);
  px(bx-1,bodyTop+bodyH-1,1,1,skin); px(bx+bw,bodyTop+bodyH-1,1,1,skin);
  if(o.cap&&!o.suit){ px(bx-1,bodyTop+2,1,2,o.cap==="red"?"#d63a3a":o.cap==="rainbow"?"#e8433a":"#ffd84a"); if(o.cap==="rainbow") px(bx-1,bodyTop+3,1,1,"#3f7fe0"); }          // 주장 완장
  /* 머리 */
  const hy=top+1; px(5,hy,6,6,skin); px(4,hy+3,1,2,skin); px(11,hy+3,1,2,skin);     // 얼굴·귀
  px(7,hy+6,2,1,skin);                                                               // 목
  /* 머리카락 */
  const mil=o.military;
  if(mil||hairStyle===8){ px(5,hy,6,1,hair); px(5,hy+1,1,1,hair); px(10,hy+1,1,1,hair); }
  else if(hairStyle===9){ px(5,hy,6,1,skin); px(6,hy,2,1,"rgba(255,255,255,.5)"); }                                           // 민머리: 반짝이는 정수리
  else if(hairStyle===4){ px(7,hy-2,2,3,hair); px(6,hy,1,1,hair); px(9,hy,1,1,hair); px(7,hy+1,2,1,hair); }                          // 모히칸
  else if(hairStyle===5){ px(4,hy-1,8,3,hair); px(3,hy,1,4,hair); px(12,hy,1,4,hair); px(5,hy-2,6,1,hair); }                       // 곱슬
  else if(hairStyle===6){ px(5,hy-1,6,2,hair); px(4,hy,1,2,hair); px(11,hy,1,2,hair); px(7,hy-2,2,1,hair); px(6,hy-1,4,1,hair); } // 올림머리
  else if(hairStyle===7){ px(5,hy-1,6,2,hair); px(4,hy,1,3,hair); px(11,hy,1,3,hair); px(12,hy+1,1,5,hair); px(11,hy+3,1,2,hair); } // 꽁지머리
  else if(hairStyle===0){ px(5,hy-1,6,2,hair); px(4,hy,1,3,hair); px(11,hy,1,3,hair); }
  else if(hairStyle===1){ px(5,hy-1,6,2,hair); px(4,hy,1,4,hair); px(11,hy,1,2,hair); px(5,hy+1,3,1,hair); }
  else if(hairStyle===2){ px(5,hy-1,6,2,hair); px(4,hy,1,5,hair); px(11,hy,1,5,hair); }
  else { px(5,hy-1,6,2,hair); px(6,hy-2,1,1,hair); px(8,hy-2,1,1,hair); px(10,hy-2,1,1,hair); px(4,hy,1,2,hair); px(11,hy,1,2,hair); }
  /* 나이: 희끗한 구레나룻 → 흰머리 */
  if(old1&&!old2&&!mil&&!dyed&&hairStyle<4){ px(4,hy,1,3,gray); px(11,hy,1,3,gray); px(5,hy-1,1,1,gray); px(10,hy-1,1,1,gray); }
  if(old2&&!mil&&!dyed&&hairStyle<4){ px(4,hy,1,5,"#f1f1f4"); px(11,hy,1,5,"#f1f1f4"); }
  /* 뒷모습(킥·헤딩 장면): 얼굴 대신 뒤통수, 등에 번호 */
  if(o.back&&!o.suit){ px(5,hy,6,6,hairStyle===9?skin:hair); if(hairStyle<9){ px(5,hy+5,6,1,hair); } px(4,hy+3,1,2,skin); px(11,hy+3,1,2,skin); px(7,hy+6,2,1,skin); px(bx+1,bodyTop+1,bw-2,1,kitL); px(6,bodyTop+2,4,1,"rgba(255,255,255,.75)"); px(7,bodyTop+3,2,3,"rgba(255,255,255,.75)"); }
  /* 얼굴: 눈·입 */
  if(!o.back){
  px(6,hy+3,1,1,"#1b1b22"); px(9,hy+3,1,1,"#1b1b22"); px(7,hy+5,2,1,boy?"#c86b6b":"#a85a55");
  if(boy) { px(5,hy+4,1,1,"#f1a6a0"); px(10,hy+4,1,1,"#f1a6a0"); }                 // 볼
  if(o.age>=33&&(h&1)){ px(5,hy+5,6,1,old2?"#d8d8de":"#4a4048"); }                  // 수염 자국
  if(old3){ px(5,hy+4,1,1,"rgba(120,80,70,.55)"); px(10,hy+4,1,1,"rgba(120,80,70,.55)"); px(6,hy+2,2,1,"rgba(90,60,50,.35)"); }  // 주름
  }
  /* 헤어밴드 · 안경 */
  if(o.band&&!mil){ px(4,hy+1,8,1,o.band==="white"?"#f4f4f4":o.band==="kit"?kitL:o.band==="gold"?"#ffcf4a":"#19f2a3"); }
  if(o.gl&&!o.back){ const fr=o.gl==="round"?"#8a5a1e":o.gl==="goggle"?"#27a9e1":o.gl==="neon"?"#19f2a3":"#101014";
    if(o.gl==="shade"||o.gl==="neon"){ px(5,hy+3,3,2,fr); px(8,hy+3,3,2,fr); px(5,hy+3,1,1,"rgba(255,255,255,.35)"); px(8,hy+3,1,1,"rgba(255,255,255,.35)"); px(4,hy+3,1,1,fr); px(11,hy+3,1,1,fr); }
    else { [5,8].forEach(x=>{ px(x+1,hy+2,1,1,fr); px(x+1,hy+4,1,1,fr); px(x,hy+3,1,1,fr); px(x+2,hy+3,1,1,fr); px(x+1,hy+3,1,1,"#1b1b22"); }); px(4,hy+3,1,1,fr); px(11,hy+3,1,1,fr); if(o.gl==="goggle") px(7,hy+1,2,1,fr); } }
  /* 목발 / 꽃다발 */
  if(o.injured){ g.fillStyle="#9a6b3a"; for(let i=0;i<14;i++){ g.fillRect(13+Math.floor(i/6),9+i,1,1); } px(13,9,2,1,"#9a6b3a"); }
  if(o.suit){ const fx=Math.max(0,bx-3); px(fx,bodyTop+bodyH-2,3,3,"#e9507a"); px(fx+1,bodyTop+bodyH-3,1,1,"#ffd84a"); px(fx,bodyTop+bodyH-2,1,1,"#fff"); px(fx+1,bodyTop+bodyH+1,1,2,"#2c9a5a"); }
  const url=c.toDataURL("image/png"); cache[key]=url; return url;
};
/* 캔버스에 그릴 도트 선수 이미지(뒷모습 옵션): 같은 모양은 한 번만 만들어요. 선수 이름·나이·체격·구단색·꾸미기가 그대로 적용돼요.
   opts: {back:true(뒷모습), kit:"#hex"(다른 팀 색), name:"x"(다른 얼굴), gk:true} → HTMLImageElement (로딩 전이면 complete=false) */
const _imgs={};
L.pixelCanvasImg=function(S,opts){ opts=opts||{}; try{ const p=S.p, age=(S.year||2026)-(p.born||2008); let col=null; const cc=S.club&&(S.club.col||(S.club.c)); if(typeof cc==="string"&&/^#[0-9a-f]{6}$/i.test(cc)) col=cc;
    let bf={mass:0,tall:0}; try{ if(L.bodyFx) bf=L.bodyFx(p.pos,p.height,p.weight); }catch(e){}
    const other=!!(opts.name||opts.kit); const base={name:opts.name||p.name,age:opts.age||(other?24:age),kit:opts.kit||col,gk:!!opts.gk||(!other&&p.pos==="GK"&&!opts.field),bodyMass:other?0:bf.mass,bodyTall:other?0:bf.tall,back:!!opts.back,military:!!opts.military,suit:!!opts.suit,injured:!!opts.injured};
    let cs=null; if(!other){ try{ cs=L.cosPix?L.cosPix():null; }catch(e){} }
    const url=L.pixelSprite(Object.assign(base,cs||{})); if(!_imgs[url]){ const im=new Image(); im.src=url; _imgs[url]=im; } return _imgs[url]; }catch(e){ return null; } };
/* 현재 선수의 도트 이미지 태그 (장착한 꾸미기가 함께 적용돼요. opts.cos 로 미리보기 값을, opts.clean 으로 부상·입대 표시 없는 모습을 받아요) */
L.pixelImg=function(S,size,opts){
  try{ opts=opts||{}; const p=S.p, age=(S.year||2026)-(p.born||2008); let col=null; const cc=S.club&&(S.club.col||(S.club.c)); if(typeof cc==="string"&&/^#[0-9a-f]{6}$/i.test(cc)) col=cc;
    let bf={mass:0,tall:0}; try{ if(L.bodyFx) bf=L.bodyFx(p.pos,p.height,p.weight); }catch(e){}
    const base={name:p.name,age:opts.age||age,kit:col,injured:!opts.clean&&(!!opts.injured||(S.sim&&S.sim.out>0&&S.stage==="pro")),military:!opts.clean&&(S.military==="serving"||S.military==="sangmu"),suit:!!opts.suit,gk:p.pos==="GK",bodyMass:bf.mass,bodyTall:bf.tall,back:!!opts.back};
    let cs=null; try{ cs=opts.cos!==undefined?opts.cos:(L.cosPix?L.cosPix():null); }catch(e){}
    const url=L.pixelSprite(Object.assign(base,cs||{}));
    const w=Math.round(size*16/24); return '<img class="pix" alt="" width="'+w+'" height="'+size+'" src="'+url+'" style="width:'+w+'px;height:'+size+'px">'; }catch(e){ return ""; }
};
})();
