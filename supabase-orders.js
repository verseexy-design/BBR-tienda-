document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#fm');
  if (!form) return;

  // Endpoint de Google Apps Script de BBR
  const BBR_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzB5B_RkVLstaF6SQ74WMmVae53P4TRMBO4xQ9oB3JIGYcxeHhRrD5Bqc1YK6l3I5fLfQ/exec';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (form.elements.web.value) return;

    const data = Object.fromEntries(new FormData(form));
    const cart = getCart();
    const error = document.querySelector('#er');
    const button = form.querySelector('button[type="submit"]');

    if (!cart.length) {
      error.textContent = 'Tu pedido está vacío.';
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
      error.textContent = 'Comprueba todos tus datos de entrega.';
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

    button.disabled = true;
    button.textContent = 'ENVIANDO PEDIDO...';
    error.textContent = '';

    // Enviar mediante un formulario HTML oculto para evitar bloqueos CORS
    // del navegador al comunicarse con Google Apps Script.
    const frameName = 'bbr_order_frame_' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = frameName;
    iframe.title = 'Envío seguro del pedido';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = BBR_SCRIPT_URL;
    hiddenForm.target = frameName;
    hiddenForm.style.display = 'none';

    const payload = document.createElement('input');
    payload.type = 'hidden';
    payload.name = 'payload';
    payload.value = JSON.stringify(order);
    hiddenForm.appendChild(payload);
    document.body.appendChild(hiddenForm);

    let finished = false;
    const timeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      error.textContent = 'No hemos podido confirmar el envío. Comprueba tu conexión antes de volver a intentarlo.';
      button.disabled = false;
      button.textContent = 'REINTENTAR PEDIDO';
      hiddenForm.remove();
      iframe.remove();
    }, 20000);

    iframe.addEventListener('load', () => {
      // Ignorar la primera carga inicial del iframe.
      if (finished || !hiddenForm.dataset.submitted) return;
      finished = true;
      window.clearTimeout(timeout);

      localStorage.removeItem('bbr_cart');

      const summary = document.querySelector('#sum');
      summary.hidden = false;
      summary.innerHTML = `
        <h2>¡PEDIDO ENVIADO!</h2>
        <p>Gracias, ${order.customer_name}.</p>
        <p>Hemos enviado tu pedido a BBR. Nos pondremos en contacto contigo para confirmar la entrega.</p>
        <h2>+${amount.toLocaleString('es-ES')} XAF</h2>
        <p>Pago: efectivo contra entrega.</p>
        <p>BBR — Soluciones inteligentes. Una vida mejor.</p>
        <a class="btn" href="index.html">Volver al inicio</a>
      `;

      form.hidden = true;
      document.querySelector('#lines').innerHTML = '<p>Pedido enviado.</p>';
      summary.scrollIntoView({ behavior: 'smooth' });

      window.setTimeout(() => {
        hiddenForm.remove();
        iframe.remove();
      }, 1000);
    });

    document.body.appendChild(hiddenForm);
    hiddenForm.dataset.submitted = 'true';
    hiddenForm.submit();
  });
});
