/* 서비스 워커 (sw.js): 앱처럼 설치할 수 있게 하고, 인터넷이 끊겨도 첫 화면은 열리게 해요.
 * 항상 '인터넷 먼저(network-first)' 라서 새 버전을 올리면 바로 새 화면이 나와요. 서버(Supabase) 요청은 건드리지 않아요. */
const CACHE="kl-v1";
self.addEventListener("install",e=>{ self.skipWaiting(); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return; const u=new URL(r.url); if(u.origin!==location.origin) return;
  e.respondWith(fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{}); } return res; }).catch(()=>caches.match(r).then(m=>m||caches.match("/"))));
});
