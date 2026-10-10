importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.8 — reforça ativação e agendamento de notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="notify-fix-138-css">
.warnTag{cursor:pointer!important;appearance:none!important;-webkit-appearance:none!important}
#add,#notifyBtn,.warnTag{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
</style>`;

const PATCH_JS = `
<script id="notify-fix-138-js">
(function(){
  const VERSION='13.8';
  let adding=false;
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.8 • Notificações reforçadas.';
      document.title='Meu Planner — Bruna V13.8';
    }catch(e){}
  }
  function nrm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()}
  function toastSafe(msg){try{toast(msg)}catch(e){alert(msg)}}
  function schedStore(){try{return JSON.parse(localStorage.brunaScheduled||'{}')}catch(e){return{}}}
  function saveSched(o){try{localStorage.brunaScheduled=JSON.stringify(o)}catch(e){}}
  function shouldSchedule138(t){return t&&!t.done&&!t.paused&&(t.recurrence||t.time)}
  function evTime(t){try{return dueAt(t)}catch(e){return null}}
  function fixCategories(){
    try{
      let changed=false;
      tasks.forEach(function(t){
        const s=nrm(t.text);
        if(/beber\\s+agua|tomar\\s+agua|hidratar|vitamina/.test(s)&&t.cat==='Contas'){
          t.cat='Hábitos'; t.sub=''; changed=true;
        }
      });
      if(changed){localStorage.brunaTasks=JSON.stringify(tasks); try{render()}catch(e){}}
    }catch(e){}
  }
  async function ensurePushPermission(){
    if(!('Notification' in window)) throw new Error('Este aparelho não liberou notificações para o navegador.');
    let O=null;
    try{O=await oneSignalReady}catch(e){throw new Error('Notificações ainda não carregaram. Feche e abra o app.');}
    if(Notification.permission!=='granted'){
      try{await O.Notifications.requestPermission()}catch(e){}
    }
    if(Notification.permission!=='granted') throw new Error('Permita as notificações no iPhone para receber avisos.');
    try{await O.User.PushSubscription.optIn()}catch(e){}
    for(let i=0;i<12;i++){
      let id=O.User&&O.User.PushSubscription&&O.User.PushSubscription.id;
      if(id)return id;
      await new Promise(r=>setTimeout(r,500));
    }
    throw new Error('Abra pelo ícone da Tela Inicial e tente ativar notificações novamente.');
  }
  async function scheduleOne138(t,showToast){
    if(!shouldSchedule138(t))return false;
    const ev=evTime(t);
    if(!ev)return false;
    const ms=ev.getTime()-Date.now();
    if(ms<90000){
      if(showToast)toastSafe('⏰ Horário muito próximo ou já passou. Use pelo menos 2 minutos de antecedência.');
      return false;
    }
    const current=schedStore();
    if(current[t.id]){
      if(showToast)toastSafe('✅ Esse aviso já estava agendado.');
      return true;
    }
    const sub=await ensurePushPermission();
    const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:sub,title:'Meu Planner 💛',message:t.text,sendAfter:ev.toISOString()})});
    let j={}; try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error('o servidor não confirmou o agendamento');
    const s=schedStore();
    s[t.id]={sendAt:ev.toISOString(),notificationId:j.id||j.notification_id||''};
    saveSched(s);
    if(showToast)toastSafe('✅ aviso agendado para '+(t.time||''));
    try{render()}catch(e){}
    return true;
  }
  window.enableNotify138=async function(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    try{
      toastSafe('🔔 Ativando notificações...');
      await ensurePushPermission();
      const notifyStatus=document.getElementById('notifyStatus');
      const notifyBtn=document.getElementById('notifyBtn');
      if(notifyStatus)notifyStatus.textContent='✅ Notificações autorizadas.';
      if(notifyBtn)notifyBtn.innerHTML='🔔 Notificações<br><b>ativadas</b>';
      const future=(Array.isArray(tasks)?tasks:[]).filter(function(t){
        const ev=evTime(t); return t&&!t.done&&!t.paused&&ev&&ev.getTime()>Date.now()+90000;
      });
      for(const t of future) await scheduleOne138(t,false);
      toastSafe('✅ Notificações ativadas. Tarefas futuras reagendadas.');
      try{render()}catch(e){}
    }catch(err){toastSafe('⚠️ '+err.message)}
    return false;
  };
  window.rescheduleTask138=async function(id,ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    try{
      const t=(tasks||[]).find(x=>String(x.id)===String(id));
      if(!t)return false;
      await scheduleOne138(t,true);
    }catch(err){toastSafe('⚠️ '+err.message)}
    return false;
  };
  window.reminderTag=function(t){
    try{
      if(!t||!t.time||t.done)return'';
      const ev=evTime(t);
      if(ev&&ev.getTime()<Date.now())return '<span class="warnTag">⏰ horário passou</span>';
      const s=schedStore();
      if(s[t.id])return '<span class="rem">✅ aviso agendado</span>';
      if(!('Notification' in window))return '<span class="warnTag">🔕 sem notificação</span>';
      if(Notification.permission==='granted')return '<button class="warnTag" type="button" onclick="return rescheduleTask138('+t.id+',event)">⚠️ agendar aviso</button>';
      return '<button class="warnTag" type="button" onclick="return enableNotify138(event)">🔔 ativar notificações</button>';
    }catch(e){return''}
  };
  async function addTask138(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    if(adding)return false;
    adding=true; setTimeout(()=>adding=false,900);
    try{
      const input=document.getElementById('input');
      const text=(input&&input.value?input.value:'').trim();
      if(!text){toastSafe('Escreva ou fale alguma coisa primeiro.');return false;}
      const t=makeItem(text);
      tasks.unshift(t);
      if(input)input.value='';
      localStorage.brunaTasks=JSON.stringify(tasks);
      fixCategories();
      try{render()}catch(e){}
      toastSafe('✅ Tarefa organizada em '+(typeof label==='function'?label(t.cat):t.cat)+(t.time?' • '+t.time:''));
      if(shouldSchedule138(t)){
        try{await scheduleOne138(t,true)}catch(err){toastSafe('⚠️ Tarefa salva, mas aviso não foi agendado: '+err.message);try{render()}catch(e){}}
      }
    }catch(err){toastSafe('Não consegui organizar: '+err.message)}
    return false;
  }
  function replaceButton(id,handler){
    try{
      const old=document.getElementById(id); if(!old)return;
      const btn=old.cloneNode(true); old.parentNode.replaceChild(btn,old);
      btn.onclick=handler;
      btn.addEventListener('click',handler,true);
      btn.addEventListener('touchend',handler,true);
    }catch(e){}
  }
  function start(){
    setVersion(); fixCategories();
    replaceButton('add',addTask138);
    replaceButton('notifyBtn',window.enableNotify138);
    try{render()}catch(e){}
    setTimeout(function(){setVersion();replaceButton('add',addTask138);replaceButton('notifyBtn',window.enableNotify138);try{render()}catch(e){}},700);
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.8');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.8 • Notificações reforçadas.');
  if(!s.includes('notify-fix-138-css'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes('notify-fix-138-js'))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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