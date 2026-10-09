importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 10.3 — ajuste visual aplicado pelo service worker.
// Mantém a tela presa na largura correta do celular e evita corte lateral no iPhone.
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

const FIX_103_CSS = `
/* Ajuste 10.3: impede corte lateral no iPhone */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;position:relative;touch-action:pan-y}
body{overscroll-behavior-x:none}
main{width:100%;max-width:780px;margin:0 auto;padding-left:calc(22px + env(safe-area-inset-left))!important;padding-right:calc(18px + env(safe-area-inset-right))!important;overflow:hidden}
.topbar,.hero,.todayPanel,.grid,.sectionHead,.filter,.item,.toolsBox{max-width:100%}
.filter{padding-left:2px;padding-right:2px}
@supports(padding:max(0px)){main{padding-left:max(22px,calc(env(safe-area-inset-left) + 22px))!important;padding-right:max(18px,calc(env(safe-area-inset-right) + 18px))!important}}
`;

const FIX_103_JS = `
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
  s = s.replace(/Meu Planner — Bruna V10\.2/g, 'Meu Planner — Bruna V10.3');
  s = s.replace('Versão 10.2 • Agenda de hoje no topo.', 'Versão 10.3 • Margem lateral corrigida.');
  s = s.replace("version:'10.2'", "version:'10.3'");
  if(!s.includes('Ajuste 10.3: impede corte lateral no iPhone')){
    s = s.replace('\n</style>', '\n' + FIX_103_CSS + '\n</style>');
  }
  if(!s.includes('function fixX(){ if(window.scrollX)')){
    s = s.replace('\n</body>', FIX_103_JS + '\n</body>');
  }
  return s;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request).then(response => {
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
