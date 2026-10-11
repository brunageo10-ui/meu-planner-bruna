importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.0 — corrige leitura do texto no botão original.
// Agora o service worker altera a função original antes da tela abrir, em vez de criar botão por cima.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const EXTRA_CSS = `
/* V15.0: remove apenas o botão ✓ Feito da Agenda de hoje */
#todayList .doneBtn{display:none!important;visibility:hidden!important;pointer-events:none!important}
#todayList .miniMain{padding-right:0!important}
#add,#voice{touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:auto!important}
`;

const ADD_TASK_REPLACEMENT = `let addBusy=false;
function rememberDraft(v){
  v=String(v||'').replace(/\\u200b/g,'').trim();
  if(v&&v.indexOf('Ex.: amanhã cedo')!==0){
    try{window.__brunaLastInputText=v}catch(e){}
    try{sessionStorage.setItem('brunaDraftText',v)}catch(e){}
  }
  return v;
}
function readDraft(){
  let vals=[];
  try{vals.push(E.input&&E.input.value)}catch(e){}
  try{vals.push(E.input&&E.input.textContent)}catch(e){}
  try{vals.push(window.__brunaLastInputText)}catch(e){}
  try{vals.push(sessionStorage.getItem('brunaDraftText'))}catch(e){}
  for(let v of vals){
    v=String(v||'').replace(/\\u200b/g,'').trim();
    if(v&&v.indexOf('Ex.: amanhã cedo')!==0)return v;
  }
  return '';
}
async function addTask(ev){
  if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation()}
  if(addBusy)return false;
  addBusy=true;
  setTimeout(()=>addBusy=false,1200);
  await new Promise(r=>setTimeout(r,90));
  let text=readDraft();
  if(!text)return toast('Escreva ou fale alguma coisa primeiro.');
  let t=makeItem(text);
  tasks.unshift(t);
  if(E.input)E.input.value='';
  try{window.__brunaLastInputText=''}catch(e){}
  try{sessionStorage.removeItem('brunaDraftText')}catch(e){}
  saveTasks();
  toast('✅ Tarefa organizada em '+label(t.cat)+(t.time?' • '+t.time:''));
  await scheduleRemote(t);
  return false;
}
function toggle(id)`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V15.0');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 15.0 • Organizar corrigido.');
  s=s.replace(/const VERSION='\d+\.\d+'/g,"const VERSION='15.0'");

  if(!s.includes('V15.0: remove apenas o botão')){
    s=s.replace('\n</style>','\n'+EXTRA_CSS+'\n</style>');
  }

  // Substitui a função original de criar tarefa dentro do script principal.
  s=s.replace(/let addBusy=false;function addTask\(ev\)\{[\s\S]*?\}function toggle\(id\)/, ADD_TASK_REPLACEMENT);

  // Evita que o touchend do iPhone leia o campo antes de o texto ser confirmado.
  s=s.replace("E.add.addEventListener('click',addTask);E.add.addEventListener('touchend',addTask,{passive:false});", "E.add.addEventListener('click',addTask);");

  // Guarda o texto vindo do microfone direto para o botão Organizar conseguir usar.
  s=s.replace(
    "r.onresult=e=>{E.input.value=e.results[0][0].transcript;showMic('Texto recebido','Revise e toque em Organizar automaticamente.',false)};",
    "r.onresult=e=>{let txt=e.results[0][0].transcript;E.input.value=txt;rememberDraft(txt);showMic('Texto recebido','Revise e toque em Organizar automaticamente.',false)};"
  );

  // Guarda também o que for digitado manualmente.
  s=s.replace(
    "E.input.addEventListener('input',()=>{if(E.input.value.trim())showMic('Texto recebido','Revise e toque em Organizar automaticamente.',false)});",
    "E.input.addEventListener('input',()=>{rememberDraft(E.input.value);if(E.input.value.trim())showMic('Texto recebido','Revise e toque em Organizar automaticamente.',false)});"
  );

  return s;
}

self.addEventListener('fetch', event=>{
  const request=event.request;
  if(request.mode!=='navigate'&&request.destination!=='document')return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(async response=>{
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html'))return response;
    const html=await response.text();
    return new Response(patchPlannerHtml(html),{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }).catch(()=>fetch(request)));
});
