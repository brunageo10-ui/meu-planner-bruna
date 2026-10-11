importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 14.6 — limpa: não interfere nos botões do app.
// Mantém a base principal funcionando e apenas remove visualmente o botão Feito da Agenda.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PATCH_CSS = `
/* V14.6: remove apenas o botão ✓ Feito da Agenda de hoje, sem mexer nos cliques */
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
`;

function patchPlannerHtml(text){
  let s = text;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V14.6');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 14.6 • Base limpa restaurada.');
  s = s.replace(/const VERSION='\d+\.\d+'/g, "const VERSION='14.6'");
  if(!s.includes('V14.6: remove apenas o botão')){
    s = s.replace('\n</style>', '\n' + PATCH_CSS + '\n</style>');
  }
  return s;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request, {cache:'no-store'}).then(async response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      const html = await response.text();
      return new Response(patchPlannerHtml(html), {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }).catch(() => fetch(request))
  );
});
