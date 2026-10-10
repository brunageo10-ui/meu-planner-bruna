importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.3 — remove a janela automática em inglês do OneSignal.
// As notificações continuam sendo ativadas pelo botão Ferramentas > Notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style>
/* V13.3: esconde o aviso automático em inglês do OneSignal */
#onesignal-slidedown-container,
.onesignal-slidedown-container,
.onesignal-slidedown-dialog,
.onesignal-slidedown-dialog-body,
.onesignal-popover-dialog,
.onesignal-bell-launcher,
[id*="onesignal-slidedown"],
[class*="onesignal-slidedown"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
</style>`;

const PATCH_JS = `
<script>
(function(){
  const VERSION='13.3';
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.3 • Notificações controladas.';
      document.title='Meu Planner — Bruna V13.3';
    }catch(e){}
  }
  function hideOneSignalEnglishPrompt(){
    try{
      const nodes=[...document.querySelectorAll('body *')];
      nodes.forEach(function(n){
        const id=(n.id||'').toLowerCase();
        const cls=(n.className||'').toString().toLowerCase();
        const txt=(n.textContent||'').toLowerCase();
        if(id.includes('onesignal')||cls.includes('onesignal')||txt.includes('subscribe to our notifications')){
          if(txt.includes('subscribe to our notifications')||id.includes('onesignal-slidedown')||cls.includes('onesignal-slidedown')){
            n.style.setProperty('display','none','important');
            n.style.setProperty('visibility','hidden','important');
            n.style.setProperty('opacity','0','important');
            n.style.setProperty('pointer-events','none','important');
          }
        }
      });
    }catch(e){}
  }
  function start(){
    setVersion();
    hideOneSignalEnglishPrompt();
    setTimeout(hideOneSignalEnglishPrompt,300);
    setTimeout(hideOneSignalEnglishPrompt,1000);
    setTimeout(hideOneSignalEnglishPrompt,2500);
    try{new MutationObserver(hideOneSignalEnglishPrompt).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.3');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.3 • Notificações controladas.');
  if(!s.includes('V13.3: esconde o aviso automático em inglês'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes("const VERSION='13.3'"))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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
