/* 업적 (js/life/achv.js) — 여러 번의 인생에 걸쳐 모으는 기록·이야기·도전 과제.
 * 한 번 달성하면 계속 남아요(localStorage klife-ach). 선수 상태 S 만 보고 계산해서, 새 이벤트·미니게임이 늘어나도 업적은 그대로 동작해요.
 * 분류: 성취(기록) · 낭만(이어지는 이야기) · 도전(어려운 길). f(S) 가 true 면 달성, [현재,목표] 배열이면 진행도예요. */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const KEY="klife-ach";
const hist=S=>(S.history||[]).filter(h=>!h.youth&&!h.military);
const tro=S=>(S.trophies||[]).filter(t=>!t.youth);
const awd=S=>(S.awards||[]).filter(a=>!a.youth);
const fl=(S,k)=>!!(S.evFlag&&S.evFlag[k]!=null);
const seen=(S,id)=>(S.evSeen||[]).includes(id);
const mx=(S,k)=>hist(S).reduce((m,h)=>Math.max(m,h[k]||0),0);
const C=S=>S.career||{};
const prog=(cur,max)=>[Math.min(cur,max),max];
const has=(S,re)=>tro(S).some(t=>re.test(t.name));
const hasA=(S,re)=>awd(S).some(a=>re.test(a.name));
const yrsMax=S=>Math.max(0,...Object.values(S.clubYears||{}));
const lgSet=S=>new Set(hist(S).map(h=>h.lg));
const STORY=["spC","sibC","loveD","fanC","protC","bossC","studyC","hoodC","rivalC","natC","slumpB","retC"];
const nStory=S=>STORY.filter(k=>fl(S,k)).length;
/* [분류, id, 이름(한|영), 설명(한|영), 판정] */
const A=(cat,id,n,d,f)=>({cat,id,ko:n[0],en:n[1],dko:d[0],dun:d[1],f});
const LIST=[
 /* ───── 성취 ───── */
 A("성취","g1",["첫 골","First goal"],["프로 무대에서 첫 골을 넣어요.","Score your first goal."],S=>C(S).goals>=1),
 A("성취","g10",["두 자릿수 골","Double figures"],["통산 10골을 넣어요.","Score 10 career goals."],S=>prog(C(S).goals||0,10)),
 A("성취","g50",["50골 클럽","The 50 club"],["통산 50골을 넣어요.","Score 50 career goals."],S=>prog(C(S).goals||0,50)),
 A("성취","g100",["백 골의 사나이","Hundred-goal club"],["통산 100골을 넣어요.","Score 100 career goals."],S=>prog(C(S).goals||0,100)),
 A("성취","g200",["200골 클럽","The 200 club"],["통산 200골을 넣어요.","Score 200 career goals."],S=>prog(C(S).goals||0,200)),
 A("성취","g300",["골 머신","Goal machine"],["통산 300골을 넣어요.","Score 300 career goals."],S=>prog(C(S).goals||0,300)),
 A("성취","a50",["도우미","Provider"],["통산 50도움을 기록해요.","Make 50 career assists."],S=>prog(C(S).assists||0,50)),
 A("성취","a100",["패스 마법사","Passing wizard"],["통산 100도움을 기록해요.","Make 100 career assists."],S=>prog(C(S).assists||0,100)),
 A("성취","ap100",["백 경기","One hundred games"],["통산 100경기에 출전해요.","Play 100 career games."],S=>prog(C(S).apps||0,100)),
 A("성취","ap300",["그라운드의 터줏대감","Ground regular"],["통산 300경기에 출전해요.","Play 300 career games."],S=>prog(C(S).apps||0,300)),
 A("성취","ap500",["오백 경기","Five hundred games"],["통산 500경기에 출전해요.","Play 500 career games."],S=>prog(C(S).apps||0,500)),
 A("성취","sz15",["한 시즌 15골","15 in a season"],["한 시즌에 15골 이상 넣어요.","Score 15 or more goals in one season."],S=>prog(mx(S,"goals"),15)),
 A("성취","sz20",["한 시즌 20골","20 in a season"],["한 시즌에 20골 이상 넣어요.","Score 20 or more goals in one season."],S=>prog(mx(S,"goals"),20)),
 A("성취","cs20",["철벽","The wall"],["통산 20번 무실점 경기를 만들어요.","Keep 20 career clean sheets."],S=>prog(C(S).cs||0,20)),
 A("성취","cs100",["무실점의 제왕","Karg of clean sheets"],["통산 100번 무실점 경기를 만들어요.","Keep 100 career clean sheets."],S=>prog(C(S).cs||0,100)),
 A("성취","rt8",["평점 8점대 시즌","An 8-rated season"],["한 시즌 평균 평점 8.0 이상을 기록해요.","Average 8.0 or higher in a season."],S=>mx(S,"rating")>=8),
 A("성취","mom10",["경기의 주인공","Man of the match"],["최우수 선수(MOM)에 10번 뽑혀요.","Be named man of the match 10 times."],S=>prog(C(S).mom||0,10)),
 A("성취","cap1",["태극마크","The national shirt"],["국가대표로 첫 경기를 뛰어요.","Win your first national cap."],S=>C(S).caps>=1),
 A("성취","cap30",["대표팀 단골","National regular"],["국가대표로 30경기를 뛰어요.","Play 30 national games."],S=>prog(C(S).caps||0,30)),
 A("성취","cap100",["센추리 클럽","Century club"],["국가대표로 100경기를 뛰어요.","Play 100 national games."],S=>prog(C(S).caps||0,100)),
 A("성취","title1",["첫 우승","First title"],["프로에서 첫 트로피를 들어 올려요.","Lift your first pro trophy."],S=>tro(S).length>=1),
 A("성취","title5",["트로피 수집가","Trophy collector"],["우승을 5번 해요.","Win 5 titles."],S=>prog(tro(S).length,5)),
 A("성취","title10",["우승 청부사","Silverware specialist"],["우승을 10번 해요.","Win 10 titles."],S=>prog(tro(S).length,10)),
 A("성취","wc",["월드컵 우승","World champion"],["월드컵에서 우승해요.","Win the World Cup."],S=>has(S,/월드컵 우승/)),
 A("성취","eur",["유럽의 정상","Champion of Europe"],["유럽 최고 클럽 대회에서 우승해요.","Win the top European club competition."],S=>tro(S).some(x=>/유럽 클럽컵 우승/.test(x.name)&&!/AFC|아시아/.test(x.name))),
 A("성취","mvp",["리그 MVP","League MVP"],["리그 MVP에 뽑혀요.","Be named league MVP."],S=>hasA(S,/리그 MVP/)),
 A("성취","top",["득점왕","Top scorer"],["득점왕에 올라요.","Finish as top scorer."],S=>hasA(S,/득점왕/)),
 A("성취","b11",["베스트 11","Team of the year"],["베스트 11에 이름을 올려요.","Make the team of the year."],S=>hasA(S,/베스트 11/)),
 A("성취","bd",["황금공","The golden ball"],["세계 최고의 선수상을 받아요.","Win the world's best player award."],S=>awd(S).some(a=>a.name==="황금공")),
 A("성취","pay10",["연봉 10억","A ten-crore salary"],["연봉 10억 원을 넘겨요.","Earn over 10 crore a year."],S=>(S.salary||0)>=10),
 A("성취","pay50",["억대를 넘어서","Beyond the crores"],["연봉 50억 원을 넘겨요.","Earn over 50 crore a year."],S=>(S.salary||0)>=50),
 A("성취","fame150",["길에서 알아보는 얼굴","A face people recognise"],["인기도 150을 넘겨요.","Reach 150 fame."],S=>prog(Math.round(S.fame||0),150)),
 A("성취","fame300",["나라의 얼굴","The nation's face"],["인기도 300을 넘겨요.","Reach 300 fame."],S=>prog(Math.round(S.fame||0),300)),
 A("성취","goat",["각성한 천재","Awakened genius"],["GOAT 각성에 성공해요.","Succeed at the GOAT awakening."],S=>!!S.goat),
 A("성취","leg1",["명선수","A fine player"],["커리어 점수 700점을 넘겨요.","Pass 700 career points."],S=>prog(Math.round(L.legacy?L.legacy(S).total:0),700)),
 A("성취","leg2",["레전드","A legend"],["커리어 점수 1900점을 넘겨요.","Pass 1,900 career points."],S=>prog(Math.round(L.legacy?L.legacy(S).total:0),1900)),
 A("성취","leg3",["역사가 된 선수","History itself"],["커리어 점수 2800점을 넘겨요.","Pass 2,800 career points."],S=>prog(Math.round(L.legacy?L.legacy(S).total:0),2800)),
 /* ───── 낭만 ───── */
 A("낭만","one10",["한 팀의 사나이","A one-club man"],["한 구단에서 10시즌을 보내요.","Spend 10 seasons at one club."],S=>prog(yrsMax(S),10)),
 A("낭만","one15",["구단의 깃발","The club's flag"],["한 구단에서 15시즌을 보내요.","Spend 15 seasons at one club."],S=>prog(yrsMax(S),15)),
 A("낭만","cap",["주장 완장","The armband"],["주장이 되어 팀을 이끌어요.","Become captain and lead the team."],S=>!!S.captain||fl(S,"capspeech")),
 A("낭만","home",["고향으로","Back home"],["고향 팀으로 돌아가요.","Return to your hometown club."],S=>seen(S,"e6_hometeam")),
 A("낭만","jersey",["영구결번","Retired number"],["내 등번호가 영구결번이 돼요.","Have your shirt number retired."],S=>!!(S.jersey&&S.jersey.length)),
 A("낭만","buddy",["단짝과 프로에서","Friends on the big stage"],["유스 시절 단짝과 프로 그라운드에서 다시 만나요.","Meet your youth best friend on a pro pitch."],S=>fl(S,"buddyC")),
 A("낭만","coach",["은사의 편지","The mentor's letter"],["옛 은사에게서 편지를 받아요.","Receive a letter from your old mentor."],S=>fl(S,"coachC")),
 A("낭만","rehab",["다시 일어서다","Back on your feet"],["큰 부상을 이겨 내고 돌아와요.","Come back from a major injury."],S=>fl(S,"rehabB")),
 A("낭만","spC",["작은 가게의 얼굴","The face of a small shop"],["동네 가게의 첫 후원이 전속 모델 계약으로 이어져요.","See a local shop's first sponsorship grow into an exclusive deal."],S=>fl(S,"spC")),
 A("낭만","sibC",["동생과 같은 그라운드","Same pitch as my brother"],["동생과 프로 그라운드에서 맞붙어요.","Face your younger brother on a pro pitch."],S=>fl(S,"sibC")),
 A("낭만","loveD",["결혼식 날","The wedding day"],["소중한 사람과 결혼식을 올려요.","Hold your wedding with someone dear."],S=>fl(S,"loveD")),
 A("낭만","fanC",["그때 그 아이","That kid from back then"],["유니폼을 내밀던 어린 팬이 프로가 되어 나타나요.","The young fan who held out a shirt turns up as a pro."],S=>fl(S,"fanC")),
 A("낭만","protC",["후배의 스승","A rookie's mentor"],["신인을 키워 내 자리를 놓고 겨뤄요.","Raise a rookie until they challenge for your place."],S=>fl(S,"protC")),
 A("낭만","bossC",["감독의 믿음","The manager's faith"],["감독이 기자회견에서 내 이름을 먼저 꺼내요.","The manager names you first at a press conference."],S=>fl(S,"bossC")),
 A("낭만","studyC",["졸업 논문","The graduation thesis"],["대학 졸업 논문 주제를 정해요.","Choose a graduation thesis topic."],S=>fl(S,"studyC")),
 A("낭만","hoodC",["우리 동네 운동장","Our neighbourhood pitch"],["고향 운동장의 개장식에서 첫 킥을 해요.","Take the first kick at your hometown pitch's opening."],S=>fl(S,"hoodC")),
 A("낭만","rivalC",["라이벌의 마지막 인사","A rival's farewell"],["오랜 라이벌의 은퇴를 함께해요.","Share your old rival's retirement."],S=>fl(S,"rivalC")),
 A("낭만","natC",["국가가 울려 퍼질 때","When the anthem plays"],["대표팀 소집부터 국가가 울려 퍼지는 순간까지 겪어요.","Live it from the first camp to the anthem."],S=>fl(S,"natC")),
 A("낭만","slumpB",["터널의 끝","The end of the tunnel"],["긴 슬럼프를 지나 감각을 되찾아요.","Find your touch again after a long slump."],S=>fl(S,"slumpB")),
 A("낭만","retC",["후배들의 질문","The juniors' question"],["후배들에게 오래 뛰는 법을 알려 줘요.","Teach the juniors how to last."],S=>fl(S,"retC")),
 A("낭만","wcC",["공항의 환영 인파","The crowd at the airport"],["월드컵을 마치고 돌아와 환영 인파를 만나요.","Return from the World Cup to a welcoming crowd."],S=>fl(S,"wcC")),
 A("낭만","olyB",["시상대를 바라보며","Looking up at the podium"],["종합 국제대회 대표팀에서 시상대를 보며 마음을 다잡아요.","Steel yourself at the Olympics, gazing at the podium."],S=>fl(S,"olyB")),
 A("낭만","asiaB",["토너먼트의 밤","A knockout night"],["아시아 네이션스컵 토너먼트 전날 밤을 동료와 보내요.","Spend the night before an Asian Cup knockout with a teammate."],S=>fl(S,"asiaB")),
 A("낭만","grad",["졸업식 날","Graduation day"],["유소년 시절의 마지막, 졸업식을 맞아요.","Reach graduation day, the end of your youth years."],S=>fl(S,"grad")),
 A("낭만","story5",["이야기 수집가","Story collector"],["이어지는 이야기를 5편 끝까지 겪어요.","See 5 chained stories through to the end."],S=>prog(nStory(S),5)),
 A("낭만","story12",["모든 이야기의 주인공","Hero of every story"],["이어지는 이야기 12편을 모두 끝까지 겪어요.","See all 12 chained stories through."],S=>prog(nStory(S),12)),
 /* ───── 도전 ───── */
 A("도전","poorK1",["개천에서 난 용","A dragon from a small stream"],["넉넉지 않은 집안에서 자라 1부 리그에서 뛰어요.","Grow up with little and play in the top division."],S=>!!(S.family&&["tight","poor"].includes(S.family.id))&&lgSet(S).has("K1")),
 A("도전","lowTop",["밑바닥에서 정상까지","From the bottom to the top"],["3·4부 리그를 거쳐 1부 리그에서 뛰어요.","Come through the lower leagues to play in the top division."],S=>(lgSet(S).has("K3")||lgSet(S).has("K4"))&&lgSet(S).has("K1")),
 A("도전","scout",["캠퍼스 스타","Campus star"],["대학 시절 프로 스카우터의 눈에 띄어 조기 입단해요.","Catch a pro scout's eye at university and turn pro early."],S=>seen(S,"u_scout")),
 A("도전","abroad",["유럽 진출","Going to Europe"],["해외 리그에서 한 시즌을 뛰어요.","Play a season in a foreign league."],S=>hist(S).some(h=>h.lg&&L.isForeign&&L.isForeign(h.lg))),
 A("도전","mil",["군 복무 완료","Service completed"],["병역을 마치고 그라운드로 돌아와요.","Finish military service and return to the pitch."],S=>S.military==="served"||S.military==="sports"||(S.history||[]).some(h=>h.military)&&S.military!=="serving"&&S.military!=="sangmu"),
 A("도전","teen",["10대 프로","A teenage pro"],["19세 이하로 프로 무대를 밟아요.","Make your pro debut at 19 or younger."],S=>{ const h=hist(S)[0]; return !!h&&h.age<=19; }),
 A("도전","age38",["불혹의 현역","Still going at 38"],["38세에도 그라운드에서 뛰어요.","Still play at 38."],S=>mx(S,"age")>=38),
 A("도전","age40",["마흔의 그라운드","Forty on the pitch"],["40세 시즌을 맞아요.","Reach a season at 40."],S=>mx(S,"age")>=40),
 A("도전","choice30",["선택의 달인","Master of choices"],["이벤트 선택에서 30번 성공해요.","Succeed in 30 event choices."],S=>prog((S.evStats&&S.evStats.hit)||0,30)),
 A("도전","choice100",["운명의 주인","Master of fate"],["이벤트 선택에서 100번 성공해요.","Succeed in 100 event choices."],S=>prog((S.evStats&&S.evStats.hit)||0,100))
];
L.ACH=LIST;
/* 영어 사전을 스스로 등록해요(이름·설명) */
{ const D={}; LIST.forEach(a=>{ D[a.ko]=a.en; D[a.dko]=a.den; }); Object.assign(D,{"업적":"Achievements","성취":"Records","낭만":"Stories","도전":"Challenges","업적 달성":"ACHIEVEMENT UNLOCKED","달성한 업적":"Unlocked","아직 달성하지 못했어요":"Not unlocked yet","한 번 달성하면 다음 인생에도 계속 남아요.":"Once unlocked, it stays for every future career.","새 업적을 달성했어요":"You unlocked a new achievement"}); window.KL_I18N_EN_ACH=D; }
const rd=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(e){ return {}; } };
const wr=o=>{ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} };
L.achSaved=rd;
L.achState=function(S){ const got=rd(); return LIST.map(a=>{ let r=false; try{ r=S?a.f(S):false; }catch(e){ r=false; } const pg=Array.isArray(r)?r:null; const now=pg?pg[0]>=pg[1]:!!r; return {a,done:!!got[a.id]||now,now,pg,at:got[a.id]||null}; }); };
/* 새로 달성한 업적을 저장하고 돌려줘요 */
L.achTick=function(S){ if(!S||!S.p) return []; const got=rd(), nu=[]; LIST.forEach(a=>{ if(got[a.id]) return; let r=false; try{ r=a.f(S); }catch(e){ r=false; } const ok=Array.isArray(r)?r[0]>=r[1]:!!r; if(ok){ got[a.id]={y:S.year||0,n:S.p.name||""}; nu.push(a); } }); if(nu.length) wr(got); return nu; };
})();
