/* 세부 능력치: 큰 능력치 하나를 눌러 펼치면 보이는 '결'이에요. 큰 능력치의 평균이 되도록 선수마다 고정된 편차를 줘요.
 * 겉으로 보이는 능력치 이름과 각 능력치의 효과 설명도 여기서 관리해요. */
(function(){
const L=window.LIFE; if(!L) return;
const SUBS={
 finishing:[["근거리 마무리","골문 앞에서 침착하게 밀어 넣는 힘"],["중장거리 슛","박스 밖에서 때리는 한 방"],["공중 장악","헤딩 경합과 높은 볼 마무리"]],
 dribble:[["볼 컨트롤","발끝에 공을 붙여 두는 능력"],["방향 전환","수비를 흔드는 페인트와 턴"],["압박 탈출","좁은 공간에서 공을 지키는 힘"]],
 pace:[["최고 속도","직선에서 달리는 최대 스피드"],["순간 가속","첫 두세 걸음의 폭발력"],["지치지 않는 질주","경기 후반에도 속도가 유지되는 힘"]],
 physical:[["몸싸움","어깨싸움과 버티기"],["점프·타이밍","공중볼 경합"],["균형감","부딪혀도 쓰러지지 않는 중심"]],
 composure:[["결정적 순간 담력","큰 경기·페널티킥에서의 침착함"],["일대일 해결","골키퍼와 마주했을 때 판단"],["압박 속 판단","수비가 붙어도 흔들리지 않는 선택"]],
 passing:[["킥 정확도","짧고 긴 패스의 정확성"],["크로스","측면에서 올리는 공"],["패스 창의력","허를 찌르는 패스 아이디어"]],
 vision:[["공간 인식","빈 곳을 먼저 읽는 눈"],["템포 조절","경기 속도를 올리고 늦추는 감각"],["전환 판단","수비에서 공격으로 넘어가는 순간의 선택"]],
 stamina:[["활동량","90분 동안 뛰는 거리"],["회복력","짧은 시간에 다시 달릴 수 있는 힘"],["강도 유지","압박을 끝까지 거는 힘"]],
 defending:[["위치 선정","어디에 서 있어야 막히는지 아는 감각"],["공간 커버","동료의 빈틈을 메우는 능력"],["읽기·인터셉트","패스 길을 끊는 예측"]],
 tackle:[["대인 마크","상대를 따라붙어 지우는 힘"],["태클 타이밍","공만 정확히 걷어내는 기술"],["투지","경합에서 물러서지 않는 마음"]],
 building:[["후방 패스","수비 라인에서 시작하는 패스"],["전진 패스","한 번에 라인을 깨는 패스"],["볼 소유 안정감","압박 속에서도 공을 지키는 침착함"]],
 saving:[["슈팅 선방","강한 슛을 막아내는 능력"],["일대일 방어","나와서 각도를 좁히는 능력"],["위기 선방","결정적인 순간의 슈퍼 세이브"]],
 reflex:[["반사 신경","가까운 거리의 슛 반응"],["다이빙 범위","좌우로 뻗는 몸의 길이"],["민첩성","빠른 자세 전환"]],
 handling:[["캐칭","공을 안정적으로 잡는 능력"],["펀칭","잡기 어려운 공을 쳐내는 능력"],["세컨드 볼 처리","튕겨 나온 공을 정리하는 능력"]],
 kicking:[["골킥 거리","멀리 보내는 킥"],["발밑 패스","짧게 이어 주는 패스"],["빌드업 판단","어디로 보낼지의 선택"]],
 command:[["수비 조율","라인과 위치를 지휘하는 능력"],["공중볼 판단","크로스에 나올지 말지의 결정"],["소통·리더십","수비수들을 움직이는 목소리"]]
};
/* 각 큰 능력치의 효과 (경기와 성장에 어떻게 쓰이는지) */
const FX={
 finishing:"득점 확률과 골 마무리의 질을 직접 좌우해요. 골잡이형은 이 능력치가 가장 크게 반영돼요.",
 dribble:"수비를 벗겨 찬스를 만들고 드리블 돌파 득점·도움에 영향을 줘요.",
 pace:"역습 기회와 침투 성공률에 영향을 줘요. 나이가 들면 가장 먼저 떨어지는 능력치예요.",
 physical:"몸싸움·공중볼과 부상을 견디는 힘이에요. 큰 부상을 입으면 가장 먼저 깎여요.",
 composure:"큰 경기·페널티킥·일대일 상황에서 득점 확률을 지켜 줘요.",
 passing:"도움 기회와 패스 연결에 영향을 줘요. 윙어는 크로스 역할에서 특히 중요해요.",
 vision:"키패스와 도움의 질, 경기 템포 조율에 영향을 줘요.",
 stamina:"후반에도 활동량과 평점이 유지돼요. 컨디션 하락도 줄여 줘요.",
 defending:"수비 안정성과 무실점 기여, 팀 실점 감소에 영향을 줘요.",
 tackle:"일대일 수비와 공 탈취 성공률에 영향을 줘요.",
 building:"후방에서 공격을 시작하는 패스의 질에 영향을 줘요.",
 saving:"슈팅 선방과 클린시트에 가장 크게 영향을 줘요.",
 reflex:"가까운 거리 슛과 예상 못 한 슛 방어에 영향을 줘요.",
 handling:"공을 흘리는 실수를 줄여 줘요.",
 kicking:"빌드업 시작점이자 긴 킥 역습의 질에 영향을 줘요.",
 command:"수비 조직력과 크로스 대응에 영향을 줘요."
};
const hash=str=>{ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
/* 큰 능력치 k 의 세부 능력치 3개 (평균이 큰 능력치와 같아요) */
L.subStats=function(p,k){
  const def=SUBS[k]; if(!def) return [];
  const main=p.stats[k]!=null?p.stats[k]:50, seed=(p.name||"")+(p.number||0)+(p.pot0||p.pot||0);
  const raw=def.map((d,i)=>((hash(seed+k+i)%15)-7));
  const m=Math.round(raw.reduce((a,b)=>a+b,0)/raw.length);
  return def.map((d,i)=>({name:d[0],desc:d[1],v:Math.max(10,Math.min(L.statCap?L.statCap(p):99,main+raw[i]-m))}));
};
L.statFx=k=>FX[k]||"";
/* 세부 능력치가 경기에 주는 작은 보정: 득점(g)·도움(a)·평점(r). 큰 능력치가 같아도 '결'이 다르면 결과가 달라져요. */
L.subEdge=function(p){
  const st=p.stats||{}, v=(k,i)=>{ const x=L.subStats(p,k)[i]; return x?x.v:50; };
  let g=1,a=1,r=0;
  if(p.pos==="FW"&&st.finishing!=null){ const w=p.type==="target"?[.2,.2,.6]:p.type==="dribbler"?[.3,.5,.2]:[.6,.25,.15]; const sv=v("finishing",0)*w[0]+v("finishing",1)*w[1]+v("finishing",2)*w[2]; g=1+Math.max(-.2,Math.min(.2,(sv-st.finishing)/45)); }
  else if(p.pos==="MF"&&st.vision!=null){ const sv=(v("vision",2)+v("passing",2))/2; a=1+Math.max(-.2,Math.min(.2,(sv-(st.vision+st.passing)/2)/45)); }
  if(p.pos==="FW"&&st.passing!=null&&(p.sub==="LW"||p.sub==="RW")) a*=1+Math.max(-.15,Math.min(.15,(v("passing",1)-st.passing)/50));
  if(p.pos==="DF"&&st.defending!=null) r=Math.max(-.2,Math.min(.2,(v("defending",0)*.5+v("tackle",0)*.5-(st.defending+st.tackle)/2)/40));
  if(p.pos==="GK"&&st.saving!=null) r=Math.max(-.2,Math.min(.2,(v("saving",2)+v("handling",0)-st.saving-st.handling)/60));
  return {g,a,r};
};
})();
