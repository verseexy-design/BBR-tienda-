/* BBR - tienda y seguimiento anónimo de visitas */
const PRODUCTS = [{
  id: 'desodorante-lanemay',
  nombre: 'Desodorante en barra Lanemay 40 g',
  desc: 'Desodorante en barra para piel sensible, sin aluminio y sin gluten. Formato de 40 g, fácil de llevar a todas partes.',
  precio: 10000,
  stock: true,
  destacado: true,
  img: 'producto.jpg'
}, {
  id: 'repelente-electronico-ultrasonico',
  nombre: 'Repelente Electrónico Ultrasónico de Insectos y Plagas',
  desc: 'Dispositivo electrónico ultrasónico pensado para ayudar a mantener alejados insectos y roedores en espacios interiores. Se conecta a una toma de corriente. Los resultados pueden variar según el espacio y el tipo de plaga; no sustituye las medidas habituales de control de plagas.',
  precio: 7000,
  stock: true,
  destacado: true,
  img: 'https://media.adeo.com/mkp/3922a8d2db55aaf253f196e776a9971a/media.jpg?fit=bounds&format=jpg&height=800&quality=85&width=800'
}, {
  id: 'clip-antirronquidos-silicona',
  nombre: 'Clip Nasal Antirronquidos Magnético de Silicona',
  desc: 'Clip nasal reutilizable de silicona con extremos magnéticos, diseñado como accesorio de apoyo para el descanso. Incluye una presentación compacta y fácil de guardar. La eficacia puede variar según la persona; no diagnostica ni trata la apnea del sueño.',
  precio: 6000,
  stock: true,
  destacado: true,
  img: 'https://s.alicdn.com/@sc04/kf/Hac4924b5c7a746268f81cafca850053fh/Hot-Sale-Medical-Silicone-Magnetic-Anti-Snoring-Nose-Clip-Stopper-Anti-Snore-Device-Man-and-Woman.jpg'
}];

const fmt = n => `${Math.round(Number(n) || 0).toLocaleString('es-ES')} FCFA`;
const $ = s => document.querySelector(s);
const getCart = () => {
  try { const data=JSON.parse(localStorage.getItem('bbr_cart')||'[]'); return Array.isArray(data)?data.filter(x=>prod(x.id)&&Number.isInteger(x.q)&&x.q>0):[]; }
  catch { return []; }
};
const setCart = c => { localStorage.setItem('bbr_cart',JSON.stringify(c)); head(); };
const prod = id => PRODUCTS.find(p=>p.id===id);
const count = () => getCart().reduce((a,i)=>a+i.q,0);
const total = () => getCart().reduce((a,i)=>a+(prod(i.id)?.precio||0)*i.q,0);

function trackBBRVisit() {
  try {
    const endpoint='https://script.google.com/macros/s/AKfycbzB5B_RkVLstaF6SQ74WMmVae53P4TRMBO4xQ9oB3JIGYcxeHhRrD5Bqc1YK6l3I5fLfQ/exec';
    let visitor=localStorage.getItem('bbr_visitor_id');
    if(!visitor){visitor=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'v-'+Date.now()+'-'+Math.random().toString(36).slice(2);localStorage.setItem('bbr_visitor_id',visitor);}
    const page=document.body.dataset.page||'unknown';
    const productId=page==='prod'?new URLSearchParams(location.search).get('id')||'':'';
    const title=productId?(prod(productId)?.nombre||document.title):document.title;
    const eventName=productId?'product_view':'page_view';
    const img=new Image();
    img.src=endpoint+'?action=track&visitor='+encodeURIComponent(visitor)+'&path='+encodeURIComponent(location.pathname+location.search)+'&title='+encodeURIComponent(title)+'&product='+encodeURIComponent(productId)+'&event='+eventName+'&t='+Date.now();
  } catch(e) { /* el seguimiento no debe interrumpir la tienda */ }
}

function add(id,q) {
  const p=prod(id); if(!p||!p.stock)return;
  const c=getCart(),item=c.find(x=>x.id===id);
  if(item)item.q=Math.min(99,item.q+q);else c.push({id,q:Math.min(99,Math.max(1,q))});
  setCart(c);
}
function head() {
  const page=document.body.dataset.page;
  const link=(href,label,key)=>`<a href="${href}" class="${page===key?'on':''}">${label}</a>`;
  $('#hd').innerHTML=`<div class="w header-inner">
    <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="bbr-menu"><span></span><span></span><span></span></button>
    <a class="header-logo" href="index.html" aria-label="BBR, inicio"><img src="logo.png" alt="BBR"></a>
    <nav aria-label="Navegación principal">${link('index.html','Inicio','home')}${link('catalogo.html','Productos','cat')}</nav>
    <a class="cart" href="pedido.html">Mi pedido (${count()})</a><a class="header-profile" id="bbr-header-profile" href="perfil.html" aria-label="Abrir mi perfil"><img id="bbr-header-avatar" alt="Perfil"><span>Mi perfil</span></a>
    <div class="menu-backdrop" hidden></div>
    <aside class="mobile-menu" id="bbr-menu" aria-label="Menú BBR" aria-hidden="true">
      <div class="menu-heading"><span>MENÚ BBR</span><button class="menu-close" type="button" aria-label="Cerrar menú">×</button></div>
      ${link('index.html','Inicio','home')}${link('catalogo.html','Productos','cat')}${link('pedido.html','Mi pedido','ped')}
      <a class="login-preview" href="cuenta.html">Mi cuenta <span>REGISTRO / ACCESO</span></a>
    </aside>
  </div>`;
  import('./bbr-auth-ui.js?v=20261126-6').catch(()=>{});
  const toggle=$('.menu-toggle'),menu=$('.mobile-menu'),backdrop=$('.menu-backdrop'),close=$('.menu-close');
  const setOpen=open=>{toggle.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open);menu.setAttribute('aria-hidden',String(!open));backdrop.hidden=!open;document.body.classList.toggle('menu-open',open);};
  toggle.onclick=()=>setOpen(!menu.classList.contains('is-open'));
  close.onclick=()=>setOpen(false);backdrop.onclick=()=>setOpen(false);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});

}
function foot() {
  $('#ft').innerHTML=`<div class="w footer-grid">
    <div class="footer-brand"><img src="logo.png" alt="BBR"><p>Soluciones inteligentes. Una vida mejor. 🇬🇶</p><p class="footer-location">Guinea Ecuatorial · Atención online</p></div>
    <div class="footer-info"><b>Pedidos y delivery</b><p>Realiza tu pedido en la web. Nos pondremos en contacto contigo para confirmar disponibilidad, ubicación y detalles de entrega.</p><p>La cobertura, el plazo y el coste se confirman según la zona.</p></div>
    <div class="footer-social"><b>Conecta con BBR</b><p class="social-soon">Síguenos y descubre las novedades de BBR.</p><div class="social-icons" aria-label="Redes sociales de BBR">
      <a href="https://www.instagram.com/bbr.shopping/" target="_blank" rel="noopener noreferrer" title="Instagram BBR" aria-label="Instagram BBR"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg></a>
      <span title="Facebook próximamente" aria-label="Facebook próximamente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h1.7V1.4C17 1.2 15.8 1 14.4 1 11 1 9 3 9 6.7V9H6v4h3v8z"></path></svg></span>
      <a href="https://www.tiktok.com/@tudoctor.tv" target="_blank" rel="noopener noreferrer" title="TikTok" aria-label="TikTok BBR"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.2a4.1 4.1 0 1 1-3.5-4.05V6.6a7.5 7.5 0 1 0 7 7.45V9.8a9 9 0 0 0 4 1V7.2c-3.2-.1-5.8-1.8-7.5-4.2z"></path></svg></a>
      </div></div>
    <div class="footer-legal"><p>Privacidad: utilizamos los datos facilitados únicamente para gestionar tu solicitud, contactar contigo y coordinar el pedido y su entrega. No envíes información personal que no sea necesaria.</p><p>Información de compra: los precios se muestran en FCFA. La disponibilidad y las condiciones de entrega se confirman antes de coordinar el envío.</p><p class="copyright">© ${new Date().getFullYear()} BBR™ · Todos los derechos reservados.</p></div>
    <div class="footer-founder"><span>Fundador</span><strong>Gabriel Bueriberi</strong></div>
  </div>`;
}
function card(p) {
  return `<article class="card product-card"><a class="card-image-link" href="producto.html?id=${encodeURIComponent(p.id)}" aria-label="Ver ${p.nombre}"><img src="${p.img}" alt="${p.nombre}" loading="lazy"></a><div><b>${p.nombre}</b><span class="price">${fmt(p.precio)}</span><span class="${p.stock?'ok':'no'}">${p.stock?'Disponible':'Agotado'}</span><div class="card-actions"><a class="btn s" href="producto.html?id=${encodeURIComponent(p.id)}">Ver producto</a><button class="share-btn" type="button" data-share="${p.id}" aria-label="Compartir ${p.nombre}" title="Compartir producto">↗ Compartir</button></div></div></article>`;
}
async function shareProduct(id,button) {
  const p=prod(id); if(!p)return;
  const url=new URL(`producto.html?id=${encodeURIComponent(id)}`,location.href).href;
  const payload={title:p.nombre,text:`${p.nombre} · ${fmt(p.precio)} en BBR. Descúbrelo aquí:`,url};
  try {
    if(navigator.share){await navigator.share(payload);}
    else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);if(button){button.textContent='✓ Enlace copiado';setTimeout(()=>button.textContent='↗ Compartir',2200);}}
    else {window.prompt('Copia el enlace del producto:',url);}
  } catch(e) { if(e&&e.name!=='AbortError'){try{window.prompt('Copia el enlace del producto:',url);}catch(_){}} }
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-share]');if(b){e.preventDefault();shareProduct(b.dataset.share,b);}});

function qtyBox(el,get,set,min=1) {
  const render=()=>{el.innerHTML=`<button type="button" aria-label="Disminuir cantidad">−</button><span>${get()}</span><button type="button" aria-label="Aumentar cantidad">+</button>`;};
  render();el.onclick=e=>{const button=e.target.closest('button');if(!button)return;const next=get()+(button.textContent.trim()==='+'?1:-1);set(Math.max(min,Math.min(99,next)));render();};
}
function homePage(){ $('#feat').innerHTML=PRODUCTS.filter(p=>p.destacado).map(card).join(''); }
function catalogPage(){ $('#list').innerHTML=PRODUCTS.map(card).join('')||'<p>Próximamente añadiremos productos.</p>'; }
function productPage() {
  const p=prod(new URLSearchParams(location.search).get('id')),mount=$('#pd');
  if(!p){mount.innerHTML='<p>Producto no encontrado. <a class="btn s" href="catalogo.html">Volver al catálogo</a></p>';return;}
  let q=1;
  mount.innerHTML=`<div class="frame"><img src="${p.img}" alt="${p.nombre}"></div><div><h1 class="product-title">${p.nombre}</h1><p class="price">${fmt(p.precio)}</p><p class="${p.stock?'ok':'no'}">${p.stock?'Disponible':'Agotado'}</p><p class="lead product-desc">${p.desc}</p><p class="label-inline">Cantidad</p><div class="qty" id="q"></div><p class="tot" id="t"></p><div class="acts"><button class="btn s" id="a" ${p.stock?'':'disabled'}>Añadir al pedido</button><button class="btn" id="r" ${p.stock?'':'disabled'}>Continuar al pedido</button><button class="share-btn detail-share" type="button" data-share="${p.id}">↗ Compartir producto</button></div><p class="mut" id="m" role="status"></p></div>`;
  const updateTotal=()=>{$('#t').textContent=`Subtotal: ${fmt(p.precio*q)}`;};
  qtyBox($('#q'),()=>q,v=>{q=v;updateTotal();});updateTotal();
  $('#a').onclick=()=>{add(p.id,q);$('#m').textContent='Producto añadido a tu pedido.';};
  $('#r').onclick=()=>{add(p.id,q);location.href='pedido.html';};
}
function orderPage() {
  const lines=$('#lines'),form=$('#fm');
  const draw=()=>{
    const cart=getCart();
    if(!cart.length){lines.innerHTML='<p>Tu pedido está vacío.</p><a class="btn" href="catalogo.html">Explorar productos</a>';form.hidden=true;return;}
    form.hidden=false;
    lines.innerHTML=cart.map(item=>{const p=prod(item.id);return `<div class="line"><div><b>${p.nombre}</b><br><span class="mut">${fmt(p.precio)} × ${item.q}</span></div><div class="qty" data-id="${p.id}"></div><b>${fmt(p.precio*item.q)}</b><button class="remove" type="button" data-remove="${p.id}">Eliminar</button></div>`;}).join('')+`<p class="tot">Total: ${fmt(total())}</p>`;
    lines.querySelectorAll('.qty').forEach(el=>{const id=el.dataset.id;qtyBox(el,()=>getCart().find(x=>x.id===id)?.q||1,value=>{setCart(getCart().map(x=>x.id===id?{...x,q:value}:x));draw();});});
    lines.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{setCart(getCart().filter(x=>x.id!==btn.dataset.remove));draw();});
  };
  draw();
}
document.addEventListener('DOMContentLoaded',()=>{
  head();foot();trackBBRVisit();
  const routes={home:homePage,cat:catalogPage,prod:productPage,ped:orderPage,account:()=>{}};
  (routes[document.body.dataset.page]||(()=>{}))();

  const reveal=document.querySelector('.products-reveal');
  if(reveal && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{threshold:0.12});
    observer.observe(reveal);
  }else if(reveal){
    reveal.classList.add('is-visible');
  }
});
