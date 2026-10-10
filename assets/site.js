(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
// network constellation
(()=>{const cv=$('#net');if(!cv)return;const hero=cv.parentElement,ctx=cv.getContext('2d');let W,H,dpr,nodes=[],mouse={x:-9999,y:-9999},vis=true,raf;
const R=150;
function init(){dpr=Math.min(2,devicePixelRatio||1);W=hero.clientWidth;H=hero.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
const n=Math.min(120,Math.max(36,Math.round(W*H/12500)));nodes=[];for(let i=0;i<n;i++){const star=Math.random()<.12;nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:star?1.9:Math.random()*1.1+.5,star,ph:Math.random()*6.28})}}
function draw(t){ctx.clearRect(0,0,W,H);
for(const p of nodes){p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
const dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.hypot(dx,dy);if(d<200){p.x+=dx*.0016;p.y+=dy*.0016}}
for(let i=0;i<nodes.length;i++){const a=nodes[i];for(let j=i+1;j<nodes.length;j++){const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<R){ctx.strokeStyle=`rgba(201,165,76,${(1-d/R)*.45})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
const dm=Math.hypot(a.x-mouse.x,a.y-mouse.y);if(dm<200){ctx.strokeStyle=`rgba(233,212,154,${(1-dm/200)*.55})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke()}}
for(const p of nodes){const tw=p.star?.65+.35*Math.sin(t/900+p.ph):.7;ctx.fillStyle=`rgba(233,212,154,${tw})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();
if(p.star){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,14);g.addColorStop(0,`rgba(201,165,76,${.35*tw})`);g.addColorStop(1,'rgba(201,165,76,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,14,0,6.283);ctx.fill()}}
if(!reduce&&vis)raf=requestAnimationFrame(draw)}
init();draw(0);
addEventListener('resize',()=>{init();if(reduce)draw(0)});
hero.addEventListener('mousemove',e=>{const r=hero.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
hero.addEventListener('mouseleave',()=>{mouse.x=mouse.y=-9999});
new IntersectionObserver(([e])=>{vis=e.isIntersecting;cancelAnimationFrame(raf);if(vis&&!reduce)raf=requestAnimationFrame(draw)}).observe(hero);
})();
// preloader
const start=()=>{document.body.classList.add('done');document.body.classList.remove('loading');setTimeout(()=>{const p=$('#pre');p&&p.remove()},1600)};
const ready=Promise.all([document.fonts?document.fonts.ready:0,new Promise(r=>setTimeout(r,reduce?0:1700))]);
ready.then(start);setTimeout(start,4000);
// header + progress
const hdr=$('#hdr'),prog=$('#prog');
const onScroll=()=>{const y=scrollY;hdr.classList.toggle('solid',y>40);const h=document.documentElement.scrollHeight-innerHeight;prog.style.transform=`scaleX(${h>0?y/h:0})`;words();hscroll();para(y)};
// menu
$('.burger').addEventListener('click',()=>document.body.classList.toggle('menu-open'));
$$('#menu a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
$$('.rv,.mask,.rule,.sechead,#rrow,.card,#phones').forEach(el=>io.observe(el));
// counters
const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;co.unobserve(e.target);const el=e.target,to=+el.dataset.count,pad=+el.dataset.pad||0,from=to>1000?1900:0,t0=performance.now(),d=2200;
const tick=t=>{const k=Math.min(1,(t-t0)/d),v=Math.round(from+(to-from)*(1-Math.pow(1-k,4)));el.textContent=String(v).padStart(pad,'0');if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}),{threshold:.6});
$$('[data-count]').forEach(el=>co.observe(el));
// words
const wp=$('#words');if(wp){const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType==3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(/^\s+$/.test(t)||!t)f.append(t);else{const s=document.createElement('span');s.className='w';s.textContent=t;f.append(s)}});c.replaceWith(f)}else walk(c)})};walk(wp)}
const ws=wp?$$('.w',wp):[];
function words(){if(!wp)return;const r=wp.getBoundingClientRect(),vh=innerHeight;const k=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));const n=Math.round(k*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))}
// horizontal programs
const sec=$('#programs'),track=$('#track'),pc=$('#pc'),cards=$$('.card',track);
const wide=()=>innerWidth>900;
function sizeH(){if(!wide()){sec.style.height='';track.style.transform='';return}const dist=track.scrollWidth-innerWidth;sec.style.height=(innerHeight+dist)+'px'}
function hscroll(){if(!wide())return;const r=sec.getBoundingClientRect();const dist=track.scrollWidth-innerWidth;const k=Math.min(1,Math.max(0,-r.top/(sec.offsetHeight-innerHeight||1)));track.style.transform=`translate3d(${-k*dist}px,0,0)`;const i=Math.min(cards.length,1+Math.floor(k*cards.length*.999));pc.textContent=String(i).padStart(2,'0')}
// hero parallax
const wings=$('.wings'),glow=$('.hero .glow');
function para(y){if(reduce||y>innerHeight)return;wings.style.translate=`0 ${y*.18}px`}
// cursor
const c1=$('.cur'),c2=$('.cur2');let mx=-100,my=-100,x2=-100,y2=-100;
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;c1.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;if(glow&&e.clientY<innerHeight)glow.style.transform=`translate(calc(-50% + ${(mx-innerWidth/2)*.06}px),calc(-50% + ${(my-innerHeight/2)*.06}px))`});
(function loop(){x2+=(mx-x2)*.14;y2+=(my-y2)*.14;c2.style.transform=`translate(${x2}px,${y2}px) translate(-50%,-50%)`;requestAnimationFrame(loop)})();
$$('a,button,.card,.rank,.ev,.pc').forEach(el=>{el.addEventListener('mouseenter',()=>c2.classList.add('hov'));el.addEventListener('mouseleave',()=>c2.classList.remove('hov'))});
// magnetic buttons
$$('.btn').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.3}px)`});b.addEventListener('mouseleave',()=>b.style.transform='')});
// pillar glow
$$('.pillar').forEach(p=>p.addEventListener('mousemove',e=>{const r=p.getBoundingClientRect();p.style.setProperty('--mx',(e.clientX-r.left)+'px');p.style.setProperty('--my',(e.clientY-r.top)+'px')}));
// poster tilt
const po=$('#poster');if(po){po.addEventListener('mousemove',e=>{const r=po.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;po.style.setProperty('--ry',(x*10)+'deg');po.style.setProperty('--rx',(-y*10)+'deg')});po.addEventListener('mouseleave',()=>{po.style.setProperty('--ry','0deg');po.style.setProperty('--rx','0deg')})}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{sizeH();onScroll()});
sizeH();onScroll();document.fonts&&document.fonts.ready.then(()=>{sizeH();onScroll()});
})();
