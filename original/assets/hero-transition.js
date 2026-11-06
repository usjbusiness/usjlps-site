(()=>{
 const root=document.documentElement, wrap=document.querySelector('.hero-journey'), hero=wrap?.querySelector('.hero');
 if(!hero || !window.IntersectionObserver) return;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 if(media.matches || root.classList.contains('motion-off')) return;
 root.classList.add('journey-on');
 const image=hero.querySelector('.hero-campus-bg'), inner=hero.querySelector('.inner');
 let pending=false;
 const clamp=(x)=>Math.min(1,Math.max(0,x));
 const update=()=>{
   pending=false;
   const distance=wrap.offsetHeight-hero.offsetHeight;
   const t=distance>0?clamp(-wrap.getBoundingClientRect().top/distance):0;
   const ease=t*t*(3-2*t);
   image.style.transform=`scale(${1+ease*.65})`;
   hero.style.setProperty('--journey-ui',String(1-clamp((t-.08)/.55)));
   hero.style.setProperty('--journey-lift',`${-46*ease}px`);
   hero.style.setProperty('--journey-text-scale',String(1+.10*ease));
   hero.style.setProperty('--journey-shade',String(1-.53*Math.sin(Math.PI*t)));
   hero.style.setProperty('--journey-end',String(.22*clamp((t-.70)/.30)));
   inner.inert=t>.7;
 };
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(update)}};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 media.addEventListener('change',()=>location.reload());
 schedule();
})();
