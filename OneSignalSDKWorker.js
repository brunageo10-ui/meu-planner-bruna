importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.9 — corrige erro makeItem e não interfere no botão principal.
// Mantém o app estável: o botão Organizar volta a usar a função original da base.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="hotfix-139-css">
html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none!important;touch-action:pan-y!important}
main,#top{width:100%!important;max-width:780px!important;overflow-x:hidden!important;box-sizing:border-box!important}
.top,.hero,.panel,.stats,.head,.filters,.item,.fold,.tools,.nav,.inputWrap,.micBox,.actions{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.hero,.panel,.item,.fold,.tools,.nav{overflow:hidden!important}
.filters{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}
.warnTag{cursor:pointer!important;appearance:none!important;-webkit-appearance:none!important}
#add,#notifyBtn,.warnTag{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
@supports(overflow:clip){html,body{overflow-x:clip!important}}
</style>`;

const PATCH_JS = `
<script id="hotfix-139-js">
(function(){
  const VERSION='13.9';
  function toastSafe(msg){try{toast(msg)}catch(e){try{alert(msg)}catch(_){} }}
  function setVersion(){
    try{
      const el=document.getElementById('versionLine');
      if(el)el.textContent='Versão 13.9 • Botão organizar corrigido.';
      document.title='Meu Planner — Bruna V13.9';
    }catch(e){}
  }
  function lockX(){
    try{
      document.documentElement.style.overflowX='hidden';
      document.body.style.overflowX='hidden';
      if(window.scrollX)window.scrollTo(0,window.scrollY);
    }catch(e){}
  }
  function fixCategories(){
    try{
      if(!Array.isArray(tasks))return;
      let changed=false;
      tasks.forEach(function(t){
        const s=String(t.text||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
        if(/beber\\s+agua|tomar\\s+agua|hidratar|vitamina/.test(s)&&t.cat==='Contas'){
          t.cat='Hábitos'; t.sub=''; changed=true;
        }
      });
      if(changed){localStorage.brunaTasks=JSON.stringify(tasks); try{render()}catch(e){}}
    }catch(e){}
  }
  function scheduledSafe(){try{return JSON.parse(localStorage.brunaScheduled||'{}')}catch(e){return{}}}
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
  async function scheduleOne139(t,showToast){
    try{
      if(!t||t.done||t.paused||(!t.time&&!t.recurrence))return false;
      const ev=(typeof dueAt==='function')?dueAt(t):null;
      if(!ev)return false;
      if(ev.getTime()<Date.now()+90000){
        if(showToast)toastSafe('⏰ Horário muito próximo ou já passou. Use pelo menos 2 minutos de antecedência.');
        return false;
      }
      const s=scheduledSafe();
      if(s[t.id]){ if(showToast)toastSafe('✅ Esse aviso já estava agendado.'); return true; }
      const sub=await ensurePushPermission();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:sub,title:'Meu Planner 💛',message:t.text,sendAfter:ev.toISOString()})});
      let j={}; try{j=await r.json()}catch(e){}
      if(!r.ok)throw new Error('o servidor não confirmou o agendamento');
      s[t.id]={sendAt:ev.toISOString(),notificationId:j.id||j.notification_id||''};
      localStorage.brunaScheduled=JSON.stringify(s);
      if(showToast)toastSafe('✅ aviso agendado para '+(t.time||''));
      try{render()}catch(e){}
      return true;
    }catch(err){ if(showToast)toastSafe('⚠️ '+err.message); return false; }
  }
  window.enableNotify139=async function(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    try{
      toastSafe('🔔 Ativando notificações...');
      await ensurePushPermission();
      const ns=document.getElementById('notifyStatus');
      const nb=document.getElementById('notifyBtn');
      if(ns)ns.textContent='✅ Notificações autorizadas.';
      if(nb)nb.innerHTML='🔔 Notificações<br><b>ativadas</b>';
      const list=Array.isArray(tasks)?tasks:[];
      for(const t of list){await scheduleOne139(t,false)}
      toastSafe('✅ Notificações ativadas. Tarefas futuras reagendadas.');
      try{render()}catch(e){}
    }catch(err){toastSafe('⚠️ '+err.message)}
    return false;
  };
  window.rescheduleTask139=async function(id,ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    const list=Array.isArray(tasks)?tasks:[];
    const t=list.find(x=>String(x.id)===String(id));
    if(t)await scheduleOne139(t,true);
    return false;
  };
  window.reminderTag=function(t){
    try{
      if(!t||!t.time||t.done)return'';
      const ev=(typeof dueAt==='function')?dueAt(t):null;
      if(ev&&ev.getTime()<Date.now())return '<span class="warnTag">⏰ horário passou</span>';
      const s=scheduledSafe();
      if(s[t.id])return '<span class="rem">✅ aviso agendado</span>';
      if(!('Notification' in window))return '<span class="warnTag">🔕 sem notificação</span>';
      if(Notification.permission==='granted')return '<button class="warnTag" type="button" onclick="return rescheduleTask139('+t.id+',event)">⚠️ agendar aviso</button>';
      return '<button class="warnTag" type="button" onclick="return enableNotify139(event)">🔔 ativar notificações</button>';
    }catch(e){return''}
  };
  function rewireNotifyOnly(){
    try{
      const old=document.getElementById('notifyBtn');
      if(old && !old.dataset.v139){old.dataset.v139='1';old.addEventListener('click',window.enableNotify139,true);old.addEventListener('touchend',window.enableNotify139,true)}
    }catch(e){}
  }
  function start(){
    setVersion(); lockX(); fixCategories(); rewireNotifyOnly();
    try{render()}catch(e){}
    setTimeout(function(){setVersion();lockX();fixCategories();rewireNotifyOnly();try{render()}catch(e){}},700);
    setInterval(lockX,1500);
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V13.9');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 13.9 • Botão organizar corrigido.');
  if(!s.includes('hotfix-139-css'))s=s.replace('\n</style>','\n'+PATCH_CSS+'\n</style>');
  if(!s.includes('hotfix-139-js'))s=s.replace('\n</body>','\n'+PATCH_JS+'\n</body>');
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