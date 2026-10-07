/* 구글 로그인 + 클라우드 저장 (js/auth.js)
 *  - Supabase Auth(구글)로 로그인하면 선수판 저장(klife-save)을 내 계정에 올려 두고, 다른 기기에서 불러올 수 있어요.
 *  - 로그인 정보는 이 기기의 localStorage("kl-auth") 에만 있어요. 서버에는 '내 행만' 읽고 쓰는 규칙(RLS)이 걸려 있어요(docs/cloud-save.sql).
 *  - 설정 방법: docs/auth-setup.md */
(function(){
"use strict";
var CFG=window.KL_CONFIG||{}, KEY="kl-auth", st=null, timer=null, listeners=[];
function load(){ try{ st=JSON.parse(localStorage.getItem(KEY)||"null"); }catch(e){ st=null; } }
function store(){ try{ if(st) localStorage.setItem(KEY,JSON.stringify(st)); else localStorage.removeItem(KEY); }catch(e){} }
function emit(){ listeners.forEach(function(f){ try{ f(st); }catch(e){} }); }
function hdr(tok){ return {apikey:CFG.SUPABASE_ANON_KEY,Authorization:"Bearer "+(tok||CFG.SUPABASE_ANON_KEY),"Content-Type":"application/json"}; }
/* 구글에서 돌아왔을 때 주소 뒤(#access_token=…)를 읽어요 */
function fromHash(){
  var h=location.hash||""; if(h.indexOf("access_token=")<0) return Promise.resolve(false);
  var p={}; h.replace(/^#/,"").split("&").forEach(function(kv){ var a=kv.split("="); p[a[0]]=decodeURIComponent(a[1]||""); });
  history.replaceState(null,"",location.pathname+location.search);
  st={at:p.access_token,rt:p.refresh_token,exp:Date.now()+((+p.expires_in||3600)-30)*1000};
  return fetch(CFG.SUPABASE_URL+"/auth/v1/user",{headers:hdr(st.at)}).then(function(r){ return r.ok?r.json():null; }).then(function(u){ if(u){ st.id=u.id; st.email=u.email; st.name=(u.user_metadata&&(u.user_metadata.name||u.user_metadata.full_name))||u.email; } store(); emit(); return true; }).catch(function(){ store(); emit(); return true; });
}
function refresh(){
  if(!st||!st.rt) return Promise.resolve(false); if(Date.now()<st.exp) return Promise.resolve(true);
  return fetch(CFG.SUPABASE_URL+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:hdr(),body:JSON.stringify({refresh_token:st.rt})}).then(function(r){ if(!r.ok) throw new Error("expired"); return r.json(); }).then(function(j){ st.at=j.access_token; st.rt=j.refresh_token||st.rt; st.exp=Date.now()+((j.expires_in||3600)-30)*1000; store(); return true; }).catch(function(){ st=null; store(); emit(); return false; });
}
var A={
  user:function(){ return st&&st.id?{id:st.id,email:st.email,name:st.name}:null; },
  loggedIn:function(){ return !!(st&&st.id); },
  id:function(){ return st&&st.id?st.id:null; },
  /* 요청 보낼 때 쓰는 접속 열쇠(만료됐으면 새로 받아요). 로그인 안 했으면 null */
  token:function(){ return refresh().then(function(ok){ return ok&&st?st.at:null; }); },
  onChange:function(f){ listeners.push(f); },
  login:function(){ if(!CFG.SUPABASE_URL){ alert("서버 설정이 아직 없어요."); return; } var back=location.origin+location.pathname; location.href=CFG.SUPABASE_URL+"/auth/v1/authorize?provider=google&redirect_to="+encodeURIComponent(back); },
  logout:function(){ st=null; store(); emit(); },
  /* 저장 올리기: payload 는 {save,dex,at} 같은 JSON */
  upload:function(payload){
    return refresh().then(function(ok){ if(!ok||!A.loggedIn()) throw new Error("로그인이 필요해요"); var body=JSON.stringify({user_id:st.id,data:payload,updated_at:new Date().toISOString()}); if(body.length>550000) throw new Error("저장 데이터가 너무 커요");
      return fetch(CFG.SUPABASE_URL+"/rest/v1/life_saves?on_conflict=user_id",{method:"POST",headers:Object.assign({Prefer:"resolution=merge-duplicates,return=minimal"},hdr(st.at)),body:body}); }).then(function(r){ if(!r.ok) throw new Error(r.status===404?"서버에 life_saves 표가 아직 없어요":"저장 실패 ("+r.status+")"); return true; });
  },
  download:function(){
    return refresh().then(function(ok){ if(!ok||!A.loggedIn()) throw new Error("로그인이 필요해요"); return fetch(CFG.SUPABASE_URL+"/rest/v1/life_saves?select=data,updated_at&user_id=eq."+st.id,{headers:hdr(st.at)}); }).then(function(r){ if(!r.ok) throw new Error(r.status===404?"서버에 life_saves 표가 아직 없어요":"불러오기 실패 ("+r.status+")"); return r.json(); }).then(function(rows){ return rows[0]||null; });
  },
  /* 저장할 때마다 불러 주면 8초 모아서 한 번만 올려요 */
  queue:function(getPayload){ if(!A.loggedIn()) return; clearTimeout(timer); timer=setTimeout(function(){ try{ A.upload(getPayload()).catch(function(){}); }catch(e){} },8000); },
  ready:null
};
load();
A.ready=fromHash().then(function(){ return refresh(); }).then(function(){ emit(); });
window.KL_AUTH=A;
})();
