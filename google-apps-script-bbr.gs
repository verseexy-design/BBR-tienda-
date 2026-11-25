/**
 * BBR - Notificaciones de pedidos por correo.
 * Destino: verseexy@gmail.com
 *
 * Configuración:
 * 1. Pega este código en Google Apps Script.
 * 2. Ejecuta authorizeBBRMail() una vez y acepta permisos.
 * 3. Implementa > Nueva implementación > Aplicación web.
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier persona.
 * 4. Copia la URL /exec y configúrala en la tienda BBR.
 */

const BBR_EMAIL = 'verseexy@gmail.com';

function authorizeBBRMail() {
  // Solicita autorización para enviar correos desde tu cuenta.
  MailApp.getRemainingDailyQuota();
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'BBR email notifications' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return output_({ ok: false, error: 'Solicitud vacía' });

    const order = JSON.parse(raw);
    const required = [
      'customer_name', 'customer_phone', 'product_name',
      'quantity', 'total_xaf', 'delivery_address'
    ];
    for (const key of required) {
      if (order[key] === undefined || order[key] === null || String(order[key]).trim() === '') {
        return output_({ ok: false, error: 'Falta el dato: ' + key });
      }
    }

    const amount = Number(order.total_xaf);
    const quantity = Number(order.quantity);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(quantity) || quantity < 1) {
      return output_({ ok: false, error: 'Importe o cantidad no válidos' });
    }

    const subject = '🛍️ BBR — PEDIDO REALIZADO +' +
      amount.toLocaleString('es-ES') + ' XAF';

    const body =
      '¡NUEVO PEDIDO REALIZADO EN BBR!\n\n' +
      'IMPORTE: ' + amount.toLocaleString('es-ES') + ' XAF\n\n' +
      'CLIENTE: ' + order.customer_name + '\n' +
      'TELÉFONO / WHATSAPP: ' + order.customer_phone + '\n' +
      'PRODUCTO: ' + order.product_name + '\n' +
      'CANTIDAD: ' + quantity + '\n' +
      'PRECIO UNITARIO: ' + Number(order.unit_price_xaf || 0).toLocaleString('es-ES') + ' XAF\n' +
      'DIRECCIÓN: ' + order.delivery_address + '\n\n' +
      'PAGO: Efectivo contra entrega\n' +
      'ESTADO: PEDIDO REALIZADO\n\n' +
      'BBR — Soluciones inteligentes. Una vida mejor.';

    MailApp.sendEmail({
      to: BBR_EMAIL,
      subject: subject,
      body: body,
      name: 'BBR Tienda'
    });

    return output_({ ok: true, message: 'Notificación enviada a BBR' });
  } catch (err) {
    console.error(err);
    return output_({ ok: false, error: String(err.message || err) });
  }
}

function output_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
