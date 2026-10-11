importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.3 — remove Feito sem quebrar botões.
// Patch seguro: não insere <style> dentro de <style> e reforça os cliques principais.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
/* hide-today-done-143 */
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
`;

const PATCH_JS = `
<script id="fix-buttons-143-js">
(function(){
  function setVersion(){
    try{
      var el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 14.3 • Botões restaurados.';
      document.title='Meu Planner — Bruna V14.3';
    }catch(e){}
  }
  function bindButtons(){
    try{
      var add=document.getElementById('add');
      if(add && typeof addTask==='function'){
        add.onclick=function(ev){return addTask(ev)};
        if(!add.dataset.fix143){
          add.dataset.fix143='1';
          add.addEventListener('click',function(ev){return addTask(ev)},true);
          add.addEventListener('touchend',function(ev){return addTask(ev)},{capture:true,passive:false});
        }
      }
    }catch(e){}
    try{
      var voice=document.getElementById('voice');
      if(voice && typeof startDictation==='function'){
        voice.onclick=function(ev){return startDictation(ev)};
        if(!voice.dataset.fix143){
          voice.dataset.fix143='1';
          voice.addEventListener('click',function(ev){return startDictation(ev)},true);
          voice.addEventListener('touchend',function(ev){return startDictation(ev)},{capture:true,passive:false});
        }
      }
    }catch(e){}
  }
  function hideDone(){
    try{document.querySelectorAll('#todayList .doneBtn').forEach(function(b){b.remove();});}catch(e){}
  }
  function start(){
    setVersion(); bindButtons(); hideDone();
    setTimeout(function(){setVersion();bindButtons();hideDone();},300);
    setTimeout(function(){setVersion();bindButtons();hideDone();},900);
    try{new MutationObserver(function(){setTimeout(hideDone,20)}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V14.3');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 14.3 • Botões restaurados.');
  if(!s.includes('hide-today-done-143'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes('fix-buttons-143-js'))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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