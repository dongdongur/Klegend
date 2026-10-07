/*
 * 배경음악 (js/bgm.js) — 파일 없이 브라우저에서 직접 만들어 내는 신나는 경기장 음악이에요(직접 만든 곡이라 저작권 걱정 없음).
 * 90년대 축구 게임 같은 밝고 빠른 박자: 킥·박수·하이햇 드럼 + 달리는 베이스 + 따라 부르기 쉬운 멜로디.
 * 우측 상단 🎵 버튼으로 켜고 끄고, 선택은 기억해요. 처음엔 꺼져 있어요(모바일은 누른 뒤에만 소리가 나요).
 * KL_BGM.mood("calm"|"match"|"epic") 으로 분위기를 바꾸고, KL_BGM.sting(kind) 은 큰 순간의 팡파르예요.
 */
(function(){
"use strict";
const KEY="kl-bgm"; let ctx=null, master=null, comp=null, noiseBuf=null, on=false, timer=null, barNo=0, nextT=0, mood="menu";
/* 코드 진행(루트 반음, 장/단) — 8마디 반복 */
const PROG=[[0,"M"],[0,"M"],[5,"M"],[5,"M"],[7,"M"],[7,"M"],[9,"m"],[7,"M"]];
const M={
  /* drum: four=4박 킥 · boom=힙합 · soft=가벼운 · none | lead: 음색 · lo: 멜로디 옥타브 오프셋 · bp: 베이스 패턴 */
  menu  :{bpm:124,drum:"four",kick:.85,snare:.4,clap:.35,hat:.14,bass:.40,lead:.22,pad:.09,leadType:"square",lo:24,bassType:"sawtooth",bassLp:520,leadOn:1},
  cute  :{bpm:112,drum:"soft",kick:.55,snare:0,clap:.0,hat:.10,bass:.30,lead:.30,pad:.07,leadType:"sine",lo:36,bassType:"triangle",bassLp:900,leadOn:1,bells:true},
  calm  :{bpm:118,drum:"soft",kick:.75,snare:0,clap:0,hat:.10,bass:.34,lead:.17,pad:.08,leadType:"triangle",lo:24,bassType:"sawtooth",bassLp:520,leadOn:.7},
  match :{bpm:132,drum:"four",kick:1.0,snare:.55,clap:.45,hat:.17,bass:.46,lead:.24,pad:.07,leadType:"square",lo:24,bassType:"sawtooth",bassLp:520,leadOn:1},
  epic  :{bpm:138,drum:"four",kick:1.1,snare:.7,clap:.6,hat:.2,bass:.52,lead:.3,pad:.12,leadType:"square",lo:24,bassType:"sawtooth",bassLp:560,leadOn:1},
  market:{bpm:92,drum:"boom",kick:1.0,snare:.6,clap:.3,hat:.14,bass:.55,lead:.14,pad:.10,leadType:"triangle",lo:24,bassType:"sine",bassLp:380,leadOn:.55},
  retire:{bpm:84,drum:"none",kick:0,snare:0,clap:0,hat:0,bass:.22,lead:.2,pad:.14,leadType:"sine",lo:24,bassType:"sine",bassLp:400,leadOn:.5}
};
const hz=n=>440*Math.pow(2,(n-69)/12);
function out(){ return master; }
function env(g,t,a,d,v){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+d); }
function osc(type,f,t,dur,v,dest,opt){
  const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(opt&&opt.glide) o.frequency.exponentialRampToValueAtTime(opt.glide,t+dur*.8);
  env(g,t,opt&&opt.a||.005,dur,v); let node=g; o.connect(g);
  if(opt&&opt.lp){ const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=opt.lp; g.connect(lp); node=lp; }
  node.connect(dest||master); o.start(t); o.stop(t+dur+.1);
}
function noise(t,dur,v,type,freq,q){
  const s=ctx.createBufferSource(); s.buffer=noiseBuf; const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q||.8; const g=ctx.createGain(); env(g,t,.002,dur,v);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+.05);
}
function kick(t,v){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+.12); env(g,t,.002,.22,v); o.connect(g); g.connect(master); o.start(t); o.stop(t+.3); }
function bar(){
  const m=M[mood], spb=60/m.bpm, step=spb/4, bl=spb*4;
  if(nextT<ctx.currentTime+.05) nextT=ctx.currentTime+.08;
  const t0=nextT, ch=PROG[barNo%PROG.length], root=48+ch[0]; // C3 기준
  const third=ch[1]==="m"?3:4, chord=[0,third,7];
  /* 드럼 */
  const dr=m.drum;
  for(let s=0;s<16;s++){ const t=t0+s*step+(dr==="boom"&&s%2?step*.28:0);
    if(dr==="four"&&s%4===0) kick(t,.9*m.kick);
    else if(dr==="soft"&&(s===0||s===8||(s===10&&barNo%2))) kick(t,.8*m.kick);
    else if(dr==="boom"&&(s===0||s===6||s===10||(s===14&&barNo%4===3))) kick(t,.95*m.kick);
    if(m.snare&&(s===4||s===12)) { noise(t,dr==="boom"?.22:.16,.5*m.snare,"bandpass",dr==="boom"?1500:1900,.7); osc("triangle",dr==="boom"?160:190,t,.12,.25*m.snare); }
    if(m.clap&&(s===4||s===12)) noise(t+.012,.09,.4*m.clap,"bandpass",1300,1.2);
    if(dr!=="none"&&(dr==="soft"?s%4===2:s%2===1)) noise(t,.05,m.hat,"highpass",7500);
    if(s===14&&(dr==="four")) noise(t,.18,m.hat*.9,"highpass",6500);
  }
  if(barNo%8===0&&(dr==="four")&&mood!=="menu") noise(t0,.9,.22,"highpass",3500);   // 크래시
  /* 베이스: 8분음표로 달려요 */
  const bp=m.drum==="boom"?[0,null,null,0,null,7,null,3]:[0,0,12,0,0,7,0,12];
  for(let i=0;i<8;i++){ if(bp[i]==null) continue; const t=t0+i*step*2; osc(m.bassType,hz(root+bp[i]),t,step*(m.drum==="boom"?3.2:1.8),m.bass,master,{lp:m.bassLp,a:.004}); }
  /* 패드(코드) */
  chord.forEach((n,i)=>osc("triangle",hz(root+12+n),t0,bl*.95,m.pad*(1-i*.12),master,{a:.04,lp:1800}));
  /* 멜로디: 코드 음을 따라 통통 튀는 훅 (2마디 단위로 변주) */
  if(m.leadOn){
    const hook=barNo%2===0?[0,3,5,6,8,10,12,14]:[0,2,4,6,8,11,12,14];
    const iv=barNo%2===0?[0,4,7,12,7,4,7,9]:[7,12,9,7,4,7,12,16];
    const pent=ch[1]==="m"?[0,3,7,10,12,15]:[0,2,4,7,9,12];
    hook.forEach((s,i)=>{ if(Math.random()<(mood==="calm"?.8:1)){ const n=barNo%4===3&&i>=6?pent[(i+barNo)%pent.length]:iv[i]; osc(m.leadType,hz(root+m.lo+n),t0+s*step,step*(m.bells?2.6:1.5),m.lead,master,{lp:m.bells?5200:3200,a:.003}); if(m.bells) osc("sine",hz(root+m.lo+n+12),t0+s*step,step*1.2,m.lead*.35); } });
    if(barNo%4===3) osc(m.leadType,hz(root+m.lo+7),t0+14*step,step*2.5,m.lead*1.1,master,{lp:3000,glide:hz(root+m.lo+19)});   // 끝에서 위로 올라가는 '우~' 소리
  }
  nextT=t0+bl; barNo++;
  timer=setTimeout(bar,Math.max(30,(nextT-ctx.currentTime-.25)*1000));
}
/* ===== 음악 파일 재생: js/audio-manifest.js 에 파일이 있으면 합성음 대신 파일을 들려줘요 ===== */
let fileEl=null, fileMood=null, fileIdx=0;
function files(k){ const a=window.KL_AUDIO&&window.KL_AUDIO[k]; return a&&a.length?a:null; }
function playFile(){
  const list=files(mood); if(!list){ if(fileEl){ fileEl.pause(); fileEl=null; fileMood=null; } return false; }
  if(fileEl&&fileMood===mood) return true;
  if(fileEl){ fileEl.pause(); }
  fileMood=mood; fileEl=new Audio(list[fileIdx%list.length]); fileEl.volume=.8; fileEl.loop=list.length===1;
  fileEl.addEventListener("ended",function(){ fileIdx++; fileMood=null; if(on) syncMusic(); });
  fileEl.play().catch(function(){}); return true;
}
function syncMusic(){ if(!on) return; if(playFile()){ clearTimeout(timer); timer=null; } else if(!timer&&ctx){ barNo=0; nextT=0; bar(); } }
function start(){
  try{
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC();
      master=ctx.createGain(); master.gain.value=0; comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.attack.value=.004; comp.release.value=.2;
      const post=ctx.createGain(); post.gain.value=1.5; master.connect(comp); comp.connect(post); post.connect(ctx.destination);
      noiseBuf=ctx.createBuffer(1,ctx.sampleRate*1,ctx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
    ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value,ctx.currentTime); master.gain.linearRampToValueAtTime(1,ctx.currentTime+1.2);
    if(files(mood)){ playFile(); } else if(!timer){ barNo=0; nextT=0; bar(); }
  }catch(e){}
}
function stop(){ try{ if(fileEl){ fileEl.pause(); fileEl=null; fileMood=null; } if(!ctx) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0,ctx.currentTime+.5); clearTimeout(timer); timer=null; setTimeout(function(){ if(!on&&ctx) ctx.suspend(); },700); }catch(e){} }
/* 큰 순간의 팡파르: 배경음악을 켜 둔 경우에만 */
function sting(kind){ try{ if(!on) return; const sl=files(kind==="euro"||kind==="win"||kind==="world"?"win":"goal"); if(sl){ const a=new Audio(sl[Math.floor(Math.random()*sl.length)]); a.volume=.9; a.play().catch(function(){}); return; } if(!ctx) return; const t=ctx.currentTime+.05, base=(kind==="retire"?57:60), ch=kind==="retire"?[0,3,7,12]:[0,4,7,12,16,19]; ch.forEach((n,i)=>{ osc("triangle",hz(base+n+12),t+i*.12,1.4,.25); osc("sine",hz(base+n),t+i*.12,1.6,.2); }); noise(t,.7,.25,"highpass",4000); }catch(e){} }
function btn(){
  const b=document.createElement("button"); b.type="button"; b.id="klBgm"; b.setAttribute("aria-label","배경음악");
  b.style.cssText="position:fixed;right:10px;top:8px;z-index:90;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(10,14,28,.78);color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(6px);box-shadow:0 4px 14px rgba(0,0,0,.4)";
  const paint=function(){ b.textContent=on?"🎵":"🔇"; b.style.opacity=on?1:.75; };
  b.onclick=function(){ on=!on; try{ localStorage.setItem(KEY,on?"1":"0"); }catch(e){} on?start():stop(); paint(); };
  paint(); document.body.appendChild(b);
  let want=false; try{ want=localStorage.getItem(KEY)==="1"; }catch(e){}
  if(want){ on=true; paint(); const f=function(){ document.removeEventListener("pointerdown",f); if(on) start(); }; document.addEventListener("pointerdown",f); }
}
window.KL_BGM={sting:sting,mood:function(k){ if(!M[k]||k===mood) return; mood=k; if(on) syncMusic(); },on:function(){ return on; }};
if(document.readyState!=="loading") btn(); else document.addEventListener("DOMContentLoaded",btn);
})();
