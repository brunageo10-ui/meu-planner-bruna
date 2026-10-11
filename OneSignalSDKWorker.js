importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.7 — restaura cliques principais sem conflito com a base.
// Mantém o botão Feito oculto na Agenda e deixa Organizar/Ditado chamarem as funções originais.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
/* V14.7: visual apenas, sem bloquear clique */
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
`;

const PATCH_JS = `
<script id="fix-buttons-147-js">
(function(){
  var VERSION_LABEL='14.7';
  var addLock=false;
  var voiceLock=false;
  function byId(id){return document.getElementById(id)}
  function setVersion(){
    try{
      var el=byId('versionLine');
      if(el)el.textContent='Versão 14.7 • Botões e avisos restaurados.';
      document.title='Meu Planner — Bruna V14.7';
    }catch(e){}
  }
  function say(msg){try{toast(msg)}catch(e){try{alert(msg)}catch(_){}}}
  function callBaseAdd(ev){
    try{if(ev){ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation();}}catch(e){}
    if(addLock)return false;
    addLock=true;
    setTimeout(function(){addLock=false},900);
    try{
      if(typeof addTask==='function'){
        return addTask(ev||new Event('click'))===undefined?false:false;
      }
    }catch(err){
      say('Não consegui organizar: '+err.message);
      return false;
    }
    try{
      var input=byId('input');
      var text=input&&input.value?input.value.trim():'';
      if(!text){say('Escreva ou fale alguma coisa primeiro.');return false;}
      if(typeof makeItem!=='function')throw new Error('função de criação indisponível');
      var t=makeItem(text);
      if(typeof tasks!=='undefined'&&Array.isArray(tasks)){
        tasks.unshift(t);
        localStorage.brunaTasks=JSON.stringify(tasks);
      }else{
        var arr=[];try{arr=JSON.parse(localStorage.brunaTasks||'[]')}catch(e){arr=[]}
        arr.unshift(t);localStorage.brunaTasks=JSON.stringify(arr);
      }
      if(input)input.value='';
      try{if(typeof render==='function')render()}catch(e){}
      say('✅ Tarefa organizada'+(t.time?' • '+t.time:''));
      try{if(typeof scheduleRemote==='function')scheduleRemote(t)}catch(e){}
    }catch(err2){say('Não consegui organizar: '+err2.message)}
    return false;
  }
  function callBaseVoice(ev){
    try{if(ev){ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation();}}catch(e){}
    if(voiceLock)return false;
    voiceLock=true;
    setTimeout(function(){voiceLock=false},900);
    try{
      if(typeof startDictation==='function'){
        return startDictation(ev||new Event('click'))===undefined?false:false;
      }
    }catch(err){}
    try{
      var input=byId('input'); if(input)input.focus();
      var box=byId('micBox'),title=byId('micTitle'),hint=byId('micHint');
      if(box)box.classList.add('on');
      if(title)title.textContent='Use o microfone do teclado';
      if(hint)hint.textContent='Toque no microfone do teclado do iPhone e fale sua tarefa.';
    }catch(e){}
    say('🎙️ Toque no microfone do teclado do iPhone.');
    return false;
  }
  function bind(){
    setVersion();
    var add=byId('add');
    var voice=byId('voice');
    if(add&&!add.dataset.fix147){
      add.dataset.fix147='1';
      add.onclick=callBaseAdd;
      add.addEventListener('click',callBaseAdd,true);
      add.addEventListener('touchend',callBaseAdd,{capture:true,passive:false});
      add.addEventListener('pointerup',callBaseAdd,true);
    }
    if(voice&&!voice.dataset.fix147){
      voice.dataset.fix147='1';
      voice.onclick=callBaseVoice;
      voice.addEventListener('click',callBaseVoice,true);
      voice.addEventListener('touchend',callBaseVoice,{capture:true,passive:false});
      voice.addEventListener('pointerup',callBaseVoice,true);
    }
  }
  function start(){bind();setTimeout(bind,250);setTimeout(bind,900);setTimeout(bind,1800)}
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s = text;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V14.7');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 14.7 • Botões e avisos restaurados.');
  s = s.replace(/const VERSION='\d+\.\d+'/g, "const VERSION='14.7'");
  if(!s.includes('V14.7: visual apenas')){
    s = s.replace('\n</style>', '\n' + PATCH_CSS + '\n</style>');
  }
  if(!s.includes('fix-buttons-147-js')){
    s = s.replace('\n</body>', '\n' + PATCH_JS + '\n</body>');
  }
  return s;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request, {cache:'no-store'}).then(async response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      const html = await response.text();
      return new Response(patchPlannerHtml(html), {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }).catch(() => fetch(request))
  );
});