importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.8 — criação direta e agendamento no próprio botão.
// Evita depender de funções internas que o iPhone/PWA às vezes não expõe para o patch.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="fix-148-css">
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
</style>`;

const PATCH_JS = `
<script id="fix-148-js">
(function(){
  var VERSION='14.8';
  var WORKER_URL='https://still-dew-5c29.brunageo10.workers.dev/';
  var busyAdd=false, busyVoice=false;

  function el(id){return document.getElementById(id)}
  function pad(n){return String(n).padStart(2,'0')}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()}
  function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function show(msg){try{ if(typeof toast==='function'){toast(msg);return} }catch(e){} try{alert(msg)}catch(e){} }
  function readJSON(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v||f}catch(e){return f}}
  function writeJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
  function setVersion(){
    try{var v=el('versionLine'); if(v)v.textContent='Versão 14.8 • Botões e agendamento corrigidos.'; document.title='Meu Planner — Bruna V14.8'}catch(e){}
  }
  function parseTime(text){
    var s=norm(text), m=s.match(/\\b(?:as?\\s*)?([01]?\\d|2[0-3])\\s*(?:h|:)\\s*([0-5]\\d)\\b/);
    if(!m)m=s.match(/\\b(?:as?\\s*)?([01]?\\d|2[0-3])\\s*h\\s*([0-5]\\d)?\\b/);
    if(m)return pad(Number(m[1]))+':'+pad(m[2]||'00');
    if(/meio\\s*dia/.test(s))return '12:00';
    if(/cedo|manha/.test(s))return '08:00';
    if(/tarde/.test(s))return '15:00';
    if(/noite/.test(s))return '19:00';
    return '';
  }
  function parseDate(text,time){
    var s=norm(text), d=new Date(), m=s.match(/\\b(\\d{1,2})[\\/\\-](\\d{1,2})(?:[\\/\\-](\\d{2,4}))?/);
    if(m){var y=m[3]?Number(m[3]):d.getFullYear(); if(y<100)y+=2000; return y+'-'+pad(m[2])+'-'+pad(m[1])}
    if(s.indexOf('amanha')>=0){d.setDate(d.getDate()+1);return dateKey(d)}
    if(s.indexOf('hoje')>=0)return dateKey(d);
    if(time){var p=time.split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+60000)d.setDate(d.getDate()+1);return dateKey(d)}
    return '';
  }
  function classify(text){
    var s=norm(text);
    if(/beber\\s+agua|tomar\\s+agua|hidratar|vitamina|remedio|exercicio|caminhar|academia/.test(s))return {cat:'Hábitos',sub:''};
    if(/sgs|vinho|vinicola|cafe|queijo|reels|story|instagram|turis|fazenda|degustacao|cliente|roteiro|tour/.test(s))return {cat:'SGS Vinho & Café',sub:/reels|story|instagram/.test(s)?'Conteúdo':'Experiências'};
    if(/alun|prova|avaliacao|geografia|apostila|bncc|aula|escola|dever|atividade|imprimir/.test(s))return {cat:'Escola',sub:/prova|avaliacao/.test(s)?'Avaliações':'Planejamento'};
    if(/boleto|fatura|pagar|energia|luz|internet|cartao|conta\\s+de\\s+agua/.test(s))return {cat:'Contas',sub:'Pagamentos'};
    if(/comprar|mercado|farmacia|compra/.test(s))return {cat:'Compras',sub:''};
    if(/reuniao|consulta|dentista|medico|evento|compromisso|unha|banho/.test(s))return {cat:'Compromissos',sub:''};
    return {cat:'Pessoal',sub:''};
  }
  function dueAt(t){
    if(!t.time)return null;
    var d=t.date?new Date(t.date+'T'+t.time):new Date();
    if(!t.date){var p=t.time.split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+60000)d.setDate(d.getDate()+1)}
    return d;
  }
  function saveTaskToBase(t){
    var saved=false;
    try{
      if(typeof tasks!=='undefined' && Array.isArray(tasks)){
        tasks.unshift(t);
        localStorage.setItem('brunaTasks',JSON.stringify(tasks));
        saved=true;
      }
    }catch(e){}
    if(!saved){
      var arr=readJSON('brunaTasks',[]);
      if(!Array.isArray(arr))arr=[];
      arr.unshift(t);
      writeJSON('brunaTasks',arr);
    }
  }
  async function getOneSignalSub(){
    if(!('Notification' in window))throw new Error('sem suporte a notificação');
    if(Notification.permission!=='granted')throw new Error('ative as notificações em Ferramentas');
    var O=null;
    try{ if(window.oneSignalReady)O=await window.oneSignalReady }catch(e){}
    if(!O && window.OneSignalDeferred){
      O=await new Promise(function(resolve){
        try{window.OneSignalDeferred.push(function(os){resolve(os)})}catch(e){resolve(null)}
        setTimeout(function(){resolve(null)},3500)
      });
    }
    if(!O)throw new Error('OneSignal não carregou');
    try{await O.User.PushSubscription.optIn()}catch(e){}
    for(var i=0;i<12;i++){
      var id='';
      try{id=O.User && O.User.PushSubscription && O.User.PushSubscription.id}catch(e){}
      if(id)return id;
      await new Promise(function(r){setTimeout(r,500)});
    }
    throw new Error('abra pela Tela Inicial e ative as notificações');
  }
  async function scheduleDirect(t){
    if(!t.time)return {ok:false,reason:'sem horário'};
    var ev=dueAt(t);
    if(!ev || ev.getTime()<Date.now()+90000)return {ok:false,reason:'horário muito próximo'};
    var sub=await getOneSignalSub();
    var r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:sub,title:'Meu Planner 💛',message:t.text,sendAfter:ev.toISOString()})});
    var j={}; try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error('servidor não confirmou');
    var s=readJSON('brunaScheduled',{});
    s[t.id]={sendAt:ev.toISOString(),notificationId:j.id||j.notification_id||''};
    writeJSON('brunaScheduled',s);
    return {ok:true};
  }
  async function organize(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}}catch(e){}
    if(busyAdd)return false; busyAdd=true; setTimeout(function(){busyAdd=false},1200);
    var input=el('input');
    var text=input&&input.value?input.value.trim():'';
    if(!text){show('Escreva ou fale alguma coisa primeiro.');return false;}
    var time=parseTime(text), cls=classify(text), date=parseDate(text,time);
    var t={id:Date.now()+Math.floor(Math.random()*1000),text:text,cat:cls.cat,sub:cls.sub,date:date,time:time,recurrence:null,paused:false,done:false,priority:false,created:new Date().toISOString()};
    saveTaskToBase(t);
    if(input)input.value='';
    var scheduled=false, msg='✅ Tarefa organizada'+(time?' • '+time:'');
    try{
      var res=await scheduleDirect(t);
      scheduled=!!(res&&res.ok);
      if(scheduled)msg='🔔 Tarefa organizada e aviso agendado • '+time;
      else if(res&&res.reason==='horário muito próximo')msg='✅ Tarefa salva, mas o horário está muito próximo para avisar.';
    }catch(e){msg='✅ Tarefa salva. Aviso não agendado: '+e.message;}
    try{ if(typeof render==='function')render(); }catch(e){}
    show(msg);
    if(typeof render!=='function')setTimeout(function(){location.reload()},700);
    return false;
  }
  function showMic(title,hint,on){
    try{var b=el('micBox'),t=el('micTitle'),h=el('micHint'); if(b){b.classList.add('on');b.classList.toggle('listening',!!on)} if(t)t.textContent=title; if(h)h.textContent=hint}catch(e){}
  }
  function voice(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}}catch(e){}
    if(busyVoice)return false; busyVoice=true; setTimeout(function(){busyVoice=false},900);
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      try{
        var r=new SR();
        r.lang='pt-BR';r.interimResults=false;r.continuous=false;
        r.onstart=function(){showMic('Ouvindo...','Fale sua tarefa agora.',true)};
        r.onresult=function(e){var input=el('input'); if(input)input.value=e.results[0][0].transcript; showMic('Texto recebido','Revise e toque em Organizar automaticamente.',false)};
        r.onerror=function(){showMic('Use o microfone do teclado','Toque no microfone do teclado do iPhone e fale sua tarefa.',false)};
        r.onend=function(){try{var b=el('micBox'); if(b)b.classList.remove('listening')}catch(e){}};
        r.start();
        return false;
      }catch(e){}
    }
    var input=el('input'); if(input)input.focus();
    showMic('Use o microfone do teclado','Toque no microfone do teclado do iPhone e fale sua tarefa.',false);
    return false;
  }
  function bind(){
    setVersion();
    var add=el('add'), v=el('voice');
    if(add&&!add.dataset.fix148){add.dataset.fix148='1';add.onclick=organize;add.addEventListener('click',organize,true);add.addEventListener('touchend',organize,true);add.addEventListener('pointerup',organize,true)}
    if(v&&!v.dataset.fix148){v.dataset.fix148='1';v.onclick=voice;v.addEventListener('click',voice,true);v.addEventListener('touchend',voice,true);v.addEventListener('pointerup',voice,true)}
  }
  function start(){bind();setTimeout(bind,300);setTimeout(bind,1000);}
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V14.8');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 14.8 • Botões e agendamento corrigidos.');
  s=s.replace(/const VERSION='\d+\.\d+'/g,"const VERSION='14.8'");
  if(!s.includes('fix-148-css'))s=s.replace('</head>',PATCH_CSS+'\n</head>');
  if(!s.includes('fix-148-js'))s=s.replace('</body>',PATCH_JS+'\n</body>');
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
