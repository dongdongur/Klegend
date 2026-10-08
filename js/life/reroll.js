/* 학창 시절 마무리 (js/life/reroll.js) — 중·고등학생 때 '새로운 인생'을 눌러 이번 생을 접을 때 나오는 짧은 한줄평과 코치 인터뷰.
 * 잠재력이 낮아도 '하나의 캐릭터'로 기억되게 등급·포지션에 맞춰 골라요. 문장에는 이름을 넣지 않아요(이름은 제목에만). */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const hash=s=>{ let x=0; s=String(s||""); for(let i=0;i<s.length;i++) x=(x*31+s.charCodeAt(i))>>>0; return x; };
const POS={FW:"공격수",MF:"미드필더",DF:"수비수",GK:"골키퍼"};
/* 등급별 한줄평 */
const REVIEW={
 S:["운동장이 좁아 보이던 천재 유망주. 이야기는 여기서 접었지만, 기억에는 오래 남아요.","누구나 '저 애는 프로 간다'고 했던 학생. 다른 인생에서 다시 만나기로 해요."],
 A:["코치들이 눈여겨보던 기대주. 가능성만큼은 확실했던 학생이었어요.","한 번 더 지켜보고 싶었던 유망주로 마무리했어요."],
 B:["묵묵히 제 몫을 하던 단단한 학생. 팀에 꼭 필요한 선수였어요.","화려하진 않아도 늘 믿음이 갔던 학생으로 기억돼요."],
 C:["재능은 평범했지만 누구보다 오래 남아 공을 차던 노력파로 마무리했어요.","타고난 건 부족해도 눈빛만큼은 누구에게도 지지 않던 학생이었어요.","운동장 맨 끝까지 남아 연습하던 학생. 이런 선수가 팀의 분위기를 만들어요."]
};
/* 코치 인터뷰: 등급별 + 포지션별 */
const COACH={
 S:["처음 봤을 때부터 달랐어요. 다음에는 더 오래 지켜보고 싶네요.","재능은 의심할 필요가 없었어요. 어떤 길을 가든 잘할 겁니다."],
 A:["볼 터치가 남달랐어요. 조금만 더 시간이 있었다면 어디까지 갔을지 궁금합니다.","기대가 컸던 만큼 아쉬워요. 그래도 그라운드에서 보여 준 건 진짜였습니다."],
 B:["시키지 않아도 먼저 뛰는 선수였어요. 이런 학생이 있으면 감독은 마음이 놓입니다.","실수해도 다시 일어나는 게 장점이었죠. 어디서든 사랑받을 선수예요."],
 C:["솔직히 재능보다 태도로 기억에 남는 학생이에요. 가장 늦게까지 남던 선수였죠.","기술은 더 다듬어야 했지만, 팀에서 가장 큰 목소리로 응원하던 친구였습니다."]
};
const COACHPOS={
 FW:["골 감각이 좋은 친구였어요. 결정적인 순간엔 유독 침착했죠."],
 MF:["경기를 읽는 눈이 좋았어요. 중원에서 볼 줄 아는 선수였습니다."],
 DF:["몸을 던지는 수비가 인상적이었어요. 뒤에 있으면 든든한 선수였죠."],
 GK:["골문 앞에서 흔들리지 않는 담력이 있었어요. 키퍼는 그게 제일 중요합니다."]
};
L.rerollNote=function(S){
  const p=S.p, g=COACH[p.grade]?p.grade:"C", h=hash(p.name+(S.year||0));
  const pick=(a,k)=>a[(h>>>k)%a.length];
  const stage=L.gradeLabel?L.gradeLabel(L.age(S)):"학창 시절";
  const cp=pick(COACHPOS[p.pos]||COACHPOS.MF,5);
  const quote=(h%3===0)?pick(COACH[g],3):cp;
  return {name:p.name,stage,posName:POS[p.pos]||"선수",review:pick(REVIEW[g],1),quote,who:"당시 코치"};
};
L.rerollHtml=function(n){
  const e=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return `<div class="ov center"><div class="sheet"><small class="kick">SCHOOL DAYS</small><h3>${e(n.name)}</h3>
   <p class="muted c">학창 시절 · ${e(n.stage)} · ${e(n.posName)}</p><p>${e(n.review)}</p>
   <div class="banner"><div class="no" style="font-size:15px;line-height:1.5">“${e(n.quote)}”<br><small>— ${e(n.who)}</small></div></div>
   <button class="big" data-act="newgo"><span>새로운 인생 시작</span><b>→</b></button><button class="wide" data-act="mok">계속 키우기</button></div></div>`;
};
})();
