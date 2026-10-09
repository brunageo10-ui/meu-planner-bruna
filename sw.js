self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const PLANNER_PATCH_CSS = `
/* Ajuste 10.4: margem lateral + pastas compactas */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;position:relative;touch-action:pan-y}
body{overscroll-behavior-x:none}
main{width:100%;max-width:780px;margin:0 auto;padding-left:calc(22px + env(safe-area-inset-left))!important;padding-right:calc(18px + env(safe-area-inset-right))!important;overflow:hidden}
.topbar,.hero,.todayPanel,.grid,.sectionHead,.filter,.item,.toolsBox{max-width:100%}
.filter{gap:7px!important;padding:2px 2px 6px!important;scroll-padding-left:2px}
.chip{font-size:14px!important;padding:8px 13px!important;border-radius:999px!important;min-height:38px!important;box-shadow:0 4px 12px rgba(82,44,37,.04)}
.chip.active{box-shadow:0 8px 16px rgba(138,18,56,.16)!important}
.sectionHead{margin-top:20px!important}.sectionTitle{min-width:0}.sectionTitle h2{white-space:nowrap}.miniBtn{padding:8px 11px!important;font-size:12.5px!important}
@media(max-width:390px){main{padding-left:20px!important;padding-right:16px!important}.chip{font-size:13.5px!important;padding:7px 11px!important}.sectionTitle h2{font-size:21px!important}.miniBtn{font-size:12px!important;padding:7px 10px!important}}
@supports(padding:max(0px)){main{padding-left:max(22px,calc(env(safe-area-inset-left) + 22px))!important;padding-right:max(18px,calc(env(safe-area-inset-right) + 18px))!important}}
`;

const PLANNER_PATCH_JS = `
<script>
(function(){
  function fixX(){ if(window.scrollX) window.scrollTo(0, window.scrollY); }
  window.addEventListener('load', function(){ setTimeout(fixX,80); setTimeout(fixX,400); });
  window.addEventListener('resize', fixX);
  document.addEventListener('touchend', fixX, {passive:true});
})();
<\/script>`;

function patchPlannerHtml(text){
  let s = text;
  s = s.replace(/Meu Planner — Bruna V10\.[0-3]/g, 'Meu Planner — Bruna V10.4');
  s = s.replace(/Versão 10\.[0-3] • [^<]+/g, 'Versão 10.4 • Pastas compactas e alinhadas.');
  s = s.replace(/version:'10\.[0-3]'/g, "version:'10.4'");
  if(!s.includes('Ajuste 10.4: margem lateral + pastas compactas')) s = s.replace('\n</style>', '\n' + PLANNER_PATCH_CSS + '\n</style>');
  if(!s.includes('function fixX(){ if(window.scrollX)')) s = s.replace('\n</body>', PLANNER_PATCH_JS + '\n</body>');
  return s;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode === 'navigate' || request.destination === 'document'){
    event.respondWith(fetch(request,{cache:'no-store'}).then(response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      return response.text().then(html => new Response(patchPlannerHtml(html), {
        status: response.status,
        statusText: response.statusText,
        headers: {'content-type':'text/html; charset=utf-8','cache-control':'no-store'}
      }));
    }).catch(() => fetch(request)));
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = {body: event.data ? event.data.text() : ''}; }
  event.waitUntil(self.registration.showNotification(data.title || 'Meu Planner 💛', {
    body: data.body || 'Você tem um lembrete.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: data.url || './'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || './'));
});
