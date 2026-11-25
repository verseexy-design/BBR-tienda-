/* BBR - Fase 2. Los productos están escritos aquí a mano; en la Fase 3 vendrán de Supabase. */
const PRODUCTS=[{id:'desodorante-lanemay',nombre:'Desodorante en barra Lanemay 40 g',
desc:'Desodorante en barra para piel sensible, sin aluminio y sin gluten. Formato de 40 g, fácil de llevar a todas partes.',
precio:10000,stock:true,destacado:true,img:'producto.jpg'}];
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' FCFA';
const $=s=>document.querySelector(s);
const getCart=()=>{try{return JSON.parse(localStorage.getItem('bbr_cart'))||[]}catch(e){return[]}};
const setCart=c=>{try{localStorage.setItem('bbr_cart',JSON.stringify(c))}catch(e){}head()};
const prod=id=>PRODUCTS.find(p=>p.id===id);
const count=()=>getCart().reduce((a,i)=>a+i.q,0);
const total=()=>getCart().reduce((a,i)=>a+(prod(i.id)?.precio||0)*i.q,0);
function add(id,q){const c=getCart(),i=c.find(x=>x.id===id);i?i.q=Math.min(99,i.q+q):c.push({id,q});setCart(c)}
function head(){const on=document.body.dataset.page;const l=(h,t,k)=>`<a href="${h}" class="${on===k?'on':''}">${t}</a>`;
$('#hd').innerHTML=`<div class="w"><a href="index.html"><img src="logo.png" alt="BBR"></a><nav>${l('index.html','Inicio','home')}${l('catalogo.html','Productos','cat')}</nav><a class="cart" href="pedido.html">Pedido (${count()})</a></div>`}
function foot(){$('#ft').innerHTML=`<div class="w"><div><img src="logo.png" alt="BBR"><p>Soluciones inteligentes. Una vida mejor.</p></div><div><b>Contacto</b><p>Bata, Guinea Ecuatorial<br>WhatsApp: [pendiente: tu número]</p></div><div><b>Legal</b><p>Política de privacidad y condiciones de compra: pendientes (Fase 8).</p></div></div>`}
function card(p){return `<a class="card" href="producto.html?id=${p.id}"><img src="${p.img}" alt="${p.nombre}" loading="lazy"><div><b>${p.nombre}</b><span class="price">${fmt(p.precio)}</span><span class="${p.stock?'ok':'no'}">${p.stock?'Disponible':'Agotado'}</span></div></a>`}
function qtyBox(el,get,set){const r=()=>el.innerHTML=`<button aria-label="Menos">−</button><span>${get()}</span><button aria-label="Más">+</button>`;
r();el.onclick=e=>{const b=e.target.closest('button');if(!b)return;set(get()+(b.textContent==='+'?1:-1));r()}}
const pages={
home(){$('#feat').innerHTML=PRODUCTS.filter(p=>p.destacado).map(card).join('')},
cat(){$('#list').innerHTML=PRODUCTS.filter(p=>p.stock!==undefined).map(card).join('')},
prod(){const p=prod(new URLSearchParams(location.search).get('id'));const m=$('#pd');
if(!p){m.innerHTML='<p>Producto no encontrado. <a class="btn s" href="catalogo.html">Ver productos</a></p>';return}
let q=1;m.innerHTML=`<div class="frame"><img src="${p.img}" alt="${p.nombre}"></div><div><h1 style="font-size:28px">${p.nombre}</h1><p class="price">${fmt(p.precio)}</p><p class="${p.stock?'ok':'no'}">${p.stock?'Disponible':'Agotado'}</p><p class="lead" style="margin-top:12px">${p.desc}</p>
<div class="qty" id="q"></div><p class="tot" id="t"></p><div class="acts"><button class="btn s" id="a" ${p.stock?'':'disabled'}>Añadir al pedido</button><button class="btn" id="r" ${p.stock?'':'disabled'}>Realizar pedido</button></div><p class="mut" id="m"></p></div>`;
const t=()=>$('#t').textContent='Subtotal: '+fmt(p.precio*q);
qtyBox($('#q'),()=>q,v=>{q=Math.max(1,Math.min(99,v));t()});t();
$('#a').onclick=()=>{add(p.id,q);$('#m').textContent='Añadido al pedido.'};
$('#r').onclick=()=>{add(p.id,q);location.href='pedido.html'}},
ped(){const L=$('#lines');const draw=()=>{const c=getCart().filter(i=>prod(i.id));
if(!c.length){L.innerHTML='<p>Tu pedido está vacío.</p><a class="btn" href="catalogo.html">Explorar productos</a>';$('#fm').hidden=true;return}
$('#fm').hidden=false;L.innerHTML=c.map(i=>{const p=prod(i.id);return `<div class="line"><div><b>${p.nombre}</b><br><span class="mut">${fmt(p.precio)} × ${i.q}</span></div><div class="qty" data-id="${i.id}"></div><b>${fmt(p.precio*i.q)}</b></div>`}).join('')+`<p class="tot">Total: ${fmt(total())}</p>`;
L.querySelectorAll('.qty').forEach(el=>{const id=el.dataset.id;qtyBox(el,()=>getCart().find(x=>x.id===id).q,v=>{const k=getCart();const it=k.find(x=>x.id===id);it.q=v;setCart(k.filter(x=>x.q>0));draw()})})};draw();
const F=$('#fm'),S=$('#sum');let sent=false;
F.onsubmit=e=>{e.preventDefault();if(F.web.value)return;const d=Object.fromEntries(new FormData(F));const er=[];
if(d.nombre.trim().length<3)er.push('Escribe tu nombre completo.');
if(!/^\+?\d[\d\s]{6,14}$/.test(d.tel.trim()))er.push('Teléfono no válido.');
if(!/^\+?\d[\d\s]{6,14}$/.test(d.wa.trim()))er.push('WhatsApp no válido.');
if(d.ciudad.trim().length<2||d.barrio.trim().length<2)er.push('Indica ciudad y barrio.');
if(d.dir.trim().length<5)er.push('Escribe la dirección de entrega.');
if(!getCart().length)er.push('Tu pedido está vacío.');
$('#er').textContent=er.join(' ');if(er.length)return;
S.hidden=false;S.innerHTML='<h2>Revisa tu pedido</h2>';const ul=document.createElement('p');
ul.textContent=`${d.nombre} · Tel: ${d.tel} · WhatsApp: ${d.wa} · ${d.ciudad}, ${d.barrio} · ${d.dir}`+(d.obs?` · Obs: ${d.obs}`:'');
const tt=document.createElement('p');tt.className='tot';tt.textContent='Total: '+fmt(total());
const b=document.createElement('button');b.className='btn';b.textContent='Confirmar pedido';
const n=document.createElement('p');n.className='err';
b.onclick=()=>{if(sent)return;sent=true;b.disabled=true;n.textContent='AVISO: el envío todavía NO está conectado (Fase 4). Este pedido no se ha guardado ni enviado.'};
S.append(ul,tt,b,n);S.scrollIntoView({behavior:'smooth'})}}};
document.addEventListener('DOMContentLoaded',()=>{head();foot();pages[document.body.dataset.page.replace('home','home')]?.()});
