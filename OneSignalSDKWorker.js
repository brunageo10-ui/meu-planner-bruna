importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 12.3 — estrela restaurada e alinhada.
// Carrega a base estável da versão 12.2 e aplica um reforço visual para a estrela.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const BASE_PATCH_URL = "https://raw.githubusercontent.com/brunageo10-ui/meu-planner-bruna/deb48ace928150c48038c0d98669cc4c5e5bed1c/OneSignalSDKWorker.js";
let cachedBasePatch = null;

const EXTRA_CSS = `
/* Ajuste 12.3: estrela restaurada, menor e alinhada ao X */
#taskList .item{position:relative!important;padding-right:104px!important}
#taskList .item .priorityBtn{position:absolute!important;right:56px!important;top:14px!important;z-index:30!important;width:32px!important;height:32px!important;border:0!important;border-radius:999px!important;background:#fff3c4!important;color:#9a6a00!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:16px!important;font-weight:900!important;line-height:1!important;box-shadow:0 5px 12px rgba(154,106,0,.16)!important;padding:0!important}
#taskList .item .priorityBtn.on{background:#ffe08a!important;color:#7a4d00!important}
#taskList .item .deleteBtn{right:12px!important;top:12px!important}
#taskList .item .priorityTag{display:inline-flex!important;align-items:center!important;gap:4px!important;background:#fff3c4!important;color:#8a5b00!important;border-radius:999px!important;padding:7px 10px!important;font-size:13px!important;font-weight:900!important}
#taskList .item.priorityItem{border-color:#f3d990!important;box-shadow:0 12px 26px rgba(154,106,0,.10)!important}
#taskList .item.priorityItem .itemText,#taskList .item.priorityItem h3{color:var(--wine)!important}
@media(max-width:390px){#taskList .item{padding-right:98px!important}#taskList .item .priorityBtn{right:52px!important;top:14px!important;width:30px!important;height:30px!important;font-size:15px!important}}
`;

const EXTRA_JS = `
<script>
(function(){
  const VERSION='12.3';
  function norm(v){return String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()}
  function allTasks(){try{return Array.isArray(tasks)?tasks:[]}catch(e){return []}}
  function saveTasks(){try{localStorage.setItem('brunaTasks',JSON.stringify(allTasks()))}catch(e){}}
  function isTaskSafe(t){try{return t&&!isRoutine(t)}catch(e){return t&&!t.recurrence}}
  function cardText(card){
    var n=card.querySelector('.itemText')||card.querySelector('h3')||card.querySelector('.itemBody')||card;
    return norm(n.textContent||'');
  }
  function getIdFromCard(card){
    var nodes=card.querySelectorAll('[onclick]');
    for(var i=0;i<nodes.length;i++){
      var a=String(nodes[i].getAttribute('onclick')||'');
      var m=a.match(/(?:editItem|del|toggle)\\((\\d+)\\)/);
      if(m)return Number(m[1]);
    }
    return null;
  }
  function findTaskForCard(card){
    var id=getIdFromCard(card);
    var arr=allTasks();
    if(id!==null){var byId=arr.find(function(t){return Number(t.id)===Number(id)}); if(byId)return byId;}
    var ct=cardText(card);
    if(!ct)return null;
    return arr.find(function(t){return isTaskSafe(t)&&!t.done&&(ct.indexOf(norm(t.text).slice(0,24))>=0||norm(t.text).indexOf(ct.slice(0,24))>=0)})||null;
  }
  function setVersion(){
    try{var el=document.getElementById('versionLine'); if(el)el.textContent='Versão '+VERSION+' • Estrela alinhada.'; document.title='Meu Planner — Bruna V'+VERSION;}catch(e){}
  }
  function addStars(){
    try{
      setVersion();
      document.querySelectorAll('#taskList .item').forEach(function(card){
        card.querySelectorAll('.priorityBtn').forEach(function(x){x.remove()});
        card.querySelectorAll('.priorityTag').forEach(function(x){x.remove()});
        card.classList.remove('priorityItem');
        var t=findTaskForCard(card);
        if(!t||!isTaskSafe(t)||t.done)return;
        var btn=document.createElement('button');
        btn.type='button';
        btn.className='priorityBtn'+(t.priority?' on':'');
        btn.textContent=t.priority?'⭐':'☆';
        btn.title=t.priority?'Remover prioridade':'Marcar prioridade';
        btn.addEventListener('click',function(ev){
          ev.preventDefault(); ev.stopPropagation();
          t.priority=!t.priority;
          saveTasks();
          try{if(typeof render==='function')render()}catch(e){}
          setTimeout(addStars,80);
          setTimeout(addStars,350);
        });
        card.appendChild(btn);
        var meta=card.querySelector('.meta');
        if(t.priority){
          card.classList.add('priorityItem');
          if(meta){var tag=document.createElement('span'); tag.className='priorityTag'; tag.textContent='⭐ Prioridade'; meta.appendChild(tag);}
        }
      });
    }catch(e){}
  }
  function start(){
    setVersion(); addStars();
    setTimeout(addStars,150); setTimeout(addStars,700); setTimeout(addStars,1500);
    setInterval(addStars,2500);
    try{new MutationObserver(function(){setTimeout(addStars,60)}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start); else start();
})();
<\/script>`;

async function getBasePatch(){
  if(cachedBasePatch)return cachedBasePatch;
  const text = await fetch(BASE_PATCH_URL,{cache:'no-store'}).then(r=>r.text());
  const cssMatch = text.match(/const PLANNER_PATCH_CSS = `([\s\S]*?)`;\n\nconst PLANNER_PATCH_JS = `/);
  const jsMatch = text.match(/const PLANNER_PATCH_JS = `([\s\S]*?)`;\n\nfunction patchPlannerHtml/);
  cachedBasePatch = {css: cssMatch ? cssMatch[1] : '', js: jsMatch ? jsMatch[1] : ''};
  return cachedBasePatch;
}

function injectBeforeClose(source, closeTag, addition){
  if(source.includes(addition.slice(0,60)))return source;
  return source.replace('\n'+closeTag, '\n'+addition+'\n'+closeTag);
}

async function patchPlannerHtml(text){
  const base = await getBasePatch();
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V12.3');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 12.3 • Estrela alinhada.');
  s=s.replace(/version:'\d+\.\d+'/g,"version:'12.3'");
  s=s.replace(/function shouldSchedule\(t\)\{[^}]+\}/,"function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!t.time||!!(t.date&&t.time))}");
  if(!s.includes('function dateKeyForTimeOnly(time)')){
    s=s.replace('function makeItem(text,old){',"function dateKeyForTimeOnly(time){let d=new Date(),p=(time||'08:00').split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1);return dateKey(d)}\nfunction makeItem(text,old){");
  }
  s=s.replace("date:recurrence?'':parseDate(text),time,","date:recurrence?'':(parseDate(text)||(time?dateKeyForTimeOnly(time):'')),time,");
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g,'sendAt.getTime()<Date.now()+5000');
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g,'sendAt.getTime()<Date.now()+5000');
  if(base.css && !s.includes('Ajuste 12.2: estrela menor alinhada com o X')) s=injectBeforeClose(s,'</style>',base.css);
  if(base.js && !s.includes("const VERSION='12.2'")) s=injectBeforeClose(s,'</body>',base.js);
  if(!s.includes('Ajuste 12.3: estrela restaurada')) s=injectBeforeClose(s,'</style>',EXTRA_CSS);
  if(!s.includes("const VERSION='12.3'")) s=injectBeforeClose(s,'</body>',EXTRA_JS);
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