importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.4 — corrige botão Organizar no iPhone/Safari.
// Mantém notificações controladas e reforça o clique do botão principal.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style>
/* V13.4: esconde o aviso automático em inglês do OneSignal */
#onesignal-slidedown-container,
.onesignal-slidedown-container,
.onesignal-slidedown-dialog,
.onesignal-slidedown-dialog-body,
.onesignal-popover-dialog,
.onesignal-bell-launcher,
[id*="onesignal-slidedown"],
[class*="onesignal-slidedown"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
#add{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
</style>`;

const PATCH_JS = `
<script>
(function(){
  const VERSION='13.4';
  let saving=false;
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.4 • Botão organizar corrigido.';
      document.title='Meu Planner — Bruna V13.4';
      const voice=document.getElementById('voice');
      if(voice)voice.innerHTML='🎙️ Ditado';
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
  function showMicPanel(){
    try{
      let panel=document.getElementById('micVisualPanel');
      if(!panel){
        panel=document.createElement('div');
        panel.id='micVisualPanel';
        panel.innerHTML='<div style="width:58px;height:58px;border-radius:999px;background:#aa1746;color:white;display:grid;place-items:center;font-size:28px;box-shadow:0 0 0 10px rgba(170,23,70,.10);animation:micPulse 1.25s infinite">🎙️</div><div><b style="color:#8a1238;font-size:17px">Ouvindo...</b><br><span style="color:#7f7273;font-size:14px">Use o microfone do teclado do iPhone.</span></div>';
        panel.style.cssText='display:flex;align-items:center;gap:14px;border:1px solid #f1c9d6;background:#fffdfb;border-radius:20px;padding:14px 16px;margin:12px 0;box-shadow:0 9px 22px rgba(82,44,37,.07)';
        const style=document.createElement('style');
        style.textContent='@keyframes micPulse{0%{box-shadow:0 0 0 0 rgba(170,23,70,.24)}70%{box-shadow:0 0 0 14px rgba(170,23,70,0)}100%{box-shadow:0 0 0 0 rgba(170,23,70,0)}}';
        document.head.appendChild(style);
        const actions=document.querySelector('.actions');
        if(actions&&actions.parentNode)actions.parentNode.insertBefore(panel,actions);
      }
      panel.style.display='flex';
    }catch(e){}
  }
  function setupVoice(){
    try{
      const voice=document.getElementById('voice'), input=document.getElementById('input');
      if(!voice||!input)return;
      voice.innerHTML='🎙️ Ditado';
      voice.onclick=function(ev){
        try{ev.preventDefault();ev.stopPropagation();}catch(e){}
        showMicPanel();
        input.focus();
        try{input.setSelectionRange(input.value.length,input.value.length)}catch(e){}
        try{toast('🎙️ Toque no microfone do teclado e fale sua tarefa.')}catch(e){}
        return false;
      };
    }catch(e){}
  }
  function addTaskFixed(ev){
    try{ if(ev){ev.preventDefault();ev.stopPropagation();} }catch(e){}
    if(saving)return false;
    saving=true;
    setTimeout(function(){saving=false},700);
    try{
      const inputEl=document.getElementById('input');
      const text=(inputEl&&inputEl.value?inputEl.value:'').trim();
      if(!text){try{toast('Escreva ou fale alguma coisa primeiro.')}catch(e){} return false;}
      if(typeof makeItem!=='function')throw new Error('função de criação não carregou');
      const t=makeItem(text);
      if(typeof tasks==='undefined'||!Array.isArray(tasks))throw new Error('lista de tarefas não carregou');
      tasks.unshift(t);
      if(inputEl)inputEl.value='';
      try{localStorage.brunaTasks=JSON.stringify(tasks)}catch(e){}
      try{render()}catch(e){}
      try{toast('✅ Tarefa organizada em '+(typeof label==='function'?label(t.cat):t.cat)+(t.time?' • '+t.time:''));}catch(e){}
      try{if(typeof scheduleRemote==='function')scheduleRemote(t)}catch(e){}
      return false;
    }catch(err){
      try{toast('Não consegui organizar: '+err.message)}catch(e){}
      return false;
    }
  }
  function setupAddButton(){
    try{
      const btn=document.getElementById('add');
      if(!btn)return;
      btn.onclick=addTaskFixed;
      btn.addEventListener('click',addTaskFixed,true);
      btn.addEventListener('touchend',addTaskFixed,true);
    }catch(e){}
  }
  function start(){
    setVersion();
    hideOneSignalEnglishPrompt();
    setupVoice();
    setupAddButton();
    setTimeout(hideOneSignalEnglishPrompt,300);
    setTimeout(hideOneSignalEnglishPrompt,1000);
    setTimeout(function(){setVersion();setupVoice();setupAddButton();},1200);
    try{new MutationObserver(function(){hideOneSignalEnglishPrompt();setupAddButton();}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.4');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.4 • Botão organizar corrigido.');
  if(!s.includes('V13.4: esconde o aviso automático em inglês'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes("const VERSION='13.4'"))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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