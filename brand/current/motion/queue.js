/* Hero illustration, not a feed renderer. All geometry and masks share one clock. */
const HOLD=3000,ADVANCE=750,STEP=HOLD+ADVANCE,COUNT=9,LOOP=STEP*COUNT;
const names=['Grouped entity media','Prose','Image','KeyValue','FileAttachment','Excerpt','MediaObject','ItemList','Component'];
const $=s=>document.querySelector(s),mod=n=>(n%COUNT+COUNT)%COUNT;
const svg=$('#queue'),art=$('.art'),rm=matchMedia('(prefers-reduced-motion: reduce)');
let theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light',elapsed=0,paused=false,last=performance.now();
const rect=(x,y,w,h,fill,r=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
function content(id){const i=mod(id),white='#FFFFFF',orange='#B65326',gold=theme==='dark'?'#FBBF24':'#D9A008',teal='#438D98';let body='';
 switch(i){
 case 0:body=rect(167,160,61,61,gold,8)+rect(247,160,61,61,orange,8)+rect(327,160,61,61,teal,8);break;
 case 1:body=rect(167,156,202,12,white)+rect(167,181,165,12,white)+rect(167,206,108,12,orange);break;
 case 2:body=rect(167,151,145,70,orange,8)+`<circle cx="277" cy="182" r="21" fill="${gold}"/>`+rect(326,159,62,10,white)+rect(326,181,45,10,white);break;
 case 3:body=rect(167,158,68,14,white)+rect(264,158,119,14,orange)+rect(167,197,50,14,white)+rect(264,197,93,14,white);break;
 case 4:body=`<path d="M174 150H214L235 171V222H174Z" fill="${orange}"/><path d="M214 150V171H235" fill="none" stroke="${gold}" stroke-width="7"/>`+rect(254,161,125,14,white)+rect(254,195,74,10,white);break;
 case 5:body=`<path d="M173 166Q173 151 188 151V159Q181 159 181 166H188V180H173ZM195 166Q195 151 210 151V159Q203 159 203 166H210V180H195Z" fill="${orange}"/>`+rect(225,155,160,12,white)+rect(225,179,130,12,white)+rect(267,209,88,9,gold);break;
 case 6:body=rect(167,153,72,72,orange,8)+rect(257,157,128,16,white)+rect(257,187,113,10,white)+rect(257,208,81,10,white);break;
 case 7:body=[0,1,2].map((n)=>`<circle cx="174" cy="${160+n*27}" r="7" fill="${n===1?orange:gold}"/>`+rect(194,154+n*27,170-n*25,12,white)).join('');break;
 case 8:body=rect(167,155,99,65,orange,8)+rect(284,155,104,65,teal,8)+rect(184,172,64,11,white)+rect(301,172,70,11,white)+rect(184,195,38,9,gold)+rect(301,195,44,9,gold);break;
 }
 const widths=[221,192,208,178,214,187,204,193,218];
 return `<g data-content="${i}"><g transform="translate(94 98) skewY(-12)"><circle r="37" fill="${white}"/></g>${rect(167,76,widths[i],38,white,19)}${body}</g>`;
}
const palette=['#17434B','#438D98','#8EB8BD'];
const positions=[[0,174],[116,82],[240,0]];
const ease=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
function colour(a,b,t){return '#'+[1,3,5].map(n=>Math.round(lerp(parseInt(a.slice(n,n+2),16),parseInt(b.slice(n,n+2),16),t)).toString(16).padStart(2,'0')).join('')}
function layout(ms){const cycle=Math.floor(ms/STEP),local=ms-cycle*STEP,p=local<HOLD?0:ease((local-HOLD)/ADVANCE),cards=[];
 for(let depth=2;depth>=0;depth--){const from=positions[depth],to=depth===2?[268,-22]:positions[depth+1];cards.push({id:cycle-depth,depth,x:lerp(from[0],to[0],p),y:lerp(from[1],to[1],p),alpha:depth===2?1-p:1,fill:colour(palette[depth],palette[Math.min(2,depth+1)],p)});}
 if(p>0)cards.push({id:cycle+1,depth:-1,x:lerp(-36,0,p),y:lerp(250,174,p),alpha:Math.min(1,p*5),fill:palette[0]});
 return {cycle,local,p,cards};
}
function draw(){const state=layout(elapsed),cards=state.cards;let defs='',draws='';
 cards.forEach((c,i)=>{const transform=`translate(${c.x} ${c.y}) skewY(12)`,mask='occlusion-'+i;
 defs+=`<mask id="${mask}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="850" height="850"><rect x="-50" y="-50" width="850" height="850" fill="white"/>`+cards.slice(i+1).map(h=>`<rect width="460" height="280" rx="50" transform="translate(${h.x} ${h.y}) skewY(12)" fill="black" stroke="black" stroke-width="32" opacity="${h.alpha}"/>`).join('')+'</mask>';
 draws+=`<g mask="url(#${mask})" data-activity-id="${mod(c.id)}" data-sequence-id="${c.id}" data-depth="${c.depth}" opacity="${c.alpha}"><g transform="${transform}">${rect(0,0,460,280,c.fill,50)}${content(c.id)}</g></g>`;
 });
 svg.innerHTML=`<g transform="translate(50 125)"><defs>${defs}</defs>${draws}</g>`;
 svg.dataset.front=String(mod(state.cycle));svg.dataset.time=elapsed.toFixed(3);svg.dataset.phase=state.p?'advance':'hold';
 const inspect=$('#inspection');if(inspect)inspect.textContent=`Front ${mod(state.cycle)+1}: ${names[mod(state.cycle)]} → middle ${names[mod(state.cycle-1)]} → rear ${names[mod(state.cycle-2)]}${state.p?' · arriving: '+names[mod(state.cycle+1)]:''}`;
}
function ui(){art.classList.toggle('reduced',rm.matches);$('#pause').textContent=paused?'Resume':'Pause';$('#pause').setAttribute('aria-pressed',String(paused));for(const id of ['pause','replay','previous','next'])$('#'+id).disabled=rm.matches;$('#status').textContent=rm.matches?'Complete still · reduced motion':paused?'Paused · resume continues this frame':'New activities · 3-second hold, 0.75-second advance';}
function applyTheme(){document.documentElement.classList.toggle('dark',theme==='dark');$('#theme').value=theme;$('#fallback').src=`marks/mark-${theme}.svg`;document.querySelectorAll('[data-word]').forEach(e=>e.src=`lockups/word-baseline-${theme}.svg`);if($('#hero-link'))$('#hero-link').href='hero.html?theme='+theme;history.replaceState(null,'','?theme='+theme);draw();ui();}
$('#theme').addEventListener('change',e=>{theme=e.target.value;applyTheme()});
$('#pause').addEventListener('click',()=>{paused=!paused;last=performance.now();ui()});
$('#replay').addEventListener('click',()=>{elapsed=0;paused=false;last=performance.now();draw();ui()});
function step(delta){elapsed=((Math.floor(elapsed/STEP)+delta)%COUNT+COUNT)%COUNT*STEP;paused=true;draw();ui()}
$('#previous').addEventListener('click',()=>step(-1));$('#next').addEventListener('click',()=>step(1));rm.addEventListener('change',()=>{last=performance.now();ui()});
function tick(now){if(!paused&&!rm.matches&&!document.hidden){elapsed=(elapsed+Math.min(now-last,100))%LOOP;draw()}last=now;requestAnimationFrame(tick)}
// Deterministic inspection API; same renderer/clock as playback, no alternate test geometry.
window.queueReview={seek(ms){elapsed=((ms%LOOP)+LOOP)%LOOP;paused=true;draw();ui()},snapshot(){return {elapsed,paused,reduced:rm.matches,...layout(elapsed)}},content,idCount:COUNT,hold:HOLD,advance:ADVANCE,loop:LOOP};
applyTheme();requestAnimationFrame(tick);
