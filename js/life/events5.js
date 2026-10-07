/*
 * K-라이프 현실감 이벤트 (js/life/events5.js) — 성적이 나쁠 때 따라오는 야유·악플·갈등
 * 선수가 항상 좋은 소리만 듣지는 않아요. 벤치 신세가 길어지면 이적을 요청하거나 감독과 부딪힐 수도 있어요.
 */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.EVC||!L.EVPOOL) return;
const R=(label,p,win,lose,ok,no)=>({label,p,win,lose,ok,no});
const Z=(label,win,ok)=>({label,safe:true,win,ok});
const pro=L.EVC.pro, age=S=>L.age(S);
/* 지난 시즌 기록(시즌 중에는 S.lastR 이 비어 있어서 기록에서 가져와요) */
const last=S=>{ const h=[...S.history].reverse().find(x=>!x.youth&&!x.military); if(!h) return null; const g=Math.max(8,(h.W||0)+(h.D||0)+(h.L||0)); return Object.assign({},h,{playShare:Math.min(1,(h.minutes||0)/(g*90))}); };
const E=(id,w,when,title,body,opts)=>L.EVPOOL.push({id,w,repeat:true,when,title,body,opts});
const poor=S=>{ const r=last(S); return pro(S)&&r&&!r.youth&&r.rating>0&&r.rating<5.7&&r.apps>=12; };
const benched=S=>{ const r=last(S); return pro(S)&&r&&!r.youth&&!r.military&&(r.playShare!=null?r.playShare<.3:r.apps<10)&&age(S)>=18&&age(S)<=33&&!(r.injury&&r.injury.severe); };
E("x_boo",3,poor,"야유가 쏟아진 경기장","최근 부진으로 홈 팬들이 경기 중에 야유를 보냈어요. 경기 뒤 SNS에도 비판 글이 가득해요.",
 [R("묵묵히 개인 훈련으로 답한다",70,{stat:1,trust:3,morale:-2},{morale:-6},"말 대신 발로 보여 주기로 했어요. 코치가 고개를 끄덕였어요.","마음만 앞서 훈련이 헛돌았어요."),
  R("SNS에 팬들에게 직접 반박한다",35,{fame:4,morale:4,char:-2},{fame:-6,rep:-4,morale:-6,char:-5},"일부 팬은 속이 시원하다고 했지만, 논란은 이어졌어요.","반박 글이 캡처돼 더 큰 비난으로 돌아왔어요. 구단에서 주의를 받았어요."),
  Z("감독에게 면담을 요청한다",{trust:3,morale:1},"감독이 지금 문제를 차분히 짚어 줬어요.")]);
E("x_troll",2,s=>poor(s)&&s.fame>=15,"악플이 이어진다","경기 뒤 댓글창이 온통 비난이에요. 가족을 향한 말까지 보여요.",
 [Z("신경 쓰지 않으려 휴대폰을 꺼 둔다",{morale:-2,cond:3},"조금 떨어져 있기로 했어요."),
  R("악플러에게 대댓글을 단다",30,{fame:5,char:-1},{fame:-8,rep:-5,char:-6},"한마디가 화제가 됐어요.","발끈한 글이 퍼져 구단이 사과문을 냈어요."),
  Z("구단 홍보팀에 대응을 맡긴다",{trust:1,morale:-1},"구단이 법적 대응을 예고했어요.")]);
E("x_drought",2,s=>{ const r=last(s); return pro(s)&&r&&r.apps>=15&&/FW|AM|WG/.test(s.p.pos)&&r.goals/r.apps<.1&&!r.youth;},"골 가뭄","공격수인데 골이 터지지 않아요. 팬 커뮤니티에는 '밥값을 해라'는 글이 올라와요.",
 [R("훈련 후 슈팅을 남아서 쏜다",65,{stat:1,morale:2},{cond:-5,morale:-3},"감각이 돌아오는 걸 느껴요.","무리하다 컨디션만 떨어졌어요."),
  Z("팬들에게 사과의 글을 남긴다",{fame:1,morale:-1,char:2},"진심이 전해졌다는 댓글이 달렸어요."),
  R("감독에게 키커 역할을 요청한다",45,{trust:2,morale:3},{trust:-4,morale:-3},"감독이 기회를 한 번 더 주기로 했어요.","'지금은 팀이 먼저'라는 대답만 들었어요.")]);
E("x_bench",3,benched,"벤치에서 터질 것 같다","오랫동안 출전 기회가 없어요. 에이전트도 '이대로면 커리어가 정체된다'고 해요.",
 [Z("공개적으로 이적을 요청한다",{demand:1,trust:-12,fame:-3,char:-3,morale:2},"이적 요청이 기사에 올랐어요. 구단이 다른 팀의 제안을 열어 두기로 했어요."),
  R("감독실 문을 두드려 항의한다",40,{trust:5,morale:3},{trust:-10,morale:-6,rep:-3,char:-4},"감독이 기회를 주겠다고 약속했어요.","감독이 '프로답지 못하다'며 선을 그었어요."),
  Z("참고 기회를 기다린다",{morale:-3,stat:1},"이를 악물고 훈련에 매달렸어요.")]);
E("x_fight",2,s=>pro(s)&&s.trust<.28&&age(s)>=18,"라커룸에서의 언쟁","훈련 중 전술 지시 문제로 감독과 목소리가 높아졌어요. 동료들이 말리고 있어요.",
 [R("끝까지 내 의견을 밀어붙인다",25,{trust:6,fame:2},{trust:-12,rep:-5,fame:-4,char:-4,inj:2,demand:1},"감독이 한 발 물러났어요.","징계를 받고 이적설까지 돌았어요."),
  Z("한발 물러서서 사과한다",{trust:2,morale:-2,char:2},"감독이 고개를 끄덕였어요."),
  Z("구단에 이적을 요청한다",{demand:1,trust:-8,char:-2},"구단이 일단 요청을 받아들였어요.")]);
})();
