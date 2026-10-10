importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.8 — agenda de hoje sem botão "Feito".
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="agenda-clean-138">
/* V13.8: Agenda de hoje apenas informativa, sem botão Feito */
#todayList .doneBtn{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}
#todayList .mini{
  padding-right:10px!important;
}
html,body{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  overflow-x:hidden!important;
  overscroll-behavior-x:none!important;
  touch-action:pan-y!important;
  position:relative!important;
}
body{left:0!important;right:0!important;margin:0!important}
main,#top{width:100%!important;max-width:780px!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
.top,.hero,.panel,.stats,.head,.filters,.item,.fold,.tools,.nav,.inputWrap,.micBox,.actions{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.hero,.panel,.item,.fold,.tools{overflow:hidden!important}
.filters{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
.nav{max-width:calc(100% - 32px)!important;overflow:hidden!important}
.round,#settingsBtn,#searchBtn{flex-shrink:0!important}
@supports(overflow:clip){html,body{overflow-x:clip!important}}
</style>`;

const PATCH_JS = `
<script id="agenda-clean-js-138">
(function(){
  const VERSION='13.8';
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.8 • Agenda sem botão Feito.';
      document.title='Meu Planner — Bruna V13.8';
    }catch(e){}
  }
  function lockX(){
    try{
      document.documentElement.style.overflowX='hidden';
      document.body.style.overflowX='hidden';
      document.documentElement.style.maxWidth='100%';
      document.body.style.maxWidth='100%';
      if(window.scrollX)window.scrollTo(0,window.scrollY);
      const main=document.querySelector('main');
      if(main){main.style.overflowX='hidden';main.style.maxWidth='780px';main.style.width='100%';}
    }catch(e){}
  }
  function removeTodayDoneButtons(){
    try{
      document.querySelectorAll('#todayList .doneBtn').forEach(function(btn){btn.remove();});
    }catch(e){}
  }
  function start(){
    setVersion();
    lockX();
    removeTodayDoneButtons();
    setTimeout(removeTodayDoneButtons,80);
    setTimeout(removeTodayDoneButtons,400);
    setTimeout(removeTodayDoneButtons,1200);
    window.addEventListener('resize',lockX,{passive:true});
    window.addEventListener('orientationchange',function(){setTimeout(lockX,250)},{passive:true});
    document.addEventListener('touchend',function(){lockX();setTimeout(removeTodayDoneButtons,40)},{passive:true});
    document.addEventListener('scroll',lockX,{passive:true});
    try{new MutationObserver(function(){removeTodayDoneButtons();lockX();}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.8');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.8 • Agenda sem botão Feito.');
  if(!s.includes('agenda-clean-138'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes('agenda-clean-js-138'))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
  return s;
}

self.addEventListener('fetch', event=>{
  const request=event.request;
  if(request.mode!=='navigate'&&request.destination!=='document')return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(async response=>{
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html'))return response;
    const html=await response.text();
    return new Response(patchPlannerHtml(html),{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }).catch(()=>fetch(request)));
});