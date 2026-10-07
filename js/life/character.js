/*
 * 인성 점수 활용 (js/life/character.js)
 * 인성(0~100)이 커리어에 실제로 영향을 줘요.
 *  ① 주장 선임(인성 높고 오래 뛴 선수) → 팀 분위기·감독 신뢰 ▲
 *  ② 재계약: 인성이 높으면 더 길고 좋은 조건, 낮으면 짧고 박한 조건
 *  ③ 스캔들/미담 이벤트: 인성이 낮으면 스캔들, 높으면 팬들의 미담
 *  ⑤ 광고 이미지 조항: 인성이 낮으면 광고가 해지되고, 높으면 모범 이미지 보너스
 *  ⑥ 후배 멘토링 이벤트 · 자녀는 부모의 인성을 일부 물려받아요
 *  ⑦ 은퇴식 연출이 인성에 따라 달라져요
 *  ⑧ 친정 복귀: 인성 높은 선수에게 예전에 뛴 팀이 돌아오라고 손을 내밀어요
 */
(function(){
"use strict";
const L=window.LIFE; if(!L||!L.EVPOOL) return;
const {clamp,pick,ri,r1}=L; const age=S=>L.age(S);
const pro=S=>S.stage==="pro"&&S.club&&S.club.lg!=="MIL";
const R=(label,p,win,lose,ok,no)=>({label,p,win,lose,ok,no});
const Z=(label,win,ok)=>({label,safe:true,win,ok});
const E=(id,w,when,title,body,opts)=>L.EVPOOL.push({id,w,repeat:true,when,title,body,opts});
const yrsAt=S=>{ const k=S.club&&S.club.name; return (S.clubYears&&S.clubYears[k])||0; };
const lastShare=S=>{ const h=[...S.history].reverse().find(x=>!x.youth&&!x.military); if(!h) return 0; return Math.min(1,(h.minutes||0)/(Math.max(8,(h.W||0)+(h.D||0)+(h.L||0))*90)); };

/* 미니게임 이벤트: 페널티킥·프리킥 (직접 해 보는 선택) */
const M=(o,t)=>Object.assign(o,{mini:t});
E("m_pk",3,S=>pro(S)&&S.p.pos!=="GK"&&S.p.ovr>=55&&S.sim&&S.sim.seg>=1&&age(S)>=17,"페널티킥 찬스","후반 추가시간, 페널티킥이 선언됐어요. 주장이 공을 건네며 말해요. \"네가 찰래?\"",
 [M(R("내가 직접 찬다 (직접 차 보기)",50,{fame:8,morale:10,trust:4,goalbonus:1},{fame:-4,morale:-10,trust:-2},"골문 구석을 가르는 완벽한 킥!","골키퍼가 막아냈어요. 고개를 숙였지만 동료들이 다독였어요."),"pk"),
  Z("키커를 동료에게 양보한다",{morale:1,trust:1},"팀을 먼저 생각했어요.")]);
E("m_fk",3,S=>pro(S)&&S.p.pos!=="GK"&&S.p.ovr>=58&&S.sim&&S.sim.seg>=1&&age(S)>=17&&((S.p.stats.passing||0)>=55||(S.p.stats.composure||0)>=55),"프리킥 기회","박스 앞 약 25m, 절묘한 위치의 프리킥이에요. 벽이 높게 쌓였어요.",
 [M(R("직접 감아 찬다 (손가락으로 궤적 그리기)",50,{fame:7,morale:9,trust:3},{morale:-5,trust:-1},"벽을 넘어 골문 구석에 꽂혔어요!","벽이나 골키퍼에게 막혔어요. 다음엔 더 잘 차야죠."),"fk"),
  Z("팀 프리킥 전문가에게 맡긴다",{morale:1},"믿고 맡겼어요.")]);
/* 포지션 전향 제안: 선수의 강점이 다른 자리에서 더 빛날 때 */
const cvOpt=(label,np,ns,tail)=>[R(label+" (전향한다)",65,{conv:np+":"+ns,trust:3,morale:4},{trust:-3,morale:-5},"새 자리가 낯설지만 빠르게 적응하기 시작했어요."+tail,"전향 훈련이 잘 풀리지 않아 한동안 헤맸어요."),Z("지금 자리를 지키고 싶다고 말한다",{trust:-1,morale:1},"감독은 알겠다며 고개를 끄덕였어요.")];
E("cv_fb_w",3,S=>pro(S)&&S.p.pos==="DF"&&(S.p.sub==="LB"||S.p.sub==="RB")&&age(S)<=30&&S.p.stats.pace>=S.p.ovr-3,"윙어로 올려 볼까?","감독이 당신의 스피드를 눈여겨봤어요. \"측면 공격수로 올려 보자. 오버래핑보다 더 큰 위협이 될 거야.\"",cvOpt("측면 공격수로 올라간다","FW","SIDE",""));
E("cv_dm_cb",2,S=>pro(S)&&S.p.pos==="MF"&&S.p.sub==="DM"&&S.p.stats.defending>=S.p.ovr&&age(S)>=22,"센터백 전향 제안","수비 라인에 구멍이 났어요. \"수비 감각이 좋은 네가 센터백을 맡아 줬으면 해.\"",cvOpt("센터백으로 내려간다","DF","CB",""));
E("cv_cb_dm",2,S=>pro(S)&&S.p.pos==="DF"&&S.p.sub==="CB"&&S.p.stats.building>=S.p.ovr-1&&age(S)>=22,"한 칸 올라가 볼까?","공을 다루는 센스가 좋다는 평가예요. \"수비형 미드필더로 올라가면 팀이 더 안정될 거야.\"",cvOpt("수비형 미드필더로 올라간다","MF","DM",""));
E("cv_am_st",2,S=>pro(S)&&S.p.pos==="MF"&&S.p.sub==="AM"&&S.p.stats.dribble>=S.p.ovr&&age(S)<=31,"최전방으로 나설 수 있나?","감독이 말해요. \"골이 필요해. 최전방에서 한번 뛰어 봐.\"",cvOpt("스트라이커로 올라간다","FW","ST",""));
E("cv_st_am",2,S=>pro(S)&&S.p.pos==="FW"&&S.p.sub==="ST"&&S.p.stats.passing>=S.p.ovr-6&&age(S)>=24,"한 칸 내려와 볼까?","감독이 영상을 보여 줘요. \"네 패스 센스는 한 칸 뒤에서 더 빛나. 공격형 미드필더를 맡아 줘.\"",cvOpt("공격형 미드필더로 내려간다","MF","AM",""));
E("cv_w_fb",2,S=>pro(S)&&S.p.pos==="FW"&&(S.p.sub==="LW"||S.p.sub==="RW")&&age(S)>=27&&S.p.stats.pace>=S.p.ovr-4,"풀백으로 내려가 볼래?","나이가 들며 활동량이 줄어드는 대신 풀백으로 내려가면 더 오래 뛸 수 있다는 제안이 왔어요.",cvOpt("풀백으로 내려간다","DF","SIDEB",""));
E("m_so",3,S=>pro(S)&&S.p.pos!=="GK"&&S.p.ovr>=55&&S.sim&&S.sim.seg>=1&&age(S)>=17&&(S.sim.recs||[]).some(r=>r.pk&&r.min>0),"승부차기","이번 시즌 컵 경기가 승부차기까지 갔던 순간을 떠올려요. 감독이 키커 명단을 짜며 당신을 쳐다봐요. (실제로 승부차기까지 간 경기가 있을 때만 나와요)",
 [M(R("키커로 나선다 (승부차기 직접 차 보기)",50,{fame:9,morale:11,trust:4,goalbonus:0},{fame:-5,morale:-12,trust:-3},"승부차기를 이기고 팀이 환호했어요!","승부차기에서 지고 말았어요. 팀원들이 어깨를 두드려 줬어요."),"so"),
  Z("순서를 후배에게 양보한다",{morale:1,trust:1},"팀을 먼저 생각했어요.")]);
E("m_corner",3,S=>pro(S)&&S.p.pos!=="GK"&&((S.p.stats.physical||0)>=60)&&S.sim&&S.sim.seg>=1&&age(S)>=17,"코너킥 헤딩","후반 막판 코너킥 기회예요. 키가 큰 당신에게 모두의 시선이 쏠려요.",
 [M(R("박스 안으로 달려든다 (헤딩 직접 해 보기)",50,{fame:7,morale:9,trust:3,goalbonus:1},{morale:-4,trust:-1},"헤딩이 골망을 흔들었어요!","점프가 어긋나 아쉽게 놓쳤어요."),"hd"),
  Z("수비 가담에 집중한다",{trust:2},"묵묵히 자기 자리를 지켰어요.")]);
E("m_cn",3,S=>pro(S)&&S.p.pos!=="GK"&&((S.p.stats.passing||0)>=58||(S.p.stats.composure||0)>=58)&&S.sim&&S.sim.seg>=1&&age(S)>=17,"코너킥 키커","후반 막판 코너킥이에요. 전담 키커가 교체돼 나가고 감독이 당신을 가리켜요. \"네가 올려 봐.\"",
 [M(R("직접 올린다 (코너킥 직접 차 보기)",50,{fame:5,morale:8,trust:3,assbonus:1},{morale:-4,trust:-1},"올린 공이 동료의 머리에 정확히 맞아 골이 됐어요!","크로스가 아쉽게 걷어내졌어요."),"cn"),
  Z("전담 키커에게 맡긴다",{trust:1},"팀의 약속을 지켰어요.")]);
/* ===== 유소년 시절 이야기 ===== */
const yth=S=>S.stage==="youth";
E("yt_bento",2.2,S=>yth(S)&&age(S)<=17,"어머니의 도시락","새벽 훈련 때마다 어머니가 말없이 도시락을 싸 주세요. 오늘은 뚜껑 안에 쪽지가 들어 있어요.",[
  Z("쪽지를 소중히 간직한다",{morale:7,trust:2},"\"오늘도 파이팅\" 한 줄이 하루를 버티게 해 줘요."),
  R("친구들에게 자랑한다",55,{morale:5,fame:1},{morale:-3},"친구들이 부러워하며 응원해 줬어요.","놀림이 돼 조금 민망했어요.")]);
E("yt_boots",2,S=>yth(S)&&age(S)<=16,"첫 축구화","낡은 축구화가 완전히 닳았어요. 새 축구화를 사기엔 형편이 빠듯해요.",[
  R("용돈을 모아 직접 산다",70,{morale:6,cond:3},{morale:1},"처음으로 내 돈으로 산 축구화! 발에 착 붙어요.","모은 돈이 부족해 한 달을 더 기다렸어요."),
  Z("낡은 신발로 한 달 더 버틴다",{morale:-1,trust:2},"끈기 있는 모습이 코치의 눈에 들었어요.")]);
E("yt_snow",1.8,S=>yth(S),"눈 오는 날의 훈련","폭설이 내려 운동장이 하얗게 덮였어요. 코치가 \"오늘은 눈밭에서 한다\"고 말해요.",[
  Z("신나게 눈밭을 달린다",{morale:6,cond:-2,pace:1},"공이 눈에 푹푹 빠졌지만 모두가 웃었어요."),
  Z("실내에서 볼 컨트롤만 한다",{morale:2,cond:2},"차분히 기본기를 다졌어요.")]);
E("yt_transfer_school",1.6,S=>yth(S)&&age(S)>=14&&age(S)<=17,"전학 제의","축구 명문 학교에서 전학 제의가 왔어요. 친구들과 떨어지는 건 싫지만 기회일지도 몰라요.",[
  R("전학을 결심한다",60,{trust:3,morale:-2,pot:1},{morale:-6,trust:-2},"낯선 환경에서 더 치열하게 경쟁하게 됐어요.","적응이 어려워 한동안 외로웠어요."),
  Z("지금 학교에 남는다",{morale:4},"친구들과의 시간을 택했어요.")]);
E("yt_final",2,S=>yth(S)&&age(S)>=13,"동네 대회 결승전","코치가 말해요. \"이번 결승, 네가 마지막 키커다.\" 운동장 가장자리에는 온 동네 사람들이 모였어요.",[
  R("당당하게 공을 찬다",55,{morale:9,fame:3},{morale:-6,fame:-1},"공이 골망을 흔들었어요! 동네가 떠나갈 듯 환호했어요.","공이 골대를 맞고 나갔어요. 친구들이 어깨를 감싸 줬어요."),
  Z("후배에게 기회를 양보한다",{trust:3,morale:1},"코치가 고개를 끄덕이며 어깨를 두드렸어요.")]);
E("yt_rival_gift",1.2,S=>yth(S)&&age(S)>=14,"라이벌의 편지","경기에서 늘 맞붙던 다른 학교 선수가 쪽지를 건넸어요. \"다음에도 지지 않을 거야.\"",[
  Z("나도 쪽지로 답한다",{morale:5,trust:1},"라이벌과 서로를 키워 주는 사이가 됐어요."),
  Z("대답 없이 더 열심히 한다",{morale:2,cond:-1},"말없이 속으로 불타올랐어요.")]);
/* 스타 기질 전용 이벤트: 능력치와 상관없이 '스타'라서 열리는 길 */
const star=S=>L.isStar&&L.isStar(S);
E("st_cover",3,S=>pro(S)&&star(S)&&S.fame>=25,"패션 매거진 화보","유명 패션 매거진에서 표지 모델 제안이 왔어요. 촬영은 이틀이 걸려요.",
 [R("표지를 장식한다",75,{fame:9,funds:3,morale:6,rep:2},{fame:3,morale:-3,trust:-3},"사진이 화제가 되면서 팬층이 훨씬 넓어졌어요.","촬영 때문에 훈련을 빠져 감독이 눈치를 줬어요."),
  Z("거절하고 훈련에 집중한다",{trust:3,morale:2},"운동선수답게 그라운드로 돌아왔어요.")]);
E("st_variety",3,S=>pro(S)&&star(S)&&S.fame>=40,"예능 출연 제의","인기 예능 프로그램에서 게스트로 나와 달라는 연락이 왔어요.",
 [R("출연한다",70,{fame:10,funds:2,morale:8},{fame:-3,rep:-2,morale:-4},"재치 있는 입담으로 국민 선수 이미지가 생겼어요.","어색한 장면이 편집 없이 나가 놀림거리가 됐어요."),
  Z("정중히 사양한다",{rep:2},"경기에만 집중하겠다고 답했어요.")]);
E("st_ambassador",2,S=>pro(S)&&star(S)&&S.fame>=60,"글로벌 브랜드 앰배서더","글로벌 스포츠 브랜드가 얼굴이 되어 달라는 대형 제안을 보냈어요.",
 [Z("앰배서더 계약을 맺는다",{fame:12,funds:8,rep:4,morale:6},"전 세계 매장에 내 얼굴이 걸렸어요."),
  R("조건을 더 올려 협상한다",50,{fame:12,funds:16,rep:5},{fame:2,funds:2},"협상이 통해 더 큰 계약을 따냈어요.","협상이 길어져 제안이 줄어들었어요.")]);
E("st_fanmeet",3,S=>pro(S)&&star(S)&&S.fame>=30,"팬 사인회","팬클럽이 대규모 사인회를 열고 싶다고 해요.",
 [Z("직접 얼굴을 비춘다",{fame:6,morale:10,rep:3},"줄이 끝없이 이어졌고 팬들과 눈을 맞췄어요."),
  Z("영상 메시지로 대신한다",{fame:2,morale:2},"팬들이 영상을 돌려 보며 아쉬워했어요.")]);
/* GOAT 각성: 99의 벽을 넘는 아주 드문 길 */
E("c_goat",2,S=>pro(S)&&!S.goat&&S.p.ovr>=96&&(S.ballon||[]).length>=2&&age(S)>=26&&age(S)<=32,"GOAT의 문턱","당신은 이미 세계 최고예요. 그런데 코치진이 조심스럽게 말해요. \"인간의 한계라고 부르는 99… 그 너머를 보고 싶지 않아요?\"",
 [Object.assign(R("모든 걸 걸고 각성 훈련에 들어간다 (미니게임 · 타이밍이 좋을수록 확률↑)",42,{goat:1,fame:12,morale:10},{inj:6,cond:-25,morale:-12},"새벽마다 한계를 부수는 훈련 끝에, 몸이 다른 차원으로 넘어갔어요.","무리한 훈련이 몸을 망가뜨렸어요. 한동안 쉬어야 해요."),{mini:"awake"}),
  Z("지금의 몸을 지키며 현역을 오래 간다",{morale:4,cond:8},"무리하지 않고 정상의 자리를 오래 지키기로 했어요.")]);
/* S급의 달콤한 유혹: 몸 관리 vs 지금의 즐거움 */
E("c_temptation",3,S=>pro(S)&&S.p.ovr>=84&&(S.fame||0)>=60,"황금빛 유혹","톱스타가 된 당신에게 파티 초대, 광고 촬영, 예능 출연이 끝없이 들어와요. 몸을 챙길 시간이 줄어들어요.",
 [Z("전부 즐긴다 (돈과 인기를 쓸어 담는다)",{funds:6,fame:10,morale:12,slack:22,char:-2},"눈부신 한 해였지만 몸은 점점 무거워졌어요."),
  Z("광고 촬영만 하고 컨디션 관리",{funds:3,fame:4,morale:3},"균형을 지켰어요."),
  Z("전부 거절하고 훈련에 집중",{morale:-3,cond:6,trust:3},"축구에만 집중했어요. 조금은 외롭네요.")]);
/* 2군 선수가 잘하거나 포지션에 구멍이 나면 1군에서 부르러 와요 */
E("c_callup",3,S=>pro(S)&&S.team==="2군"&&S.sim&&S.sim.seg>=1&&(S.p.ovr>=((S.club&&S.club.l)||70)-7||(S.lastRatingHot)||Math.random()<.35),"1군 호출","1군 감독이 직접 당신을 호출했어요. 주전 선수의 부상과 포지션 공백이 겹쳤고, 2군에서의 활약도 눈에 들어왔다고 해요.",
 [Z("바로 1군 훈련에 합류한다",{callup:1,trust:6,morale:8,fame:2},"1군 라커룸의 첫 훈련. 긴장되지만 기회예요."),
  Z("한 경기만 더 2군에서 뛰고 합류한다",{callup:1,trust:3,morale:3},"차분하게 마무리하고 합류했어요.")]);
/* ① 주장 */
L.isCaptain=S=>!!(S.captain&&S.club&&S.captain.club===S.club.id);
E("c_captain",3,S=>pro(S)&&age(S)>=25&&L.charOf(S)>=60&&yrsAt(S)>=3&&lastShare(S)>=.5&&!L.isCaptain(S)&&!(S.captainNo&&S.captainNo===S.club.id),
 "주장 완장 제안","감독과 선수단이 당신을 새 주장으로 추천했어요. 그라운드 안팎에서 쌓아 온 신뢰 덕분이에요.",
 [Z("영광스럽게 완장을 찬다",{trust:8,morale:6,fame:2,captain:1},"선수단 앞에서 짧고 단단한 취임 인사를 했어요."),
  Z("후배에게 양보한다",{morale:2,char:2,captainNo:1},"겸손한 선택에 동료들이 박수를 보냈어요.")]);
E("c_captain_lost",2,S=>pro(S)&&L.isCaptain(S)&&L.charOf(S)<42,"주장 완장 박탈","잇따른 구설로 선수단의 신뢰를 잃었어요. 구단이 주장 교체를 검토 중이에요.",
 [Z("완장을 내려놓는다",{trust:-4,morale:-4,captainOff:1},"스스로 물러나는 모습에 일부 팬이 다시 지켜봐 주기로 했어요."),
  R("끝까지 맡겠다고 버틴다",35,{trust:3,morale:2},{trust:-9,fame:-4,captainOff:1},"감독이 한 번 더 믿어 줬어요.","결국 완장을 빼앗겼어요.")]);
/* ③ 스캔들·미담 */
E("c_scandal",2.2,S=>pro(S)&&L.charOf(S)<38&&S.fame>=15,"스캔들 기사","당신의 사생활과 태도를 다룬 자극적인 기사가 터졌어요. 구단과 광고주가 상황을 지켜보고 있어요.",
 [Z("공개 사과문을 올린다",{fame:-4,char:3,rep:-2},"진정성 있는 사과에 비난이 조금 가라앉았어요."),
  R("전부 사실무근이라고 부인한다",45,{fame:2,morale:2},{fame:-14,rep:-8,char:-4,trust:-5},"증거가 없어 논란이 흐지부지됐어요.","추가 폭로가 이어져 큰 논란이 됐어요."),
  Z("대응하지 않는다",{fame:-6,morale:-3},"시간이 지나길 기다리기로 했어요.")]);
E("c_goodwill",2.2,S=>pro(S)&&L.charOf(S)>=72&&S.fame>=12,"팬들의 미담","경기 뒤 어린 팬을 챙기는 모습이 SNS에서 화제가 됐어요. 구단은 이 미담을 크게 소개하고 싶어 해요.",
 [Z("구단 공식 영상에 출연한다",{fame:6,rep:4,char:1},"따뜻한 영상이 퍼지며 이미지가 한층 좋아졌어요."),
  Z("조용히 넘어가자고 부탁한다",{rep:3,char:2},"겸손한 태도가 또 한 번 칭찬을 받았어요.")]);
/* ⑥ 멘토링 */
E("c_mentor",2,S=>pro(S)&&age(S)>=28&&L.charOf(S)>=66,"후배 멘토링","재능은 있지만 흔들리는 신인이 당신에게 조언을 구해요.",
 [Z("시간을 내어 직접 가르친다",{morale:3,char:2,rep:3,trust:3},"후배가 훈련장에서 눈에 띄게 달라졌어요."),
  Z("짧게 조언만 해 준다",{rep:1},"몇 마디가 후배에게 큰 힘이 됐어요.")]);
/* ② 재계약: 인성이 조건에 반영돼요 */
const _co=L.contractOffer;
L.contractOffer=function(S){
  const c=_co(S); const ch=L.charOf(S);
  if(ch>=72){ c.years=Math.min(5,c.years+1); c.offer=r1(c.offer*1.03); c.rate=Math.round((c.offer/Math.max(.1,S.salary)-1)*100); c.charNote="모범적인 이미지 덕분에 구단이 더 길고 좋은 조건을 내밀었어요."; }
  else if(ch<36){ c.years=1; c.offer=r1(c.offer*.92); c.rate=Math.round((c.offer/Math.max(.1,S.salary)-1)*100); c.charNote="잦은 구설로 구단이 짧고 박한 조건을 제시했어요."; }
  return c;
};
/* ⑧ 친정 복귀 제안 */
const _to=L.transferOffers;
L.transferOffers=function(S,opts){
  const out=_to(S,opts)||[]; try{
    if(!pro(S)||S.military==="serving"||S.military==="sangmu"||L.charOf(S)<65||age(S)<28) return out;
    const hist={}; S.history.filter(h=>!h.youth&&!h.military&&h.clubId).forEach(h=>{ hist[h.clubId]=hist[h.clubId]||{id:h.clubId,name:h.club,lg:h.lg,yrs:0}; hist[h.clubId].yrs++; });
    const cand=Object.values(hist).filter(x=>x.id!==S.club.id&&x.yrs>=3&&!out.some(o=>o.club.id===x.id));
    const rvOf=x=>L.isRivalMove&&L.isRivalMove(S,{id:x.id,name:x.name});
    const h=cand.filter(x=>!rvOf(x))[0]; if(!h) return out;
    const c=L.leagueClubs(S,h.lg).find(z=>z.id===h.id); if(!c) return out;
    const sr=Math.min(.95,L.startRateAt(S.p.ovr,c.l,S.trust*.8,S.p)+.15);
    out.unshift({club:L.clubRef(S,c,h.lg),lvl:r1(c.l),salary:r1(S.salary*.95),years:2,tag:"친정 복귀 · 환영해요",role:L.roleLabel(sr),sr,foreign:L.isForeign(h.lg),homecoming:true});
  }catch(e){} return out;
};
const _dt=L.doTransfer;
L.doTransfer=function(S,offer){ const r=_dt(S,offer); if(r!==false&&offer&&offer.homecoming){ S.fame=Math.max(0,S.fame+5); S.rep=clamp(S.rep+2,0,100); if(L.charDelta) L.charDelta(S,1,"의리: 친정 복귀"); L.addMoment(S,"친정 복귀","복귀",offer.club.name+" 팬들이 눈물로 환영했어요."); } return r; };
/* ⑥ 자녀: 부모의 인성을 일부 물려받아요 */
const _cc=L.createChild;
L.createChild=function(S,o){ const r=_cc(S,o); try{ r.state.char=clamp(Math.round((50+(L.charOf(S)-50)*.4)*10)/10,0,100); }catch(e){} return r; };
})();
