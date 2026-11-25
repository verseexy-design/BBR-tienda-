/** BBR: pedidos reales, estadísticas y seguimiento anónimo de visitas.
 * Ejecutar setupBBRDatabase() una vez y publicar una NUEVA versión del Web App.
 * La clave se guarda en Propiedades del script; no se publica en GitHub.
 */
const BBR_EMAIL = 'verseexy@gmail.com';

function setupBBRDatabase() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('BBR_SHEET_ID');
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('BBR View - Registro privado');
    props.setProperty('BBR_SHEET_ID', ss.getId());
  }
  let orders = ss.getSheetByName('Pedidos');
  if (!orders) orders = ss.insertSheet('Pedidos');
  if (orders.getLastRow() === 0) {
    orders.appendRow(['ID','Fecha','Cliente','Teléfono / WhatsApp','Productos','Unidades','Precio unitario XAF','Total XAF','Dirección','Método de pago','Estado']);
    orders.setFrozenRows(1); orders.getRange(1,1,1,11).setFontWeight('bold');
  }
  let activity = ss.getSheetByName('Actividad');
  if (!activity) activity = ss.insertSheet('Actividad');
  if (activity.getLastRow() === 0) {
    activity.appendRow(['Fecha','Visitante anónimo','Página','Título','Producto','Evento']);
    activity.setFrozenRows(1); activity.getRange(1,1,1,6).setFontWeight('bold');
  }
  return 'BBR View listo: ' + ss.getUrl();
}

/** Ejecuta esta función desde el editor para guardar la clave privada. */
function configurarClaveBBRView() {
  const pin = Browser.inputBox('BBR View', 'Escribe la nueva clave privada de administrador:', Browser.Buttons.OK_CANCEL);
  if (pin === 'cancel' || !/^\d{6}$/.test(pin)) throw new Error('La clave debe tener exactamente 6 números.');
  PropertiesService.getScriptProperties().setProperty('BBR_ADMIN_PIN', pin);
  return 'Clave de BBR View guardada.';
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'stats') return getStats_(p.pin, p.callback);
  if (p.action === 'track') {
    try {
      const ss = getDatabase_();
      const sheet = ss.getSheetByName('Actividad');
      if (!sheet) throw new Error('Falta la hoja Actividad. Ejecuta setupBBRDatabase().');
      const visitor = String(p.visitor || '').slice(0,80);
      if (!visitor) throw new Error('Visitante no válido');
      sheet.appendRow([new Date(), visitor, String(p.path||'').slice(0,250), String(p.title||'').slice(0,250), String(p.product||'').slice(0,150), String(p.event||'page_view').slice(0,40)]);
      return output_({ok:true});
    } catch(err) { return output_({ok:false,error:String(err.message||err)}); }
  }
  return output_({ok:true,service:'BBR View'});
}

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    let order;
    if (params.payload) order = JSON.parse(params.payload);
    else if (e && e.postData && e.postData.contents) order = JSON.parse(e.postData.contents);
    else return output_({ok:false,error:'Solicitud vacía'});

    const required = ['customer_name','customer_phone','product_name','quantity','total_xaf','delivery_address'];
    required.forEach(k => { if (order[k] === undefined || order[k] === null || String(order[k]).trim() === '') throw new Error('Falta el dato: '+k); });
    const amount = Number(order.total_xaf), quantity = Number(order.quantity);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(quantity) || quantity < 1) throw new Error('Importe o cantidad no válidos');

    const sheet = getDatabase_().getSheetByName('Pedidos');
    if (!sheet) throw new Error('Falta la hoja Pedidos. Ejecuta setupBBRDatabase().');
    const id = 'BBR-' + Utilities.getUuid().slice(0,8).toUpperCase();
    const date = new Date();
    sheet.appendRow([id,date,order.customer_name,order.customer_phone,order.product_name,quantity,Number(order.unit_price_xaf||0),amount,order.delivery_address,order.payment_method||'Efectivo contra entrega',order.status||'REALIZADO']);

    const subject = '🛍️ Pedido realizado +' + amount.toLocaleString('es-ES') + ' XAF';
    const body = '¡NUEVO PEDIDO REALIZADO EN BBR!\n\nIMPORTE SOLICITADO: '+amount.toLocaleString('es-ES')+' XAF\nCÓDIGO: '+id+'\nCLIENTE: '+order.customer_name+'\nTELÉFONO / WHATSAPP: '+order.customer_phone+'\nPRODUCTO: '+order.product_name+'\nCANTIDAD: '+quantity+'\nDIRECCIÓN: '+order.delivery_address+'\nPAGO: '+(order.payment_method||'Efectivo contra entrega')+'\nESTADO: '+(order.status||'REALIZADO')+'\n\nBBR — Soluciones inteligentes. Una vida mejor.';
    MailApp.sendEmail({to:BBR_EMAIL,subject:subject,body:body,name:'BBR Tienda'});
    return output_({ok:true,id:id});
  } catch(err) {
    console.error(err);
    return output_({ok:false,error:String(err.message||err)});
  }
}

function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty('BBR_SHEET_ID');
  if (!id) throw new Error('Primero ejecuta setupBBRDatabase() desde Apps Script.');
  return SpreadsheetApp.openById(id);
}

function getStats_(pin, callback) {
  const savedPin = PropertiesService.getScriptProperties().getProperty('BBR_ADMIN_PIN');
  if (!savedPin || pin !== savedPin) return output_({ok:false,error:'Clave incorrecta o aún no configurada.'}, callback);
  try {
    const ss = getDatabase_(), orderSheet = ss.getSheetByName('Pedidos'), activitySheet = ss.getSheetByName('Actividad');
    const rows = orderSheet ? orderSheet.getDataRange().getValues().slice(1).filter(r=>r[0]) : [];
    const activity = activitySheet ? activitySheet.getDataRange().getValues().slice(1).filter(r=>r[0]) : [];
    const gross = rows.reduce((s,r)=>s+Number(r[7]||0),0);
    const completed = rows.filter(r=>String(r[10]).toUpperCase()==='COMPLETADO').length;
    const clients = new Set(rows.map(r=>String(r[2]).trim().toLowerCase()).filter(Boolean)).size;
    const today = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');
    const todayActivity = activity.filter(r=>Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),'yyyy-MM-dd')===today);
    const visitorsToday = new Set(todayActivity.map(r=>String(r[1]))).size;
    const uniqueVisitors = new Set(activity.map(r=>String(r[1]))).size;
    const productCounts = {};
    activity.filter(r=>r[4]).forEach(r=>{const k=String(r[4]);productCounts[k]=(productCounts[k]||0)+1;});
    const topProducts = Object.keys(productCounts).map(k=>({product:k,views:productCounts[k]})).sort((a,b)=>b.views-a.views).slice(0,8);
    const recent = rows.slice(-50).reverse().map(r=>({id:r[0],date:r[1] instanceof Date?Utilities.formatDate(r[1],Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'):String(r[1]),customer:r[2],phone:r[3],products:r[4],quantity:r[5],total:Number(r[7]||0),address:r[8],status:r[10]}));
    const data = {ok:true,metrics:{grossSales:gross,orders:rows.length,clients:clients,pending:rows.length-completed,completed:completed,units:rows.reduce((s,r)=>s+Number(r[5]||0),0),averageTicket:rows.length?Math.round(gross/rows.length):0,viewsToday:todayActivity.length,visitorsToday:visitorsToday,totalViews:activity.length,uniqueVisitors:uniqueVisitors,productViews:activity.filter(r=>r[4]).length},recent:recent,topProducts:topProducts};
    return output_(data,callback);
  } catch(err) { return output_({ok:false,error:String(err.message||err)},callback); }
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  if (callback && /^[a-zA-Z_$][0-9a-zA-Z_$\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
