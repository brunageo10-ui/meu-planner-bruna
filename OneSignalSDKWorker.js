importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 12.4 — estrela com fallback visual.
// Mantém a base da 12.2 e garante estrela visível mesmo se o botão não for criado.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const BASE_PATCH_URL = "https://raw.githubusercontent.com/brunageo10-ui/meu-planner-bruna/deb48ace928150c48038c0d98669cc4c5e5bed1c/OneSignalSDKWorker.js";
let cachedBasePatch = null;

const EXTRA_CSS = `
/* Ajuste 12.4: estrela sempre visível e alinhada ao X */
#taskList .item{position:relative!important;padding-right:104px!important}
#taskList .item::after{content:'☆';position:absolute!important;right:56px!important;top:14px!important;z-index:25!important;width:32px!important;height:32px!important;border-radius:999px!important;background:#fff3c4!important;color:#9a6a00!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:18px!important;font-weight:900!important;line-height:1!important;box-shadow:0 5px 12px rgba(154,106,0,.16)!important;pointer-events:none!important}
#taskList .item.priorityItem::after{content:'⭐';font-size:16px!important;background:#ffe08a!important;color:#7a4d00!important}
#taskList .item .priorityBtn{position:absolute!important;right:56px!important;top:14px!important;z-index:35!important;width:32px!important;height:32px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:transparent!important;display:block!important;box-shadow:none!important;padding:0!important;opacity:.02!important}
#taskList .item .priorityBtn.on{background:transparent!important;color:transparent!important}
#taskList .item .deleteBtn{right:12px!important;top:12px!important}
#taskList .item .priorityTag{display:inline-flex!important;align-items:center!important;gap:4px!important;background:#fff3c4!important;color:#8a5b00!important;border-radius:999px!important;padding:7px 10px!important;font-size:13px!important;font-weight:900!important}
#taskList .item.priorityItem{border-color:#f3d990!important;box-shadow:0 12px 26px rgba(154,106,0,.10)!important}
#taskList .item.priorityItem .itemText,#taskList .item.priorityItem h3{color:var(--wine)!important}
@media(max-width:390px){#taskList .item{padding-right:98px!important}#taskList .item::after,#taskList .item .priorityBtn{right:52px!important;top:14px!important;width:30px!important;height:30px!important;font-size:16px!important}#taskList .item.priorityItem::after{font-size:15px!important}}
`;

const EXTRA_JS = `
<script>
(function(){
  const VERSION='12.4';
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
    return arr.find(function(t){
      var nt=norm(t&&t.text);
      return isTaskSafe(t)&&!t.done&&(ct.indexOf(nt.slice(0,22))>=0||nt.indexOf(ct.slice(0,22))>=0);
    })||null;
  }
  function setVersion(){
    try{var el=document.getElementById('versionLine'); if(el)el.textContent='Versão '+VERSION+' • Estrela restaurada.'; document.title='Meu Planner — Bruna V'+VERSION;}catch(e){}
  }
  function applyPriorityVisual(card,t){
    card.classList.remove('priorityItem');
    card.querySelectorAll('.priorityTag').forEach(function(x){x.remove()});
    if(t&&t.priority){
      card.classList.add('priorityItem');
      var meta=card.querySelector('.meta');
      if(meta){var tag=document.createElement('span'); tag.className='priorityTag'; tag.textContent='⭐ Prioridade'; meta.appendChild(tag);}
    }
  }
  function addButtons(){
    try{
      setVersion();
      document.querySelectorAll('#taskList .item').forEach(function(card){
        var t=findTaskForCard(card);
        if(!t||!isTaskSafe(t)||t.done)return;
        applyPriorityVisual(card,t);
        var btn=card.querySelector('.priorityBtn');
        if(!btn){
          btn=document.createElement('button');
          btn.type='button';
          btn.className='priorityBtn';
          btn.title='Marcar prioridade';
          btn.setAttribute('aria-label','Marcar prioridade');
          card.appendChild(btn);
        }
        btn.className='priorityBtn'+(t.priority?' on':'');
        btn.onclick=function(ev){
          ev.preventDefault(); ev.stopPropagation();
          t.priority=!t.priority;
          saveTasks();
          try{if(typeof render==='function')render()}catch(e){}
          setTimeout(addButtons,80); setTimeout(addButtons,350);
        };
      });
    }catch(e){}
  }
  function clickFallback(ev){
    try{
      var card=ev.target.closest&&ev.target.closest('#taskList .item');
      if(!card || ev.target.classList.contains('deleteBtn'))return;
      var r=card.getBoundingClientRect();
      var x=ev.clientX-r.left, y=ev.clientY-r.top;
      var inStar=x>=r.width-92 && x<=r.width-48 && y>=8 && y<=48;
      if(!inStar)return;
      var t=findTaskForCard(card); if(!t)return;
      ev.preventDefault(); ev.stopPropagation();
      t.priority=!t.priority; saveTasks();
      try{if(typeof render==='function')render()}catch(e){}
      setTimeout(addButtons,80); setTimeout(addButtons,350);
    }catch(e){}
  }
  function start(){
    setVersion(); addButtons();
    setTimeout(addButtons,150); setTimeout(addButtons,700); setTimeout(addButtons,1500);
    setInterval(addButtons,2500);
    document.addEventListener('click',clickFallback,true);
    try{new MutationObserver(function(){setTimeout(addButtons,60)}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState==='loading')window.addEventListener('load',start); else start();
})();
<\/script>`;

async function getBasePatch(){
  if(cachedBasePatch)return cachedBasePatch;
  try{
    const text = await fetch(BASE_PATCH_URL,{cache:'no-store'}).then(r=>r.text());
    const cssMatch = text.match(/const PLANNER_PATCH_CSS = `([\s\S]*?)`;\n\nconst PLANNER_PATCH_JS = `/);
    const jsMatch = text.match(/const PLANNER_PATCH_JS = `([\s\S]*?)`;\n\nfunction patchPlannerHtml/);
    cachedBasePatch = {css: cssMatch ? cssMatch[1] : '', js: jsMatch ? jsMatch[1] : ''};
  }catch(e){
    cachedBasePatch = {css:'',js:''};
  }
  return cachedBasePatch;
}

function injectBeforeClose(source, closeTag, addition){
  if(!addition)return source;
  if(source.includes(addition.slice(0,60)))return source;
  return source.replace('\n'+closeTag, '\n'+addition+'\n'+closeTag);
}

async function patchPlannerHtml(text){
  const base = await getBasePatch();
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V12.4');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 12.4 • Estrela restaurada.');
  s=s.replace(/version:'\d+\.\d+'/g,"version:'12.4'");
  s=s.replace(/function shouldSchedule\(t\)\{[^}]+\}/,"function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!t.time||!!(t.date&&t.time))}");
  if(!s.includes('function dateKeyForTimeOnly(time)')){
    s=s.replace('function makeItem(text,old){',"function dateKeyForTimeOnly(time){let d=new Date(),p=(time||'08:00').split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1);return dateKey(d)}\nfunction makeItem(text,old){");
  }
  s=s.replace("date:recurrence?'':parseDate(text),time,","date:recurrence?'':(parseDate(text)||(time?dateKeyForTimeOnly(time):'')),time,");
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g,'sendAt.getTime()<Date.now()+5000');
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g,'sendAt.getTime()<Date.now()+5000');
  if(base.css && !s.includes('Ajuste 12.2: estrela menor alinhada com o X')) s=injectBeforeClose(s,'</style>',base.css);
  if(base.js && !s.includes("const VERSION='12.2'")) s=injectBeforeClose(s,'</body>',base.js);
  if(!s.includes('Ajuste 12.4: estrela sempre visível')) s=injectBeforeClose(s,'</style>',EXTRA_CSS);
  if(!s.includes("const VERSION='12.4'")) s=injectBeforeClose(s,'</body>',EXTRA_JS);
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