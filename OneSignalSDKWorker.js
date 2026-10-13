importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.6 — visual leve seguro.
// Injeta apenas CSS e troca texto de versão no HTML. Não adiciona JS e não altera cliques, microfone, organização, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const SAFE_VISUAL_CSS = `
<style id="safe-visual-156">
:root{
  --w:#a80f47!important;
  --w2:#491023!important;
  --bg:#fff7f3!important;
  --ink:#24191d!important;
  --mut:#85777b!important;
  --line:#efd9d2!important;
  --rose:#fde8ef!important;
  --gold:#fff2bd!important;
  --gl:#f1d698!important;
  --sh:0 10px 26px rgba(128,72,76,.07)!important;
}
html,body{
  background:linear-gradient(180deg,#fffaf7 0%,#fff5f1 50%,#fff8f4 100%)!important;
  overflow-x:hidden!important;
}
.hello h1{color:var(--w2)!important;letter-spacing:-.5px!important;}
.hello p{color:#776a6d!important;}
.round{background:#fffdfb!important;border-color:#ead5ce!important;box-shadow:0 8px 20px rgba(128,72,76,.06)!important;color:var(--w)!important;}
.hero,.panel,.item,.fold summary,.tools summary{
  background:linear-gradient(145deg,#fffefe,#fff8f4)!important;
  border-color:#ecd8d0!important;
  box-shadow:0 10px 24px rgba(128,72,76,.065)!important;
}
.heroTitle{color:#20171a!important;}
.inputWrap{background:#fffdfc!important;border-color:#ebd6cf!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)!important;}
textarea::placeholder{color:#a99da0!important;}
.micBox{background:#fff8fb!important;border-color:#f1c9d6!important;}
.micIcon{background:linear-gradient(135deg,#b4124a,#dc3e72)!important;box-shadow:0 0 0 8px rgba(172,22,76,.08)!important;}
.micText b{color:var(--w)!important;}
.btn{background:linear-gradient(135deg,#fde7ee,#fff1f5)!important;border:1px solid rgba(243,198,210,.9)!important;color:var(--w)!important;box-shadow:0 8px 18px rgba(128,72,76,.055)!important;}
.primary{background:linear-gradient(135deg,#b6124d,#d93668)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 12px 24px rgba(172,22,76,.17)!important;}
.ver,.note{color:#88787c!important;}
.todayHead b,.h h2{color:var(--w2)!important;}
.mini{background:#fffdfc!important;border-color:#ead8d1!important;}
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important;}
#todayList .miniMain{padding-right:0!important;}
.stat{background:#fffdfc!important;border-color:#ead8d1!important;box-shadow:0 8px 18px rgba(128,72,76,.055)!important;}
.stat b{color:var(--w)!important;}
#foldersBtn,.small{background:#fde7ee!important;color:var(--w)!important;}
.chip{background:#fffdfc!important;border-color:#e7c7cf!important;color:var(--w)!important;}
.chip.on{background:linear-gradient(135deg,#a80f47,#c8205a)!important;color:#fff!important;border-color:transparent!important;}
.item{background:#fffdfc!important;border-color:#ead8d1!important;}
.tag{background:#fde3eb!important;color:var(--w)!important;}
.del{background:#f4e3e4!important;color:var(--w)!important;}
.count{background:#fde7ee!important;color:var(--w)!important;}
.nav{background:#fffdfc!important;border-color:#ead8d1!important;}
</style>`;

function patchPlannerHtml(html){
  let s = html;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V15.6');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 15.6 • Visual leve seguro.');
  if(!s.includes('safe-visual-156')){
    s = s.replace('</head>', SAFE_VISUAL_CSS + '\n</head>');
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
          'cache-control': 'no-store, max-age=0'
        }
      });
    }).catch(() => fetch(request))
  );
});
