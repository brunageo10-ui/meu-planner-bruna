importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 11.3 — tarefas atrasadas.
// Mantém topo com respiro, botão Feito na agenda, tarefas acima das rotinas, alertas por horário e seções recolhíveis.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const PLANNER_PATCH_CSS = `
/* Ajuste 11.3: tarefas atrasadas + Feito na agenda */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;position:relative;touch-action:pan-y}
body{overscroll-behavior-x:none}
main{width:100%;max-width:780px;margin:0 auto;padding-top:28px!important;padding-bottom:24px!important;padding-left:calc(22px + env(safe-area-inset-left))!important;padding-right:calc(18px + env(safe-area-inset-right))!important;overflow:hidden}
.topbar{max-width:100%;align-items:flex-start!important;margin:8px 0 12px!important;min-height:52px!important}
.hello h1{font-size:25px!important;line-height:1.04!important;letter-spacing:-.55px!important;margin:0!important;white-space:nowrap!important}.hello p{font-size:13px!important;line-height:1.25!important;margin-top:5px!important}
.topActions{padding-top:2px!important;flex:none!important}.roundBtn{width:38px!important;height:38px!important}.hero{margin-top:4px!important}.heroTitle{line-height:1.2!important}
.topbar,.hero,.todayPanel,.grid,.sectionHead,.filter,.item,.toolsBox,.historyBox,.routineBox{max-width:100%}
.todayMini{position:relative;display:flex!important;align-items:center!important;gap:9px!important}.todayMiniMain{flex:1;min-width:0}.todayMiniActions{display:flex;align-items:center;gap:6px;flex:none;flex-wrap:wrap;justify-content:flex-end}
.todayDoneBtn{border:0;background:var(--rose);color:var(--wine);border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;white-space:nowrap;box-shadow:0 4px 10px rgba(138,18,56,.08)}.todayDoneBtn:active{transform:scale(.96)}.todayMini.routine .todayDoneBtn{display:none}
.todayLateTag,.overdueTag{display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:#ffe3e0;color:#a01838;font-weight:900;line-height:1;white-space:nowrap}.todayLateTag{padding:6px 9px;font-size:11.5px}.overdueTag{padding:7px 10px;font-size:13px;margin-left:4px}.overdueItem{border-color:#efc7c2!important;box-shadow:0 10px 24px rgba(160,24,56,.08)!important}
.filter{gap:7px!important;padding:2px 2px 6px!important;scroll-padding-left:2px}.chip{font-size:14px!important;padding:8px 13px!important;border-radius:999px!important;min-height:38px!important;box-shadow:0 4px 12px rgba(82,44,37,.04)}.chip.active{box-shadow:0 8px 16px rgba(138,18,56,.16)!important}
.sectionHead{margin-top:20px!important}.sectionTitle{min-width:0}.sectionTitle h2{white-space:nowrap}.miniBtn{padding:8px 11px!important;font-size:12.5px!important}
.historyBox,.routineBox{margin:24px 0 10px;border-top:1px solid var(--line);padding-top:14px}.routineBox{margin-top:20px}
.historyBox summary,.routineBox summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,253,251,.94);border:1px solid var(--line);border-radius:18px;padding:14px 15px;box-shadow:var(--shadow2);color:var(--wine);font-weight:900;font-size:18px;cursor:pointer}
.historyBox summary::-webkit-details-marker,.routineBox summary::-webkit-details-marker{display:none}.historyBox summary b,.routineBox summary b{display:block;font-size:18px;line-height:1.05}.historyBox summary small,.routineBox summary small{display:block;font-size:12px;color:var(--muted);font-weight:700;margin-top:3px}.historyBox[open] summary small,.routineBox[open] summary small{color:var(--wine)}
.historyCount,.routineCountMini{background:var(--rose);color:var(--wine);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;white-space:nowrap}.historyBox #doneList,.routineBox #routineList{margin-top:10px}.routineBox .empty,.historyBox .empty{margin-top:10px}
@media(max-width:390px){main{padding-top:30px!important;padding-left:20px!important;padding-right:16px!important}.hello h1{font-size:24px!important}.todayMini{gap:7px!important}.todayMiniTime{min-width:44px!important}.todayDoneBtn,.todayLateTag{font-size:11px!important;padding:6px 8px!important}.chip{font-size:13.5px!important;padding:7px 11px!important}.sectionTitle h2{font-size:21px!important}.miniBtn{font-size:12px!important;padding:7px 10px!important}.historyBox summary,.routineBox summary{padding:13px 14px}.historyBox summary b,.routineBox summary b{font-size:17px}}
@supports(padding:max(0px)){main{padding-top:max(28px,calc(env(safe-area-inset-top) + 10px))!important;padding-left:max(22px,calc(env(safe-area-inset-left) + 22px))!important;padding-right:max(18px,calc(env(safe-area-inset-right) + 18px))!important}}
`;

const PLANNER_PATCH_JS = `
<script>
(function(){
  function fixX(){ if(window.scrollX) window.scrollTo(0, window.scrollY); }
  function enhanceFilter(){ var f=document.getElementById('filters'); if(f&&!f.dataset.compactHint){f.dataset.compactHint='1';f.setAttribute('aria-label','Pastas — arraste para o lado para ver todas');} }
  function dkTime(time){ var d=new Date(),p=String(time||'08:00').split(':').map(Number); d.setHours(p[0]||0,p[1]||0,0,0); if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1); return (typeof dateKey==='function')?dateKey(d):d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function fixExistingTimeOnlyTasks(){ try{ var changed=false; if(typeof tasks==='undefined'||!Array.isArray(tasks))return; tasks.forEach(function(t){ if(t&&t.time&&!t.date&&!t.recurrence&&!t.done){t.date=dkTime(t.time);changed=true;} }); if(changed){localStorage.setItem('brunaTasks',JSON.stringify(tasks)); if(typeof render==='function')render(); if(typeof schedulePendingReminders==='function')schedulePendingReminders(false);} }catch(e){console.log('time-only patch',e);} }
  function routineCount(){try{return tasks.filter(function(t){return isRoutine(t)&&isActive(t)}).length}catch(e){return document.querySelectorAll('#routineList .routineItem').length}}
  function historyDoneCount(){try{return tasks.filter(function(t){return !isRoutine(t)&&t.done}).length}catch(e){return document.querySelectorAll('#doneList .historyItem').length}}
  function updateFoldCounts(){var r=document.getElementById('routineCountMini'),h=document.getElementById('historyCount'); if(r)r.textContent=String(routineCount()); if(h)h.textContent=String(historyDoneCount());}
  function setupRoutineAccordion(){var list=document.getElementById('routineList'); if(!list)return; if(list.closest&&list.closest('.routineBox')){updateFoldCounts();return;} var head=list.previousElementSibling; while(head&&head.nodeType!==1)head=head.previousElementSibling; if(!head||!head.classList||!head.classList.contains('sectionHead'))return; var box=document.createElement('details'); box.className='routineBox'; box.id='routineBox'; var sum=document.createElement('summary'); sum.innerHTML='<span><b>🔁 Minhas rotinas</b><small>Toque para abrir</small></span><span class="routineCountMini" id="routineCountMini">0</span>'; head.parentNode.insertBefore(box,head); head.remove(); box.appendChild(sum); box.appendChild(list); updateFoldCounts();}
  function setupSectionOrder(){var rb=document.getElementById('routineBox'),tl=document.getElementById('taskList'); if(!rb||!tl||!rb.parentNode)return; var th=tl.previousElementSibling; while(th&&th.nodeType!==1)th=th.previousElementSibling; if(!th||!th.classList||!th.classList.contains('sectionHead'))return; rb.parentNode.insertBefore(th,rb); rb.parentNode.insertBefore(tl,rb);}
  function setupHistoryAccordion(){var list=document.getElementById('doneList'); if(!list)return; if(list.closest&&list.closest('.historyBox')){updateFoldCounts();return;} var head=list.previousElementSibling; while(head&&head.nodeType!==1)head=head.previousElementSibling; if(!head||!head.classList||!head.classList.contains('sectionHead'))return; var box=document.createElement('details'); box.className='historyBox'; box.id='historyBox'; var sum=document.createElement('summary'); sum.innerHTML='<span><b>🕘 Histórico</b><small>Toque para abrir</small></span><span class="historyCount" id="historyCount">0</span>'; head.parentNode.insertBefore(box,head); head.remove(); box.appendChild(sum); box.appendChild(list); updateFoldCounts();}
  function setupAccordions(){setupRoutineAccordion();setupSectionOrder();setupHistoryAccordion();updateFoldCounts();}
  function eventTime(t){try{return eventDueAt(t)}catch(e){ if(t&&t.date&&t.time)return new Date(t.date+'T'+t.time); return null; }}
  function isLate(t){ if(!t||t.done||isRoutine(t)||!isActive(t))return false; var ev=eventTime(t); return !!(ev&&ev.getTime()<Date.now()); }
  function todayItems(){var today=dateKey(new Date()),out=[]; tasks.forEach(function(t){ if(!isActive(t))return; if(isRoutine(t)){ if(routineOccursToday(t)){var rt=t.time||'08:00'; out.push({id:t.id,text:t.text,time:rt,cat:t.cat,routine:true,late:false,stamp:todayAt(rt).getTime()});} return; } var ev=eventTime(t); var late=isLate(t); if(t.date===today||(ev&&dateKey(ev)===today)||late){var tm=t.time||(ev?pad(ev.getHours())+':'+pad(ev.getMinutes()):'Hoje'); out.push({id:t.id,text:t.text,time:tm,cat:t.cat,routine:false,late:late,stamp:ev?ev.getTime():todayAt('23:59').getTime()});} }); return out.sort(function(a,b){return (b.late?1:0)-(a.late?1:0)||a.stamp-b.stamp}).slice(0,6);}
  window.completeAgendaItem=function(id){try{if(typeof toggle==='function')toggle(id);}catch(e){console.log('complete agenda',e)}};
  function applyTodayAgenda(){ try{ if(typeof tasks==='undefined'||typeof renderTodayAgenda!=='function')return; if(window.__todayDonePatchApplied)return; window.__todayDonePatchApplied=true; renderTodayAgenda=function(){var list=document.getElementById('todayAgendaList'),label=document.getElementById('todayDateLabel'); if(!list)return; if(label)label.textContent=agendaDateLabel(); var items=todayItems(); if(!items.length){list.innerHTML='<div class="todayEmpty">Nada marcado para hoje. Ótimo respiro 🌿</div>'; return;} list.innerHTML=items.map(function(x){var late=x.late?'<span class="todayLateTag">⚠️ Atrasada</span>':''; var btn=x.routine?'':'<button class="todayDoneBtn" onclick="completeAgendaItem('+x.id+')">✓ Feito</button>'; return '<div class="todayMini '+(x.routine?'routine':'task')+(x.late?' overdueItem':'')+'"><span class="todayMiniTime">'+esc(x.time)+'</span><div class="todayMiniMain"><div class="todayMiniText">'+esc(x.text)+'</div><div class="todayMiniCat">'+(x.routine?'Rotina • ':'')+esc(catLabel(x.cat))+'</div></div><div class="todayMiniActions">'+late+btn+'</div></div>';}).join('');}; if(typeof render==='function')render(); }catch(e){console.log('today agenda patch',e);} }
  function decorateOverdueCards(){try{ if(typeof tasks==='undefined')return; document.querySelectorAll('.item').forEach(function(card){var edit=card.querySelector('[onclick^="editItem("]'); if(!edit)return; var m=String(edit.getAttribute('onclick')||'').match(/editItem\((\d+)\)/); if(!m)return; var id=Number(m[1]),t=tasks.find(function(x){return Number(x.id)===id}); var old=card.querySelector('.overdueTag'); if(old)old.remove(); card.classList.remove('overdueItem'); if(isLate(t)){card.classList.add('overdueItem'); var meta=card.querySelector('.meta'); if(meta){var tag=document.createElement('span'); tag.className='overdueTag'; tag.textContent='⚠️ Atrasada'; meta.appendChild(tag);}} }); }catch(e){console.log('overdue decorate',e);} }
  function wrapRender(){ if(window.__foldPatchWrapped){setupAccordions();decorateOverdueCards();return;} window.__foldPatchWrapped=true; var old=null; try{old=window.render||(typeof render==='function'?render:null);}catch(e){} if(typeof old==='function'){window.render=function(){var r=old.apply(this,arguments);setupAccordions();setTimeout(decorateOverdueCards,0);return r;}; try{render=window.render;}catch(e){}} setupAccordions();decorateOverdueCards();}
  window.addEventListener('load',function(){setTimeout(fixExistingTimeOnlyTasks,120);setTimeout(applyTodayAgenda,160);setTimeout(wrapRender,200);setTimeout(applyTodayAgenda,700);setTimeout(wrapRender,750);setInterval(function(){try{renderTodayAgenda();decorateOverdueCards();}catch(e){}},30000);setTimeout(fixX,80);setTimeout(fixX,400);setTimeout(enhanceFilter,500);});
  window.addEventListener('resize',fixX); document.addEventListener('touchend',fixX,{passive:true});
})();
<\/script>`;

function patchPlannerHtml(text){
  let s=text;
  s=s.replace(/Meu Planner — Bruna V\d+\.\d+/g,'Meu Planner — Bruna V11.3');
  s=s.replace(/Versão \d+\.\d+ • [^<]+/g,'Versão 11.3 • Tarefas atrasadas.');
  s=s.replace(/version:'\d+\.\d+'/g,"version:'11.3'");
  s=s.replace("function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!(t.date&&t.time))}","function shouldSchedule(t){return !t.paused&&!t.done&&(hasReminderIntent(t.text)||!!t.recurrence||!!t.time||!!(t.date&&t.time))}");
  if(!s.includes('function dateKeyForTimeOnly(time)')){s=s.replace('function makeItem(text,old){',"function dateKeyForTimeOnly(time){let d=new Date(),p=(time||'08:00').split(':').map(Number);d.setHours(p[0]||0,p[1]||0,0,0);if(d.getTime()<=Date.now()+5000)d.setDate(d.getDate()+1);return dateKey(d)}\nfunction makeItem(text,old){");}
  s=s.replace("date:recurrence?'':parseDate(text),time,","date:recurrence?'':(parseDate(text)||(time?dateKeyForTimeOnly(time):'')),time,");
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+20000/g,'sendAt.getTime()<Date.now()+5000');
  s=s.replace(/sendAt\.getTime\(\)<Date\.now\(\)\+15000/g,'sendAt.getTime()<Date.now()+5000');
  if(!s.includes('Ajuste 11.3: tarefas atrasadas + Feito na agenda')){s=s.replace('\n</style>','\n'+PLANNER_PATCH_CSS+'\n</style>');}
  if(!s.includes('function decorateOverdueCards()')){s=s.replace('\n</body>',PLANNER_PATCH_JS+'\n</body>');}
  return s;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.mode!=='navigate'&&request.destination!=='document')return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html'))return response;
    return response.text().then(html=>new Response(patchPlannerHtml(html),{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}}));
  }).catch(()=>fetch(request)));
});
