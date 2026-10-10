importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 13.1 — ajuste do microfone para usar o ditado do teclado no iPhone.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const MIC_PATCH = `
<script>
(function(){
  const VERSION = '13.1';
  function showToast(msg){
    try{
      if(typeof window.toast === 'function') return window.toast(msg);
      var el = document.getElementById('toast');
      if(el){
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(function(){ el.style.display = 'none'; }, 4200);
        return;
      }
    }catch(e){}
    try{ alert(msg); }catch(e){}
  }
  function setupMicButton(){
    try{
      document.title = 'Meu Planner — Bruna V' + VERSION;
      var version = document.getElementById('versionLine');
      if(version) version.textContent = 'Versão ' + VERSION + ' • Ditado pelo teclado.';
      var btn = document.getElementById('voice');
      var input = document.getElementById('input');
      if(!btn || !input) return;
      btn.innerHTML = '🎙️ Ditado';
      btn.setAttribute('title','Usar o microfone do teclado');
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        input.focus();
        setTimeout(function(){ input.focus(); }, 80);
        setTimeout(function(){
          showToast('Toque no microfone do teclado do iPhone, fale sua tarefa e depois toque em “Organizar automaticamente”.');
        }, 120);
      };
    }catch(e){}
  }
  if(document.readyState === 'loading'){
    window.addEventListener('load', setupMicButton);
  }else{
    setupMicButton();
  }
  setTimeout(setupMicButton, 500);
  setTimeout(setupMicButton, 1500);
})();
<\/script>`;

function patchHtml(html){
  let s = html;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V13.1');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 13.1 • Ditado pelo teclado.');
  if(!s.includes("const VERSION = '13.1'")){
    s = s.replace('\n</body>', '\n' + MIC_PATCH + '\n</body>');
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
      return new Response(patchHtml(html), {
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