const $=id=>document.getElementById(id);
const base='./assets/whole-torso-v3/';
const manifest=await fetch(base+'manifest.json').then(r=>{if(!r.ok)throw Error('Manifest missing');return r.json()});
const defaults=structuredClone(manifest.views), views=manifest.views, images={};
const storageKey='stormwatch-rat-whole-torso-v3-fuller-front-rear-inner';
try { const saved=JSON.parse(localStorage.getItem(storageKey)||'null'); for(const [name,v] of Object.entries(views)){const old=saved?.[name];if(!old)continue;for(const k of ['scale','x','y'])if(Number.isFinite(old.up?.[k])&&(k!=='scale'||old.up[k]>0))v.up[k]=old.up[k];if(Number.isFinite(old.legScale)&&old.legScale>0)v.legScale=old.legScale;v.legs.forEach((l,i)=>{for(const k of ['x','y','rotation'])if(Number.isFinite(old.legs?.[i]?.[k]))l[k]=old.legs[i][k];});}}catch{}
let direction='side', switching=false, started=0;
async function load(file){const im=new Image();im.src=base+file;await im.decode();return im;}
try{
 for(const [view,v] of Object.entries(views)){
  images[view]={down:await load(view+'-down.webp'),up:await load(view+'-up.webp'),legs:await Promise.all(v.legs.map(l=>load(l.file)))};
  const b=document.createElement('button');b.textContent={side:'Side',front:'Front',rear:'Rear'}[view];b.dataset.view=view;b.onclick=()=>{direction=view;setup()};$('views').append(b);
 }
 $('status').textContent='All three reviewed views loaded. Guard is implemented in the game.';
}catch(error){$('status').textContent='Could not load artwork: '+error.message;throw error;}
function settings(){ try{localStorage.setItem(storageKey,JSON.stringify(views));}catch{} $('output').value=JSON.stringify({format:'rat-whole-torso-v3',units:'original torso pixels; rotation in degrees',views},null,2); }
function field(label,obj,key,step=1){const el=document.createElement('label');el.textContent=label;const input=document.createElement('input');input.type='number';input.step=step;input.value=obj[key];input.oninput=()=>{const n=Number(input.value);if(Number.isFinite(n)&&(!(key==='scale'||key==='legScale')||n>0)){obj[key]=n;settings();}};el.append(input);$('adjust').append(el);}
function setup(){const v=views[direction];for(const b of $('views').children)b.setAttribute('aria-pressed',String(b.dataset.view===direction));$('legs').replaceChildren();$('legTitle').textContent=direction==='side'?'Outer and inner leg surfaces':'Anatomical left and right legs';v.legs.forEach((l,i)=>{const d=document.createElement('div');d.className='leg';const im=images[direction].legs[i].cloneNode();im.alt=l.label;const label=document.createElement('small');label.textContent=l.label;d.append(im,label);$('legs').append(d)});$('adjust').replaceChildren();field('Pair scale',v,'legScale',.005);v.legs.forEach((l,i)=>{field(`Leg ${i+1} hip X`,l,'x');field(`Leg ${i+1} hip Y`,l,'y');field(`Leg ${i+1} rotation`,l,'rotation')});field('Up frame scale',v.up,'scale',.001);field('Up frame X',v.up,'x');field('Up frame Y',v.up,'y');settings();}
function draw(canvas,state,time){const ctx=canvas.getContext('2d'),v=views[direction],im=images[direction];ctx.clearRect(0,0,520,520);const scale=$('small').checked?.15:.53;const center=direction==='rear'?300:direction==='front'?430:420;ctx.save();ctx.translate(260,500-(810*scale));ctx.scale(scale,scale);ctx.translate(-center,0);
 const order=direction==='side'?[1,0]:[0,1];for(const i of order){const l=v.legs[i];ctx.save();ctx.translate(l.x,l.y);const swing=$('walk').checked?Math.sin(time*.004+i*Math.PI)*.09:0;ctx.rotate(l.rotation*Math.PI/180+swing);ctx.scale(v.legScale,v.legScale);ctx.drawImage(im.legs[i],-l.pivot[0],-l.pivot[1]);ctx.restore();}
 if(!$('hide').checked){if(state==='up'){ctx.save();ctx.translate(v.up.x,v.up.y);ctx.scale(v.up.scale,v.up.scale);ctx.drawImage(im.up,0,0);ctx.restore();}else ctx.drawImage(im.down,0,0);}
 ctx.restore();}
function frame(t){const state=switching&&Math.floor((t-started)/1400)%2===1?'down':'up';draw($('down'),'down',t);draw($('up'),state,t);$('upLabel').textContent=switching?`Switch preview · shield ${state}`:'Shield up · new torso';requestAnimationFrame(frame);}
$('switch').onclick=()=>{switching=!switching;started=performance.now();$('switch').setAttribute('aria-pressed',String(switching));$('switch').textContent=switching?'Pause shield switch':'Play shield switch';};
$('reset').onclick=()=>{views[direction]=structuredClone(defaults[direction]);setup()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('output').value);$('status').textContent='Copied assembly settings for all views.';}catch{$('output').select();$('status').textContent='Select and copy the settings text.';}};
setup();requestAnimationFrame(frame);
