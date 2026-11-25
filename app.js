/* BBR - Fase 2: tienda frontend. Los pedidos aún requieren conexión a un servidor/base de datos. */
const PRODUCTS = [{
  id: 'desodorante-lanemay',
  nombre: 'Desodorante en barra Lanemay 40 g',
  desc: 'Desodorante en barra para piel sensible, sin aluminio y sin gluten. Formato de 40 g, fácil de llevar a todas partes.',
  precio: 10000,
  stock: true,
  destacado: true,
  img: 'producto.jpg'
}];

const fmt = n => `${Math.round(Number(n) || 0).toLocaleString('es-ES')} FCFA`;
const $ = s => document.querySelector(s);
const getCart = () => {
  try {
    const data = JSON.parse(localStorage.getItem('bbr_cart') || '[]');
    return Array.isArray(data) ? data.filter(x => prod(x.id) && Number.isInteger(x.q) && x.q > 0) : [];
  } catch { return []; }
};
const setCart = c => {
  localStorage.setItem('bbr_cart', JSON.stringify(c));
  head();
};
const prod = id => PRODUCTS.find(p => p.id === id);
const count = () => getCart().reduce((a, i) => a + i.q, 0);
const total = () => getCart().reduce((a, i) => a + (prod(i.id)?.precio || 0) * i.q, 0);

function add(id, q) {
  const p = prod(id);
  if (!p || !p.stock) return;
  const c = getCart();
  const item = c.find(x => x.id === id);
  if (item) item.q = Math.min(99, item.q + q);
  else c.push({ id, q: Math.min(99, Math.max(1, q)) });
  setCart(c);
}
function head() {
  const page = document.body.dataset.page;
  const link = (href, label, key) => `<a href="${href}" class="${page === key ? 'on' : ''}">${label}</a>`;
  $('#hd').innerHTML = `<div class="w">
    <a href="index.html" aria-label="BBR, inicio"><img src="logo.png" alt="BBR"></a>
    <nav aria-label="Navegación principal">${link('index.html','Inicio','home')}${link('catalogo.html','Productos','cat')}</nav>
    <a class="cart" href="pedido.html">Mi pedido (${count()})</a>
  </div>`;
}
function foot() {
  $('#ft').innerHTML = `<div class="w">
    <div><img src="logo.png" alt="BBR"><p>Soluciones inteligentes. Una vida mejor.</p></div>
    <div><b>Contacto</b><p>Bata, Guinea Ecuatorial<br>WhatsApp: pendiente de configurar</p></div>
    <div><b>Información</b><p>Los pedidos se habilitarán cuando conectemos el sistema seguro de registro.</p></div>
  </div>`;
}
function card(p) {
  return `<article class="card">
    <a href="producto.html?id=${encodeURIComponent(p.id)}" aria-label="Ver ${p.nombre}">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy">
    </a>
    <div><b>${p.nombre}</b><span class="price">${fmt(p.precio)}</span>
      <span class="${p.stock ? 'ok' : 'no'}">${p.stock ? 'Disponible' : 'Agotado'}</span>
      <a class="btn s" href="producto.html?id=${encodeURIComponent(p.id)}">Ver producto</a>
    </div>
  </article>`;
}
function qtyBox(el, get, set, min = 1) {
  const render = () => {
    el.innerHTML = `<button type="button" aria-label="Disminuir cantidad">−</button><span>${get()}</span><button type="button" aria-label="Aumentar cantidad">+</button>`;
  };
  render();
  el.onclick = e => {
    const button = e.target.closest('button');
    if (!button) return;
    const next = get() + (button.textContent.trim() === '+' ? 1 : -1);
    set(Math.max(min, Math.min(99, next)));
    render();
  };
}
function homePage() {
  $('#feat').innerHTML = PRODUCTS.filter(p => p.destacado).map(card).join('');
}
function catalogPage() {
  $('#list').innerHTML = PRODUCTS.map(card).join('') || '<p>Próximamente añadiremos productos.</p>';
}
function productPage() {
  const p = prod(new URLSearchParams(location.search).get('id'));
  const mount = $('#pd');
  if (!p) {
    mount.innerHTML = '<p>Producto no encontrado. <a class="btn s" href="catalogo.html">Volver al catálogo</a></p>';
    return;
  }
  let q = 1;
  mount.innerHTML = `<div class="frame"><img src="${p.img}" alt="${p.nombre}"></div>
    <div><h1 class="product-title">${p.nombre}</h1><p class="price">${fmt(p.precio)}</p>
    <p class="${p.stock ? 'ok' : 'no'}">${p.stock ? 'Disponible' : 'Agotado'}</p>
    <p class="lead product-desc">${p.desc}</p>
    <p class="label-inline">Cantidad</p><div class="qty" id="q"></div>
    <p class="tot" id="t"></p><div class="acts">
      <button class="btn s" id="a" ${p.stock ? '' : 'disabled'}>Añadir al pedido</button>
      <button class="btn" id="r" ${p.stock ? '' : 'disabled'}>Continuar al pedido</button>
    </div><p class="mut" id="m" role="status"></p></div>`;
  const updateTotal = () => { $('#t').textContent = `Subtotal: ${fmt(p.precio * q)}`; };
  qtyBox($('#q'), () => q, v => { q = v; updateTotal(); });
  updateTotal();
  $('#a').onclick = () => { add(p.id, q); $('#m').textContent = 'Producto añadido a tu pedido.'; };
  $('#r').onclick = () => { add(p.id, q); location.href = 'pedido.html'; };
}
function orderPage() {
  const lines = $('#lines');
  const form = $('#fm');
  const summary = $('#sum');

  const draw = () => {
    const cart = getCart();
    if (!cart.length) {
      lines.innerHTML = '<p>Tu pedido está vacío.</p><a class="btn" href="catalogo.html">Explorar productos</a>';
      form.hidden = true;
      return;
    }
    form.hidden = false;
    lines.innerHTML = cart.map(item => {
      const p = prod(item.id);
      return `<div class="line"><div><b>${p.nombre}</b><br><span class="mut">${fmt(p.precio)} × ${item.q}</span></div>
        <div class="qty" data-id="${p.id}"></div><b>${fmt(p.precio * item.q)}</b>
        <button class="remove" type="button" data-remove="${p.id}">Eliminar</button></div>`;
    }).join('') + `<p class="tot">Total: ${fmt(total())}</p>`;
    lines.querySelectorAll('.qty').forEach(el => {
      const id = el.dataset.id;
      qtyBox(el, () => getCart().find(x => x.id === id)?.q || 1, value => {
        const next = getCart().map(x => x.id === id ? {...x, q: value} : x);
        setCart(next); draw();
      });
    });
    lines.querySelectorAll('[data-remove]').forEach(btn => btn.onclick = () => {
      setCart(getCart().filter(x => x.id !== btn.dataset.remove)); draw();
    });
  };
  draw();

  form.onsubmit = e => {
    e.preventDefault();
    if (form.web.value) return;
    const data = Object.fromEntries(new FormData(form));
    const errors = [];
    if (data.nombre.trim().length < 3) errors.push('Escribe tu nombre completo.');
    if (!/^\+?[\d\s()-]{7,18}$/.test(data.tel.trim())) errors.push('Comprueba el teléfono.');
    if (!/^\+?[\d\s()-]{7,18}$/.test(data.wa.trim())) errors.push('Comprueba el WhatsApp.');
    if (data.ciudad.trim().length < 2 || data.barrio.trim().length < 2) errors.push('Indica ciudad y barrio.');
    if (data.dir.trim().length < 5) errors.push('Escribe una dirección de entrega completa.');
    if (!getCart().length) errors.push('Tu pedido está vacío.');
    $('#er').textContent = errors.join(' ');
    if (errors.length) return;

    summary.hidden = false;
    summary.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = 'Revisa los datos de tu pedido';
    const details = document.createElement('p');
    details.textContent = `${data.nombre} · Tel: ${data.tel} · WhatsApp: ${data.wa} · ${data.ciudad}, ${data.barrio} · ${data.dir}${data.obs ? ' · Observaciones: ' + data.obs : ''}`;
    const products = document.createElement('p');
    products.textContent = getCart().map(i => `${prod(i.id).nombre} × ${i.q}`).join(' | ');
    const amount = document.createElement('p');
    amount.className = 'tot';
    amount.textContent = `Total solicitado: ${fmt(total())}`;
    const notice = document.createElement('p');
    notice.className = 'mut';
    notice.textContent = 'IMPORTANTE: esta versión todavía no guarda ni envía pedidos. Estamos preparando la conexión segura a la base de datos.';
    summary.append(title, details, products, amount, notice);
    summary.scrollIntoView({behavior: 'smooth', block: 'center'});
  };
}
document.addEventListener('DOMContentLoaded', () => {
  head();
  foot();
  const routes = {home: homePage, cat: catalogPage, prod: productPage, ped: orderPage};
  (routes[document.body.dataset.page] || homePage)();
});
