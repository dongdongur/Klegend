/*
 * 가벼운 복사 방지 (js/guard.js)
 * 우클릭·끌어서 복사·텍스트 선택·소스 보기/개발자 도구 단축키를 막아서 쉽게 따라 베끼는 걸 어렵게 해요.
 * 주의: 브라우저로 내려받는 웹 코드는 완전히 감출 수 없어요. 이건 '가벼운 억제'일 뿐이고,
 * 입력칸(글자 쓰기)과 접근성에는 영향이 없게 입력 요소는 제외했어요.
 * 끄는 법: 주소 뒤에 ?noguard=1 (개발·점검용)
 */
(function(){
"use strict";
try{ if(/[?&]noguard=1/.test(location.search)) return; }catch(e){}
const isField=t=>!!(t&&t.closest&&t.closest("input,textarea,select,[contenteditable='true']"));
document.addEventListener("contextmenu",e=>{ if(!isField(e.target)) e.preventDefault(); });
document.addEventListener("dragstart",e=>{ e.preventDefault(); });
document.addEventListener("selectstart",e=>{ if(!isField(e.target)) e.preventDefault(); });
document.addEventListener("copy",e=>{ if(!isField(e.target)) e.preventDefault(); });
document.addEventListener("keydown",e=>{
  const k=(e.key||"").toLowerCase(), c=e.ctrlKey||e.metaKey;
  if(e.key==="F12"||(c&&e.shiftKey&&["i","j","c"].includes(k))||(c&&["u","s","p"].includes(k)&&!isField(e.target))) e.preventDefault();
});
const st=document.createElement("style");
st.textContent="body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea,select,[contenteditable='true']{-webkit-user-select:text;user-select:text}img,svg{-webkit-user-drag:none}";
document.head.appendChild(st);
})();
