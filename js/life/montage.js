/* 은퇴 영상 (js/life/montage.js) — 한 선수의 인생을 도트 영상으로 이어서 보여 줘요.
 * 어린 시절 운동장 → 커리어의 빛난 순간들(그때 나이의 도트 모습) → 통산 기록 → 정장 입고 꽃다발 받는 마지막 장면.
 * 하이라이트 카드(highlight.js)의 장면 그림을 그대로 써요. 누르면 건너뛰고, 끝나면 저절로 닫혀요. */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.hlDraw) return;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let busy=false;
/* 순간(moment) → 장면 종류 */
const kindOf=m=>{ const s=(m.badge||"")+" "+(m.text||""); if(/월드컵|챔피언스|트레블|우승/.test(s)) return "title"; if(/황금공|MVP|올해의|득점왕|수상|상 |주장|GOAT|각성|영구결번/.test(s)) return "award"; if(/기록|골|해트트릭/.test(s)) return "goal"; if(/군|상무|입대/.test(s)) return "mil"; if(/성장|재활|부상|복귀/.test(s)) return "grow"; return "ball"; };
L.montageScenes=function(S){
  const out=[]; const ms=(S.moments||[]).filter(m=>m&&m.text); const born=S.p.born||(S.startYear-S.startAge);
  out.push({type:"kid",age:Math.max(10,S.startAge||13),dur:3600,sm:(born+(S.startAge||13))+"년",txt:"작은 운동장에서 공 하나로 시작했어요."});
  const key=ms.filter(m=>/월드컵|챔피언스|트레블|우승|황금공|MVP|올해의|득점왕|GOAT|각성|영구결번|주장|기록/.test((m.badge||"")+" "+m.text));
  const rest=ms.filter(m=>!key.includes(m));
  let pickd=key.slice(0,5); if(pickd.length<5) pickd=pickd.concat(rest.slice(0,5-pickd.length)); pickd.sort((a,b)=>(a.year||0)-(b.year||0));
  pickd.forEach(m=>out.push({type:kindOf(m),age:Math.min(45,m.age||25),dur:3500,sm:m.year+" · "+(m.club||"")+(m.age?" · "+m.age+"세":""),txt:m.text}));
  if(out.length<3){ const h=(S.history||[]).filter(x=>!x.youth&&!x.military); h.slice(-3).forEach(x=>out.push({type:"run",age:x.age,dur:3200,sm:x.year+" · "+x.club,txt:x.apps+"경기 "+(S.p.pos==="GK"?x.cs+"무실점":x.goals+"골 "+x.assists+"도움")+", 그해도 그라운드에 있었어요."})); }
  const c=S.career||{}; out.push({type:"run",age:null,dur:3600,sm:"통산 기록",txt:(c.apps||0)+"경기 · "+(c.goals||0)+"골 · "+(c.assists||0)+"도움"+((c.caps||0)?" · 국가대표 "+c.caps+"경기":""),stats:true});
  const jr=S.jersey||[]; out.push({type:"farewell",age:null,dur:6200,sm:L.age(S)+"세 · 은퇴",txt:S.p.name+", 그동안 고마웠어요."+(jr.length?" "+jr[0].club+"의 "+jr[0].number+"번은 영원히 당신의 번호예요.":"")});
  return out;
};
L.playMontage=function(S,done){
  if(busy||!S) { if(done) done(); return; } busy=true;
  const scenes=L.montageScenes(S); const w=document.createElement("div"); w.className="mv";
  w.innerHTML='<canvas class="mvc" width="360" height="190"></canvas><div class="mvcap"></div><div class="mvbar"><i></i></div><button type="button" class="mvskip">건너뛰기 ›</button>';
  document.body.appendChild(w); document.body.classList.add("fx-on");
  const cv=w.querySelector(".mvc"), cap=w.querySelector(".mvcap"), bar=w.querySelector(".mvbar i");
  const ctl=L.hlDraw(cv,S,S.lastR,{type:scenes[0].type,age:scenes[0].age});
  const total=scenes.reduce((a,s)=>a+s.dur,0); let i=0, closed=false, start=performance.now(), sceneStart=start;
  const show=k=>{ const s=scenes[k]; ctl.set(s.type,s.age); sceneStart=performance.now(); cap.innerHTML='<small>'+esc(s.sm)+'</small><b>'+esc(s.txt)+'</b>'; cap.classList.remove("in"); void cap.offsetWidth; cap.classList.add("in"); };
  show(0);
  const close=()=>{ if(closed) return; closed=true; ctl.stop(); w.classList.add("out"); setTimeout(()=>{ w.remove(); document.body.classList.remove("fx-on"); busy=false; if(done) done(); },380); };
  const tick=()=>{ if(closed) return; const now=performance.now(); bar.style.width=Math.min(100,(now-start)/total*100)+"%"; if(now-sceneStart>=scenes[i].dur){ i++; if(i>=scenes.length){ setTimeout(close,500); return; } show(i); } setTimeout(tick,60); };
  tick(); w.addEventListener("click",()=>{ if(performance.now()-start>800) close(); });
  w.querySelector(".mvskip").addEventListener("click",e=>{ e.stopPropagation(); close(); });
  try{ if(window.KL_BGM&&KL_BGM.sting) KL_BGM.sting("retire"); }catch(e){}
};
window.KL_I18N_EN_MV={"작은 운동장에서 공 하나로 시작했어요.":"It all began with one ball on a small pitch.","통산 기록":"Career totals","은퇴":"Retired","그동안 고마웠어요.":"Thank you for everything.","은 영원히 당신의 번호예요.":"will be your number forever.","그해도 그라운드에 있었어요.":"you were on the pitch that year too.","🎞 은퇴 영상 보기":"🎞 Watch the retirement film","건너뛰기 ›":"Skip ›"};
})();
