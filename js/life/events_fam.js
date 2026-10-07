/*
 * K-라이프 가정환경 이벤트 (js/life/events_fam.js) — 집안 형편이 눈에 보이는 기회·시련으로 이어져요
 *  부유: 개인 코치·해외 캠프 초대 / 평범: 동네 코치의 무료 레슨 / 빠듯·어려움: 장학·후원·알바 같은 이야기
 */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.EVC||!L.EVPOOL) return;
const R=(label,p,win,lose,ok,no)=>({label,p,win,lose,ok,no});
const Z=(label,win,ok)=>({label,safe:true,win,ok});
const {minor,univ}=L.EVC, kid=S=>S.family&&(minor(S)||univ(S)), fid=S=>S.family&&S.family.id;
const E=(id,w,when,title,body,opts)=>L.EVPOOL.push({id,w,when,title,body,opts});
E("f_coach",2.4,S=>kid(S)&&["rich","upper"].includes(fid(S))&&S.stage==="youth"&&S.funds>=.3,"전담 코치를 붙여 줄게",
 "부모님이 알아봐 둔 전직 국가대표 출신 코치가 일대일 레슨을 해 주겠대요. 비용은 집에서 댈게요.",
 [R("제대로 배워 본다",85,{stat:2,morale:3},{cond:-5,morale:-2},"집중 레슨으로 감각이 눈에 띄게 좋아졌어요.","강도가 너무 높아 몸이 먼저 지쳤어요."),
  Z("팀 훈련에 집중하고 싶다고 말씀드린다",{trust:2,morale:2},"팀 안에서 신뢰가 쌓였어요.")]);
E("f_camp",1.6,S=>kid(S)&&fid(S)==="rich"&&S.stage==="youth"&&L.age(S)>=14,"방학 해외 캠프 초대",
 "집안 인맥으로 유럽 구단 방학 캠프에 갈 수 있게 됐어요. 비행기 표도 이미 끊어 놨대요.",
 [R("떠난다",70,{stat:2,pot:1,fame:1,morale:4},{cond:-6,morale:-4},"낯선 훈련 방식에서 배운 게 많았어요.","언어도 음식도 낯설어 힘들게 돌아왔어요."),
  Z("친구들과 국내 훈련을 한다",{trust:2,morale:2},"팀 동료들과 끈끈해졌어요.")]);
E("f_free",2.2,S=>kid(S)&&["mid","tight"].includes(fid(S))&&S.stage==="youth","동네 코치의 무료 레슨",
 "동네 축구교실 코치가 재능이 아깝다며 방과 후에 무료로 가르쳐 주겠대요.",
 [R("고맙게 배운다",90,{stat:1,morale:3,trust:1},{morale:-2},"공짜지만 값진 레슨이었어요.","일정이 안 맞아 몇 번 못 갔어요."),
  Z("혼자 벽치기 훈련을 한다",{cond:3},"묵묵히 몸을 만들었어요.")]);
E("f_schol",2.4,S=>kid(S)&&["tight","poor"].includes(fid(S))&&S.fame>=3,"장학 제안이 들어왔어요",
 "근처 사립 학교가 축구부 장학생으로 받아 주겠대요. 등록금과 합숙비를 줄여 줘요.",
 [R("제안을 받아들인다",90,{fam:2,morale:4,trust:1},{morale:-2},"한시름 놓았어요. 훈련에만 집중할 수 있어요.","조건이 맞지 않아 무산됐어요."),
  Z("지금 팀에 남는다",{trust:2},"의리를 지켰어요.")]);
E("f_job",2,S=>kid(S)&&fid(S)==="poor"&&S.stage==="univ","편의점 야간 알바",
 "등록금이 모자라 부모님 몰래 알바를 알아봤어요. 야간이라 훈련에 지장이 올 수도 있어요.",
 [R("일하면서 버틴다",60,{funds:.1,morale:2,char:1},{cond:-8,morale:-4},"생활비를 보태고 책임감을 배웠어요.","몸이 못 버텨 훈련에서 졸았어요."),
  Z("대출을 알아본다",{funds:.05,morale:-1},"빚이 생겼지만 훈련은 지켰어요.")]);
E("f_dinner",1.6,S=>kid(S)&&["mid","tight","poor"].includes(fid(S)),"부모님의 빈 그릇",
 "밥을 먹다 보니 부모님 그릇엔 밥이 거의 없어요. 내 훈련비 때문에 아끼고 계셨어요.",
 [R("꼭 프로가 되어 갚겠다고 다짐한다",100,{morale:5,char:1},{},"눈시울이 뜨거워졌어요. 더 독해졌어요."),
  Z("내일 아침 일찍 개인 훈련을 한다",{stat:1,cond:-2},"작은 다짐이 발끝에 실렸어요.")]);
const proF=S=>S.stage==="pro"&&S.family&&["tight","poor"].includes(fid(S));
E("f_remit",2.2,S=>proF(S)&&S.funds>=.5&&!(S.evSeen||[]).includes("f_remit"),"가족에게 보내는 첫 월급",
 "어려운 시절 뒷바라지해 주신 부모님이 떠올라요. 통장에 처음으로 여유가 생겼어요.",
 [R("생활비를 보내 드린다",100,{funds:-.3,morale:6,char:2,rep:1},{},"부모님이 전화로 한참 우셨어요. 마음이 한결 가벼워졌어요."),
  Z("전액 맡기고 용돈만 받는다",{funds:-.6,morale:8,char:3},"가족이 든든해하며 응원 플래카드를 만들어 왔어요."),
  Z("지금은 내 커리어에 집중한다",{trust:1},"곧 꼭 보답하겠다고 다짐했어요.")]);
E("f_home",1.6,S=>proF(S)&&fid(S)==="poor"&&S.funds>=3&&!(S.evSeen||[]).includes("f_home"),"부모님께 집을 사 드릴 수 있을까",
 "월세방을 전전하던 가족에게 내 집을 마련해 주고 싶어요. 계약금이 필요해요.",
 [R("집을 사 드린다",100,{funds:-2.5,morale:10,char:3,rep:3,fame:2},{},"부모님이 현관 앞에서 한참을 서 계셨어요. 기사에도 훈훈하게 소개됐어요."),
  Z("전세 보증금만 보태 드린다",{funds:-.8,morale:5,char:1},"작지만 안정된 보금자리가 생겼어요."),
  Z("나중에 더 성공하면 사 드린다",{morale:-2},"아직은 때가 아니라고 스스로를 달랬어요.")]);
})();
