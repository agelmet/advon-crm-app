/* Advon · Ideas — small, dependency-free */
(function(){
  var d=document, RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
  d.documentElement.classList.add('js');
  var els=[].slice.call(d.querySelectorAll('.rv,.draw,.note,.watch'));
  function show(e){e.classList.add('in')}
  if(RM||!('IntersectionObserver' in window)){els.forEach(show)}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.06});
    els.forEach(function(e){io.observe(e)});
    setTimeout(function(){els.forEach(function(e){var r=e.getBoundingClientRect();if(r.top<innerHeight*1.1)show(e)})},1600);
  }
  /* top bar edge + reading progress + toc highlight — one rAF scroll handler */
  var top=d.querySelector('.top'), prog=d.querySelector('.prog'), links=[].slice.call(d.querySelectorAll('.toc a')), secs=links.map(function(a){return d.getElementById(a.getAttribute('href').slice(1))}), tick=false;
  function onScroll(){
    tick=false; var y=scrollY;
    if(top) top.classList.toggle('sc',y>8);
    for(var j=0;j<els.length;j++){ var e=els[j]; if(!e.classList.contains('in') && e.getBoundingClientRect().top<innerHeight*.96) e.classList.add('in') }
    if(prog){var h=d.documentElement.scrollHeight-innerHeight; prog.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')'}
    if(secs.length){var cur=0; for(var i=0;i<secs.length;i++){ if(secs[i] && secs[i].getBoundingClientRect().top<140) cur=i } links.forEach(function(a,i){a.classList.toggle('on',i===cur)})}
  }
  addEventListener('scroll',function(){ if(!tick){tick=true; requestAnimationFrame(onScroll)} },{passive:true}); onScroll();
  /* gentle 3D tilt on the big cards (mouse only) */
  if(!RM && matchMedia('(hover:hover) and (pointer:fine)').matches){
    [].forEach.call(d.querySelectorAll('.ncard'),function(c){
      var b=null;
      c.addEventListener('pointerenter',function(){b=c.getBoundingClientRect()});
      c.addEventListener('pointermove',function(e){ if(!b) return; var x=(e.clientX-b.left)/b.width-.5, y=(e.clientY-b.top)/b.height-.5; c.style.setProperty('--ry',(x*5).toFixed(2)+'deg'); c.style.setProperty('--rx',(-y*5).toFixed(2)+'deg') });
      c.addEventListener('pointerleave',function(){ c.style.setProperty('--ry','0deg'); c.style.setProperty('--rx','0deg'); b=null });
    });
  }
  /* copy buttons on every script */
  [].forEach.call(d.querySelectorAll('.say'),function(s){
    var lbl=s.querySelector('.lbl'); if(!lbl) return;
    var b=d.createElement('button'); b.className='cp'; b.type='button'; b.textContent='Copy';
    b.addEventListener('click',function(){
      var t=s.cloneNode(true); var l=t.querySelector('.lbl'); if(l) l.remove();
      var txt=t.textContent.replace(/^\s+|\s+$/g,'');
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){b.textContent='Copied ✓';b.classList.add('ok');setTimeout(function(){b.textContent='Copy';b.classList.remove('ok')},1800)}).catch(function(){b.textContent='Select & copy'});
    });
    lbl.appendChild(b);
  });
})();
