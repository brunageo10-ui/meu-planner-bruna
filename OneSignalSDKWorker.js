importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.4 — clique reforçado nos botões principais.
// Mantém a base 14.1 estável, remove o Feito da Agenda e restaura Organizar/Ditado.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
<style id="fix-144-css">
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
</style>`;

const PATCH_JS = `
<script id="fix-buttons-144-js">
(function(){
  const VERSION='14.4';
  let addBusy=false;
  function el(id){return document.getElementById(id)}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()}
  function pad(n){return String(n).padStart(2,'0')}
  function todayKey(){const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function toastSafe(msg){try{toast(msg)}catch(e){try{alert(msg)}catch(_){}}}
  function setVersion(){
    try{const v=el('versionLine'); if(v)v.textContent='Versão 14.4 • Botões corrigidos.'; document.title='Meu Planner — Bruna V14.4';}catch(e){}
  }
  function getText(){const i=el('input');return i&&i.value?i.value.trim():''}
  function parseTimeLocal(text){
    const s=norm(text); let m=s.match(/\\b(?:as?\\s*)?([01]?\\d|2[0-3])\\s*(?:h|:)\\s*([0-5]\\d)\\b/);
    if(!m)m=s.match(/\\b(?:as?\\s*)?([01]?\\d|2[0-3])\\s*h\\b/);
    if(m)return pad(Number(m[1]))+':'+pad(m[2]||'00');
    if(/meio\\s*dia/.test(s))return'12:00'; if(/cedo|manha/.test(s))return'08:00'; if(/tarde/.test(s))return'15:00'; if(/noite/.test(s))return'19:00';
    return'';
  }
  function dateForTimeLocal(time){
    const d=new Date();
    if(time){const p=time.split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+60000)d.setDate(d.getDate()+1)}
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function catLocal(text){
    const s=norm(text);
    if(/beber\\s+agua|tomar\\s+agua|hidratar|vitamina|remedio|exercicio|caminhar|academia/.test(s))return ['Hábitos',''];
    if(/sgs|vinho|vinicola|cafe|queijo|reels|story|instagram|turis|fazenda|degustacao|cliente|roteiro|tour/.test(s))return ['SGS Vinho & Café','Experiências'];
    if(/alun|prova|avaliacao|geografia|apostila|bncc|aula|escola|dever|atividade|imprimir/.test(s))return ['Escola','Planejamento'];
    if(/boleto|fatura|pagar|energia|luz|internet|cartao|conta\\s+de\\s+agua/.test(s))return ['Contas','Pagamentos'];
    if(/comprar|mercado|farmacia|compra/.test(s))return ['Compras',''];
    if(/reuniao|consulta|dentista|medico|evento|compromisso|unha|banho/.test(s))return ['Compromissos',''];
    return ['Pessoal',''];
  }
  function fallbackAdd(){
    const input=el('input'); const text=getText();
    if(!text){toastSafe('Escreva ou fale alguma coisa primeiro.');return false;}
    const time=parseTimeLocal(text); const cs=catLocal(text);
    const t={id:Date.now(),text,cat:cs[0],sub:cs[1],date:time?dateForTimeLocal(time):'',time,recurrence:null,paused:false,done:false,priority:false,created:new Date().toISOString()};
    try{tasks.unshift(t);localStorage.brunaTasks=JSON.stringify(tasks)}catch(e){let arr=[];try{arr=JSON.parse(localStorage.brunaTasks||'[]')}catch(_){arr=[]}arr.unshift(t);localStorage.brunaTasks=JSON.stringify(arr)}
    if(input)input.value='';
    try{if(typeof render==='function')render()}catch(e){setTimeout(()=>location.reload(),150)}
    toastSafe('✅ Tarefa organizada'+(time?' • '+time:''));
    try{if(typeof scheduleRemote==='function')scheduleRemote(t)}catch(e){}
    return false;
  }
  function robustAdd(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    if(addBusy)return false; addBusy=true; setTimeout(()=>addBusy=false,900);
    const text=getText(); if(!text){toastSafe('Escreva ou fale alguma coisa primeiro.');return false;}
    let before=-1; try{before=tasks.length}catch(e){}
    try{
      if(typeof addTask==='function'){
        const r=addTask(ev||new Event('click'));
        setTimeout(function(){try{const i=el('input');if(i&&i.value.trim()&&typeof tasks!=='undefined'&&tasks.length===before)fallbackAdd()}catch(e){fallbackAdd()}},180);
        return r===undefined?false:r;
      }
    }catch(e){}
    return fallbackAdd();
  }
  function robustVoice(ev){
    try{if(ev){ev.preventDefault();ev.stopPropagation();}}catch(e){}
    try{if(typeof startDictation==='function')return startDictation(ev||new Event('click'))}catch(e){}
    const input=el('input'); if(input)input.focus();
    try{const box=el('micBox'),title=el('micTitle'),hint=el('micHint'); if(box)box.classList.add('on'); if(title)title.textContent='Use o microfone do teclado'; if(hint)hint.textContent='Toque no microfone do teclado do iPhone e fale sua tarefa.';}catch(e){}
    toastSafe('🎙️ Toque no microfone do teclado do iPhone.');
    return false;
  }
  function bind(){
    setVersion();
    const add=el('add'), voice=el('voice');
    if(add&&!add.dataset.fix144){add.dataset.fix144='1';add.onclick=robustAdd;add.addEventListener('click',robustAdd,true);add.addEventListener('touchend',robustAdd,true);add.addEventListener('pointerup',robustAdd,true)}
    if(voice&&!voice.dataset.fix144){voice.dataset.fix144='1';voice.onclick=robustVoice;voice.addEventListener('click',robustVoice,true);voice.addEventListener('touchend',robustVoice,true);voice.addEventListener('pointerup',robustVoice,true)}
  }
  function start(){bind();setTimeout(bind,400);setTimeout(bind,1000);}
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V14.4');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 14.4 • Botões corrigidos.');
  if(!s.includes('fix-144-css'))s=s.replace('</head>',PATCH_CSS+'\n</head>');
  if(!s.includes('fix-buttons-144-js'))s=s.replace('</body>',PATCH_JS+'\n</body>');
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