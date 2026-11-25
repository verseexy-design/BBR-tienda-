document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#fm');
  if (!form) return;

  const SUPABASE_URL = 'https://ajvubdktkkpdztkjgqxm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_8wjj8Odlj4xU0AYbE7z0sw_3adFOdvu';

  form.onsubmit = async (e) => {
    e.preventDefault();

    if (form.web.value) return;

    const data = Object.fromEntries(new FormData(form));
    const cart = getCart();

    if (!cart.length) {
      document.querySelector('#er').textContent = 'Tu pedido está vacío.';
      return;
    }

    if (
      data.nombre.trim().length < 3 ||
      data.tel.trim().length < 7 ||
      data.wa.trim().length < 7 ||
      data.ciudad.trim().length < 2 ||
      data.barrio.trim().length < 2 ||
      data.dir.trim().length < 5
    ) {
      document.querySelector('#er').textContent =
        'Comprueba todos tus datos de entrega.';
      return;
    }

    const products = cart.map(item => {
      const p = prod(item.id);
      return `${p.nombre} x ${item.q}`;
    });

    const quantity = cart.reduce((sum, item) => sum + item.q, 0);
    const amount = total();

    const order = {
      customer_name: data.nombre.trim(),
      customer_phone: `${data.tel.trim()} | WhatsApp: ${data.wa.trim()}`,
      product_name: products.join(' | '),
      quantity: quantity,
      unit_price_xaf: Math.round(amount / quantity),
      total_xaf: amount,
      delivery_address: `${data.ciudad}, ${data.barrio}. ${data.dir}. ${data.obs || ''}`,
      payment_method: 'EFECTIVO_CONTRA_ENTREGA',
      status: 'REALIZADO'
    };

    const button = form.querySelector('button[type="submit"]');
    const error = document.querySelector('#er');

    button.disabled = true;
    button.textContent = 'REGISTRANDO PEDIDO...';
    error.textContent = '';

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error('No se pudo registrar el pedido.');
      }

      localStorage.removeItem('bbr_cart');

      const summary = document.querySelector('#sum');
      summary.hidden = false;
      summary.innerHTML = `
        <h2>¡PEDIDO REALIZADO!</h2>
        <p>Gracias, ${order.customer_name}.</p>
        <p>Tu pedido se ha registrado correctamente.</p>
        <h2>+${amount.toLocaleString('es-ES')} XAF</h2>
        <p>Pago: efectivo contra entrega.</p>
        <p>BBR — Soluciones inteligentes. Una vida mejor.</p>
        <a class="btn" href="index.html">Volver al inicio</a>
      `;

      form.hidden = true;
      document.querySelector('#lines').innerHTML =
        '<p>Pedido registrado correctamente.</p>';

      summary.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      error.textContent =
        'No se pudo registrar el pedido. Comprueba tu conexión e inténtalo de nuevo.';
      button.disabled = false;
      button.textContent = 'REALIZAR PEDIDO';
    }
  };
});
