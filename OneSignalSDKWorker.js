importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 10.5 — ajuste visual e correção de alertas por horário.
// Se a usuária escrever apenas um horário, o planner assume hoje quando ainda dá tempo.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const PLANNER_PATCH_CSS = `
/* Ajuste 10.5: margem lateral + pastas compactas */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;position:relative;touch-action:pan-y}
body{overscroll-behavior-x:none}
main{width:100%;max-width:780px;margin:0 auto;padding-left:calc(22px + env(safe-area-inset-left))!important;padding-right:calc(18px + env(safe-area-inset-right))!important;overflow:hidden}
.topbar,.hero,.todayPanel,.grid,.sectionHead,.filter,.item,.toolsBox{max-width:100%}
.filter{gap:7px!important;padding:2px 2px 6px!important;scroll-padding-left:2px}
.chip{font-size:14px!important;padding:8px 13px!important;border-radius:999px!important;min-height:38px!important;box-shadow:0 4px 12px rgba(82,44,37,.04)}
.chip.active{box-shadow:0 8px 16px rgba(138,18,56,.16)!important}
.sectionHead{margin-top:20px!important}
.sectionTitle{min-width:0}.sectionTitle h2{white-space:nowrap}.miniBtn{padding:8px 11px!important;font-size:12.5px!important}
@media(max-width:390px){main{padding-left:20px!important;padding-right:16px!important}.chip{font-size:13.5px!important;padding:7px 11px!important}.sectionTitle h2{font-size:21px!important}.miniBtn{font-size:12px!important;padding:7px 10px!important}}
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
  function dateFromTime(time){
    var d=new Date();
    var p=String(time||'').split(':').map(Number);
    d.setHours(p[0]||0,p[1]||0,0,0);
    if(d.getTime() <= Date.now()+15000) d.setDate(d.getDate()+1);
    return dateKey(d);
  }
  function patchTimeOnlyTasks(){
    if(window.__plannerTimePatchApplied) return;
    window.__plannerTimePatchApplied=true;
    var oldMakeItem=window.makeItem;
    if(typeof oldMakeItem==='function'){
      window.makeItem=function(text,old){
        var item=oldMakeItem(text,old);
        if(item && item.time && !item.date && !item.recurrence){
          item.date=dateFromTime(item.time);
        }
        return item;
      };
    }
    var oldEventDueAt=window.eventDueAt;
    if(typeof oldEventDueAt==='function'){
      window.eventDueAt=function(t){
        if(t && t.time && !t.date && !t.recurrence){
          var d=new Date(dateFromTime(t.time)+'T'+t.time);
          return d;
        }
        return oldEventDueAt(t);
      };
    }
  }
  window.addEventListener('load', function(){
    patchTimeOnlyTasks();
    setTimeout(fixX,80); setTimeout(fixX,400); setTimeout(enhanceFilter,500);
  });
  window.addEventListener('resize', fixX);
  document.addEventListener('touchend', fixX, {passive:true});
})();
<\/script>`;

function patchPlannerHtml(text){
  let s = text;
  s = s.replace(/Meu Planner — Bruna V10\.[0-4]/g, 'Meu Planner — Bruna V10.5');
  s = s.replace(/Versão 10\.[0-4] • [^<]+/g, 'Versão 10.5 • Alertas por horário corrigidos.');
  s = s.replace(/version:'10\.[0-4]'/g, "version:'10.5'");
  s = s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g, 'sendAt.getTime()<Date.now()+5000');
  s = s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g, 'sendAt.getTime()<Date.now()+5000');
  if(!s.includes('Ajuste 10.5: margem lateral + pastas compactas')){
    s = s.replace('\n</style>', '\n' + PLANNER_PATCH_CSS + '\n</style>');
  }
  if(!s.includes('function patchTimeOnlyTasks()')){
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
