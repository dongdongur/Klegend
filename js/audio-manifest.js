/*
 * 음악 파일 목록 (js/audio-manifest.js)
 * 화면 분위기(mood)마다 재생할 mp3 경로를 적어요. 비어 있으면 js/bgm.js 가 직접 만든 합성 음악을 들려줘요.
 *  menu=메인·홈 / cute=유스 시절 / calm=선수단·결과 / match=경기 진행 / epic=우승·유럽컵·황금공 / market=이적시장·오프시즌 / retire=은퇴·마무리
 *  goal=골·큰 순간 스팅어(짧은 곡) / win=승리·우승 스팅어
 * 예) menu:["assets/audio/menu/menu1.mp3","assets/audio/menu/menu2.mp3"]  ← 여러 곡이면 돌아가며 재생해요.
 * 파일을 넣을 때는 곡 페이지 주소·라이선스·내려받은 날짜를 docs/audio-licenses.csv 에 꼭 남겨 주세요.
 */
window.KL_AUDIO={menu:[],cute:[],calm:[],match:[],epic:[],market:[],retire:[],goal:[],win:[]};
