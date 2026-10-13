importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão visual 15.3 — redesign leve apenas por CSS.
// Não altera botões, microfone, organização, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const LIGHT_UI_CSS = `
<style id="light-ui-153">
:root{
  --w:#a40f45!important;
  --w2:#4a1023!important;
  --bg:#fff6f2!important;
  --ink:#24191d!important;
  --mut:#8f7f82!important;
  --line:#f0d8d3!important;
  --rose:#fde8ee!important;
  --gold:#fff2bf!important;
  --gl:#f5d8a0!important;
  --sh:0 10px 28px rgba(130,63,70,.075)!important;
}
html,body{
  background:
    radial-gradient(circle at 85% 2%,rgba(255,200,211,.42),transparent 34%),
    radial-gradient(circle at 8% 28%,rgba(255,232,224,.70),transparent 38%),
    linear-gradient(180deg,#fffaf7 0%,#fff5f0 52%,#fff8f4 100%)!important;
  color:var(--ink)!important;
}
body::before{
  content:'';
  position:fixed;
  right:-60px;top:38px;
  width:260px;height:260px;
  border:1px solid rgba(206,104,127,.16);
  border-radius:50%;
  pointer-events:none;
  z-index:-1;
}
main{max-width:780px!important;padding:30px 18px 28px!important;}
.hello h1{
  color:var(--w2)!important;
  font-size:30px!important;
  letter-spacing:-.7px!important;
  text-shadow:0 1px 0 rgba(255,255,255,.75)!important;
}
.hello p{font-size:15px!important;color:#7f6f74!important;margin-top:8px!important;}
.round{
  background:rgba(255,255,255,.80)!important;
  border:1px solid rgba(230,197,191,.82)!important;
  box-shadow:0 10px 24px rgba(132,70,78,.08)!important;
  color:var(--w)!important;
  backdrop-filter:blur(10px);
}
.hero,.panel,.item,.fold summary,.tools summary{
  background:rgba(255,255,255,.74)!important;
  border:1px solid rgba(237,210,203,.86)!important;
  border-radius:26px!important;
  box-shadow:0 12px 32px rgba(129,69,72,.07)!important;
  backdrop-filter:blur(10px);
}
.hero{padding:16px!important;margin-bottom:14px!important;}
.heroTitle{
  color:#20171a!important;
  font-size:19px!important;
  letter-spacing:-.2px!important;
  margin-bottom:12px!important;
}
.heroTitle::first-letter{color:var(--w)!important;}
.inputWrap{
  background:rgba(255,255,255,.70)!important;
  border:1px solid rgba(232,205,199,.95)!important;
  border-radius:22px!important;
  padding:15px 14px!important;
  margin-bottom:14px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.80)!important;
}
.inputWrap span{color:#7e5f66!important;opacity:.9!important;}
textarea{
  min-height:76px!important;
  color:#3b2b30!important;
  font-size:17px!important;
  line-height:1.42!important;
}
textarea::placeholder{color:#ad9ea3!important;}
.micBox{
  background:linear-gradient(135deg,rgba(255,244,247,.92),rgba(255,250,248,.86))!important;
  border:1px solid rgba(245,193,207,.92)!important;
  border-radius:24px!important;
  padding:14px!important;
  margin:10px 0 14px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important;
}
.micIcon{
  background:linear-gradient(135deg,#d72565,#f1759a)!important;
  width:58px!important;height:58px!important;
  box-shadow:0 0 0 10px rgba(218,70,112,.09),0 10px 20px rgba(180,28,78,.13)!important;
}
.micText b{color:var(--w)!important;font-size:18px!important;}
.micText span{color:#807174!important;font-size:14px!important;line-height:1.35!important;}
.actions{gap:14px!important;}
.btn{
  border-radius:20px!important;
  padding:15px 14px!important;
  background:linear-gradient(135deg,#fde7ee,#fff2f5)!important;
  border:1px solid rgba(246,202,213,.85)!important;
  color:var(--w)!important;
  box-shadow:0 10px 22px rgba(139,60,77,.07)!important;
  font-size:16px!important;
}
.primary{
  background:linear-gradient(135deg,#c51655,#e44d78)!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.35)!important;
  box-shadow:0 14px 28px rgba(172,22,76,.20)!important;
}
.ver,.note{color:#8f7f82!important;font-size:13px!important;margin-top:12px!important;}
.panel{padding:16px!important;margin:14px 0 14px!important;}
.todayHead b{font-size:22px!important;color:var(--w2)!important;}
.todayHead small{font-size:14px!important;color:#807174!important;margin-top:2px!important;}
.mini{
  background:rgba(255,255,255,.75)!important;
  border:1px solid rgba(235,210,204,.86)!important;
  border-radius:18px!important;
  padding:12px 13px!important;
  box-shadow:none!important;
}
.timeMini{color:var(--w)!important;font-size:19px!important;min-width:58px!important;}
.miniText{font-size:16px!important;color:#251b1f!important;}
.miniCat{font-size:13px!important;color:#87777b!important;}
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important;}
#todayList .miniMain{padding-right:0!important;}
.stats{gap:12px!important;margin:16px 0 20px!important;}
.stat{
  background:rgba(255,255,255,.72)!important;
  border:1px solid rgba(235,211,205,.86)!important;
  border-radius:22px!important;
  min-height:78px!important;
  box-shadow:0 10px 24px rgba(130,63,70,.055)!important;
  color:#55494d!important;
  font-size:13px!important;
}
.stat b{font-size:27px!important;color:var(--w)!important;margin:2px 0!important;}
.head{margin:25px 0 10px!important;align-items:center!important;}
.h h2{font-size:25px!important;color:#21181b!important;letter-spacing:-.5px!important;}
.small{
  background:linear-gradient(135deg,#fde7ee,#fff2f6)!important;
  border:1px solid rgba(246,204,214,.8)!important;
  color:var(--w)!important;
  border-radius:999px!important;
  padding:11px 15px!important;
  box-shadow:0 8px 20px rgba(128,57,75,.055)!important;
}
.filters{gap:10px!important;padding-bottom:8px!important;}
.chip{
  background:rgba(255,255,255,.70)!important;
  border:1px solid rgba(238,178,194,.82)!important;
  color:var(--w)!important;
  padding:10px 17px!important;
  border-radius:999px!important;
  box-shadow:0 8px 18px rgba(130,63,70,.035)!important;
}
.chip.on{
  background:linear-gradient(135deg,#b30d48,#d93367)!important;
  color:#fff!important;
  border-color:transparent!important;
  box-shadow:0 10px 20px rgba(174,20,77,.18)!important;
}
.item{
  border-radius:23px!important;
  padding:16px 56px 16px 15px!important;
  margin:12px 0!important;
  background:rgba(255,255,255,.76)!important;
}
.text{font-size:19px!important;line-height:1.2!important;color:#22181c!important;}
.meta{font-size:13px!important;color:#7d7073!important;}
.tag{background:#fde3eb!important;color:var(--w)!important;padding:6px 10px!important;}
.rem{background:#f7efea!important;padding:6px 10px!important;}
.prioTag,.warnTag{padding:7px 11px!important;}
.check{border-color:#d7c9c6!important;border-radius:13px!important;background:#fff!important;}
.del{
  background:#f7e6e7!important;
  color:var(--w)!important;
  box-shadow:none!important;
}
.fold,.tools{border-top:1px solid rgba(236,211,204,.78)!important;margin-top:26px!important;}
.fold summary,.tools summary{padding:16px!important;border-radius:23px!important;}
.count{background:#fde3eb!important;color:var(--w)!important;}
.feature{border-color:rgba(235,210,204,.86)!important;background:rgba(255,255,255,.72)!important;border-radius:20px!important;}
.toast{background:#3a252c!important;border-radius:18px!important;box-shadow:0 14px 34px rgba(45,22,30,.18)!important;}
.nav{
  background:rgba(255,255,255,.78)!important;
  border:1px solid rgba(235,210,204,.86)!important;
  border-radius:25px!important;
  box-shadow:0 14px 32px rgba(128,57,75,.08)!important;
  backdrop-filter:blur(10px);
}
.plus{background:linear-gradient(135deg,#b30d48,#e24a78)!important;}
@media(max-width:390px){
  .hello h1{font-size:28px!important;}
  .actions{grid-template-columns:1fr 1.45fr!important;gap:10px!important;}
  .btn{font-size:15px!important;padding:14px 11px!important;}
  .hero,.panel{border-radius:24px!important;}
  .stat{min-height:72px!important;font-size:12px!important;}
  .stat b{font-size:24px!important;}
}
</style>`;

function patchHtmlLightUI(html){
  let s = html;
  s = s.replace(/Versão 14\.1 • Base estável restaurada\./g, 'Versão 15.3 • Visual leve.');
  s = s.replace(/Meu Planner — Bruna V14\.1/g, 'Meu Planner — Bruna V15.3');
  if(s.includes('light-ui-153')) return s;
  return s.replace('</head>', LIGHT_UI_CSS + '\n</head>');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.mode !== 'navigate' && request.destination !== 'document') return;
  event.respondWith(
    fetch(request, {cache:'no-store'}).then(async response => {
      const type = response.headers.get('content-type') || '';
      if(!type.includes('text/html')) return response;
      const html = await response.text();
      return new Response(patchHtmlLightUI(html), {
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
