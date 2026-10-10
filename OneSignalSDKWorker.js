importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.5 — corrige experiência do ditado no iPhone.
// Tenta reconhecimento de voz quando disponível e orienta o microfone do teclado quando o iOS bloquear.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style>
/* V13.5: notificações controladas + ditado claro no iPhone */
#onesignal-slidedown-container,
.onesignal-slidedown-container,
.onesignal-slidedown-dialog,
.onesignal-slidedown-dialog-body,
.onesignal-popover-dialog,
.onesignal-bell-launcher,
[id*="onesignal-slidedown"],
[class*="onesignal-slidedown"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
#micVisualPanel .micPulseIcon{animation:micPulse 1.25s infinite!important}
@keyframes micPulse{0%{box-shadow:0 0 0 0 rgba(170,23,70,.24)}70%{box-shadow:0 0 0 14px rgba(170,23,70,0)}100%{box-shadow:0 0 0 0 rgba(170,23,70,0)}}
</style>`;

const PATCH_JS = `
<script>
(function(){
  const VERSION='13.5';
  let saving=false;
  let currentRecognition=null;
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.5 • Ditado corrigido.';
      document.title='Meu Planner — Bruna V13.5';
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
  function showMicPanel(title, subtitle, pulsing){
    try{
      let panel=document.getElementById('micVisualPanel');
      if(!panel){
        panel=document.createElement('div');
        panel.id='micVisualPanel';
        panel.innerHTML='<div class="micPulseIcon" id="micPulseIcon" style="width:58px;height:58px;border-radius:999px;background:#aa1746;color:white;display:grid;place-items:center;font-size:28px;box-shadow:0 0 0 10px rgba(170,23,70,.10)">🎙️</div><div><b id="micPanelTitle" style="color:#8a1238;font-size:17px">Ditado</b><br><span id="micPanelSub" style="color:#7f7273;font-size:14px">Use o microfone do teclado do iPhone.</span></div>';
        panel.style.cssText='display:flex;align-items:center;gap:14px;border:1px solid #f1c9d6;background:#fffdfb;border-radius:20px;padding:14px 16px;margin:12px 0;box-shadow:0 9px 22px rgba(82,44,37,.07)';
        const actions=document.querySelector('.actions');
        if(actions&&actions.parentNode)actions.parentNode.insertBefore(panel,actions);
      }
      panel.style.display='flex';
      const t=document.getElementById('micPanelTitle'), s=document.getElementById('micPanelSub'), i=document.getElementById('micPulseIcon');
      if(t)t.textContent=title||'Ditado';
      if(s)s.textContent=subtitle||'Use o microfone do teclado do iPhone.';
      if(i){if(pulsing)i.classList.add('micPulseIcon');else i.classList.remove('micPulseIcon')}
    }catch(e){}
  }
  function showKeyboardFallback(){
    const input=document.getElementById('input');
    showMicPanel('Microfone do teclado', 'Toque no microfone do teclado do iPhone e fale sua tarefa.', false);
    try{input.focus();input.setSelectionRange(input.value.length,input.value.length)}catch(e){}
    try{toast('🎙️ Toque no microfone do teclado do iPhone.')}catch(e){}
  }
  function tryBrowserSpeech(){
    const input=document.getElementById('input');
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showKeyboardFallback();return;}
    try{
      if(currentRecognition){try{currentRecognition.stop()}catch(e){}}
      const rec=new SR();
      currentRecognition=rec;
      let gotText=false;
      rec.lang='pt-BR';
      rec.interimResults=false;
      rec.maxAlternatives=1;
      rec.onstart=function(){showMicPanel('Ouvindo de verdade...', 'Pode falar agora. O texto aparecerá no campo.', true)};
      rec.onresult=function(ev){
        gotText=true;
        let txt='';
        try{txt=ev.results[0][0].transcript||''}catch(e){}
        if(txt){
          const before=(input.value||'').trim();
          input.value=before?(before+' '+txt):txt;
          showMicPanel('Fala captada ✅', 'Agora toque em Organizar automaticamente.', false);
          try{toast('✅ Fala captada.')}catch(e){}
        }else{
          showKeyboardFallback();
        }
      };
      rec.onerror=function(){showKeyboardFallback()};
      rec.onend=function(){if(!gotText){showKeyboardFallback()}};
      showMicPanel('Pedindo acesso ao microfone...', 'Se o iPhone bloquear, use o microfone do teclado.', true);
      rec.start();
    }catch(e){
      showKeyboardFallback();
    }
  }
  function setupVoice(){
    try{
      const voice=document.getElementById('voice'), input=document.getElementById('input');
      if(!voice||!input)return;
      voice.innerHTML='🎙️ Ditado';
      voice.onclick=function(ev){
        try{ev.preventDefault();ev.stopPropagation();}catch(e){}
        input.focus();
        try{input.setSelectionRange(input.value.length,input.value.length)}catch(e){}
        tryBrowserSpeech();
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
    try{new MutationObserver(function(){hideOneSignalEnglishPrompt();setupAddButton();setupVoice();}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.5');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.5 • Ditado corrigido.');
  s=s.replace(/const VERSION='\d+\.\d+'/g,"const VERSION='13.5'");
  if(!s.includes('V13.5: notificações controladas + ditado claro'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes("const VERSION='13.5'"))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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