/*
 * 유스 클럽의 개성 (js/life/youthperk.js)
 * 어느 유스 클럽·어느 나라 아카데미에서 크느냐에 따라 잘 크는 능력치가 달라져요.
 *  - 스페인: 패스·점유 중심(기술) / 독일: 체계적인 체력·정신력 / 이탈리아: 수비 조직 / 프랑스: 빠르고 강한 신체 / 잉글랜드: 몸싸움과 템포
 *  - 레전드리그 유스도 구단마다 색깔이 있어요.
 * (실제 팀 문화를 단순하게 옮긴 게임 속 설정이에요.) 효과는 유스 시절에만 적용돼요.
 */
(function(){
"use strict";
const L=window.LIFE; if(!L) return;
const CAT={tech:["finishing","dribble","passing","vision","building","kicking","handling"],phys:["physical","pace","stamina","reflex"],def:["defending","tackle","saving","command"],mind:["composure","vision","command"]};
const TAGN={tech:"기술",phys:"신체",def:"수비",mind:"정신력"};
const COUNTRY={
 ESP:{name:"스페인식 점유 축구",tags:{tech:.4},text:"패스와 볼 소유를 가르치는 스페인식 육성 — 기술 능력치가 잘 커요."},
 GER:{name:"독일식 체계 훈련",tags:{phys:.28,mind:.16},text:"체계적인 체력·전술 훈련 — 피지컬과 침착함이 잘 커요."},
 ITA:{name:"이탈리아식 수비 조직",tags:{def:.4},text:"수비 조직과 전술 이해를 중시 — 수비 능력치가 잘 커요."},
 FRA:{name:"프랑스식 신체 육성",tags:{phys:.4},text:"빠르고 강한 신체 능력을 키우는 육성 — 스피드·피지컬이 잘 커요."},
 ENG:{name:"잉글랜드식 몸싸움과 템포",tags:{phys:.3,mind:.1},text:"강한 몸싸움과 빠른 템포에 익숙해져요 — 신체 능력치가 잘 커요."}
};
const CLUB={
 lal_fcb:{name:"라 마시아식 점유 육성",tags:{tech:.5},text:"어릴 때부터 패스 축구를 몸에 새겨요 — 기술 능력치가 아주 잘 커요."},
 lal_rma:{name:"명문 유스의 경쟁",tags:{tech:.3,mind:.2},text:"치열한 경쟁 속에서 기술과 침착함이 함께 커요."},
 lal_atm:{name:"투지의 유스",tags:{def:.3,mind:.2},text:"끈질긴 수비와 투지를 가르쳐요."},
 bun_bay:{name:"바이에른식 엘리트 육성",tags:{phys:.3,tech:.2},text:"체력과 기본기를 함께 다져요."},
 bun_bvb:{name:"젊은 재능의 무대",tags:{phys:.3,tech:.2},text:"스피드와 기술이 빠르게 올라요."},
 mci:{name:"점유 축구 아카데미",tags:{tech:.45},text:"패스 플레이 중심의 육성 — 기술 능력치가 잘 커요."},
 ars:{name:"기술 중심 아카데미",tags:{tech:.38},text:"볼 다루는 기술을 중시해요."},
 chl:{name:"풍부한 인재풀",tags:{phys:.25,tech:.2},text:"많은 선수와 경쟁하며 신체와 기술이 함께 자라요."},
 liv:{name:"강한 압박 철학",tags:{phys:.35,mind:.1},text:"체력과 압박 능력을 키워요."},
 mun:{name:"드리블의 전통",tags:{tech:.35,mind:.1},text:"과감한 돌파와 자신감을 가르쳐요."},
 sea_int:{name:"수비 조직의 명가",tags:{def:.35,mind:.1},text:"수비 조직과 전술 이해를 가르쳐요."},
 sea_juv:{name:"수비와 정신력",tags:{def:.35,mind:.15},text:"수비와 승부 근성을 가르쳐요."},
 l1_psg:{name:"파리의 재능 공장",tags:{phys:.3,tech:.2},text:"빠르고 기술 좋은 선수를 키워요."},
 l1_ol:{name:"리옹식 유스 시스템",tags:{tech:.3,phys:.2},text:"체계적인 유스 시스템으로 고르게 자라요."}
};
const KCLUB={
 "서울 이스트":{tags:{tech:.3},name:"기술 중심 유스",text:"패스와 드리블 같은 기본기를 중시해요."},
 "울산 하이":{tags:{phys:.3,mind:.1},name:"강한 체력의 유스",text:"체력과 투지를 길러요."},
 "전북 에덴":{tags:{phys:.25,tech:.15},name:"스피드와 승부욕",text:"빠른 발과 승부욕을 키워요."},
 "포항 해풍":{tags:{def:.32,mind:.1},name:"기본기와 수비 전통",text:"탄탄한 수비와 기본기를 길러요."},
 "수원 블루윙":{tags:{tech:.3,mind:.1},name:"기술과 자신감",text:"기술과 자신감을 중시해요."},
 "인천 포트":{tags:{mind:.25,def:.15},name:"투지의 유스",text:"끈질김과 정신력을 키워요."},
 "광주 무등":{tags:{tech:.3},name:"패스 축구 유스",text:"짧은 패스 플레이를 가르쳐요."},
 "대구 팔공":{tags:{phys:.3},name:"활동량의 유스",text:"많이 뛰는 축구를 가르쳐요."},
 "제주 오름":{tags:{phys:.2,tech:.2},name:"섬의 훈련장",text:"체력과 기술을 고르게 키워요."},
 "강원 파인":{tags:{phys:.3},name:"고지대 체력 훈련",text:"체력 능력치가 잘 커요."},
 "대전 사이언스":{tags:{tech:.2,mind:.2},name:"성장형 유스",text:"기술과 침착함을 길러요."}
};
const hash=s=>{ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; };
function pack(o,src){ return {name:o.name,tags:o.tags,text:o.text,src}; }
L.youthPerkOfClub=function(clubName){
  if(KCLUB[clubName]) return pack(KCLUB[clubName],clubName);
  const keys=["tech","phys","def","mind"], k=keys[hash(clubName||"x")%4], k2=keys[(hash(clubName||"x")>>3)%4];
  const tags={}; tags[k]=.26; if(k2!==k) tags[k2]=.1;
  return {name:"성실한 육성 유스",tags,text:TAGN[k]+" 능력치를 꾸준히 키워 줘요.",src:clubName};
};
L.youthPerkOfForeign=function(c){
  if(CLUB[c.id]) return pack(CLUB[c.id],c.id);
  const cty=c._cty||"ENG"; return pack(COUNTRY[cty]||COUNTRY.ENG,cty);
};
L.perkBonus=function(S,k){
  if(S.stage!=="youth"||!S.youthPerk||!S.youthPerk.tags) return 0; let v=0;
  Object.keys(S.youthPerk.tags).forEach(t=>{ if((CAT[t]||[]).includes(k)) v+=S.youthPerk.tags[t]; });
  return Math.min(.55,v);
};
L.perkTag=function(c){ const p=c&&c.id&&c.l!=null?L.youthPerkOfForeign(c):null; return p?p.name:""; };
/* 국내 유스 배정 때 특징도 같이 정해요 */
const _assign=L.assignYouthClub;
L.assignYouthClub=function(S){ _assign(S); try{ S.youthPerk=L.youthPerkOfClub(S.club.parent||S.club.name); }catch(e){} };
/* 해외 유스: 영국 외에 스페인·독일·이탈리아·프랑스 아카데미도 제안이 와요 */
L.abroadYouthPool=function(){
  const out=[]; const E=window.KL_EPL; (E&&(E.clubs||E)||[]).forEach(c=>out.push(Object.assign({},c,{_cty:"ENG"})));
  const map={LAL:"ESP",BUN:"GER",SEA:"ITA",L1:"FRA"}; Object.keys(map).forEach(k=>((window.KL_FL||{})[k]||[]).forEach(c=>out.push(Object.assign({},c,{_cty:map[k]}))));
  return out;
};
L.anyAbroadClub=function(id){ return L.abroadYouthPool().find(c=>c.id===id)||null; };
const _offer=L.overseasYouthOffer;
L.overseasYouthOffer=function(S){
  const off=_offer(S); if(!off) return off;
  const pool=L.abroadYouthPool().filter(c=>c.l<=88&&c.l>=72);
  const picked=[]; const used=new Set();
  L.shuffle(pool).forEach(c=>{ if(picked.length<3&&!used.has(c._cty)){ used.add(c._cty); picked.push(c); } });
  off.clubs=picked; return off;
};
const _go=L.goAbroadYouth;
L.goAbroadYouth=function(S,c,kind){ _go(S,c,kind); try{ const full=L.anyAbroadClub(c.id)||c; S.youthPerk=L.youthPerkOfForeign(full); S.club.country=full._cty||"ENG"; S.youthCty=full._cty||"ENG"; }catch(e){} };
})();
