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
window.KL_OPERATOR = { name: "동동구리", email: "", note: "개인 운영 팬 프로젝트" };

/* 읽기 요청 간살(KL_FETCH_CACHE): 같은 주소의 명예의 전당·실시간 소식 조회는 잠깐(2분/30초) 브라우저가 기억해서 서버 요청을 줄여요. 쓰기·로그인·채팅은 건드리지 않아요. */
(function(){
  if(!window.fetch||window.KL_FETCH_CACHE) return; window.KL_FETCH_CACHE=true; var orig=window.fetch.bind(window);
  function ttl(u){ if(u.indexOf("/rest/v1/life_hof")>=0) return 120000; if(u.indexOf("/rest/v1/life_live")>=0) return 30000; if(u.indexOf("/rest/v1/results")>=0) return 60000; return 0; }
  window.fetch=function(input,init){
    try{ var u=typeof input==="string"?input:(input&&input.url)||""; var m=((init&&init.method)||(input&&input.method)||"GET").toUpperCase(); var t=m==="GET"?ttl(u):0;
      if(t){ var k="klc:"+u; var raw=sessionStorage.getItem(k); if(raw){ var o=JSON.parse(raw); if(Date.now()-o.t<t) return Promise.resolve(new Response(o.b,{status:200,headers:{"content-type":"application/json"}})); }
        return orig(input,init).then(function(r){ if(!r.ok) return r; var cl=r.clone(); cl.text().then(function(b){ try{ if(b.length<900000) sessionStorage.setItem(k,JSON.stringify({t:Date.now(),b:b})); }catch(e){} }); return r; }); }
    }catch(e){}
    return orig(input,init);
  };
})();
