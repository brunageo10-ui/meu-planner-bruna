importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 12.5 — estrela fixa dentro do cartão.
// Usa a base estável da versão 12.2 e redesenha o cartão de tarefa com estrela própria.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const BASE_PATCH_URL = "https://raw.githubusercontent.com/brunageo10-ui/meu-planner-bruna/deb48ace928150c48038c0d98669cc4c5e5bed1c/OneSignalSDKWorker.js";
let cachedBasePatch = null;

const EXTRA_CSS = `
/* Ajuste 12.5: estrela fixa no próprio cartão da tarefa */
#taskList .item{position:relative!important;padding-right:104px!important}
#taskList .item>.priorityBtn{display:none!important}
#taskList .item .priorityNativeBtn{position:absolute!important;right:54px!important;top:12px!important;z-index:40!important;width:34px!important;height:34px!important;border:0!important;border-radius:999px!important;background:#fff3c4!important;color:#9a6a00!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:17px!important;font-weight:900!important;line-height:1!important;box-shadow:0 5px 12px rgba(154,106,0,.16)!important;padding:0!important}
#taskList .item .priorityNativeBtn.on{background:#ffe08a!important;color:#7a4d00!important}
#taskList .item .priorityNativeBtn:active{transform:scale(.95)!important}
#taskList .item .deleteBtn{right:12px!important;top:12px!important}
#taskList .item .priorityNativeTag{display:inline-flex!important;align-items:center!important;gap:4px!important;background:#fff3c4!important;color:#8a5b00!important;border-radius:999px!important;padding:7px 10px!important;font-size:13px!important;font-weight:900!important;margin-right:5px!important;margin-top:5px!important}
#taskList .item.priorityItem{border-color:#f3d990!important;box-shadow:0 12px 26px rgba(154,106,0,.10)!important}
#taskList .item.priorityItem .itemText{color:var(--wine)!important}
@media(max-width:390px){#taskList .item{padding-right:98px!important}#taskList .item .priorityNativeBtn{right:52px!important;top:12px!important;width:31px!important;height:31px!important;font-size:16px!important}}
`;

const EXTRA_JS = `
<script>
(function(){
  const VERSION='12.5';
  function setVersion(){try{var el=document.getElementById('versionLine');if(el)el.textContent='Versão '+VERSION+' • Estrela corrigida.';document.title='Meu Planner — Bruna V'+VERSION;}catch(e){}}
  function taskArray(){try{return Array.isArray(tasks)?tasks:[]}catch(e){return[]}}
  function persist(){try{localStorage.setItem('brunaTasks',JSON.stringify(taskArray()))}catch(e){}}
  window.togglePriority=function(id){try{var t=taskArray().find(function(x){return Number(x.id)===Number(id)});if(!t)return;t.priority=!t.priority;try{calendarChanged()}catch(e){}persist();try{render()}catch(e){}setTimeout(fixVisibleStars,80);setTimeout(fixVisibleStars,300);try{toast(t.priority?'⭐ Marcada como prioridade.':'☆ Prioridade removida.')}catch(e){}}catch(e){}};
  function buildCard(t,routine,history){
    var scheduled=scheduledInfo(t.id);
    var recurring=t.recurrence?' <span class="reminder">🔁 '+esc(t.recurrence.label)+'</span>':'';
    var schedLabel=scheduled?' <span class="reminder">✅ '+(scheduled.recurring?'avisos agendados':'aviso agendado')+'</span>':'';
    var pauseLabel=t.paused?' <span class="reminder">⏸ pausada</span>':'';
    var left=routine?'<div class="itemLead">'+iconFor(t,true)+'</div>':'<button class="check" onclick="toggle('+t.id+')">'+(t.done?'✓':'')+'</button>';
    var actions=routine?'<button class="smallAction" onclick="toggleRoutine('+t.id+')">'+(t.paused?'▶️ Ativar rotina':'⏸ Pausar rotina')+'</button><button class="smallAction" onclick="editItem('+t.id+')">✎ Editar</button>':(history?'<button class="smallAction" onclick="toggle('+t.id+')">↩️ Reabrir</button>':'')+'<button class="smallAction" onclick="editItem('+t.id+')">✎ Editar</button>';
    var isPriority=!!(t.priority&&!routine&&!history&&!t.done);
    var nativeStar=(!routine&&!history&&!t.done)?'<button type="button" class="priorityNativeBtn '+(isPriority?'on':'')+'" onclick="togglePriority('+t.id+')" title="'+(isPriority?'Remover prioridade':'Marcar prioridade')+'">'+(isPriority?'⭐':'☆')+'</button>':'';
    var priorityTag=isPriority?' <span class="priorityNativeTag">⭐ Prioridade</span>':'';
    var itemClasses='item '+(routine?'routineItem ':'')+(history?'historyItem ':'')+(t.done?'done ':'')+(t.paused?'paused ':'')+(isPriority?'priorityItem ':'');
    var meta='<span class="tag">'+esc(catLabel(t.cat))+'</span>'+(t.sub?'<span class="tag">'+esc(t.sub)+'</span>':'')+(t.date?' <span class="reminder">📅 '+new Date(t.date+'T12:00').toLocaleDateString('pt-BR')+'</span>':'')+(t.time?' <span class="time">🕐 '+esc(t.time)+'</span>':'')+(t.reminder?' <span class="reminder">🔔 '+reminderLabel(t.reminder)+'</span>':'')+recurring+pauseLabel+schedLabel+priorityTag;
    return '<div class="'+itemClasses+'">'+left+'<div class="itemBody"><div class="itemText">'+esc(t.text)+'</div><div class="meta">'+meta+'</div><div class="itemActions">'+actions+'</div></div>'+nativeStar+'<button class="btn secondary deleteBtn" onclick="del('+t.id+')">×</button></div>';
  }
  function installCardOverride(){try{window.card=buildCard;card=buildCard;}catch(e){} }
  function fixVisibleStars(){
    try{
      setVersion();
      document.querySelectorAll('#taskList .item').forEach(function(card){
        var native=card.querySelector('.priorityNativeBtn');
        if(native)return;
        var del=card.querySelector('.deleteBtn');
        var id=null;
        if(del){var m=String(del.getAttribute('onclick')||'').match(/del\\((\\d+)\\)/);if(m)id=Number(m[1]);}
        if(id===null)return;
        var t=taskArray().find(function(x){return Number(x.id)===Number(id)});
        if(!t||t.done||t.recurrence)return;
        var b=document.createElement('button');
        b.type='button';b.className='priorityNativeBtn '+(t.priority?'on':'');b.textContent=t.priority?'⭐':'☆';b.title=t.priority?'Remover prioridade':'Marcar prioridade';
        b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();window.togglePriority(id)});
        card.appendChild(b);
        if(t.priority){card.classList.add('priorityItem');var meta=card.querySelector('.meta');if(meta&&!meta.querySelector('.priorityNativeTag')){var tag=document.createElement('span');tag.className='priorityNativeTag';tag.textContent='⭐ Prioridade';meta.appendChild(tag);}}
      });
    }catch(e){}
  }
  function start(){
    setVersion();installCardOverride();
    try{render()}catch(e){}
    setTimeout(fixVisibleStars,80);setTimeout(fixVisibleStars,300);setTimeout(fixVisibleStars,900);
    setInterval(fixVisibleStars,2000);
    try{new MutationObserver(function(){setTimeout(fixVisibleStars,60)}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start);else start();
})();
<\/script>`;

async function getBasePatch(){
  if(cachedBasePatch)return cachedBasePatch;
  const text=await fetch(BASE_PATCH_URL,{cache:'no-store'}).then(r=>r.text());
  const cssMatch=text.match(/const PLANNER_PATCH_CSS = `([\s\S]*?)`;\n\nconst PLANNER_PATCH_JS = `/);
  const jsMatch=text.match(/const PLANNER_PATCH_JS = `([\s\S]*?)`;\n\nfunction patchPlannerHtml/);
  cachedBasePatch={css:cssMatch?cssMatch[1]:'',js:jsMatch?jsMatch[1]:''};
  return cachedBasePatch;
}

function injectBeforeClose(source,closeTag,addition){
  if(!addition)return source;
  if(source.includes(addition.slice(0,60)))return source;
  return source.replace('\n'+closeTag,'\n'+addition+'\n'+closeTag);
}

async function patchPlannerHtml(text){
  const base=await getBasePatch();
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V12.5');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 12.5 • Estrela corrigida.');
  s=s.replace(/version:'\d+\.\d+'/g,"version:'12.5'");
  s=s.replace(/function shouldSchedule\(t\)\{[^}]+\}/,"function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!t.time||!!(t.date&&t.time))}");
  if(!s.includes('function dateKeyForTimeOnly(time)')){
    s=s.replace('function makeItem(text,old){',"function dateKeyForTimeOnly(time){let d=new Date(),p=(time||'08:00').split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1);return dateKey(d)}\nfunction makeItem(text,old){");
  }
  s=s.replace("date:recurrence?'':parseDate(text),time,","date:recurrence?'':(parseDate(text)||(time?dateKeyForTimeOnly(time):'')),time,");
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g,'sendAt.getTime()<Date.now()+5000');
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g,'sendAt.getTime()<Date.now()+5000');
  if(base.css&&!s.includes('Ajuste 12.2: estrela menor alinhada com o X'))s=injectBeforeClose(s,'</style>',base.css);
  if(base.js&&!s.includes("const VERSION='12.2'"))s=injectBeforeClose(s,'</body>',base.js);
  if(!s.includes('Ajuste 12.5: estrela fixa'))s=injectBeforeClose(s,'</style>',EXTRA_CSS);
  if(!s.includes("const VERSION='12.5'"))s=injectBeforeClose(s,'</body>',EXTRA_JS);
  return s;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate'&&request.destination!=='document')return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(async response=>{
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html'))return response;
    const html=await response.text();
    const patched=await patchPlannerHtml(html);
    return new Response(patched,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }).catch(()=>fetch(request)));
});