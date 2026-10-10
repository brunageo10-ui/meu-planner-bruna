self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const LOCK_CSS = `
<style id="lock-horizontal-136-sw">
html,body{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important;overscroll-behavior-x:none!important;touch-action:pan-y!important;position:relative!important}
body{left:0!important;right:0!important;margin:0!important}
main,#top{width:100%!important;max-width:780px!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
.top,.hero,.panel,.stats,.head,.filters,.item,.fold,.tools,.nav,.inputWrap,.micBox,.actions{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.hero,.panel,.item,.fold,.tools{overflow:hidden!important}.filters{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}.nav{max-width:calc(100% - 32px)!important;overflow:hidden!important}.round,#settingsBtn,#searchBtn{flex-shrink:0!important}
@supports(overflow:clip){html,body{overflow-x:clip!important}}
</style>`;

const LOCK_JS = `
<script id="lock-horizontal-js-136-sw">
(function(){
  function setVersion(){try{var el=document.getElementById('versionLine');if(el)el.textContent='Versão 13.6 • Tela travada lateralmente.';document.title='Meu Planner — Bruna V13.6';}catch(e){}}
  function lockX(){try{document.documentElement.style.overflowX='hidden';document.body.style.overflowX='hidden';document.documentElement.style.maxWidth='100%';document.body.style.maxWidth='100%';if(window.scrollX)window.scrollTo(0,window.scrollY);var main=document.querySelector('main');if(main){main.style.overflowX='hidden';main.style.maxWidth='780px';main.style.width='100%';}}catch(e){}}
  function start(){setVersion();lockX();setTimeout(lockX,80);setTimeout(lockX,400);setTimeout(lockX,1200);window.addEventListener('resize',lockX,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(lockX,250)},{passive:true});document.addEventListener('touchend',lockX,{passive:true});document.addEventListener('scroll',lockX,{passive:true});}
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.6');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.6 • Tela travada lateralmente.');
  if(!s.includes('lock-horizontal-136-sw'))s=s.replace('\n</style>','\n'+LOCK_CSS+'\n</style>');
  if(!s.includes('lock-horizontal-js-136-sw'))s=s.replace('\n</body>','\n'+LOCK_JS+'\n</body>');
  return s;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate'&&request.destination!=='document')return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(async response=>{
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html'))return response;
    const html=await response.text();
    return new Response(patchPlannerHtml(html),{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }).catch(()=>fetch(request)));
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = {body: event.data ? event.data.text() : ''}; }
  event.waitUntil(self.registration.showNotification(data.title || 'Meu Planner 💛', {
    body: data.body || 'Você tem um lembrete.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: data.url || './'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || './'));
});
