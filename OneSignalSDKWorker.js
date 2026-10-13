importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.8 — remove apenas a palavra Ditado do botão de microfone.
// Não altera funcionamento do microfone, botão Organizar, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

function patchPlannerHtml(html){
  let s = html;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V15.8');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 15.8 • Microfone sem texto.');
  s = s.replace(/<button type="button" class="btn" id="voice">🎙️\s*Ditado<\/button>/g, '<button type="button" class="btn" id="voice" aria-label="Microfone">🎙️</button>');
  s = s.replace(/id="voice">🎙️\s*Ditado<\/button>/g, 'id="voice" aria-label="Microfone">🎙️</button>');
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
          'cache-control': 'no-store, max-age=0'
        }
      });
    }).catch(() => fetch(request))
  );
});
