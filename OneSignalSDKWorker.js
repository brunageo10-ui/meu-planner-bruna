importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.0 — corrige ligação dos botões no iPhone.
// O iOS nem sempre cria variáveis globais para elementos com id; este patch cria essas referências antes do app iniciar.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const LOCK_CSS = `
<style id="fix-140-css">
html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none!important;touch-action:pan-y!important}
main,#top{width:100%!important;max-width:780px!important;overflow-x:hidden!important;box-sizing:border-box!important}
.top,.hero,.panel,.stats,.head,.filters,.item,.fold,.tools,.nav,.inputWrap,.micBox,.actions{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.hero,.panel,.item,.fold,.tools,.nav{overflow:hidden!important}
.filters{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important}
.warnTag{cursor:pointer!important;appearance:none!important;-webkit-appearance:none!important}
#add,#notifyBtn,.warnTag{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
@supports(overflow:clip){html,body{overflow-x:clip!important}}
</style>`;

const PREBIND_JS = `
<script id="prebind-140-js">
(function(){
  function g(id){return document.getElementById(id)}
  var ids=['input','add','voice','micBox','micTitle','micHint','versionLine','searchBtn','settingsBtn','searchPanel','closeSearch','searchInput','searchResults','todayLabel','todayList','todayCount','schoolCount','taskCount','routineCount','routineMini','historyMini','filters','taskList','routineList','doneList','foldersBtn','notifyBtn','calendarBtn','backupBtn','importBtn','backupFile','notifyStatus','navHome','navCalendar','navPlus','navStats','navProfile','toast'];
  ids.forEach(function(id){try{window[id]=g(id)}catch(e){}});
})();
<\/script>`;

const AFTER_JS = `
<script id="after-fix-140-js">
(function(){
  const VERSION='14.0';
  let busy=false;
  function g(id){return document.getElementById(id)}
  function toastSafe(msg){try{toast(msg)}catch(e){try{alert(msg)}catch(_){}}}
  function setVersion(){
    try{
      const el=g('versionLine');
      if(el)el.textContent='Versão 14.0 • Botão organizar restaurado.';
      document.title='Meu Planner — Bruna V14.0';
    }catch(e){}
  }
  function lockX(){
    try{document.documentElement.style.overflowX='hidden';document.body.style.overflowX='hidden';if(window.scrollX)window.scrollTo(0,window.scrollY)}catch(e){}
  }
  function bindIds(){
    var ids=['input','add','voice','micBox','micTitle','micHint','versionLine','searchBtn','settingsBtn','searchPanel','closeSearch','searchInput','searchResults','todayLabel','todayList','todayCount','schoolCount','taskCount','routineCount','routineMini','historyMini','filters','taskList','routineList','doneList','foldersBtn','notifyBtn','calendarBtn','backupBtn','importBtn','backupFile','notifyStatus','navHome','navCalendar','navPlus','navStats','navProfile','toast'];
    ids.forEach(function(id){try{window[id]=g(id)}catch(e){}});
  }
  function safeAdd(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    if(busy)return false;
    busy=true; setTimeout(function(){busy=false},1000);
    try{
      bindIds();
      if(typeof addTask==='function'){
        const before=(Array.isArray(tasks)?tasks.length:0);
        const r=addTask(ev||new Event('click'));
        setTimeout(function(){try{if(Array.isArray(tasks)&&tasks.length===before&&g('input')&&g('input').value.trim()){fallbackAdd()} }catch(e){}},120);
        return r===undefined?false:r;
      }
      return fallbackAdd();
    }catch(err){toastSafe('Não consegui organizar: '+err.message);return false}
  }
  function nrm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function pad(n){return String(n).padStart(2,'0')}
  function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function timeFrom(text){
    const s=nrm(text); let m=s.match(/\b(?:as?\s*)?([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)\b/);
    if(!m)m=s.match(/\b(?:as?\s*)?([01]?\d|2[0-3])\s*h\b/);
    if(m)return pad(Number(m[1]))+':'+pad(m[2]||'00');
    if(/meio\s*dia/.test(s))return'12:00'; if(/cedo|manha/.test(s))return'08:00'; if(/tarde/.test(s))return'15:00'; if(/noite/.test(s))return'19:00';
    return'';
  }
  function catFrom(text){
    const s=nrm(text);
    if(/beber\s+agua|tomar\s+agua|hidratar|vitamina|remedio|exercicio|caminhar|academia/.test(s))return 'Hábitos';
    if(/sgs|vinho|vinicola|cafe|queijo|reels|story|instagram|turis|fazenda|degustacao|cliente|roteiro|tour/.test(s))return 'SGS Vinho & Café';
    if(/alun|prova|avaliacao|geografia|apostila|bncc|aula|escola|dever|atividade|imprimir/.test(s))return 'Escola';
    if(/boleto|fatura|pagar|energia|luz|internet|cartao|conta\s+de\s+agua/.test(s))return 'Contas';
    if(/comprar|mercado|farmacia|compra/.test(s))return 'Compras';
    if(/reuniao|consulta|dentista|medico|evento|compromisso|unha|banho/.test(s))return 'Compromissos';
    return 'Pessoal';
  }
  function futureDateFor(time){
    let d=new Date();
    if(time){let p=time.split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+60000)d.setDate(d.getDate()+1)}
    return dateKey(d);
  }
  function fallbackAdd(){
    const inp=g('input'); const text=(inp&&inp.value?inp.value:'').trim();
    if(!text){toastSafe('Escreva ou fale alguma coisa primeiro.');return false;}
    const time=timeFrom(text);
    const t={id:Date.now(),text:text,cat:catFrom(text),sub:catFrom(text)==='SGS Vinho & Café'?'Experiências':'',date:time?futureDateFor(time):'',time:time,recurrence:null,paused:false,done:false,priority:false,created:new Date().toISOString()};
    try{
      if(Array.isArray(tasks)){tasks.unshift(t);localStorage.brunaTasks=JSON.stringify(tasks)}
      else{let arr=JSON.parse(localStorage.brunaTasks||'[]');arr.unshift(t);localStorage.brunaTasks=JSON.stringify(arr)}
    }catch(e){let arr=[];try{arr=JSON.parse(localStorage.brunaTasks||'[]')}catch(_){arr=[]}arr.unshift(t);localStorage.brunaTasks=JSON.stringify(arr)}
    if(inp)inp.value='';
    try{render()}catch(e){setTimeout(function(){location.reload()},250)}
    toastSafe('✅ Tarefa organizada'+(time?' • '+time:''));
    try{if(typeof scheduleRemote==='function')scheduleRemote(t)}catch(e){}
    return false;
  }
  function start(){
    bindIds(); setVersion(); lockX();
    const btn=g('add');
    if(btn){
      btn.onclick=safeAdd;
      btn.addEventListener('click',safeAdd,true);
      btn.addEventListener('touchend',safeAdd,true);
    }
    try{if(typeof render==='function')render()}catch(e){}
    setTimeout(function(){bindIds();setVersion();lockX();const b=g('add');if(b){b.onclick=safeAdd;b.addEventListener('click',safeAdd,true);b.addEventListener('touchend',safeAdd,true)}},700);
    setInterval(lockX,1500);
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V14.0');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 14.0 • Botão organizar restaurado.');
  s=s.replace(/const VERSION='\d+\.\d+'/g,"const VERSION='14.0'");
  if(!s.includes('fix-140-css'))s=s.replace('\n</style>','\n'+LOCK_CSS+'\n</style>');
  if(!s.includes('prebind-140-js'))s=s.replace('\n<script>\nconst VERSION=', '\n'+PREBIND_JS+'\n<script>\nconst VERSION=');
  if(!s.includes('after-fix-140-js'))s=s.replace('\n</body>','\n'+AFTER_JS+'\n</body>');
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