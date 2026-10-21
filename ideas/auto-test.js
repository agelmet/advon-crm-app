/* Advon · ψηφιακός βοηθός γραφείου (δωρεάν πιλότος) — the 100-call test page: menu, live scoreboard, CRM-style Leads (call mode), scripts, slide links.
   Calls are saved in this browser (localStorage «advon_auto_leads_v1»); the CRM on the same address carries them in its
   encrypted state and syncs them across devices whenever it is open (see «Auto-leads bridge» in the CRM). 20 Oct 2026 */
(function(){
'use strict';
var d=document, N=window.AUTO_NICHES||{}, L=(window.AUTO_LEADS||[]).slice(), KEY='advon_auto_leads_v1', UIKEY='advon_auto_ui_v1';
var NK=['asf','log','mes'], TARGET=33;
(function(){ var idx={}; L.forEach(function(l){ idx[l.n]=(idx[l.n]||0)+1; l._o=idx[l.n]*10+['asf','log','mes'].indexOf(l.n); }); L.sort(function(a,b){ return (a.round-b.round)||(a._o-b._o); }); })();
var byId={}; L.forEach(function(l){ byId[l.id]=l; });
function $(s,r){return (r||d).querySelector(s)} function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pad(n){return (n<10?'0':'')+n}
function iso(dt){dt=dt||new Date(); return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate())}
var TODAY=iso();
var DAYS=['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];
var DAYS_ACC=['την Κυριακή','τη Δευτέρα','την Τρίτη','την Τετάρτη','την Πέμπτη','την Παρασκευή','το Σάββατο'];
var MON=['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'];
function fmtDay(s){ if(!s) return ''; var t=new Date(s+'T12:00'); if(s===TODAY) return 'σήμερα'; var tm=new Date(); tm.setDate(tm.getDate()+1); if(s===iso(tm)) return 'αύριο'; return DAYS[t.getDay()].slice(0,3)+' '+t.getDate()+' '+MON[t.getMonth()]; }
function fmtPhone(p){ p=String(p||''); if(/^2\d{9}$/.test(p)){ return p.slice(0,2)==='21'? p.slice(0,3)+' '+p.slice(3,6)+' '+p.slice(6) : p.slice(0,4)+' '+p.slice(4,7)+' '+p.slice(7); } if(/^69\d{8}$/.test(p)) return p.slice(0,3)+' '+p.slice(3,6)+' '+p.slice(6); return p; }
function nextWorkdays(n){ var out=[], dt=new Date(); while(out.length<n){ dt.setDate(dt.getDate()+1); var w=dt.getDay(); if(w>0&&w<6) out.push(new Date(dt)); } return out; }
function dayPhrase(dt){ var tm=new Date(); tm.setDate(tm.getDate()+1); return iso(dt)===iso(tm)? 'αύριο' : DAYS_ACC[dt.getDay()]; }
var W2=nextWorkdays(2), DAY1=dayPhrase(W2[0])+' στις 11:00', DAY2=dayPhrase(W2[1])+' στις 17:00';
var toastT; function toast(m){ var t=$('#toast'); if(!t) return; t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('on')},2200); }
function copy(txt, btn, okLabel){ (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){ toast('Αντιγράφηκε ✓'); if(btn){ var o=btn.textContent; btn.textContent=okLabel||'Αντιγράφηκε ✓'; setTimeout(function(){btn.textContent=o},1600);} }).catch(function(){ toast('Επίλεξε το κείμενο και αντέγραψέ το'); }); }

/* ---------------- state ---------------- */
function blank(){ return {v:1, upd:0, leads:{}, log:[]}; }
var S=blank(), UI={n:'', round:'1', call:false, focus:null, q:'', open:{}};
function load(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||'null'); S=(o&&o.v===1)?o:blank(); }catch(e){ S=blank(); } S.leads=S.leads||{}; S.log=S.log||[];
  try{ var u=JSON.parse(localStorage.getItem(UIKEY)||'null'); if(u) UI=Object.assign(UI,u); }catch(e){} }
function save(){ S.upd=Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){ toast('Δεν αποθηκεύτηκε — ο browser μπλοκάρει την αποθήκευση'); } renderSync(); }
function saveUI(){ try{ localStorage.setItem(UIKEY, JSON.stringify(UI)); }catch(e){} }
function R(id){ var r=S.leads[id]; if(!r){ r=S.leads[id]={st:'new', tries:[]}; } r.tries=r.tries||[]; return r; }
function rec(id){ return S.leads[id]||{st:'new',tries:[]}; }
function touch(id){ R(id).upd=Date.now(); }
function logCall(id,o){ S.log.push({id:id,o:o,t:Date.now()}); }
function isOpen(r){ return r.st==='new'||r.st==='na'||r.st==='ab'; }
function cbDue(r){ return r.cb && r.cb.day && (r.cb.day<TODAY || (r.cb.day===TODAY && (!r.cb.time || r.cb.time<=nowHM()))); }
function nowHM(){ var t=new Date(); return pad(t.getHours())+':'+pad(t.getMinutes()); }
function triedToday(r){ return r.tries && r.tries[r.tries.length-1]===TODAY; }

/* ---------------- stats (for the scoreboard + banner) ---------------- */
function stats(){
  var s={}; NK.forEach(function(k){ s[k]={calls:0,pick:0,g:0,ab:0,y:0,r:0,n:0,left:0,leads:0}; });
  S.log.forEach(function(e){ if(e.u) return; var l=byId[e.id]; if(!l) return; var x=s[l.n]; x.calls++; if(e.o==='g'){x.g++;x.pick++} else if(e.o==='y'){x.y++;x.pick++} else if(e.o==='r'){x.r++;x.pick++} else if(e.o==='ab'){x.ab++;x.pick++} else if(e.o==='n'){x.n++} });
  L.forEach(function(l){ var r=rec(l.id); s[l.n].leads++; if(isOpen(r) && r.st!=='t') s[l.n].left++; });
  return s;
}
function counts(){
  var c={left:0,fresh:0,na:0,g:0,ab:0,y:0,r:0,today:0,cbDue:0,cb:0};
  filteredAll().forEach(function(l){ var r=rec(l.id); if(r.st==='new'){c.fresh++;c.left++} else if(r.st==='na'){c.na++;c.left++} else if(r.st==='ab'){c.ab++;c.left++} else if(r.st==='g') c.g++; else if(r.st==='y') c.y++; else if(r.st==='r') c.r++;
    if(r.cb && isOpen(r)){ c.cb++; if(cbDue(r)) c.cbDue++; } });
  var t0=new Date(); t0.setHours(0,0,0,0); S.log.forEach(function(e){ if(!e.u && e.t>=t0.getTime()) c.today++; });
  return c;
}

/* ---------------- menu / views ---------------- */
var VIEWS=['plan','leads','script','meeting','slides','idea'];
var OLD={why:1,lego:1,find:1,niches:1,build:1,data:1,price:1,run:1,use:1,first:1,fears:1,scripts:1,go:1};
function route(){
  var h=(location.hash||'').slice(1), v=VIEWS.indexOf(h)>=0? h : (OLD[h]? 'idea' : 'plan');
  $$('.view').forEach(function(x){ x.classList.toggle('on', x.dataset.view===v); });
  $$('.amenu a').forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+v); });
  d.body.dataset.view=v;
  if(OLD[h]){ var el=d.getElementById(h); if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth'}); },60); }
  else if(VIEWS.indexOf(h)>=0){ var m=$('.amenu'); if(m && scrollY>m.offsetTop) scrollTo({top:m.offsetTop-62+1}); }
  if(v==='leads') renderLeads(); if(v==='plan') renderScore();
  var act=$('.amenu a.on'), mw=$('.amenu .wrap'); if(act && mw) mw.scrollLeft=Math.max(0, act.offsetLeft-(mw.clientWidth-act.offsetWidth)/2);
}
addEventListener('hashchange', route);

/* ---------------- plan: live scoreboard ---------------- */
function renderScore(){
  var el=$('#score'); if(!el) return; var s=stats();
  var best=null; NK.forEach(function(k){ var x=s[k]; if(x.calls>=10){ var rt=x.g/x.calls; if(!best||rt>best.rt) best={k:k,rt:rt}; } });
  el.innerHTML=NK.map(function(k){ var x=s[k], n=N[k], pct=Math.min(100,Math.round(x.calls/TARGET*100)), rt=x.calls? Math.round(x.g/x.calls*100):0, pk=x.calls? Math.round(x.pick/x.calls*100):0;
    var verdict= x.calls<TARGET? (TARGET-x.calls)+' κλήσεις ακόμα' : (x.g>=3? 'Νικητής — συνέχισε εδώ' : x.g>=1? 'Ίσως — άλλαξε το άνοιγμα' : 'Κόψ\' το');
    var win= best && best.k===k && x.g>0;
    return '<div class="scard '+k+(win?' win':'')+'">'+(win?'<span class="badge">Προηγείται</span>':'')+
      '<div class="t">'+esc(n.label)+'<span>'+x.calls+' / '+TARGET+' κλήσεις</span></div><div class="bar"><i style="width:'+pct+'%"></i></div>'+
      '<div class="nums"><div class="g"><b>'+x.g+'</b><span>ραντεβού</span></div><div><b>'+x.ab+'</b><span>σχεδόν</span></div><div><b>'+x.y+'</b><span>θέλουν info</span></div><div><b>'+x.r+'</b><span>όχι</span></div></div>'+
      '<div class="rate">Σήκωσαν <b>'+pk+'%</b> · ραντεβού ανά κλήση <b>'+rt+'%</b> · '+esc(verdict)+'</div></div>'; }).join('');
  var tot=0,g=0; NK.forEach(function(k){tot+=s[k].calls; g+=s[k].g;}); var t=$('#scoreTot'); if(t) t.textContent=tot+' / 99 κλήσεις · '+g+' ραντεβού';
}

/* ---------------- leads: queue + filters ---------------- */
function filtered(){ var q=(UI.q||'').trim().toLowerCase();
  return L.filter(function(l){ if(UI.n && l.n!==UI.n) return false; if(UI.round==='1' && l.round!==1 && !S.leads[l.id]) return false; if(q && (l.name+' '+l.city+' '+l.phone).toLowerCase().indexOf(q)<0) return false; return true; }); }
function queue(){
  var f=filtered().filter(function(l){ return isOpen(rec(l.id)); });
  function pri(l){ var r=rec(l.id); if(r.cb && cbDue(r)) return 0; if(r.st==='ab' && !r.cb) return 1; if(r.cb) return 9; if(r.st==='new') return 2+(l.round===1?0:3); if(r.st==='na') return triedToday(r)? 8 : 4+Math.min(2,r.tries.length*0.5); return 7; }
  return f.sort(function(a,b){ var d1=pri(a)-pri(b); if(d1) return d1; var ra=rec(a.id), rb=rec(b.id); if(ra.cb&&rb.cb) return (ra.cb.day+(ra.cb.time||'')).localeCompare(rb.cb.day+(rb.cb.time||'')); return L.indexOf(a)-L.indexOf(b); });
}
function scriptFor(l){ var n=N[l.n]; return n.script.replace(/\{reviews\}/g, l.reviews>=8? l.reviews : 'πολύ καλές').replace(/\{day1\}/g, DAY1).replace(/\{day2\}/g, DAY2); }
function mapsUrl(l){ return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(l.name+' '+l.city)+'&query_place_id='+encodeURIComponent(l.pid||''); }
function googleUrl(l){ return 'https://www.google.com/search?q='+encodeURIComponent(l.name+' '+l.city); }
function slidesUrl(l){ return 'automations-slides.html?n='+l.n+'&c='+encodeURIComponent(l.name.split(' — ')[0]); }

/* ---------------- outcomes ---------------- */
var panel={id:null, kind:null}, pick={day:'',time:'',where:'office'};
function outcome(l,o){
  var r=R(l.id);
  if(o==='g'){ panel={id:l.id,kind:'book'}; pick={day:(r.book&&r.book.day)||'',time:(r.book&&r.book.time)||'',where:(r.book&&r.book.where)||'office'}; renderLeads(); return; }
  if(o==='ab'){ panel={id:l.id,kind:'cb',ab:true}; pick={day:(r.cb&&r.cb.day)||'',time:(r.cb&&r.cb.time)||''}; renderLeads(); return; }
  if(o==='y'){ r.st='y'; r.at=Date.now(); logCall(l.id,'y'); touch(l.id); save(); panel={id:l.id,kind:'sms'}; toast(l.name+' → θέλει πληροφορίες'); renderLeads(); return; }
  if(o==='r'){ r.st='r'; r.at=Date.now(); delete r.cb; logCall(l.id,'r'); touch(l.id); save(); toast(l.name+' → Όχι'); advance(l); return; }
  if(o==='n'){ r.st= r.st==='ab'?'ab':'na'; if(!triedToday(r)) r.tries.push(TODAY); logCall(l.id,'n'); touch(l.id); save(); toast(l.name+' → δεν σήκωσε ('+r.tries.length+'η φορά)'); advance(l); return; }
  if(o==='x'){ r.st='x'; r.at=Date.now(); touch(l.id); save(); toast(l.name+' → σταματάμε'); advance(l); return; }
  if(o==='t'){ r.st='t'; r.at=Date.now(); touch(l.id); save(); toast(l.name+' → εκτός λίστας'); advance(l); return; }
}
function advance(l){ if(UI.call && UI.focus===l.id){ UI.focus=null; saveUI(); } panel={id:null,kind:null}; renderLeads(); }
function undo(l){ var r=R(l.id); for(var i=S.log.length-1;i>=0;i--){ var e=S.log[i]; if(e.id===l.id && !e.u && e.o!=='n'){ e.u=1; break; } } r.st= r.tries.length? 'na':'new'; delete r.book; delete r.at; touch(l.id); save(); toast(l.name+' → πίσω στη λίστα'); renderLeads(); }
function confirmBook(l){ var r=R(l.id); if(!pick.day||!pick.time){ toast('Διάλεξε μέρα και ώρα'); return; } r.st='g'; r.book={day:pick.day,time:pick.time,where:pick.where||'office'}; r.at=Date.now(); delete r.cb; delete r.hot; logCall(l.id,'g'); touch(l.id); save(); panel={id:l.id,kind:'after'}; toast('Ραντεβού: '+l.name+' · '+fmtDay(pick.day)+' '+pick.time); renderLeads(); }
function confirmCb(l){ var r=R(l.id); if(!pick.day){ toast('Διάλεξε μέρα'); return; } r.cb={day:pick.day,time:pick.time||''}; if(panel.ab){ if(r.st!=='ab') logCall(l.id,'ab'); r.st='ab'; } touch(l.id); save(); toast((panel.ab?'Σχεδόν κλεισμένο — ':'Call-back — ')+l.name+' · '+fmtDay(pick.day)+(pick.time?' '+pick.time:'')); panel={id:null,kind:null}; if(UI.call&&UI.focus===l.id){UI.focus=null;saveUI();} renderLeads(); }

/* ---------------- ready texts ---------------- */
function afterMsg(l){ var r=rec(l.id), b=r.book||{}, dt=b.day? new Date(b.day+'T12:00'):null; var who=(r.contact||'').trim(), meet=b.where==='meet';
  return 'Καλησπέρα σας'+(who?' '+who:'')+', ευχαριστώ πολύ για την κουβέντα!\n\nΌπως είπαμε, τα λέμε '+(dt? (b.day===TODAY?'σήμερα':DAYS_ACC[dt.getDay()]+' '+dt.getDate()+'/'+(dt.getMonth()+1)) : '')+(b.time?' στις '+b.time:'')+(meet?' στο Google Meet, για μισή ώρα — θα σας στείλω το link λίγο πριν.':' στο γραφείο σας ('+[l.street,l.city].filter(Boolean).join(', ')+'), για μισή ώρα.')+'\n\nΘα σας δείξω πώς θα δούλευε ο ψηφιακός βοηθός στο δικό σας γραφείο και πώς στήνουμε τον δωρεάν πιλότο. Αν θέλετε, έχετε πρόχειρο το τετράδιο ή το Excel σας, για να δούμε μαζί πώς θα φαίνονται τα δικά σας στοιχεία.\n\nΆγγελος Μετρίδης · 6934088046\nAdvon Media · advonmedia.com'; }
function calUrl(l){ var r=rec(l.id), b=r.book||{}; if(!b.day||!b.time) return '#'; var s=b.day.replace(/-/g,'')+'T'+b.time.replace(':','')+'00'; var e=new Date(b.day+'T'+b.time+':00'); e.setMinutes(e.getMinutes()+30); var en=iso(e).replace(/-/g,'')+'T'+pad(e.getHours())+pad(e.getMinutes())+'00';
  var det='Συνάντηση μισής ώρας — δωρεάν πιλότος ψηφιακού βοηθού ('+N[l.n].label+')'+(b.where==='meet'?' · Google Meet':' · στο γραφείο τους')+'\nΤηλ: '+fmtPhone(l.phone)+(r.contact?'\nΕπαφή: '+r.contact:'')+'\nSlides: https://crm.advonmedia.com/ideas/'+slidesUrl(l)+(r.memo?'\nΣημείωση: '+r.memo:'');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Πιλότος — '+l.name)+'&dates='+s+'/'+en+'&ctz=Europe/Athens'+(b.where==='meet'?'':'&location='+encodeURIComponent([l.street,l.city].filter(Boolean).join(', ')))+'&details='+encodeURIComponent(det); }

/* ---------------- render: banner ---------------- */
function renderBanner(){ var el=$('#lban'); if(!el) return; var c=counts(), f=queue().length;
  el.innerHTML='<div class="lnow"><span class="k">Να καλέσω</span><div class="big">'+c.left+'</div><div class="sub">'+c.fresh+' καινούργια · '+c.na+' ξανά'+(UI.n?' · '+esc(N[UI.n].short)+': '+f:'')+'</div></div>'+
   '<div class="ok"><span class="k">Ραντεβού</span><div class="big">'+c.g+'</div><div class="sub">συναντήσεις μισής ώρας</div></div>'+
   '<div class="ab"><span class="k">Σχεδόν</span><div class="big">'+c.ab+'</div><div class="sub">πάρε ξανά να κλείσεις ώρα</div></div>'+
   '<div><span class="k">Θέλουν info</span><div class="big">'+c.y+'</div><div class="sub">SMS στάλθηκε</div></div>'+
   '<div class="no"><span class="k">Όχι</span><div class="big">'+c.r+'</div><div class="sub">δεν ενδιαφέρονται</div></div>'+
   '<div><span class="k">Δεν σήκωσαν</span><div class="big">'+c.na+'</div><div class="sub">'+(c.cbDue?'<b style="color:#FFD36E">'+c.cbDue+' call-back τώρα</b>':(c.cb?c.cb+' call-back':'ξανά άλλη μέρα'))+'</div></div>'+
   '<div><span class="k">Σήμερα</span><div class="big">'+c.today+'</div><div class="sub">κλήσεις · '+filteredAll().length+' leads στη λίστα</div></div>'; }
function renderPills(){ var el=$('#lpills'); if(!el) return; var cnt={'':0}; NK.forEach(function(k){cnt[k]=0});
  filteredAll().forEach(function(l){ if(isOpen(rec(l.id))){ cnt[l.n]++; cnt['']++; } });
  el.innerHTML='<button data-n="" class="'+(UI.n?'':'on')+'">Όλα <span class="n">'+cnt['']+'</span></button>'+NK.map(function(k){ return '<button data-n="'+k+'" class="'+(UI.n===k?'on':'')+'"><span class="dot '+k+'"></span>'+esc(N[k].short)+' <span class="n">'+cnt[k]+'</span></button>'; }).join('');
  $$('button',el).forEach(function(b){ b.onclick=function(){ UI.n=b.dataset.n; UI.focus=null; panel={id:null}; saveUI(); renderLeads(); }; });
  var rb=$('#lround'); if(rb){ rb.textContent= UI.round==='1'? 'Γύρος 1 (33 ανά κλάδο)' : 'Όλα + εφεδρικά'; rb.classList.toggle('on', UI.round!=='1'); }
}
function filteredAll(){ return L.filter(function(l){ return !(UI.round==='1' && l.round!==1 && !S.leads[l.id]); }); }

/* ---------------- render: call mode ---------------- */
function focusLead(){ var q=queue(); var l=UI.focus? byId[UI.focus] : null; if(l && !isOpen(rec(l.id)) && !(panel.id===l.id)) l=null; if(l && UI.n && l.n!==UI.n) l=null; if(!l) l=q[0]; return {l:l,q:q}; }
function renderFocus(){
  var el=$('#lfocus'); if(!el) return; $('#lcall').classList.toggle('on',UI.call); $('#lcall').textContent= UI.call? 'Έξοδος από call mode' : '▶ Call mode';
  if(!UI.call){ el.style.display='none'; el.innerHTML=''; return; } el.style.display='';
  var o=focusLead(), l=o.l, q=o.q; if(!l){ el.innerHTML='<div class="small mute" style="padding:24px 4px">Δεν έμεινε κανείς να καλέσεις σε αυτό το φίλτρο. Άνοιξε «Όλα + εφεδρικά» ή πάρε μια ανάσα — τα κατάφερες.</div>'; return; }
  UI.focus=l.id; saveUI();
  var n=N[l.n], r=rec(l.id), idx=q.indexOf(l);
  el.style.setProperty('--nc',n.color); el.style.setProperty('--ns',n.soft); el.classList.toggle('hot', r.st==='ab');
  var tries=r.tries.length? '<span class="chip warn">δεν σήκωσε '+r.tries.map(fmtDay).join(', ')+'</span>':'';
  var cb=r.cb? '<span class="chip warn">⏰ call-back '+fmtDay(r.cb.day)+(r.cb.time?' '+r.cb.time:'')+'</span>':'';
  el.innerHTML='<div class="f-top"><div style="min-width:0;flex:1 1 380px">'+
    '<span class="f-niche"><span class="dot '+l.n+'"></span>'+esc(n.label)+(l.round!==1?' · εφεδρικό':'')+'</span>'+
    '<div class="f-name">'+esc(l.name)+'</div><div class="f-sub">'+esc([l.street,l.city].filter(Boolean).join(', '))+'</div>'+
    '<a class="f-phone" href="tel:+30'+esc(l.phone)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'+esc(fmtPhone(l.phone))+'</a>'+
    '<div class="f-meta">'+(l.tier==='A'?'<span class="chip" style="background:#E3F8EF;color:#0B7A55">Μεγάλο γραφείο · στόχος 2.900€</span>':'<span class="chip">Μικρότερο γραφείο · 1.500€</span>')+'<span class="chip">★ '+String(l.rating).replace('.',',')+' · '+l.reviews+' κριτικές</span><a class="chip" href="'+esc(mapsUrl(l))+'" target="_blank" rel="noopener">Maps ↗</a><a class="chip" href="'+esc(googleUrl(l))+'" target="_blank" rel="noopener">Google ↗</a><a class="chip" href="'+esc(slidesUrl(l))+'" target="_blank" rel="noopener">Slides με το όνομά τους ↗</a>'+tries+cb+'</div>'+
    '<div class="f-why">'+esc(l.why)+'</div>'+(r.memo?'<div class="f-memo">✎ '+esc(r.memo)+'</div>':'')+
    '</div><div class="f-right">επόμενοι στη σειρά<b>'+Math.max(0,q.length-(idx<0?0:idx)-1)+'</b>'+fmtDay(TODAY)+'</div></div>'+
    '<div class="f-script">'+scriptFor(l)+'</div>'+
    '<div class="f-q"><div class="qbox"><div class="ql">Πού τα κρατάνε σήμερα;</div><div class="opt" data-k="uses">'+['Τετράδιο','Excel','Πρόγραμμα','Μνήμη / τίποτα'].map(function(x){return '<button type="button" class="'+(r.uses===x?'on':'')+'">'+x+'</button>'}).join('')+'</div></div>'+
    '<div class="qbox"><div class="ql">Ποιος σήκωσε · όνομα επαφής</div><div class="opt" data-k="who">'+['Ιδιοκτήτης','Υπάλληλος'].map(function(x){return '<button type="button" class="'+(r.who===x?'on':'')+'">'+x+'</button>'}).join('')+'</div><input type="text" data-contact placeholder="π.χ. κ. Λαμπρόπουλε (για το μήνυμα)" value="'+esc(r.contact||'')+'" style="margin-top:6px"></div></div>'+
    '<div class="f-acts"><button class="g" data-o="g">✓ Συνάντηση<small>1 · πού + πότε</small></button><button class="ab" data-o="ab">🔥 Σχεδόν<small>5 · πάρε ξανά</small></button><button class="y" data-o="y">✉ Θέλει info<small>2 · στείλε SMS</small></button><button class="r" data-o="r">✕ Όχι<small>3 · δεν ενδιαφέρεται</small></button><button class="n" data-o="n">⌛ Δεν σήκωσε<small>4 · άλλη μέρα</small></button></div>'+
    '<div id="lfpanel"></div>'+
    '<div class="f-foot"><button data-a="skip">Παράλειψη <kbd>S</kbd></button><button data-a="cb">⏰ Πάρε με στις… <kbd>C</kbd></button><button data-a="memo">✎ Σημείωση <kbd>N</kbd></button><button data-a="obj">Αντιρρήσεις ↗</button>'+(r.tries.length>=3?'<button data-a="x">Σταματάμε (3 φορές)</button>':'')+'<button class="t" data-a="t">Λάθος αριθμός / εκτός</button></div>'+
    upNext(q,l,idx);
  wireFocus(el,l);
  var p=$('#lfpanel',el); if(panel.id===l.id && p) p.appendChild(panelEl(l));
}
function upNext(q,cur,idx){ var rest=(idx>=0? q.slice(idx+1) : q.filter(function(x){return x.id!==cur.id})).slice(0,5); if(!rest.length) return '';
  return '<div class="lnext"><div class="h">Έρχονται μετά · '+rest.length+'</div>'+rest.map(function(x,i){ var r=rec(x.id); return '<div class="r"><span class="no">'+(i+1)+'</span><span class="dot '+x.n+'"></span><button class="nm" data-jump="'+esc(x.id)+'"><b>'+esc(x.name)+'</b><small>'+esc(N[x.n].short+' · '+x.city)+(r.st==='na'?' · δεν σήκωσε πριν':'')+(r.cb?' · call-back':'')+'</small></button><a class="ph" href="tel:+30'+esc(x.phone)+'">'+esc(fmtPhone(x.phone))+'</a></div>'; }).join('')+'</div>'; }
function wireFocus(el,l){
  $$('[data-o]',el).forEach(function(b){ b.onclick=function(){ outcome(l,b.dataset.o); }; });
  $$('.opt',el).forEach(function(g){ $$('button',g).forEach(function(b){ b.onclick=function(){ var r=R(l.id), k=g.dataset.k; r[k]= r[k]===b.textContent? undefined : b.textContent; touch(l.id); save(); $$('button',g).forEach(function(x){x.classList.toggle('on', r[k]===x.textContent)}); }; }); });
  var ci=$('[data-contact]',el); if(ci) ci.onchange=function(){ var r=R(l.id); r.contact=ci.value.trim(); touch(l.id); save(); };
  $$('[data-a]',el).forEach(function(b){ b.onclick=function(){ var a=b.dataset.a; if(a==='skip') skip(l); else if(a==='cb'){ panel={id:l.id,kind:'cb'}; var r=rec(l.id); pick={day:(r.cb&&r.cb.day)||'',time:(r.cb&&r.cb.time)||''}; renderLeads(); } else if(a==='memo'){ panel={id:l.id,kind:'memo'}; renderLeads(); } else if(a==='obj'){ location.hash='script'; setTimeout(function(){ showNiche(l.n); var o=$('#objs'); if(o) o.scrollIntoView({behavior:'smooth'}); },80); } else outcome(l,a); }; });
  $$('[data-jump]',el).forEach(function(b){ b.onclick=function(){ UI.focus=b.dataset.jump; panel={id:null}; saveUI(); renderLeads(); var f=$('#lfocus'); if(f) f.scrollIntoView({behavior:'smooth',block:'start'}); }; });
}
var skipped={}; function skip(l){ skipped[l.id]=1; var q=queue().filter(function(x){return !skipped[x.id]}); if(!q.length){ skipped={}; q=queue(); } var nx=q.find(function(x){return x.id!==l.id}); UI.focus=nx?nx.id:null; panel={id:null}; saveUI(); renderLeads(); }

/* ---------------- inline panels ---------------- */
var TIMES=['10:00','11:00','12:00','13:00','16:00','17:00','18:00','19:00'];
function quickDays(){ var out=[{k:TODAY,t:'Σήμερα'}]; var tm=new Date(); tm.setDate(tm.getDate()+1); out.push({k:iso(tm),t:'Αύριο'}); nextWorkdays(6).forEach(function(dt){ var k=iso(dt); if(out.some(function(o){return o.k===k})) return; if(out.length<6) out.push({k:k,t:DAYS[dt.getDay()].slice(0,3)+' '+dt.getDate()}); }); return out; }
function panelEl(l){
  var box=d.createElement('div'); box.className='pnl'; var r=rec(l.id);
  if(panel.kind==='book'||panel.kind==='cb'){
    var isB=panel.kind==='book';
    box.innerHTML='<div class="lbl">'+(isB?'Συνάντηση μισής ώρας — πού και πότε;':(panel.ab?'Σχεδόν κλεισμένο — πότε να τον ξαναπάρεις;':'Πάρε με στις… — πότε;'))+'</div>'+
      '<div class="row" data-days>'+quickDays().map(function(o){return '<button type="button" data-day="'+o.k+'" class="'+(pick.day===o.k?'on':'')+'">'+o.t+'</button>'}).join('')+'<input type="date" data-di value="'+pick.day+'"></div>'+
      (isB?'<div class="row" data-where><button type="button" data-w="office" class="'+(pick.where!=='meet'?'on':'')+'">Στο γραφείο τους</button><button type="button" data-w="meet" class="'+(pick.where==='meet'?'on':'')+'">Google Meet</button></div>':'')+'<div class="row" data-times>'+TIMES.map(function(t){return '<button type="button" data-time="'+t+'" class="'+(pick.time===t?'on':'')+'">'+t+'</button>'}).join('')+'<input type="time" data-ti value="'+pick.time+'"></div>'+
      '<div class="row"><button type="button" class="go" data-ok>✓ '+(isB?'Κλείσαμε ραντεβού':'Αποθήκευση')+'</button><button type="button" data-cancel style="border:0;background:none;color:var(--mute)">Άκυρο</button></div>';
    $$('[data-day]',box).forEach(function(b){ b.onclick=function(){ pick.day=b.dataset.day; renderLeads(); }; });
    $$('[data-time]',box).forEach(function(b){ b.onclick=function(){ pick.time=b.dataset.time; renderLeads(); }; });
    $$('[data-w]',box).forEach(function(b){ b.onclick=function(){ pick.where=b.dataset.w; renderLeads(); }; });
    $('[data-di]',box).onchange=function(e){ pick.day=e.target.value; renderLeads(); };
    $('[data-ti]',box).onchange=function(e){ pick.time=e.target.value; renderLeads(); };
    $('[data-ok]',box).onclick=function(){ isB? confirmBook(l) : confirmCb(l); };
    $('[data-cancel]',box).onclick=function(){ panel={id:null}; renderLeads(); };
  } else if(panel.kind==='memo'){
    box.innerHTML='<div class="lbl">Σημείωση</div><textarea data-m placeholder="π.χ. έχει 900 συμβόλαια σε Excel · πάρε μετά τις 17:00 · μίλα με την κα Μαρία">'+esc(r.memo||'')+'</textarea><div class="row" style="margin-top:8px"><button type="button" class="go" data-ok>Αποθήκευση</button><button type="button" data-cancel style="border:0;background:none;color:var(--mute)">Άκυρο</button></div>';
    $('[data-ok]',box).onclick=function(){ var v=$('[data-m]',box).value.trim(), rr=R(l.id); if(v) rr.memo=v; else delete rr.memo; touch(l.id); save(); panel={id:null}; renderLeads(); };
    $('[data-cancel]',box).onclick=function(){ panel={id:null}; renderLeads(); };
    setTimeout(function(){ var t=$('[data-m]',box); if(t) t.focus(); },30);
  } else if(panel.kind==='after'){
    box.classList.add('after'); var msg=afterMsg(l);
    box.innerHTML='<div class="lbl">✓ Συνάντηση '+fmtDay(r.book.day)+' '+esc(r.book.time)+(r.book.where==='meet'?' · Google Meet':' · στο γραφείο τους')+' — 3 πράγματα τώρα (20 δευτερόλεπτα)</div>'+
      '<div class="acts" style="margin-bottom:10px"><a class="pri" href="'+esc(calUrl(l))+'" target="_blank" rel="noopener">1 · Βάλ\' το στο Google Calendar ↗</a><a href="'+esc(slidesUrl(l))+'" target="_blank" rel="noopener">2 · Slides με το όνομά τους ↗</a></div>'+
      '<div class="lbl" style="margin-top:4px">3 · Μήνυμα επιβεβαίωσης (Viber / SMS)</div><div class="msg">'+esc(msg)+'</div>'+
      '<div class="acts"><button class="pri" data-cp>Αντιγραφή</button><a href="sms:+30'+esc(l.phone)+'?&body='+encodeURIComponent(msg)+'">Άνοιγμα SMS</a><a href="viber://chat?number=%2B30'+esc(l.phone)+'">Άνοιγμα Viber</a><button data-next>Επόμενος →</button></div>';
    $('[data-cp]',box).onclick=function(e){ copy(msg,e.target); };
    $('[data-next]',box).onclick=function(){ advance(l); };
  } else if(panel.kind==='sms'){
    var t=N[l.n].sms;
    box.innerHTML='<div class="lbl">✉ Το μήνυμα με τις πληροφορίες — στείλ\' το τώρα</div><div class="msg">'+esc(t)+'</div><div class="acts"><button class="pri" data-cp>Αντιγραφή</button><a href="sms:+30'+esc(l.phone)+'?&body='+encodeURIComponent(t)+'">Άνοιγμα SMS</a><a href="viber://chat?number=%2B30'+esc(l.phone)+'">Άνοιγμα Viber</a><button data-cb>⏰ Πάρε τον ξανά σε 2 μέρες</button><button data-next>Επόμενος →</button></div>';
    $('[data-cp]',box).onclick=function(e){ copy(t,e.target); };
    $('[data-cb]',box).onclick=function(){ var rr=R(l.id); var w=nextWorkdays(2)[1]; rr.cb={day:iso(w),time:'11:00'}; touch(l.id); save(); toast('Call-back '+fmtDay(rr.cb.day)+' 11:00'); advance(l); };
    $('[data-next]',box).onclick=function(){ advance(l); };
  }
  return box;
}

/* ---------------- render: list groups ---------------- */
var shown={};
function itemEl(l){
  var r=rec(l.id), n=N[l.n], open=isOpen(r), row=d.createElement('div'); row.className='litem'+(r.st==='ab'?' hot':'')+(open?'':' done');
  var meta=['<span>'+esc(n.short)+' · '+esc(l.city)+'</span>','<a class="ph" href="tel:+30'+esc(l.phone)+'">'+esc(fmtPhone(l.phone))+'</a>','<span>★ '+l.reviews+'</span>','<a href="'+esc(mapsUrl(l))+'" target="_blank" rel="noopener">Maps</a>'];
  if(r.st==='na'||(r.tries&&r.tries.length&&open)) meta.push('<span>⌛ '+r.tries.map(fmtDay).join(', ')+'</span>');
  if(r.cb&&open) meta.push('<span class="w-out ab">⏰ '+fmtDay(r.cb.day)+(r.cb.time?' '+r.cb.time:'')+'</span>');
  if(r.uses) meta.push('<span>📒 '+esc(r.uses)+'</span>');
  if(!open){ var t={g:'Ραντεβού',y:'Θέλει info',r:'Όχι',x:'Σταματήσαμε',t:'Εκτός λίστας'}[r.st]||r.st; meta.push('<span class="w-out '+r.st+'">'+t+(r.st==='g'&&r.book?' · '+fmtDay(r.book.day)+' '+esc(r.book.time):'')+'</span>'); }
  row.innerHTML='<div class="w-main"><div class="w-name"><span class="dot '+l.n+'"></span>'+esc(l.name)+'</div><div class="w-meta">'+meta.join('')+'</div>'+(r.memo?'<div class="w-memo">✎ '+esc(r.memo)+'</div>':'')+'</div>';
  var a=d.createElement('div'); a.className='lacts';
  if(open){ a.innerHTML='<button class="a-f" title="Άνοιξέ το στο call mode">▶</button><button class="a-g">✓ Ραντεβού</button><button class="a-y">✉ Info</button><button class="a-r">✕ Όχι</button><button class="a-n">⌛ Δεν σήκωσε</button>';
    $('.a-f',a).onclick=function(){ UI.call=true; UI.focus=l.id; panel={id:null}; saveUI(); renderLeads(); scrollTo({top:$('#lfocus').getBoundingClientRect().top+scrollY-130,behavior:'smooth'}); };
    $('.a-g',a).onclick=function(){ UI.call=true; UI.focus=l.id; saveUI(); outcome(l,'g'); };
    $('.a-y',a).onclick=function(){ UI.call=true; UI.focus=l.id; saveUI(); outcome(l,'y'); };
    $('.a-r',a).onclick=function(){ outcome(l,'r'); }; $('.a-n',a).onclick=function(){ outcome(l,'n'); };
  } else { a.innerHTML=(r.st==='g'?'<button class="a-f" data-msg>Μήνυμα</button>':'')+'<button class="a-u">↶ Αναίρεση</button>'; $('.a-u',a).onclick=function(){ undo(l); }; var m=$('[data-msg]',a); if(m) m.onclick=function(){ UI.call=true; UI.focus=l.id; panel={id:l.id,kind:'after'}; saveUI(); renderLeads(); scrollTo({top:$('#lfocus').getBoundingClientRect().top+scrollY-130,behavior:'smooth'}); }; }
  row.appendChild(a); return row;
}
function group(key,title,sub,items,shut){
  var g=d.createElement('div'); g.className='lgrp'+((UI.open[key]===false||(UI.open[key]===undefined&&shut))?' shut':'');
  g.innerHTML='<div class="lgrp-h">'+title+' <span class="n">'+items.length+'</span>'+(sub?' <span class="s">· '+sub+'</span>':'')+'<span class="ar">▾</span></div><div class="lgrp-b"></div>';
  $('.lgrp-h',g).onclick=function(){ UI.open[key]= g.classList.contains('shut'); saveUI(); g.classList.toggle('shut'); };
  var b=$('.lgrp-b',g), lim=shown[key]||25; items.slice(0,lim).forEach(function(l){ b.appendChild(itemEl(l)); });
  if(items.length>lim){ var m=d.createElement('button'); m.className='lmore'; m.textContent='Δείξε άλλους '+Math.min(25,items.length-lim)+' · απομένουν '+(items.length-lim); m.onclick=function(){ shown[key]=lim+25; renderLeads(); }; b.appendChild(m); }
  return g;
}
function renderList(){
  var el=$('#llist'); if(!el) return; el.innerHTML=''; var f=filtered();
  var cb=[],ab=[],fresh=[],na=[],done=[],out=[];
  f.forEach(function(l){ var r=rec(l.id); if(r.st==='t'||r.st==='x') out.push(l); else if(!isOpen(r)) done.push(l); else if(r.st==='ab') ab.push(l); else if(r.cb) cb.push(l); else if(r.st==='na') na.push(l); else fresh.push(l); });
  cb.sort(function(a,b){ var x=rec(a.id).cb, y=rec(b.id).cb; return (x.day+(x.time||'')).localeCompare(y.day+(y.time||'')); });
  done.sort(function(a,b){ return (rec(b.id).at||0)-(rec(a.id).at||0); });
  if(ab.length) el.appendChild(group('ab','🔥 Σχεδόν κλεισμένα','πάρε ξανά να κλείσεις ώρα',ab));
  if(cb.length) el.appendChild(group('cb','⏰ Call-backs','με τη σειρά της ώρας',cb));
  el.appendChild(group('fresh','📞 Να καλέσω', UI.round==='1'?'γύρος 1 · με τη σειρά που προτείνω':'μαζί με τα εφεδρικά',fresh));
  if(na.length) el.appendChild(group('na','⌛ Δεν σήκωσαν','ξανά άλλη μέρα, άλλη ώρα',na));
  if(done.length) el.appendChild(group('done','✓ Έγιναν','ραντεβού · info · όχι',done,true));
  if(out.length) el.appendChild(group('out','🗑 Εκτός λίστας','λάθος αριθμός / σταματήσαμε',out,true));
}
function renderSync(){ var el=$('#lsync'); if(!el) return; var t=S.upd? new Date(S.upd):null, c=null; try{ c=parseInt(localStorage.getItem('advon_auto_leads_crm_at')||'0',10)||null; }catch(e){}
  el.innerHTML='<span>💾 Αποθηκεύεται μόνο του'+(t?' · <b>'+pad(t.getHours())+':'+pad(t.getMinutes())+'</b>':'')+'</span><span>🔄 '+(c? 'Συγχρονίστηκε με το CRM <b>'+fmtDay(iso(new Date(c)))+' '+pad(new Date(c).getHours())+':'+pad(new Date(c).getMinutes())+'</b>' : 'Άνοιξε το CRM μία φορά σε αυτόν τον browser για να πάνε οι κλήσεις και στις άλλες συσκευές σου')+'</span>'; }
function renderLeads(){ if(!$('#llist')) return; renderBanner(); renderPills(); renderFocus(); renderList(); renderSync(); var b=$('#mLeadsN'); if(b) b.textContent=counts().left; }

/* keyboard (call mode, like the CRM: 1–5, S, C, N) */
d.addEventListener('keydown',function(e){
  if(d.body.dataset.view!=='leads' || !UI.call) return; var tg=e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA'||e.metaKey||e.ctrlKey||e.altKey) return;
  var l=byId[UI.focus]; if(!l) return; var k=e.key.toLowerCase();
  if(panel.id===l.id && (panel.kind==='book'||panel.kind==='cb') && k==='enter'){ e.preventDefault(); panel.kind==='book'?confirmBook(l):confirmCb(l); return; }
  var map={'1':'g','2':'y','3':'r','4':'n','5':'ab'}; if(map[k]){ e.preventDefault(); outcome(l,map[k]); return; }
  if(k==='s'){ e.preventDefault(); skip(l); } else if(k==='c'){ e.preventDefault(); panel={id:l.id,kind:'cb'}; pick={day:'',time:''}; renderLeads(); } else if(k==='n'){ e.preventDefault(); panel={id:l.id,kind:'memo'}; renderLeads(); } else if(k==='escape'){ panel={id:null}; renderLeads(); }
});
/* another tab (or the CRM) changed the calls → reload */
addEventListener('storage',function(e){ if(e.key===KEY||e.key==='advon_auto_leads_crm_at'){ load(); if(d.body.dataset.view==='leads') renderLeads(); else renderScore(); } });

/* export */
function csv(){ var rows=[['Κλάδος','Όνομα','Πόλη','Τηλέφωνο','Κριτικές','Αποτέλεσμα','Ραντεβού','Call-back','Δεν σήκωσε','Πού τα κρατάνε','Ποιος σήκωσε','Επαφή','Σημείωση']];
  L.forEach(function(l){ var r=rec(l.id); rows.push([N[l.n].short,l.name,l.city,fmtPhone(l.phone),l.reviews,{new:'Να καλέσω',na:'Δεν σήκωσε',ab:'Σχεδόν',g:'Ραντεβού',y:'Θέλει info',r:'Όχι',x:'Σταματήσαμε',t:'Εκτός'}[r.st]||r.st, r.book?r.book.day+' '+r.book.time:'', r.cb?r.cb.day+' '+(r.cb.time||''):'', (r.tries||[]).join(' '), r.uses||'', r.who||'', r.contact||'', r.memo||'']); });
  var s='﻿'+rows.map(function(r){return r.map(function(c){ c=String(c==null?'':c); return /[",;\n]/.test(c)? '"'+c.replace(/"/g,'""')+'"' : c; }).join(';')}).join('\n');
  var a=d.createElement('a'); a.href=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'})); a.download='tetradio-test-'+TODAY+'.csv'; d.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },500); }
function summary(){ var s=stats(), out=['Τεστ 100 κλήσεων — ψηφιακός βοηθός (δωρεάν πιλότος) · '+fmtDay(TODAY)]; NK.forEach(function(k){ var x=s[k]; out.push(N[k].label+': '+x.calls+' κλήσεις · σήκωσαν '+x.pick+' · ραντεβού '+x.g+' · σχεδόν '+x.ab+' · info '+x.y+' · όχι '+x.r); });
  var uses={}; L.forEach(function(l){ var r=rec(l.id); if(r.uses){ var k=N[l.n].short+' → '+r.uses; uses[k]=(uses[k]||0)+1; } }); var u=Object.keys(uses); if(u.length){ out.push(''); out.push('Πού τα κρατάνε σήμερα:'); u.sort().forEach(function(k){ out.push('· '+k+': '+uses[k]); }); }
  return out.join('\n'); }

/* ---------------- script view ---------------- */
function showNiche(k){ var n=N[k]; if(!n) return; var v=$('[data-view=script]'); if(!v) return; v.style.setProperty('--nc',n.color);
  $$('#ntabs button').forEach(function(b){ b.classList.toggle('on', b.dataset.n===k); });
  var demo={reviews:'Χ', day1:DAY1, day2:DAY2};
  var sc=n.script.replace(/\{reviews\}/g,'{κριτικές}').replace(/\{day1\}/g,demo.day1).replace(/\{day2\}/g,demo.day2);
  $('#sMain').innerHTML='<div class="lbl">Το τηλεφώνημα · ~40 δευτερόλεπτα · '+esc(n.label)+'</div>'+sc;
  $('#sGate').innerHTML='<div class="lbl">Αν σηκώσει υπάλληλος / γραμματεία</div>'+esc(n.gate.replace('{owner}','ΕΠΩΝΥΜΟ'));
  $('#sSms').innerHTML='<div class="lbl">«Θέλει info» ή δεν σήκωσε 2 φορές · SMS / Viber</div>'+esc(n.sms);
  $('#objs').innerHTML=n.obj.map(function(o){ return '<div class="fear"><div class="q">'+esc(o[0])+'</div><div class="a">'+esc(o[1].replace(/\{day2\}/g,DAY2))+'</div></div>'; }).join('');
  $('#sQs').innerHTML=n.qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('');
  $$('.bigsay').forEach(addCopy);
  try{ localStorage.setItem('advon_auto_script_n',k); }catch(e){}
}
function addCopy(s){ var lbl=$('.lbl',s); if(!lbl || $('.cp',lbl)) return; var b=d.createElement('button'); b.className='cp'; b.type='button'; b.textContent='Αντιγραφή'; b.style.cssText='border:0;background:var(--ink);color:#fff;font:700 12px/1 inherit;font-family:inherit;padding:7px 11px;border-radius:999px;cursor:pointer;letter-spacing:0;text-transform:none';
  b.onclick=function(){ var t=s.cloneNode(true); var l=$('.lbl',t); if(l) l.remove(); copy(t.textContent.trim(), b); }; lbl.appendChild(b); }

/* ---------------- meeting: questions per niche ---------------- */
function renderMeetQs(){ var el=$('#mQs'); if(!el) return; el.innerHTML=NK.map(function(k){ var n=N[k]; return '<div class="card" style="border-top:4px solid '+n.color+'"><h3 style="color:'+n.color+'">'+esc(n.label)+'</h3><ol class="small" style="margin:0">'+n.qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ol></div>'; }).join(''); }

/* ---------------- slides: personalised links ---------------- */
function wireDecks(){ $$('.deck').forEach(function(dk){ var k=dk.dataset.n, inp=$('input',dk), a=$('a.pri',dk), p=$('a.pdf',dk);
  function upd(){ var c=inp.value.trim(); var u='automations-slides.html?n='+k+(c?'&c='+encodeURIComponent(c):''); a.href=u; if(p) p.href=u+'&print=1'; }
  inp.addEventListener('input',upd); upd(); }); }

/* ---------------- boot ---------------- */
load();
d.addEventListener('DOMContentLoaded',function(){});
var lc=$('#lcall'); if(lc) lc.onclick=function(){ UI.call=!UI.call; if(UI.call) UI.focus=null; panel={id:null}; saveUI(); renderLeads(); };
var lr=$('#lround'); if(lr) lr.onclick=function(){ UI.round= UI.round==='1'? 'all':'1'; saveUI(); renderLeads(); };
var ls=$('#lsearch'); if(ls){ ls.value=UI.q||''; ls.addEventListener('input',function(){ UI.q=ls.value; saveUI(); renderList(); renderBanner(); }); }
var ex=$('#lcsv'); if(ex) ex.onclick=csv;
var sm=$('#lsum'); if(sm) sm.onclick=function(e){ copy(summary(), e.target); };
var sm2=$('#scoreCopy'); if(sm2) sm2.onclick=function(e){ copy(summary(), e.target); };
$$('#ntabs button').forEach(function(b){ b.onclick=function(){ showNiche(b.dataset.n); }; });
var sn='asf'; try{ sn=localStorage.getItem('advon_auto_script_n')||'asf'; }catch(e){} showNiche(sn);
renderMeetQs(); wireDecks();
var b=$('#mLeadsN'); if(b) b.textContent=counts().left;
route(); renderScore();
})();
