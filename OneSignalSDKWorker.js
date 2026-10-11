importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.2 — base estável com apenas o botão Feito oculto.
// Não altera botões, microfone, organização, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const HIDE_DONE_CSS = `
<style id="hide-done-only-152">
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
</style>`;

function patchHtmlOnlyHideDone(html){
  if(html.includes('hide-done-only-152')) return html;
  return html.replace('</head>', HIDE_DONE_CSS + '\n</head>');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request, {cache:'no-store'}).then(async response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      const html = await response.text();
      return new Response(patchHtmlOnlyHideDone(html), {
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
