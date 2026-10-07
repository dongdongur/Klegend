/*
 * K-라이프 레전드 비교 (js/life/legends.js)
 * 은퇴한 내 선수를 역대 레전드와 비교해요. 수치는 공개된 커리어 기록을 바탕으로 한 대략적인 값(근사치)이에요.
 * 비교 상대는 '역할 · 세부 포지션 · 키 · 주발 · 유형'이 비슷한 레전드를 우선으로 골라요.
 *   g 골 · a 도움 · apps 경기 · cs 클린시트 · caps 대표팀 경기 · intg 대표팀 골 · wc 월드컵 우승 · ucl 유럽컵 우승
 *   lg 리그 우승 · cup 기타 우승 · bd 황금공 · aw 기타 큰 개인상 · peak 전성기 능력치(우리 기준 1~99)
 *   sub 세부 포지션 · roles 어울리는 역할 id · h 키(cm) · foot 주발
 */
(function(){
"use strict";
const L=window.LIFE;
const N=(n,pos,sub,roles,h,foot,types,s,tag)=>Object.assign({n,pos,sub,roles,h,foot,types,tag},s);
const LEGENDS=[
 /* ===== 공격수 ===== */
 N("훈눌으터","FW",["ST"],["poacher","complete"],183,"오른발",["finisher"],{g:414,a:100,apps:616,caps:98,intg:62,wc:2,ucl:0,lg:2,cup:6,bd:2,aw:10,peak:97},"괴물 같은 득점 본능"),
 N("키바주타온늘 마놀드","FW",["ST","LW"],["poacher","inside","target"],187,"오른발",["finisher","target"],{g:900,a:250,apps:1250,caps:220,intg:140,wc:0,ucl:5,lg:7,cup:14,bd:5,aw:25,peak:96},"끝없는 득점 기계"),
 N("른사널 머사","FW",["RW","ST","AM"],["inside","false9","maker"],170,"왼발",["dribbler"],{g:850,a:380,apps:1100,caps:190,intg:112,wc:1,ucl:4,lg:12,cup:16,bd:8,aw:30,peak:99},"발끝의 마법사"),
 N("후누서자으","FW",["LW","AM"],["inside","maker"],181,"오른발",["dribbler"],{g:190,a:120,apps:560,caps:97,intg:33,wc:1,ucl:1,lg:2,cup:3,bd:1,aw:6,peak:94},"웃음을 주는 마술사"),
 N("졸루머 으비던할므나츠","FW",["ST"],["target","complete"],195,"오른발",["target","finisher"],{g:570,a:200,apps:1000,caps:122,intg:62,wc:0,ucl:0,lg:13,cup:10,bd:0,aw:12,peak:92},"압도적인 존재감"),
 N("손힝마","FW",["LW","ST"],["inside","poacher"],183,"양발",["dribbler","finisher"],{g:230,a:110,apps:760,caps:135,intg:51,wc:0,ucl:0,lg:0,cup:2,bd:0,aw:6,peak:91},"아시아가 낳은 월드클래스"),
 N("차남곤","FW",["ST","RW"],["poacher","complete"],183,"오른발",["finisher","target"],{g:200,a:40,apps:620,caps:136,intg:58,wc:0,ucl:0,lg:0,cup:2,bd:0,aw:4,peak:88},"한국 축구의 전설"),
 N("이둥각","FW",["ST"],["target","poacher"],185,"오른발",["target","finisher"],{g:260,a:90,apps:690,caps:105,intg:33,wc:0,ucl:0,lg:8,cup:3,bd:0,aw:8,peak:85},"레전드리그의 살아 있는 역사"),
 N("르밸라 던코크","FW",["ST"],["target"],191,"오른발",["target"],{g:340,a:90,apps:700,caps:115,intg:80,wc:0,ucl:0,lg:3,cup:3,bd:0,aw:3,peak:86},"피지컬로 밀어붙이는 9번"),
 N("드다거 디바순보","FW",["ST"],["target","complete"],189,"오른발",["target","finisher"],{g:300,a:100,apps:700,caps:105,intg:65,wc:0,ucl:1,lg:4,cup:8,bd:0,aw:5,peak:90},"큰 경기의 사나이"),
 N("란쿠 마나","FW",["ST"],["target"],193,"오른발",["target"],{g:300,a:70,apps:620,caps:47,intg:16,wc:1,ucl:0,lg:1,cup:2,bd:0,aw:4,peak:86},"공중전의 지배자"),
 N("울라브새 즈버","FW",["ST"],["target","false9"],193,"왼발",["target"],{g:300,a:90,apps:830,caps:137,intg:57,wc:1,ucl:1,lg:2,cup:8,bd:0,aw:2,peak:84},"노련한 타깃맨"),
 N("마라가 몬즈큰자","FW",["ST"],["target"],190,"오른발",["target"],{g:240,a:60,apps:620,caps:89,intg:33,wc:0,ucl:1,lg:6,cup:7,bd:0,aw:3,peak:86},"끈질긴 전방 투사"),
 N("애브 후룬","FW",["ST"],["target","poacher"],194,"왼발",["target","finisher"],{g:350,a:60,apps:480,caps:50,intg:35,wc:0,ucl:1,lg:5,cup:5,bd:0,aw:8,peak:95},"득점 로봇"),
 N("블라프 인초그","FW",["ST"],["poacher"],181,"오른발",["finisher"],{g:313,a:90,apps:700,caps:57,intg:25,wc:1,ucl:2,lg:3,cup:3,bd:0,aw:3,peak:86},"오프사이드 라인 위의 사나이"),
 N("버토 버날소탤루아","FW",["ST"],["poacher"],188,"오른발",["finisher"],{g:360,a:80,apps:560,caps:70,intg:35,wc:0,ucl:0,lg:3,cup:4,bd:0,aw:6,peak:90},"박스 안의 포식자"),
 N("거부토 머루","FW",["ST"],["poacher"],176,"오른발",["finisher"],{g:600,a:80,apps:700,caps:62,intg:68,wc:1,ucl:3,lg:4,cup:6,bd:1,aw:6,peak:93},"폭격기"),
 N("바배로틸 러먼타포군카","FW",["ST"],["poacher","complete"],185,"오른발",["finisher"],{g:700,a:200,apps:1000,caps:155,intg:85,wc:0,ucl:2,lg:11,cup:12,bd:0,aw:15,peak:94},"끊임없는 골 감각"),
 N("코람 버재버","FW",["ST"],["false9","complete"],185,"오른발",["finisher","dribbler"],{g:450,a:200,apps:900,caps:97,intg:37,wc:0,ucl:5,lg:4,cup:13,bd:1,aw:10,peak:92},"기술 좋은 9번"),
 N("하라 건안","FW",["ST"],["false9","complete","poacher"],188,"오른발",["finisher"],{g:450,a:150,apps:750,caps:105,intg:70,wc:0,ucl:0,lg:1,cup:1,bd:0,aw:12,peak:92},"골과 도움을 모두 하는 9번"),
 N("글라운 음부버","FW",["LW","ST"],["inside","poacher"],178,"오른발",["dribbler","finisher"],{g:400,a:130,apps:600,caps:85,intg:52,wc:1,ucl:1,lg:8,cup:10,bd:0,aw:10,peak:96},"질주하는 슈퍼스타"),
 N("므머버돌 술더","FW",["RW"],["inside"],175,"왼발",["dribbler","finisher"],{g:330,a:140,apps:700,caps:105,intg:60,wc:0,ucl:1,lg:2,cup:6,bd:0,aw:10,peak:92},"왼발 역발 윙어의 정석"),
 N("우부언 루분","FW",["RW"],["inside"],180,"왼발",["dribbler"],{g:200,a:150,apps:600,caps:96,intg:37,wc:0,ucl:1,lg:8,cup:7,bd:0,aw:5,peak:91},"안으로 파고드는 오른쪽 날개"),
 N("폴버구 르매르","FW",["LW"],["inside","classic"],170,"오른발",["dribbler"],{g:180,a:200,apps:760,caps:81,intg:16,wc:0,ucl:1,lg:9,cup:10,bd:0,aw:8,peak:91},"왼쪽 측면의 폭주기관차"),
 N("너알무부","FW",["LW"],["inside"],175,"오른발",["dribbler"],{g:430,a:260,apps:700,caps:128,intg:79,wc:0,ucl:1,lg:5,cup:14,bd:0,aw:12,peak:93},"화려한 드리블러"),
 N("너아븐디 버감","FW",["RW"],["classic"],183,"오른발",["dribbler"],{g:130,a:250,apps:720,caps:115,intg:17,wc:0,ucl:1,lg:6,cup:8,bd:0,aw:4,peak:89},"크로스와 프리킥의 달인"),
 N("른짤소 프서","FW",["RW"],["classic","inside"],180,"오른발",["dribbler"],{g:120,a:200,apps:800,caps:127,intg:32,wc:0,ucl:1,lg:6,cup:8,bd:1,aw:5,peak:92},"우아한 오른쪽 날개"),
 N("라이언 각구","FW",["LW"],["classic"],180,"왼발",["dribbler"],{g:168,a:271,apps:963,caps:64,intg:12,wc:0,ucl:2,lg:13,cup:11,bd:0,aw:5,peak:90},"끝없는 측면 질주"),
 N("가란거","FW",["RW"],["classic","inside"],169,"오른발",["dribbler"],{g:230,a:100,apps:600,caps:50,intg:12,wc:2,ucl:0,lg:3,cup:2,bd:0,aw:4,peak:94},"드리블의 천사"),
 N("사나우 거내","FW",["LW"],["inside"],174,"오른발",["dribbler","finisher"],{g:240,a:100,apps:700,caps:110,intg:50,wc:0,ucl:1,lg:3,cup:8,bd:0,aw:6,peak:90},"쉼 없이 파고드는 왼쪽 날개"),
 N("투무주 머루","FW",["AM","RW","ST"],["raum","shadow"],186,"오른발",["finisher"],{g:260,a:250,apps:900,caps:131,intg:45,wc:1,ucl:2,lg:12,cup:10,bd:0,aw:6,peak:88},"공간을 해석하는 라움도이터"),
 N("이촌스","FW",["RW"],["classic","inside"],175,"오른발",["dribbler"],{g:50,a:55,apps:340,caps:78,intg:10,wc:0,ucl:0,lg:1,cup:2,bd:0,aw:2,peak:82},"번뜩이는 측면 재능"),
 /* ===== 미드필더 ===== */
 N("지내는 즈둔","MF",["AM","CM"],["maker"],185,"오른발",["playmaker"],{g:100,a:110,apps:800,caps:108,intg:31,wc:1,ucl:1,lg:3,cup:4,bd:1,aw:8,peak:96},"우아함의 극치"),
 N("온디러구 은가어시더","MF",["CM","AM"],["mezz","maker"],171,"오른발",["playmaker"],{g:60,a:150,apps:900,caps:131,intg:13,wc:1,ucl:4,lg:9,cup:8,bd:0,aw:8,peak:92},"공간을 지배한 마에스트로"),
 N("수마 어둘노대소","MF",["CM"],["regista","maker"],170,"오른발",["playmaker"],{g:85,a:190,apps:1000,caps:133,intg:13,wc:1,ucl:4,lg:8,cup:9,bd:0,aw:8,peak:92},"패스의 교과서"),
 N("기소웅","MF",["CM","DM"],["regista"],189,"오른발",["playmaker"],{g:35,a:50,apps:480,caps:110,intg:10,wc:0,ucl:0,lg:3,cup:3,bd:0,aw:2,peak:84},"정확한 롱패스의 대가"),
 N("소탈눈 제로디","MF",["CM"],["b2b","mezz"],183,"오른발",["box"],{g:186,a:150,apps:710,caps:114,intg:21,wc:0,ucl:1,lg:0,cup:6,bd:0,aw:5,peak:91},"팀을 짊어진 캡틴"),
 N("부랑킬 담포디","MF",["CM"],["b2b","mezz"],184,"오른발",["box"],{g:270,a:150,apps:880,caps:106,intg:29,wc:0,ucl:1,lg:3,cup:8,bd:0,aw:4,peak:90},"골 넣는 미드필더"),
 N("박자장","MF",["CM","AM"],["b2b"],178,"오른발",["box"],{g:40,a:45,apps:540,caps:100,intg:13,wc:0,ucl:1,lg:4,cup:5,bd:0,aw:4,peak:87},"산소탱크, 두 개의 심장"),
 N("어갈 트배","MF",["CM","DM"],["b2b","mezz"],188,"오른발",["box"],{g:120,a:90,apps:720,caps:101,intg:19,wc:0,ucl:1,lg:5,cup:7,bd:0,aw:6,peak:90},"덩치 큰 공격형 미드필더"),
 N("폴 바고분","MF",["CM"],["b2b","mezz"],191,"오른발",["box","playmaker"],{g:60,a:90,apps:500,caps:91,intg:11,wc:1,ucl:0,lg:5,cup:4,bd:0,aw:4,peak:88},"큰 키와 기술을 겸비한 중원"),
 N("우부더룰 므돌","MF",["CM"],["b2b","winner"],180,"오른발",["box","destroyer"],{g:130,a:70,apps:700,caps:128,intg:30,wc:0,ucl:1,lg:8,cup:5,bd:0,aw:3,peak:88},"전투적인 중원 사령관"),
 N("서부으울 넌솔거치","MF",["DM"],["anchor"],189,"오른발",["destroyer"],{g:20,a:50,apps:780,caps:143,intg:2,wc:1,ucl:3,lg:9,cup:7,bd:0,aw:3,peak:89},"축구 지능의 정점"),
 N("은글반 거터","MF",["DM","CM"],["winner"],168,"오른발",["destroyer"],{g:20,a:40,apps:500,caps:56,intg:3,wc:1,ucl:1,lg:2,cup:4,bd:0,aw:3,peak:90},"두 명 몫을 뛰는 사나이"),
 N("굴루디 몬캐럴배","MF",["DM"],["anchor","winner"],170,"오른발",["destroyer"],{g:20,a:30,apps:650,caps:71,intg:2,wc:0,ucl:3,lg:6,cup:6,bd:0,aw:2,peak:88},"수비형 미드필더의 대명사"),
 N("쿤갤브라","MF",["DM"],["winner","anchor"],185,"오른발",["destroyer"],{g:60,a:50,apps:650,caps:80,intg:8,wc:0,ucl:5,lg:5,cup:10,bd:0,aw:2,peak:88},"방패막이"),
 N("건도런우 브로른","MF",["DM","CM"],["regista"],177,"오른발",["playmaker"],{g:90,a:170,apps:850,caps:116,intg:13,wc:1,ucl:2,lg:6,cup:6,bd:0,aw:6,peak:91},"뒤에서 경기를 쓰는 레지스타"),
 N("란쿠 문디르탈","MF",["CM"],["regista","b2b"],172,"오른발",["playmaker","box"],{g:100,a:130,apps:1000,caps:180,intg:25,wc:0,ucl:6,lg:4,cup:12,bd:1,aw:10,peak:91},"작은 체구의 마에스트로"),
 N("컨바 더 빈덜거노","MF",["AM","CM"],["maker"],181,"오른발",["playmaker"],{g:150,a:260,apps:700,caps:105,intg:30,wc:0,ucl:1,lg:6,cup:7,bd:0,aw:8,peak:92},"패스로 수비를 가르는 플레이메이커"),
 N("먼거토 언자","MF",["AM"],["maker"],180,"왼발",["playmaker"],{g:90,a:200,apps:650,caps:92,intg:23,wc:1,ucl:0,lg:2,cup:6,bd:0,aw:4,peak:89},"마지막 패스의 장인"),
 N("피던처시간 투타","MF",["AM"],["maker","shadow"],180,"오른발",["playmaker"],{g:300,a:200,apps:780,caps:58,intg:9,wc:1,ucl:0,lg:1,cup:4,bd:0,aw:6,peak:92},"울프의 황제"),
 /* ===== 수비수 ===== */
 N("버울르 물나는","DF",["CB","LB"],["stopper","ballplay"],186,"왼발",["stopper","builder"],{g:33,a:40,apps:900,caps:126,intg:7,wc:0,ucl:5,lg:7,cup:8,bd:0,aw:6,peak:93},"수비의 품격"),
 N("버발은 콘눌부다","DF",["CB"],["stopper"],176,"오른발",["stopper"],{g:8,a:10,apps:600,caps:136,intg:2,wc:1,ucl:0,lg:3,cup:3,bd:1,aw:3,peak:90},"뚫리지 않는 벽"),
 N("브로흐 판 두살코","DF",["CB"],["stopper","ballplay"],193,"오른발",["stopper","builder"],{g:40,a:12,apps:480,caps:80,intg:10,wc:0,ucl:1,lg:1,cup:3,bd:0,aw:4,peak:91},"압도적인 센터백"),
 N("핀번초 넌캔보엘","DF",["CB"],["libero","ballplay"],181,"오른발",["builder"],{g:100,a:50,apps:750,caps:103,intg:14,wc:1,ucl:3,lg:5,cup:6,bd:2,aw:6,peak:94},"리베로의 창시자"),
 N("김만사","DF",["CB"],["stopper"],190,"오른발",["stopper"],{g:12,a:6,apps:380,caps:100,intg:4,wc:0,ucl:0,lg:3,cup:3,bd:0,aw:4,peak:90},"괴물 수비수"),
 N("홍망분","DF",["CB"],["ballplay","stopper","libero"],182,"오른발",["builder","stopper"],{g:40,a:25,apps:600,caps:136,intg:10,wc:0,ucl:0,lg:4,cup:4,bd:0,aw:3,peak:87},"영원한 리더"),
 N("존 터라","DF",["CB"],["stopper"],187,"오른발",["stopper"],{g:70,a:20,apps:720,caps:78,intg:6,wc:0,ucl:1,lg:5,cup:11,bd:0,aw:6,peak:90},"온몸을 던진 캡틴"),
 N("코릴러주 프소","DF",["CB","RB"],["stopper"],178,"오른발",["stopper"],{g:15,a:15,apps:600,caps:100,intg:3,wc:1,ucl:3,lg:6,cup:6,bd:0,aw:3,peak:90},"곱슬머리 수비 투혼"),
 N("서부으울 던무시","DF",["CB"],["libero","stopper"],184,"오른발",["stopper","builder"],{g:130,a:40,apps:950,caps:180,intg:23,wc:1,ucl:5,lg:5,cup:14,bd:0,aw:8,peak:91},"골 넣는 수비수"),
 N("르가 포다나누","DF",["CB"],["ballplay"],189,"오른발",["builder"],{g:11,a:7,apps:600,caps:81,intg:3,wc:0,ucl:1,lg:6,cup:8,bd:0,aw:4,peak:90},"우아한 센터백"),
 N("제더로 프개","DF",["CB"],["ballplay"],194,"오른발",["builder"],{g:55,a:12,apps:700,caps:102,intg:5,wc:1,ucl:3,lg:9,cup:12,bd:0,aw:3,peak:88},"빌드업 센터백"),
 N("루배리머 코릴르주","DF",["LB"],["overlap"],168,"왼발",["runner"],{g:70,a:60,apps:700,caps:125,intg:11,wc:1,ucl:3,lg:4,cup:6,bd:0,aw:3,peak:92},"왼쪽 측면의 폭격기"),
 N("넌나 울내소","DF",["RB"],["overlap"],172,"오른발",["runner"],{g:50,a:150,apps:900,caps:126,intg:8,wc:0,ucl:3,lg:6,cup:30,bd:0,aw:4,peak:92},"우승컵 수집가 풀백"),
 N("몬릴설버","DF",["LB"],["overlap"],174,"왼발",["runner"],{g:40,a:100,apps:800,caps:58,intg:6,wc:0,ucl:5,lg:6,cup:12,bd:0,aw:3,peak:89},"화려한 왼쪽 풀백"),
 N("티밴토 쩔럭순도올알누","DF",["RB"],["invert","overlap"],180,"오른발",["builder","runner"],{g:20,a:90,apps:450,caps:35,intg:3,wc:0,ucl:1,lg:2,cup:5,bd:0,aw:4,peak:88},"패스하는 풀백"),
 N("코프","DF",["RB"],["overlap"],176,"오른발",["runner"],{g:20,a:90,apps:700,caps:142,intg:5,wc:2,ucl:1,lg:3,cup:4,bd:0,aw:3,peak:90},"지칠 줄 모르는 오른쪽 날개"),
 N("팔듭 람","DF",["LB","RB"],["invert","overlap"],170,"오른발",["runner","builder"],{g:19,a:90,apps:800,caps:113,intg:5,wc:1,ucl:1,lg:8,cup:8,bd:0,aw:4,peak:90},"완벽한 풀백"),
 N("이쩡볼","DF",["LB"],["overlap","defend"],177,"왼발",["runner"],{g:12,a:50,apps:600,caps:127,intg:5,wc:0,ucl:0,lg:2,cup:3,bd:0,aw:2,peak:85},"쉼 없이 오르내린 왼쪽 측면"),
 /* ===== 골키퍼 ===== */
 N("러피 어잔","GK",["GK"],["line"],189,"오른발",["shotstopper"],{g:0,a:0,apps:800,cs:270,caps:78,intg:0,wc:0,ucl:0,lg:5,cup:3,bd:1,aw:5,peak:98},"검은 거미"),
 N("선라으자 바픈","GK",["GK"],["line","sweeper"],192,"오른발",["shotstopper","commander"],{g:0,a:0,apps:1100,cs:450,caps:176,intg:0,wc:1,ucl:0,lg:10,cup:9,bd:0,aw:12,peak:95},"가장 긴 시간을 지킨 수호신"),
 N("마느설 노알가","GK",["GK"],["sweeper"],193,"오른발",["sweeper"],{g:0,a:0,apps:800,cs:340,caps:124,intg:0,wc:1,ucl:2,lg:12,cup:10,bd:0,aw:8,peak:97},"스위퍼 키퍼의 완성"),
 N("이캐부 콘사어주","GK",["GK"],["line"],185,"오른발",["commander","shotstopper"],{g:0,a:0,apps:900,cs:300,caps:167,intg:0,wc:1,ucl:3,lg:5,cup:8,bd:0,aw:6,peak:93},"성인 성자"),
 N("김벙자","GK",["GK"],["sweeper"],184,"오른발",["commander","sweeper"],{g:3,a:0,apps:700,cs:200,caps:6,intg:0,wc:0,ucl:0,lg:0,cup:3,bd:0,aw:3,peak:80},"그라운드의 철인"),
 N("펀무로 처히","GK",["GK"],["line"],196,"오른발",["shotstopper"],{g:0,a:0,apps:800,cs:310,caps:124,intg:0,wc:0,ucl:1,lg:4,cup:9,bd:0,aw:6,peak:92},"헬멧을 쓴 거인 수문장"),
 N("앨더로자","GK",["GK"],["sweeper"],188,"왼발",["sweeper"],{g:0,a:5,apps:550,cs:200,caps:25,intg:0,wc:0,ucl:1,lg:6,cup:6,bd:0,aw:5,peak:91},"발로 공격을 시작하는 골키퍼"),
 N("프다 스거근캘","GK",["GK"],["line","commander"],193,"오른발",["commander","shotstopper"],{g:1,a:0,apps:750,cs:300,caps:129,intg:0,wc:0,ucl:1,lg:5,cup:8,bd:0,aw:4,peak:93},"압도적인 존재감의 거인"),
 N("트말 거로탄우","GK",["GK"],["line"],199,"왼발",["shotstopper"],{g:0,a:0,apps:600,cs:230,caps:100,intg:0,wc:0,ucl:2,lg:5,cup:6,bd:0,aw:6,peak:94},"장신 선방의 달인"),
];
function score(c){ return Math.round(c.peak*8+c.g*3+c.a*2+c.apps*.5+(c.cs||0)*1.5+c.bd*260+c.aw*30+c.wc*110+c.ucl*110+c.lg*45+c.cup*20+c.caps*3+c.intg*10); }
LEGENDS.forEach(x=>{ x.score=score(x); x.types=x.types||[]; });
L.LEGENDS=LEGENDS; L.legendScore=score;

/* 내 선수와 비교할 레전드: 역할·세부 포지션·키·주발·유형이 비슷한 순, 점수도 조금 반영 */
L.compareLegends=function(S){
  const lg=L.legacy(S), c=S.career, mine=lg.total, p=S.p;
  const myAw=S.awards.filter(a=>!a.youth);
  const my={g:c.goals,a:c.assists,apps:c.apps,cs:c.cs,caps:c.caps,intg:c.intGoals,
    tr:S.trophies.filter(t=>!t.youth).length,aw:myAw.filter(a=>!/후보/.test(a.name)).length,bd:S.ballon.filter(b=>b.rank===1).length,
    wc:S.trophies.filter(t=>/월드컵 우승/.test(t.name)&&/월드컵/.test(t.name)).length,peak:p.peak};
  const same=LEGENDS.filter(x=>x.pos===p.pos);
  const rate=x=>{ const why=[]; let s=0;
    if(x.roles&&x.roles.includes(p.role)){ s+=4; why.push("같은 역할"); }
    if(x.sub&&x.sub.includes(p.sub)){ s+=2; why.push("같은 포지션"); }
    if(x.types.includes(p.type)){ s+=2; why.push("같은 유형"); }
    const dh=Math.abs((p.height||x.h)-x.h); if(dh<=4){ s+=3; why.push("키가 비슷해요 ("+x.h+"cm)"); } else s+=Math.max(0,3-dh/7);
    if(x.foot===p.foot||(x.foot==="양발"&&true)){ s+=1.2; if(x.foot===p.foot) why.push("같은 주발"); }
    s-=Math.min(2,Math.abs(x.score-mine)/Math.max(800,mine)*2);
    return {x,s,why}; };
  const ranked=same.map(rate).sort((a,b)=>b.s-a.s);
  const pick=ranked.slice(0,4);
  const list=pick.map(({x,why})=>({n:x.n,tag:x.tag,score:x.score,pct:Math.round(mine/x.score*100),beat:mine>=x.score,typed:why.length>0,why,h:x.h,foot:x.foot,
    rows:[["골",my.g,x.g],["도움",my.a,x.a],["경기",my.apps,x.apps],["대표팀",my.caps,x.caps],["월드컵 우승",my.wc,x.wc],["황금공",my.bd,x.bd],["리그·컵 우승",my.tr,x.lg+x.cup+x.ucl+x.wc]].filter(r=>!(p.pos==="GK"&&(r[0]==="골"||r[0]==="도움")))}));
  return {mine,list,type:p.typeName,body:(p.height||"?")+"cm "+(p.weight||"?")+"kg · "+p.foot+" · "+(L.roleName?L.roleName(p):"")};
};
})();
