/* 이어지는 이야기 도우미 (js/life/chain.js)
 * 여러 편으로 이어지는 이야기는 앞 편을 겪은 뒤 간격이 지나면 '다음 편'이 열려요. 그런데 일반 이벤트 사이에서 뽑히기만 기다리면 한 판에 끝까지 가기 어려워서,
 * 다음 편이 열려 있으면 높은 확률로 먼저 보여 주고, 첫 편도 열려 있으면 가끔 끼워 넣어요. */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.rollEvent||!L.EVPOOL||!L.markEvent) return;
const NEXT=/^e(6_(coachB|coachC|buddy_b|buddy_c|rehabB)|8_(spB|spC|sibB|sibC|loveB|loveC|loveD|fanB|fanC|protB|protC|bossB|bossC|studyB|studyC|hoodB|hoodC|rivalB|rivalC|natB|natC|slumpB|retB|retC)|9_(wcB|wcC|olyB|asiaB|grad))$/;
const FIRST=/^e(6_(coachA|buddy_a|rehabA)|8_(spA|sibA|loveA|fanA|protA|bossA|studyA|hoodA|rivalA|natA|slumpA|retA)|9_(wcA|olyA|asiaA|sat))$/;
L.CHAIN_NEXT=NEXT; L.CHAIN_FIRST=FIRST;
const base=L.rollEvent;
const open=(S,re)=>{ const seen=S.evSeen||[]; return L.EVPOOL.filter(e=>re.test(e.id)&&!seen.includes(e.id)&&(()=>{ try{ return !e.when||e.when(S); }catch(x){ return false; } })()); };
L.rollEvent=function(S,out){
  const n0=(S.evSeen||[]).length, h0=(S.evHist||[]).length;
  let ev=base.apply(this,arguments);
  try{
    if(S.military==="serving") return ev;
    if(ev&&(NEXT.test(ev.id)||FIRST.test(ev.id)||ev.story)) return ev;
    const nx=open(S,NEXT), fr=nx.length?[]:open(S,FIRST);
    const cand=nx.length&&Math.random()<(ev?.55:.45)?nx:(fr.length&&Math.random()<.1?fr:null);
    if(!cand||!cand.length) return ev;
    if(ev){ if((S.evHist||[]).length>h0||(S.evHist||[]).length===40) (S.evHist||[]).pop(); if((S.evSeen||[]).length>n0) S.evSeen.pop(); }
    const e=cand[Math.floor(Math.random()*cand.length)];
    return L.markEvent(S,{id:e.id,title:e.title,body:e.body,opts:e.opts,repeat:e.repeat});
  }catch(x){ return ev; }
};
})();
