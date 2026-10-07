/*
 * 팀 엠블럼과 선수 얼굴 사진
 * ------------------------------------------------------------
 * 이미지 파일을 이 저장소에 두지 않고, 화면에서 레전드리그 공식 사이트(kleague.com)의 이미지 주소를 그대로 불러다 보여줘요.
 * 파일을 내려받아 저장하거나 우리 사이트에 올리지 않아요. 사이트 주소가 바뀌거나 막히면 자동으로 이니셜 배지/실루엣으로 바뀌어요.
 *   - 끄고 싶으면 아래 KL_CRESTS_ON / KL_FACES_ON 을 false 로 바꾸세요.
 *   - 비공식 팬 게임이라 구단·선수 이미지의 권리는 각 권리자에게 있어요. 공개 범위를 넓힐 때는 사용 허락을 확인하세요.
 */
window.KL_CRESTS_ON = false;   // 배포 전 저작권 문제로 끔
window.KL_FACES_ON = false;   // 선수 사진 끔
window.KL_EMBLEM_URL = code => "https://www.kleague.com/assets/images/emblem/emblem_"+code+".png";
window.KL_FACE_URL = id => "https://d2tfp74nsbbrkr.cloudfront.net/v1/player/player_"+id+".jpg";
/* 구단 이름(여러 표기) → kleague.com 팀 코드. 현역 구단은 js/data_squads26.js 의 코드를 쓰고, 옛 이름은 아래에서 이어 줘요 */
window.KL_CLUB_CODE = Object.assign({},
  Object.fromEntries(Object.entries(window.KL_SQUADS26||{}).map(([n,c])=>[n,c.code])),
  {"울산 하이":"K01","수원 블루윙":"K02","포항 해풍":"K03","해풍":"K03","제주 오름":"K04","오름":"K04","에덴":"K05","부산 파도":"K06","파도":"K06",
   "성남 라이트하우스":"K08","라이트하우스":"K08","안양 퍼플":"K09","이스트":"K09","사이언스":"K10","팔공":"K17","포트":"K18","해안":"K20","파인":"K21","무등":"K22","비트":"K26","퍼플":"K27","블루윙":"K02","하이":"K01"});
