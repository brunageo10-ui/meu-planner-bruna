importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 10.9 — tarefas acima das rotinas.
// Mantém alertas por horário, margem corrigida, pastas compactas e seções recolhíveis.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const PLANNER_PATCH_CSS = `
/* Ajuste 10.9: tarefas acima das rotinas + seções recolhíveis */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;position:relative;touch-action:pan-y}
body{overscroll-behavior-x:none}
main{width:100%;max-width:780px;margin:0 auto;padding-left:calc(22px + env(safe-area-inset-left))!important;padding-right:calc(18px + env(safe-area-inset-right))!important;overflow:hidden}
.topbar,.hero,.todayPanel,.grid,.sectionHead,.filter,.item,.toolsBox,.historyBox,.routineBox{max-width:100%}
.filter{gap:7px!important;padding:2px 2px 6px!important;scroll-padding-left:2px}
.chip{font-size:14px!important;padding:8px 13px!important;border-radius:999px!important;min-height:38px!important;box-shadow:0 4px 12px rgba(82,44,37,.04)}
.chip.active{box-shadow:0 8px 16px rgba(138,18,56,.16)!important}
.sectionHead{margin-top:20px!important}
.sectionTitle{min-width:0}.sectionTitle h2{white-space:nowrap}.miniBtn{padding:8px 11px!important;font-size:12.5px!important}
.historyBox,.routineBox{margin:24px 0 10px;border-top:1px solid var(--line);padding-top:14px}
.routineBox{margin-top:20px}
.historyBox summary,.routineBox summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,253,251,.94);border:1px solid var(--line);border-radius:18px;padding:14px 15px;box-shadow:var(--shadow2);color:var(--wine);font-weight:900;font-size:18px;cursor:pointer}
.historyBox summary::-webkit-details-marker,.routineBox summary::-webkit-details-marker{display:none}
.historyBox summary b,.routineBox summary b{display:block;font-size:18px;line-height:1.05}
.historyBox summary small,.routineBox summary small{display:block;font-size:12px;color:var(--muted);font-weight:700;margin-top:3px}
.historyBox[open] summary small,.routineBox[open] summary small{color:var(--wine)}
.historyCount,.routineCountMini{background:var(--rose);color:var(--wine);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;white-space:nowrap}
.historyBox #doneList,.routineBox #routineList{margin-top:10px}
.routineBox .empty,.historyBox .empty{margin-top:10px}
@media(max-width:390px){main{padding-left:20px!important;padding-right:16px!important}.chip{font-size:13.5px!important;padding:7px 11px!important}.sectionTitle h2{font-size:21px!important}.miniBtn{font-size:12px!important;padding:7px 10px!important}.historyBox summary,.routineBox summary{padding:13px 14px}.historyBox summary b,.routineBox summary b{font-size:17px}}
@supports(padding:max(0px)){main{padding-left:max(22px,calc(env(safe-area-inset-left) + 22px))!important;padding-right:max(18px,calc(env(safe-area-inset-right) + 18px))!important}}
`;

const PLANNER_PATCH_JS = `
<script>
(function(){
  function fixX(){ if(window.scrollX) window.scrollTo(0, window.scrollY); }
  function enhanceFilter(){
    var filter=document.getElementById('filters');
    if(filter && !filter.dataset.compactHint){ filter.dataset.compactHint='1'; filter.setAttribute('aria-label','Pastas — arraste para o lado para ver todas'); }
  }
  function dateKeyForTimeOnlyRuntime(time){
    var d=new Date();
    var p=String(time||'08:00').split(':').map(Number);
    d.setHours(p[0]||0,p[1]||0,0,0);
    if(d.getTime() <= Date.now()+5000) d.setDate(d.getDate()+1);
    if(typeof dateKey==='function') return dateKey(d);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function fixExistingTimeOnlyTasks(){
    try{
      var changed=false;
      if(!Array.isArray(window.tasks)) return;
      window.tasks.forEach(function(t){
        if(t && t.time && !t.date && !t.recurrence && !t.done){
          t.date=dateKeyForTimeOnlyRuntime(t.time);
          changed=true;
        }
      });
      if(changed){
        localStorage.setItem('brunaTasks', JSON.stringify(window.tasks));
        if(typeof render==='function') render();
        if(typeof schedulePendingReminders==='function') schedulePendingReminders(false);
      }
    }catch(e){ console.log('fix time-only tasks:', e); }
  }
  function routineCount(){
    try{
      if(typeof tasks!=='undefined' && Array.isArray(tasks)){
        return tasks.filter(function(t){ return isRoutine(t) && isActive(t); }).length;
      }
    }catch(e){}
    return document.querySelectorAll('#routineList .routineItem').length;
  }
  function historyDoneCount(){
    try{
      if(typeof tasks!=='undefined' && Array.isArray(tasks)){
        return tasks.filter(function(t){ return !isRoutine(t) && t.done; }).length;
      }
    }catch(e){}
    return document.querySelectorAll('#doneList .historyItem').length;
  }
  function updateFoldCounts(){
    var rc=document.getElementById('routineCountMini');
    var hc=document.getElementById('historyCount');
    if(rc) rc.textContent=String(routineCount());
    if(hc) hc.textContent=String(historyDoneCount());
  }
  function setupRoutineAccordion(){
    var list=document.getElementById('routineList');
    if(!list){ return; }
    if(list.closest && list.closest('.routineBox')){ updateFoldCounts(); return; }
    var head=list.previousElementSibling;
    while(head && head.nodeType!==1){ head=head.previousElementSibling; }
    if(!head || !head.classList || !head.classList.contains('sectionHead')){ return; }
    var box=document.createElement('details');
    box.className='routineBox';
    box.id='routineBox';
    var summary=document.createElement('summary');
    summary.innerHTML='<span><b>🔁 Minhas rotinas</b><small>Toque para abrir</small></span><span class="routineCountMini" id="routineCountMini">0</span>';
    head.parentNode.insertBefore(box, head);
    head.remove();
    box.appendChild(summary);
    box.appendChild(list);
    updateFoldCounts();
  }
  function setupSectionOrder(){
    var routineBox=document.getElementById('routineBox');
    var taskList=document.getElementById('taskList');
    if(!routineBox || !taskList || !routineBox.parentNode){ return; }
    var taskHead=taskList.previousElementSibling;
    while(taskHead && taskHead.nodeType!==1){ taskHead=taskHead.previousElementSibling; }
    if(!taskHead || !taskHead.classList || !taskHead.classList.contains('sectionHead')){ return; }
    routineBox.parentNode.insertBefore(taskHead, routineBox);
    routineBox.parentNode.insertBefore(taskList, routineBox);
  }
  function setupHistoryAccordion(){
    var list=document.getElementById('doneList');
    if(!list){ return; }
    if(list.closest && list.closest('.historyBox')){ updateFoldCounts(); return; }
    var head=list.previousElementSibling;
    while(head && head.nodeType!==1){ head=head.previousElementSibling; }
    if(!head || !head.classList || !head.classList.contains('sectionHead')){ return; }
    var box=document.createElement('details');
    box.className='historyBox';
    box.id='historyBox';
    var summary=document.createElement('summary');
    summary.innerHTML='<span><b>🕘 Histórico</b><small>Toque para abrir</small></span><span class="historyCount" id="historyCount">0</span>';
    head.parentNode.insertBefore(box, head);
    head.remove();
    box.appendChild(summary);
    box.appendChild(list);
    updateFoldCounts();
  }
  function setupAccordions(){
    setupRoutineAccordion();
    setupSectionOrder();
    setupHistoryAccordion();
    updateFoldCounts();
  }
  function wrapRenderForAccordions(){
    if(window.__foldPatchWrapped){ setupAccordions(); return; }
    window.__foldPatchWrapped=true;
    var oldRender=null;
    try{ oldRender=window.render || (typeof render==='function' ? render : null); }catch(e){}
    if(typeof oldRender==='function'){
      window.render=function(){
        var result=oldRender.apply(this, arguments);
        setupAccordions();
        return result;
      };
      try{ render=window.render; }catch(e){}
    }
    setupAccordions();
  }
  window.addEventListener('load', function(){
    setTimeout(fixExistingTimeOnlyTasks,120);
    setTimeout(wrapRenderForAccordions,180);
    setTimeout(wrapRenderForAccordions,650);
    setTimeout(fixX,80); setTimeout(fixX,400); setTimeout(enhanceFilter,500);
  });
  window.addEventListener('resize', fixX);
  document.addEventListener('touchend', fixX, {passive:true});
})();
<\/script>`;

function patchPlannerHtml(text){
  let s = text;
  s = s.replace(/Meu Planner — Bruna V10\.[0-8]/g, 'Meu Planner — Bruna V10.9');
  s = s.replace(/Versão 10\.[0-8] • [^<]+/g, 'Versão 10.9 • Tarefas antes das rotinas.');
  s = s.replace(/version:'10\.[0-8]'/g, "version:'10.9'");

  // Aceita agendamento quando houver horário, mesmo sem data escrita.
  s = s.replace(
    "function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!(t.date&&t.time))}",
    "function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!t.time||!!(t.date&&t.time))}"
  );

  // Cria data automaticamente para tarefas com horário e sem data.
  if(!s.includes('function dateKeyForTimeOnly(time)')){
    s = s.replace(
      'function makeItem(text,old){',
      "function dateKeyForTimeOnly(time){let d=new Date(),p=(time||'08:00').split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1);return dateKey(d)}\nfunction makeItem(text,old){"
    );
  }
  s = s.replace(
    "date:recurrence?'':parseDate(text),time,",
    "date:recurrence?'':(parseDate(text)||(time?dateKeyForTimeOnly(time):'')),time,"
  );

  // Não rejeita lembrete criado poucos segundos antes do horário.
  s = s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g, 'sendAt.getTime()<Date.now()+5000');
  s = s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g, 'sendAt.getTime()<Date.now()+5000');

  if(!s.includes('Ajuste 10.9: tarefas acima das rotinas + seções recolhíveis')){
    s = s.replace('\n</style>', '\n' + PLANNER_PATCH_CSS + '\n</style>');
  }
  if(!s.includes('function setupSectionOrder()')){
    s = s.replace('\n</body>', PLANNER_PATCH_JS + '\n</body>');
  }
  return s;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request, {cache:'no-store'}).then(response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      return response.text().then(html => new Response(patchPlannerHtml(html), {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store'
        }
      }));
    }).catch(() => fetch(request))
  );
});
