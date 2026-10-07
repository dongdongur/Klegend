/* 수상 연출 (js/life/awardcine.js) — 시즌 결산에서 큰 상을 받으면 시네마틱을 보여 줘요.
 *  · 차남곤 축구상(유망주)·리그 MVP·득점왕 같은 국내 수상 → 신문 기사(한 장이 빙글 돌며 날아들어요)
 *  · 황금 신예·신예 트로피 → 스포트라이트 아래 내 도트 선수가 서 있는 카드
 * 한 시즌에 최대 2번까지만 보여 줘서 지루해지지 않게 해요. 반환: KL_FX.cine 에 넘길 o 목록. */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const NEWS=["일간 풋볼 타임즈","주간 그라운드","스포츠 매일","풋볼 투데이"];
function paperMeta(R){ const m=pick([11,12]), d=1+Math.floor(Math.random()*27); return {name:pick(NEWS),no:"제 "+(18000+Math.floor(Math.random()*9000))+"호",date:R.year+"."+m+"."+d,stamp:pick(["단독","화제","주목"])}; }
function nm(S){ return S.p.name; }
L.awardCines=function(S,R){
  const out=[]; const aw=(R&&R.awards)||[]; if(!aw.length) return out;
  const name=nm(S), club=R.club?R.club.name:"", age=R.age||L.age(S);
  const stat=R.goals!=null&&R.apps?R.apps+"경기 "+R.goals+"골 "+R.assists+"도움":"", rate=R.rating?"평점 "+R.rating:"";
  const photo=(()=>{ try{ return L.pixelImg(S,124,{clean:true}); }catch(e){ return ""; } })();
  const has=re=>aw.find(a=>re.test(a));
  /* ① 황금 신예 · 신예 트로피 */
  { const g=has(/^황금 신예$/), c=has(/^신예 트로피$/);
    if(g) out.push({kind:"golden",kicker:"GOLDEN BOY · "+R.year,title:"황금 신예 "+name,sub:"유럽 무대에서 가장 빛난 21세 이하 선수로 뽑혔어요.",iconHtml:photo||"🌟",lines:[club+" · "+age+"세",stat,rate].filter(Boolean)});
    else if(c) out.push({kind:"golden",kicker:"COPA TROPHY · "+R.year,title:"신예 트로피",sub:name+", 21세 이하 세계 최고의 선수가 됐어요.",iconHtml:photo||"🏆",lines:[club+" · "+age+"세",stat,rate].filter(Boolean)}); }
  /* ② 차남곤 축구상 — 신문 기사 */
  { const a=has(/^차남곤 축구상/); if(a&&out.length<2){ const young=/유망주/.test(a);
    const heads=young?[name+", 눈에 띄는 어린 재능","'될성부른 떡잎' "+name,name+", 유망주 부문 영예"]:[name+", 차남곤 축구상 영예","올해의 축구 꿈나무 "+name,"학교 운동장이 키운 "+name];
    const bodies=[
      [club+"의 "+name+"("+age+"세)이(가) 올 시즌 "+(stat||"꾸준한 활약")+"으로 '차남곤 축구상'의 주인공이 됐다.","심사위원단은 \"기술은 물론 경기를 대하는 태도가 남달랐다\"고 평가했다.",name+"은(는) \"함께 뛴 동료와 코치님 덕분\"이라며 수줍게 소감을 전했다."],
      ["올해 '차남곤 축구상'은 "+club+"의 "+name+"에게 돌아갔다.","지도자들은 \"또래보다 한 박자 빠른 판단이 인상적\"이라고 입을 모았다.","수상자는 \"더 큰 무대에서도 지금처럼 즐겁게 뛰고 싶다\"고 밝혔다."],
      [age+"세 "+name+"이(가) 유망주를 대표하는 '차남곤 축구상'을 받았다.","한 시즌 "+(rate||"안정적인 경기력")+"을 기록하며 팀의 중심으로 자리잡은 점이 높은 점수를 받았다.","\"아직 배울 게 많다\"는 말에서 단단한 자세가 엿보였다."]];
    out.push({kind:"paper",kicker:young?"유망주 부문 수상":"수상 소식",title:pick(heads),sub:club+" · "+age+"세 · "+(stat||"올 시즌 활약"),lines:pick(bodies),photoHtml:photo,cap:name+(a.length>0?"":""),paper:paperMeta(R)}); } }
  /* ③ 리그 MVP · 득점왕 · 올해의 선수 — 신문 기사 */
  if(out.length<2){ const a=has(/MVP|올해의 선수|득점왕|황금 축구화|올해의 골키퍼/)&&!has(/^팀 올해의 선수$/)&&has(/MVP|올해의 선수|득점왕|황금 축구화|올해의 골키퍼/); if(a&&!/후보/.test(a)){
    const gk=/골키퍼/.test(a), top=/득점왕|황금 축구화/.test(a);
    const head=top?pick([name+", 올 시즌 최고의 해결사",name+", 득점 레이스 정상에","골문 앞의 지배자 "+name]):gk?pick([name+", 철벽의 한 해","골문을 지킨 "+name]):pick([name+", 올해의 주인공",name+", 한 시즌의 얼굴","리그를 평정한 "+name]);
    const body=top?[club+"의 "+name+"이(가) "+(R.goals!=null?R.goals+"골로 ":"")+"득점 1위에 올랐다.","마지막 경기까지 이어진 경쟁에서 끝내 앞서 나갔다.","\"팀 동료들이 만들어 준 골\"이라며 공을 돌렸다."]:gk?[club+"의 "+name+"이(가) "+(R.cs!=null?R.cs+"번의 무실점으로 ":"")+"골문을 지켰다.","결정적인 선방이 팀을 여러 번 구했다는 평가다.","\"수비수들과 함께 만든 기록\"이라고 말했다."]:["'"+a+"' 수상자는 "+club+"의 "+name+"이다.",(stat||"꾸준한 활약")+"이 높은 평가를 받았다.","\"팬들의 응원이 큰 힘이었다\"는 소감이 이어졌다."];
    out.push({kind:"paper",kicker:a,title:head,sub:club+" · "+(stat||rate||R.leagueName||""),lines:body,photoHtml:photo,cap:name,paper:paperMeta(R)}); } }
  return out.slice(0,2);
};
window.KL_I18N_EN_AWC=(()=>{ const NUM=s=>String(s).replace(/[0-9][0-9,]*(?:.[0-9]+)?/g,"#"), nd=o=>{ const r={}; Object.keys(o).forEach(k=>{ r[NUM(k)]=NUM(o[k]); }); return r; };
return nd({
 "황금 신예":"Golden Buy","신예 트로피":"Copa Trophy","유망주 부문 수상":"Rising star award","수상 소식":"Award news","일간 풋볼 타임즈":"Daily Football Times","주간 그라운드":"Weekly Ground","스포츠 매일":"Sports Daily","풋볼 투데이":"Football Today","단독":"EXCLUSIVE","화제":"BUZZ","주목":"NOTED",
 "유럽 무대에서 가장 빛난 21세 이하 선수로 뽑혔어요.":"Chosen as the brightest under-21 player on the European stage.",
 "'될성부른 떡잎'":"'A bud with promise'","눈에 띄는 어린 재능":"A young talent who stands out","유망주 부문 영예":"Rising star honour","영예":"honour","올해의 축구 꿈나무":"Football's young dreamer of the year","학교 운동장이 키운":"Raised on a school pitch",
 "심사위원단은 \"기술은 물론 경기를 대하는 태도가 남달랐다\"고 평가했다.":"The judges said, \"Not just his skill — his attitude to the game was exceptional.\"",
 "지도자들은 \"또래보다 한 박자 빠른 판단이 인상적\"이라고 입을 모았다.":"Coaches agreed: \"A decision-making speed a beat ahead of his peers is impressive.\"",
 "수상자는 \"더 큰 무대에서도 지금처럼 즐겁게 뛰고 싶다\"고 밝혔다.":"The winner said, \"I want to keep enjoying the game like this on bigger stages.\"",
 "\"아직 배울 게 많다\"는 말에서 단단한 자세가 엿보였다.":"\"There is still much to learn,\" he said, showing a solid attitude.",
 "마지막 경기까지 이어진 경쟁에서 끝내 앞서 나갔다.":"In a race that went to the final match, he finally pulled ahead.",
 "\"팀 동료들이 만들어 준 골\"이라며 공을 돌렸다.":"\"These are goals my teammates made for me,\" he said, sharing the credit.",
 "결정적인 선방이 팀을 여러 번 구했다는 평가다.":"His decisive saves rescued the team time and again, it is said.",
 "\"수비수들과 함께 만든 기록\"이라고 말했다.":"\"A record made together with the defenders,\" he said.",
 "\"팬들의 응원이 큰 힘이었다\"는 소감이 이어졌다.":"\"The fans' support was a great strength,\" he added.",
 "올 시즌 최고의 해결사":"this season's best finisher","올 시즌 활약":"this season's form","올해의 주인공":"the hero of the year","한 시즌의 얼굴":"the face of the season","리그를 평정한":"who conquered the league","골문 앞의 지배자":"master of the penalty area","철벽의 한 해":"a year as a wall","골문을 지킨":"who guarded the goal","득점 레이스 정상에":"tops the scoring race"
}); })();
})();
