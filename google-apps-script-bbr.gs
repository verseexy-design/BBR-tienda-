/**
 * BBR - Receptor de pedidos para Google Sheets
 * 1) Ejecuta setupBBR() una vez desde el editor.
 * 2) Autoriza los permisos y consulta el registro para copiar la URL de la hoja.
 * 3) Implementa como aplicación web: Ejecutar como tú / Acceso: Cualquier persona.
 */
function setupBBR() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('BBR_SPREADSHEET_ID');
  let ss;

  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('BBR - PEDIDOS');
    id = ss.getId();
    props.setProperty('BBR_SPREADSHEET_ID', id);
  }

  let sheet = ss.getSheetByName('PEDIDOS BBR');
  if (!sheet) sheet = ss.getSheets()[0].setName('PEDIDOS BBR');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Fecha', 'Cliente', 'Teléfono', 'Producto', 'Cantidad',
      'Precio unitario (XAF)', 'Total (XAF)', 'Dirección',
      'Método de pago', 'Estado'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  Logger.log('BBR_SPREADSHEET_URL=' + ss.getUrl());
  return ss.getUrl();
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, error: 'Solicitud vacía' });

    const data = JSON.parse(raw);
    const required = [
      'customer_name', 'customer_phone', 'product_name',
      'quantity', 'unit_price_xaf', 'total_xaf', 'delivery_address'
    ];

    for (const key of required) {
      if (data[key] === undefined || data[key] === null || String(data[key]).trim() === '') {
        return json_({ ok: false, error: 'Falta un dato obligatorio: ' + key });
      }
    }

    const quantity = Number(data.quantity);
    const unit = Number(data.unit_price_xaf);
    const total = Number(data.total_xaf);
    if (!Number.isInteger(quantity) || quantity < 1 ||
        !Number.isFinite(unit) || unit < 0 ||
        !Number.isFinite(total) || total < 0) {
      return json_({ ok: false, error: 'Importes o cantidad no válidos' });
    }

    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('BBR_SPREADSHEET_ID');
    if (!id) throw new Error('Primero ejecuta setupBBR()');

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = SpreadsheetApp.openById(id);
      const sheet = ss.getSheetByName('PEDIDOS BBR');
      if (!sheet) throw new Error('No existe la hoja PEDIDOS BBR');

      sheet.appendRow([
        new Date(),
        String(data.customer_name).slice(0, 120),
        String(data.customer_phone).slice(0, 80),
        String(data.product_name).slice(0, 500),
        quantity, Math.round(unit), Math.round(total),
        String(data.delivery_address).slice(0, 500),
        'Efectivo contra entrega',
        'PEDIDO REALIZADO'
      ]);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true, message: 'Pedido BBR guardado' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'BBR Orders', message: 'Servicio activo' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
