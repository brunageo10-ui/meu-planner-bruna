importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.2 — remove botão Feito da Agenda de hoje.
// Patch mínimo: só esconde o botão da agenda, sem alterar criação, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="hide-today-done-142">
/* V14.2: remove apenas o botão ✓ Feito da Agenda de hoje */
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
</style>`;

const PATCH_JS = `
<script id="version-142-js">
(function(){
  function setVersion(){
    try{
      var el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 14.2 • Botão Feito removido.';
      document.title='Meu Planner — Bruna V14.2';
    }catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',setVersion);else setVersion();
  setTimeout(setVersion,500);
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V14.2');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 14.2 • Botão Feito removido.');
  if(!s.includes('hide-today-done-142'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes('version-142-js'))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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