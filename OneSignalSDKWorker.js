importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.4 — visual leve e versão visível.
// Altera somente aparência e texto de versão. Não mexe nos botões, microfone, organização, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const LIGHT_UI_CSS = `
<style id="light-ui-154">
:root{
  --w:#a40f45!important;
  --w2:#4b1024!important;
  --bg:#fff6f2!important;
  --ink:#24191d!important;
  --mut:#8b7b7f!important;
  --line:#f0d8d3!important;
  --rose:#fde8ee!important;
  --gold:#fff2bf!important;
  --gl:#f5d8a0!important;
  --sh:0 10px 28px rgba(130,63,70,.075)!important;
}
html,body{
  max-width:100%!important;
  overflow-x:hidden!important;
  background:
    radial-gradient(circle at 88% 2%,rgba(255,203,214,.42),transparent 34%),
    radial-gradient(circle at 8% 24%,rgba(255,232,224,.75),transparent 38%),
    linear-gradient(180deg,#fffaf7 0%,#fff5f0 54%,#fff8f4 100%)!important;
  color:var(--ink)!important;
}
body::before{
  content:'';
  position:fixed;
  right:-70px;top:34px;
  width:280px;height:280px;
  border:1px solid rgba(206,104,127,.15);
  border-radius:50%;
  pointer-events:none;
  z-index:-1;
}
main{max-width:780px!important;padding:30px 18px 28px!important;overflow-x:hidden!important;}
.top{margin:10px 0 18px!important;align-items:flex-start!important;}
.hello h1{color:var(--w2)!important;font-size:30px!important;letter-spacing:-.7px!important;text-shadow:0 1px 0 rgba(255,255,255,.75)!important;}
.hello p{font-size:15px!important;color:#7f6f74!important;margin-top:8px!important;}
.round{background:rgba(255,255,255,.82)!important;border:1px solid rgba(230,197,191,.82)!important;box-shadow:0 10px 24px rgba(132,70,78,.08)!important;color:var(--w)!important;backdrop-filter:blur(10px);}
.hero,.panel,.item,.fold summary,.tools summary{background:rgba(255,255,255,.76)!important;border:1px solid rgba(237,210,203,.88)!important;border-radius:26px!important;box-shadow:0 12px 32px rgba(129,69,72,.07)!important;backdrop-filter:blur(10px);}
.hero{padding:16px!important;margin-bottom:14px!important;}
.heroTitle{color:#20171a!important;font-size:19px!important;letter-spacing:-.2px!important;margin-bottom:12px!important;}
.heroTitle::first-letter{color:var(--w)!important;}
.inputWrap{background:rgba(255,255,255,.72)!important;border:1px solid rgba(232,205,199,.95)!important;border-radius:22px!important;padding:15px 14px!important;margin-bottom:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.80)!important;}
.inputWrap span{color:#7e5f66!important;opacity:.9!important;}
textarea{min-height:76px!important;color:#3b2b30!important;font-size:17px!important;line-height:1.42!important;}
textarea::placeholder{color:#ad9ea3!important;}
.micBox{background:linear-gradient(135deg,rgba(255,244,247,.94),rgba(255,250,248,.88))!important;border:1px solid rgba(245,193,207,.92)!important;border-radius:24px!important;padding:14px!important;margin:10px 0 14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important;}
.micIcon{background:linear-gradient(135deg,#d72565,#f1759a)!important;width:58px!important;height:58px!important;box-shadow:0 0 0 10px rgba(218,70,112,.09),0 10px 20px rgba(180,28,78,.13)!important;}
.micText b{color:var(--w)!important;font-size:18px!important;}
.micText span{color:#807174!important;font-size:14px!important;line-height:1.35!important;}
.actions{gap:14px!important;}
.btn{border-radius:20px!important;padding:15px 14px!important;background:linear-gradient(135deg,#fde7ee,#fff2f5)!important;border:1px solid rgba(246,202,213,.85)!important;color:var(--w)!important;box-shadow:0 10px 22px rgba(139,60,77,.07)!important;font-size:16px!important;}
.primary{background:linear-gradient(135deg,#c51655,#e44d78)!important;color:#fff!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:0 14px 28px rgba(172,22,76,.20)!important;}
.ver,.note{color:#8f7f82!important;font-size:13px!important;margin-top:12px!important;}
.panel{padding:16px!important;margin:14px 0 14px!important;}
.todayHead b{font-size:22px!important;color:var(--w2)!important;}
.todayHead small{font-size:14px!important;color:#807174!important;margin-top:2px!important;}
.mini{background:rgba(255,255,255,.72)!important;border:1px solid rgba(232,205,199,.92)!important;border-radius:18px!important;padding:12px 13px!important;margin-top:10px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;}
.timeMini{color:var(--w)!important;font-weight:900!important;}
.miniText{font-size:15px!important;font-weight:750!important;}
.miniCat{font-size:12px!important;color:#85777a!important;}
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important;}
#todayList .miniMain{padding-right:0!important;}
.stats{gap:10px!important;margin:14px 0 20px!important;}
.stat{background:rgba(255,255,255,.78)!important;border:1px solid rgba(237,210,203,.86)!important;border-radius:22px!important;min-height:74px!important;box-shadow:0 10px 24px rgba(129,69,72,.06)!important;font-size:13px!important;color:#473a3e!important;}
.stat b{font-size:28px!important;color:var(--w)!important;margin:2px 0!important;}
.head{margin:24px 0 10px!important;}
.h h2{font-size:25px!important;letter-spacing:-.5px!important;color:#24191d!important;}
.sub{font-size:15px!important;color:#8a7b7e!important;margin-top:3px!important;}
#foldersBtn,.small{background:linear-gradient(135deg,#fde6ee,#fff0f4)!important;border:1px solid rgba(246,202,213,.85)!important;color:var(--w)!important;border-radius:999px!important;box-shadow:0 8px 18px rgba(139,60,77,.06)!important;}
.filters{gap:9px!important;padding-bottom:8px!important;}
.chip{border:1px solid rgba(231,174,190,.75)!important;background:rgba(255,255,255,.76)!important;color:var(--w)!important;border-radius:999px!important;padding:9px 16px!important;font-size:15px!important;box-shadow:0 6px 14px rgba(129,69,72,.04)!important;}
.chip.on{background:linear-gradient(135deg,#b80f4d,#d23266)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 10px 22px rgba(172,22,76,.16)!important;}
.item{border-radius:24px!important;background:rgba(255,255,255,.80)!important;margin:12px 0!important;padding:15px 58px 15px 14px!important;box-shadow:0 10px 24px rgba(129,69,72,.06)!important;}
.text{font-size:19px!important;color:#1f171a!important;}
.meta{font-size:13px!important;color:#85777a!important;}
.tag{background:#fde3ec!important;color:var(--w)!important;border-radius:999px!important;padding:5px 10px!important;}
.rem{background:#f4ece8!important;border-radius:999px!important;padding:5px 10px!important;}
.prioBtn{background:#fff2bf!important;color:#8a5b00!important;border:1px solid #f5d8a0!important;}
.del{background:#f5e5e6!important;color:var(--w)!important;box-shadow:0 8px 18px rgba(139,60,77,.06)!important;}
.fold,.tools{border-top:1px solid rgba(237,210,203,.88)!important;margin-top:26px!important;}
.count{background:#fde7ee!important;color:var(--w)!important;}
.nav{background:rgba(255,255,255,.85)!important;border-color:rgba(237,210,203,.86)!important;box-shadow:0 14px 32px rgba(129,69,72,.09)!important;}
</style>`;

const LIGHT_UI_JS = `
<script id="light-ui-154-js">
(function(){
  function setVisualVersion(){
    try{
      var v=document.getElementById('versionLine');
      if(v)v.textContent='Versão 15.4 • Visual leve.';
      document.title='Meu Planner — Bruna V15.4';
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setVisualVersion);else setVisualVersion();
  setTimeout(setVisualVersion,400);
  setTimeout(setVisualVersion,1200);
})();
<\/script>`;

function injectBefore(source, tag, addition){
  if(source.includes(addition.slice(0,40))) return source;
  return source.replace(tag, addition + '\n' + tag);
}

function patchPlannerHtml(html){
  let s = html;
  s = s.replace(/Meu Planner — Bruna V\d+\.\d+/g, 'Meu Planner — Bruna V15.4');
  s = s.replace(/Versão \d+\.\d+ • [^<]+/g, 'Versão 15.4 • Visual leve.');
  s = injectBefore(s, '</head>', LIGHT_UI_CSS);
  s = injectBefore(s, '</body>', LIGHT_UI_JS);
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
