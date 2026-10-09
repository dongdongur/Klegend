/* Supabase 연결 정보. anon 키는 브라우저에 공개되도록 만들어진 키라서 여기에 둬도 돼요.
   (service_role 키는 절대 넣지 마세요.) */
window.KL_CONFIG = {
  SUPABASE_URL: "https://elvhqjwvlytkumxahhsw.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdmhxand2bHl0a3VteGFoaHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4Mjc2NzksImV4cCI6MjEwNjQwMzY3OX0.moDnQVS-wYtHQkeE5zSPMBKYs4REHkpOqT_8vC5roig"
};

/* 개발자 후원 안내(선택). 채우면 메인 화면 맨 아래에 '개발자 응원하기'가 나타나고, 비워 두면 보이지 않아요.
   게임 혜택은 없는 순수 후원이라는 문구가 함께 보여요. 개인 계좌번호를 그대로 공개하기보다 송금 링크(토스·카카오페이 등)를 쓰는 걸 권해요. */
window.KL_SUPPORT = { text: "", link: "", account: "" };

/* 운영자 정보: 약관·개인정보 처리방침·메인 하단에 표시돼요. 비워 두면 해당 줄은 숨겨져요. (이메일은 공개되니 공개해도 되는 주소를 쓰세요) */
/* 공개 SNS 계정: 인스타그램 아이디(@ 없이) */
window.KL_SOCIAL = { instagram: "Klegendgame", dc: "https://gall.dcinside.com/mgallery/board/lists?id=klegend" };
window.KL_OPERATOR = { name: "동동구리", email: "", note: "개인 운영 팬 프로젝트" };

/* 광고 칸(js/ads.js): enabled 가 false 이거나 슬롯 설정이 없으면 아무것도 보이지 않고 자리도 차지하지 않아요. 사업자 등록·광고 심사 뒤에 아래 값만 채우면 돼요.
   provider: "adfit"(카카오 애드핏: unit 에 광고단위 ID) | "adsense"(client 에 ca-pub-…, 슬롯마다 slot) | "custom"(html 에 직접 넣은 태그).
   슬롯 이름: home(메인 하단) · result(시즌 결과 중간) · retired(은퇴 화면) · hof(명예의 전당 목록) · help(도움말) · patch(패치노트) · terms(약관·방침). "*" 는 모든 슬롯 기본값.
   미니게임·이벤트 선택창·계약서·하단 고정 버튼 주변에는 넣지 않아요. 후원자 코드를 등록한 사람에게는 광고가 꺼져요. */
window.KL_ADS = { enabled: false, provider: "adfit", client: "", hideForSupporters: true, minGapMs: 60000,
  slots: {
    // "*": { unit: "DAN-xxxxxxxx", w: 320, h: 100 },
    // home: { unit: "DAN-xxxxxxxx", w: 320, h: 100 },
  } };

/* 부적절한 이름 걸러내기(KL_BAD): 성적·욕설 낱말이 들어간 닉네임·선수 이름은 입력과 등록을 막고, 이미 올라온 기록도 목록에서 숨겨요. 띄어쓰기·점·모양 바꾼 글자로 피해 가도 잡아요. */
(function(){
  if(window.KL_BAD) return;
  var SUB=["짬지","잠지","쨤지","보짓","자짓","보지털","ㅂㅈ","부랄","불알","정액","좆","좇","씨발","시발","씨팔","시팔","ㅅㅂ","ㅆㅂ","병신","븅신","ㅂㅅ","개새끼","섹스","야동","야설","꼬추","자위","페니스","음순","질싸","딸딸이","대딸","후장","조건만남","창녀","느금","느그엄","니미","애미","지랄","염병","엿먹","쌍년","쌍놈","썅","씹","존나","미친놈","미친년","강간","성폭","몰카","빨통","젖통","음란","포르노","porn","fuck","shit","pussy","penis","vagina","nigg","bitch","asshole","whore","slut","boob","hentai"];
  var WORD=["보지","자지","섹","성기","음경","걸레","항문","sex","ass","gay","dick","cock","cunt","rape","cum","anal","jot","jaji","bozi"];
  function norm(s){ s=String(s==null?"":s).toLowerCase(); var m={"0":"o","1":"i","3":"e","4":"a","5":"s","7":"t","@":"a","$":"s","!":"i"}; return s.replace(/[01345 7@$!]/g,function(ch){ return m[ch]||""; }); }
  function bad(s){
    s=String(s==null?"":s); if(!s) return false;
    var flat=s.toLowerCase().replace(/[  .·,_~*'"^-]+/g,"");           // 띄어쓰기·기호 제거
    var flatL=norm(flat);
    for(var i=0;i<SUB.length;i++){ if(flat.indexOf(SUB[i])>=0||flatL.indexOf(SUB[i])>=0) return true; }
    var toks=s.toLowerCase().split(/[^a-z가-힣]+/);
    for(var j=0;j<toks.length;j++){ if(WORD.indexOf(toks[j])>=0) return true; }
    for(var k=0;k<WORD.length;k++){ if(flat===WORD[k]) return true; }
    /* 보지·자지는 "보지만"처럼 흔한 말에도 있어서, 이름 앞이나 끝에 붙어 짧게 쓰인 경우만 막아요 */
    var PT="만는은도를가이의에러";
    var ST=["보지","자지"];
    for(var q=0;q<ST.length;q++){ var w=ST[q]; if(flat.length<=6){ if(flat.indexOf(w)===0&&PT.indexOf(flat.charAt(2)||"만")<0) return true; if(flat.length>=3&&flat.lastIndexOf(w)===flat.length-2) return true; } }
    return false; }
  window.KL_BAD=bad;
  /* 서버에서 받은 목록(기록·소식)에서 부적절한 이름의 줄을 뺀다 */
  window.KL_CLEAN=function(rows){ if(!Array.isArray(rows)) return rows; return rows.filter(function(r){ if(!r||typeof r!=="object") return true; return !["name","nickname","nick","manager","team_name","who"].some(function(k){ return typeof r[k]==="string"&&bad(r[k]); }); }); };
})();

/* 읽기 요청 간살(KL_FETCH_CACHE): 같은 주소의 명예의 전당·실시간 소식 조회는 잠깐(2분/30초) 브라우저가 기억해서 서버 요청을 줄여요. 쓰기·로그인·채팅은 건드리지 않아요. */
(function(){
  if(!window.fetch||window.KL_FETCH_CACHE) return; window.KL_FETCH_CACHE=true; var orig=window.fetch.bind(window);
  function ttl(u){ if(u.indexOf("/rest/v1/life_hof")>=0) return 120000; if(u.indexOf("/rest/v1/life_live")>=0) return 30000; if(u.indexOf("/rest/v1/results")>=0) return 60000; return 0; }
  function clean(b){ try{ var j=JSON.parse(b); return JSON.stringify(window.KL_CLEAN?window.KL_CLEAN(j):j); }catch(e){ return b; } }
  window.fetch=function(input,init){
    try{ var u=typeof input==="string"?input:(input&&input.url)||""; var m=((init&&init.method)||(input&&input.method)||"GET").toUpperCase(); var t=m==="GET"?ttl(u):0;
      if(t){ var k="klc:"+u; var raw=sessionStorage.getItem(k); if(raw){ var o=JSON.parse(raw); if(Date.now()-o.t<t) return Promise.resolve(new Response(clean(o.b),{status:200,headers:{"content-type":"application/json"}})); }
        return orig(input,init).then(function(r){ if(!r.ok) return r; var cl=r.clone(); cl.text().then(function(b){ try{ if(b.length<900000) sessionStorage.setItem(k,JSON.stringify({t:Date.now(),b:b})); }catch(e){} }); return r.text().then(function(b){ return new Response(clean(b),{status:r.status,headers:{"content-type":"application/json"}}); }); }); }
    }catch(e){}
    return orig(input,init);
  };
})();
