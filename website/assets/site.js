(()=>{'use strict';
const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu=$('#mobile-menu'),toggle=$('.menu-button');
function closeMenu(){if(!menu)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu')}
toggle?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
addEventListener('keydown',e=>{if(e.key==='Escape'&&menu&&!menu.hidden){closeMenu();toggle.focus()}});
matchMedia('(min-width:961px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
if(!reduce&&'IntersectionObserver' in window){document.documentElement.classList.add('js');const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>io.observe(e))}
const list=$('#public-events');if(!list)return;
const refresh=$('#calendar-refresh'),sync=$('#calendar-sync');
const URL='https://ftwjthakbeuitorrlkzf.supabase.co/rest/v1/rpc/site_events';
const KEY='sb_publishable_DzVu1_EyoFnWQYfcPw0R4A_ZdNYOjno';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(d,o)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',...o}).format(new Date(d));
let busy=false,lastSuccess=null,signature='';
function state(title,message){list.innerHTML=`<div class="calendar-state"><h3>${title}</h3><p>${message}</p></div>`}
function render(rows){if(!rows.length){state('The next chapter is being planned.','Confirmed events will appear here as soon as the E-Board publishes them. Check the member portal for the full calendar.');return}
list.innerHTML=rows.map(e=>{const changed=e.status==='cancelled'||e.status==='postponed';const status={confirmed:'Confirmed',upcoming:'Upcoming',cancelled:'Cancelled',postponed:'Postponed'}[e.status]||'Confirmed';
const meta=changed?'Previously announced date · '+fmt(e.starts_at,{month:'long',day:'numeric',year:'numeric'}):fmt(e.starts_at,{weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'})+(e.location?' · '+e.location:'');
const warning=e.status==='cancelled'?'This event will not take place.':e.status==='postponed'?'A new date will be announced once confirmed.':'';
return `<article class="public-event"><div class="event-date"><b>${fmt(e.starts_at,{day:'2-digit'})}</b><span>${fmt(e.starts_at,{month:'short'})}</span></div><div class="event-info"><h3>${esc(e.title)}</h3><p>${esc(meta)}</p>${warning?`<p class="event-warning">${warning}</p>`:''}</div><div class="event-labels"><span class="event-status ${esc(e.status)}">${esc(status)}</span>${e.headliner?'<small>Headliner · ×2 stickers</small>':''}</div></article>`}).join('')}
async function load(){if(busy||document.hidden)return;busy=true;refresh.disabled=true;list.setAttribute('aria-busy','true');
try{const response=await fetch(URL,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Calendar unavailable');const rows=await response.json();if(!Array.isArray(rows))throw new Error('Invalid response');
const safe=rows.filter(e=>e&&['confirmed','upcoming','cancelled','postponed'].includes(e.status)&&typeof e.title==='string'&&!Number.isNaN(Date.parse(e.starts_at)));
const next=JSON.stringify(safe);if(next!==signature||!lastSuccess){render(safe);signature=next}lastSuccess=Date.now();sync.textContent='Updated '+fmt(lastSuccess,{hour:'numeric',minute:'2-digit',timeZoneName:'short'})+' · refreshes every 30 seconds';
}catch(e){if(lastSuccess){sync.textContent='Connection interrupted · showing last update from '+fmt(lastSuccess,{hour:'numeric',minute:'2-digit',timeZoneName:'short'})+'. Please refresh.'}else{state('Calendar temporarily unavailable.','We could not load the published events. Try Refresh or open the member calendar below.');sync.textContent='Live calendar is not connected yet.'}}
finally{busy=false;refresh.disabled=false;list.setAttribute('aria-busy','false')}}
refresh.addEventListener('click',load);addEventListener('visibilitychange',()=>{if(!document.hidden)load()});addEventListener('online',load);load();setInterval(load,30000);
})();
