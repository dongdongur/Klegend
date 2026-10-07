/* 세계지도 항로 연출 (js/worldmap.js)
 * 점으로 그린 세계지도 위에서 비행기가 출발 도시 → 도착 도시로 곡선 항로를 따라 날아가요.
 * 대륙 윤곽은 대략적인 좌표(경도, 위도)로 만들고, 점 격자 안에 들어오는 곳만 찍어서 지도처럼 보이게 해요.
 * 사용: KL_MAP.flight(canvas, {from:{n,lat,lon}, to:{n,lat,lon}}, durationMs, onDone) */
(function(){
"use strict";
var LAND=[
 /* 북아메리카 */ [[-168,66],[-162,70],[-140,70],[-125,70],[-95,72],[-80,73],[-62,66],[-55,52],[-66,45],[-70,42],[-76,35],[-81,30],[-80,25],[-85,29],[-90,29],[-97,26],[-97,22],[-105,20],[-110,24],[-115,30],[-118,34],[-124,40],[-125,48],[-135,58],[-150,60],[-165,60]],
 /* 중앙아메리카 */ [[-97,22],[-92,18],[-87,21],[-83,15],[-79,9],[-83,8],[-92,14],[-105,20]],
 /* 그린란드 */ [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-72,76]],
 /* 남아메리카 */ [[-78,8],[-72,12],[-62,10],[-50,0],[-35,-6],[-40,-22],[-48,-28],[-58,-38],[-65,-42],[-68,-52],[-72,-52],[-74,-40],[-71,-18],[-81,-5]],
 /* 유라시아 */ [[-10,36],[-9,43],[-2,43.5],[-4,48],[2,51],[8,54],[10,57],[5,62],[15,69],[28,71],[45,68],[60,70],[80,73],[100,77],[140,72],[170,70],[180,66],[160,60],[142,54],[136,44],[130,42.5],[129,38],[129,35],[126,34.5],[125,38],[122,40],[121,37],[119,35],[122,30],[120,22],[110,20],[106,10],[100,13],[100,5],[104,1],[98,8],[92,22],[80,15],[78,8],[72,20],[67,25],[58,25],[56,27],[51,25],[56,22],[52,16],[43,13],[39,21],[35,28],[34,31],[28,36],[26,40],[20,40],[16,38],[12,44],[3,43],[-6,36]],
 /* 아프리카 */ [[-17,21],[-10,30],[-6,36],[10,37],[22,33],[32,31],[35,28],[43,12],[51,12],[40,-3],[40,-15],[35,-25],[20,-35],[18,-32],[12,-18],[9,-1],[9,4],[-8,4],[-17,14]],
 /* 오스트레일리아 */ [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-27],[150,-37],[140,-38],[132,-32],[115,-34]],
 /* 영국 */ [[-5,50],[1,51],[2,53],[-2,58],[-6,58],[-5,54]], /* 아일랜드 */ [[-10,52],[-6,52],[-6,55],[-10,54]],
 /* 일본 */ [[130,31],[135,34],[141,36],[142,40],[140,42],[143,44],[141,45],[139,38],[135,36],[131,34]],
 /* 인도네시아 */ [[95,5],[106,-6],[115,-8],[120,-9],[110,-3],[100,2]], [[109,1],[118,7],[119,0],[115,-3],[110,-3]],
 /* 아이슬란드·뉴질랜드·필리핀·스리랑카 */ [[-24,64],[-14,64],[-14,66],[-22,66]], [[172,-35],[178,-38],[175,-41],[172,-41]], [[120,18],[124,12],[126,7],[122,10]], [[80,9],[82,7],[80,6]]
];
function inPoly(x,y,p){ var c=false; for(var i=0,j=p.length-1;i<p.length;j=i++){ var xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
var cache=null;
function land(){ if(cache) return cache; var pts=[]; for(var lat=-58;lat<=82;lat+=2){ for(var lon=-180;lon<=180;lon+=2){ for(var k=0;k<LAND.length;k++){ if(inPoly(lon,lat,LAND[k])){ pts.push([lon,lat]); break; } } } } cache=pts; return pts; }
function flight(cv,route,dur,done){
  var g=cv.getContext("2d"), W=cv.width, H=cv.height, dpr=1;
  var A=route.from, B=route.to;
  /* 화면에 두 도시가 잘 들어오도록 보는 구간을 잡아요 */
  var cLon=(A.lon+B.lon)/2, cLat=(A.lat+B.lat)/2, dLon=Math.abs(A.lon-B.lon), dLat=Math.abs(A.lat-B.lat);
  var spanLon=Math.max(dLon*1.7,60), spanLat=spanLon*H/W; if(spanLat<dLat*2.2){ spanLat=dLat*2.2; spanLon=spanLat*W/H; }
  var X=function(lon){ return W/2+(lon-cLon)/spanLon*W; }, Y=function(lat){ return H/2-(lat-cLat)/spanLat*H; };
  var a={x:X(A.lon),y:Y(A.lat)}, b={x:X(B.lon),y:Y(B.lat)}, dx=b.x-a.x, dy=b.y-a.y, dist=Math.hypot(dx,dy);
  var lift=Math.min(dist*.32,H*.28); var c={x:(a.x+b.x)/2-dy/dist*lift*.4,y:(a.y+b.y)/2-lift-Math.abs(dx)/dist*0};
  var q=function(t){ return {x:(1-t)*(1-t)*a.x+2*(1-t)*t*c.x+t*t*b.x,y:(1-t)*(1-t)*a.y+2*(1-t)*t*c.y+t*t*b.y}; };
  var dots=land(), rad=Math.max(1,W/spanLon*.62);
  var t0=performance.now(), fin=false;
  function plane(p,ang,sz){ g.save(); g.translate(p.x,p.y); g.rotate(ang); g.shadowColor="rgba(0,0,0,.45)"; g.shadowBlur=8; g.fillStyle="#fff"; g.beginPath(); g.moveTo(sz*1.4,0); g.lineTo(sz*.5,sz*.22); g.lineTo(-sz*.2,sz*.22); g.lineTo(-sz*.6,sz*.95); g.lineTo(-sz*.85,sz*.95); g.lineTo(-sz*.55,sz*.22); g.lineTo(-sz*1.1,sz*.2); g.lineTo(-sz*1.2,sz*.45); g.lineTo(-sz*1.35,sz*.45); g.lineTo(-sz*1.2,0); g.lineTo(-sz*1.35,-sz*.45); g.lineTo(-sz*1.2,-sz*.45); g.lineTo(-sz*1.1,-sz*.2); g.lineTo(-sz*.55,-sz*.22); g.lineTo(-sz*.85,-sz*.95); g.lineTo(-sz*.6,-sz*.95); g.lineTo(-sz*.2,-sz*.22); g.lineTo(sz*.5,-sz*.22); g.closePath(); g.fill(); g.restore(); }
  function city(p,name,on,t){ g.fillStyle=on?"#ffcf4a":"rgba(255,255,255,.8)"; g.beginPath(); g.arc(p.x,p.y,on?4.2:3.2,0,7); g.fill(); if(on){ var r=(t%1)*22; g.strokeStyle="rgba(255,207,74,"+(1-(t%1))*.8+")"; g.lineWidth=2; g.beginPath(); g.arc(p.x,p.y,6+r,0,7); g.stroke(); } g.font="700 12px 'Noto Sans KR',sans-serif"; g.textAlign="center"; g.fillStyle="rgba(255,255,255,.95)"; g.shadowColor="rgba(0,0,0,.7)"; g.shadowBlur=4; g.fillText(name,p.x,p.y-10); g.shadowBlur=0; }
  function frame(now){
    if(fin||!cv.isConnected) return; var el=now-t0, k=Math.min(1,el/dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    g.clearRect(0,0,W,H); var bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#06172e"); bg.addColorStop(1,"#0d2f55"); g.fillStyle=bg; g.fillRect(0,0,W,H);
    /* 위도·경도 격자 */
    g.strokeStyle="rgba(120,170,255,.08)"; g.lineWidth=1; for(var lo=-180;lo<=180;lo+=30){ var xx=X(lo); g.beginPath(); g.moveTo(xx,0); g.lineTo(xx,H); g.stroke(); } for(var la=-60;la<=80;la+=20){ var yy=Y(la); g.beginPath(); g.moveTo(0,yy); g.lineTo(W,yy); g.stroke(); }
    g.fillStyle="rgba(150,200,255,.42)"; for(var i=0;i<dots.length;i++){ var px=X(dots[i][0]), py=Y(dots[i][1]); if(px<-3||px>W+3||py<-3||py>H+3) continue; g.beginPath(); g.arc(px,py,rad,0,7); g.fill(); }
    /* 항로(점선)와 지나온 길 */
    g.setLineDash([6,6]); g.strokeStyle="rgba(255,255,255,.35)"; g.lineWidth=2; g.beginPath(); for(var s=0;s<=40;s++){ var pp=q(s/40); s?g.lineTo(pp.x,pp.y):g.moveTo(pp.x,pp.y); } g.stroke(); g.setLineDash([]);
    g.strokeStyle="#ffcf4a"; g.lineWidth=3; g.shadowColor="rgba(255,207,74,.8)"; g.shadowBlur=8; g.beginPath(); for(var s2=0;s2<=Math.round(e*40);s2++){ var p2=q(Math.min(e,s2/40)); s2?g.lineTo(p2.x,p2.y):g.moveTo(p2.x,p2.y); } g.stroke(); g.shadowBlur=0;
    city(a,A.n,false,0); city(b,B.n,e>=.99,el/900);
    var pos=q(e), nx=q(Math.min(1,e+.01)), pv=q(Math.max(0,e-.01)); var ang=Math.atan2(nx.y-pv.y,nx.x-pv.x);
    var sz=7+Math.sin(e*Math.PI)*3; plane(pos,ang,sz);
    /* 비행 정보 */
    var km=Math.round(Math.hypot((A.lon-B.lon)*Math.cos((A.lat+B.lat)/2*Math.PI/180)*111,(A.lat-B.lat)*111)*1.08*e); g.font="600 11px 'Oswald',sans-serif"; g.textAlign="left"; g.fillStyle="rgba(255,255,255,.75)"; g.fillText((A.code||A.n)+" → "+(B.code||B.n)+"  ·  "+km.toLocaleString()+" km",12,H-12);
    if(k<1) setTimeout(function(){ frame(performance.now()); },16); else if(!fin){ if(el<dur+900){ setTimeout(function(){ frame(performance.now()); },16); } else { fin=true; if(done) done(); } }
  }
  frame(performance.now());
  return {stop:function(){ fin=true; }};
}
window.KL_MAP={flight:flight,land:land};
})();
