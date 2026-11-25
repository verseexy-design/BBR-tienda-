/**
 * BBR - Pedidos, correo y base de datos privada para BBR View.
 * Pega este archivo completo en el proyecto Apps Script que ya usa la tienda.
 * Antes de publicar, cambia BBR_ADMIN_PIN por una clave privada tuya.
 */
const BBR_EMAIL = 'verseexy@gmail.com';
const BBR_ADMIN_PIN = 'CAMBIA-ESTA-CLAVE-ANTES-DE-PUBLICAR';

function authorizeBBRMail() {
  MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getActiveSpreadsheet(); // solicita permisos de Sheets
}

/** Ejecutar UNA VEZ desde Apps Script. Crea la hoja de pedidos. */
function setupBBRDatabase() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('BBR_SHEET_ID');
  if (id) {
    const existing = SpreadsheetApp.openById(id);
    return 'BBR View ya está conectado: ' + existing.getUrl();
  }
  const ss = SpreadsheetApp.create('BBR View - Registro privado de pedidos');
  const sheet = ss.getSheets()[0];
  sheet.setName('Pedidos');
  sheet.appendRow(['ID','Fecha','Cliente','Teléfono / WhatsApp','Productos','Unidades','Precio unitario XAF','Total XAF','Dirección','Método de pago','Estado']);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,11).setFontWeight('bold');
  props.setProperty('BBR_SHEET_ID', ss.getId());
  return 'Base de datos creada: ' + ss.getUrl();
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'stats') return getStats_(p.pin);
  if (p.action === 'visit') {
    try { countVisit_(); return output_({ok:true}); }
    catch (err) { return output_({ok:false}); }
  }
  return output_({ ok: true, service: 'BBR orders and BBR View' });
}

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    let order;
    if (params.payload) order = JSON.parse(params.payload);
    else if (e && e.postData && e.postData.contents) order = JSON.parse(e.postData.contents);
    else return output_({ ok:false, error:'Solicitud vacía' });

    const required = ['customer_name','customer_phone','product_name','quantity','total_xaf','delivery_address'];
    required.forEach(k => {
      if (order[k] === undefined || order[k] === null || String(order[k]).trim() === '') throw new Error('Falta el dato: ' + k);
    });
    const amount = Number(order.total_xaf);
    const quantity = Number(order.quantity);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(quantity) || quantity < 1) throw new Error('Importe o cantidad no válidos');

    const sheet = getOrdersSheet_();
    const id = 'BBR-' + Utilities.getUuid().slice(0,8).toUpperCase();
    const date = new Date();
    sheet.appendRow([id,date,order.customer_name,order.customer_phone,order.product_name,quantity,Number(order.unit_price_xaf||0),amount,order.delivery_address,'Efectivo contra entrega','REALIZADO']);

    const subject = '🛍️ Pedido realizado +' + amount.toLocaleString('es-ES') + ' XAF';
    const body = '¡NUEVO PEDIDO REALIZADO EN BBR!\n\n' +
      'IMPORTE: ' + amount.toLocaleString('es-ES') + ' XAF\n' +
      'CÓDIGO: ' + id + '\nCLIENTE: ' + order.customer_name + '\n' +
      'TELÉFONO / WHATSAPP: ' + order.customer_phone + '\n' +
      'PRODUCTO: ' + order.product_name + '\nCANTIDAD: ' + quantity + '\n' +
      'PRECIO UNITARIO: ' + Number(order.unit_price_xaf||0).toLocaleString('es-ES') + ' XAF\n' +
      'DIRECCIÓN: ' + order.delivery_address + '\n\nPAGO: Efectivo contra entrega\nESTADO: PEDIDO REALIZADO\n\nBBR — Soluciones inteligentes. Una vida mejor.';
    MailApp.sendEmail({to:BBR_EMAIL,subject:subject,body:body,name:'BBR Tienda'});
    return output_({ok:true,id:id});
  } catch (err) {
    console.error(err);
    return output_({ok:false,error:String(err.message||err)});
  }
}

function getOrdersSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('BBR_SHEET_ID');
  if (!id) throw new Error('Primero ejecuta setupBBRDatabase() desde Apps Script.');
  return SpreadsheetApp.openById(id).getSheetByName('Pedidos');
}

function getStats_(pin) {
  if (!BBR_ADMIN_PIN || BBR_ADMIN_PIN.indexOf('CAMBIA-ESTA') === 0 || pin !== BBR_ADMIN_PIN) {
    return output_({ok:false,error:'Clave de administrador incorrecta o sin configurar.'});
  }
  try {
    const sheet = getOrdersSheet_();
    const rows = sheet.getDataRange().getValues();
    const orders = rows.slice(1).filter(r => r[0]);
    const total = orders.reduce((s,r) => s + Number(r[7]||0),0);
    const completed = orders.filter(r => String(r[10]).toUpperCase() === 'COMPLETADO').length;
    const pending = orders.length - completed;
    const clients = new Set(orders.map(r => String(r[2]).trim().toLowerCase())).size;
    const recent = orders.slice(-30).reverse().map(r => ({
      id:r[0], date:r[1] instanceof Date ? Utilities.formatDate(r[1],Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm') : String(r[1]),
      customer:r[2], phone:r[3], products:r[4], quantity:r[5], total:Number(r[7]||0), address:r[8], status:r[10]
    }));
    return output_({ok:true,metrics:{revenue:total,orders:orders.length,clients:clients,pending:pending,completed:completed},recent:recent});
  } catch(err) { return output_({ok:false,error:String(err.message||err)}); }
}

function countVisit_() {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');
  const key = 'BBR_VISITS_' + today;
  props.setProperty(key,String(Number(props.getProperty(key)||0)+1));
}

function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}