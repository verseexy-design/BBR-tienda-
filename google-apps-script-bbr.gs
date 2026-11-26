/** BBR View: pedidos leídos desde Gmail; solo la analítica anónima de visitas usa Sheets.
 * Ejecuta setupBBRDatabase() una vez si aún no existe la hoja Actividad.
 * Configura la clave con configurarClaveBBRView() y vuelve a implementar el Web App.
 */
const BBR_EMAIL = 'verseexy@gmail.com';
const BBR_ORDER_SUBJECTS = ['Pedido realizado', 'Nuevo pedido recibido'];

function setupBBRDatabase() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('BBR_SHEET_ID');
  let ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('BBR View - Analítica de visitas');
  if (!id) props.setProperty('BBR_SHEET_ID', ss.getId());
  let activity = ss.getSheetByName('Actividad');
  if (!activity) activity = ss.insertSheet('Actividad');
  if (activity.getLastRow() === 0) {
    activity.appendRow(['Fecha','Visitante anónimo','Página','Título','Producto','Evento']);
    activity.setFrozenRows(1);
    activity.getRange(1,1,1,6).setFontWeight('bold');
  }
  return 'BBR View listo. Los pedidos se consultan directamente desde Gmail. Analítica: ' + ss.getUrl();
}

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
      const sheet = getActivitySheet_();
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

    const id = 'BBR-' + Utilities.getUuid().slice(0,8).toUpperCase();
    const subject = '🛍️ Nuevo pedido recibido · +' + amount.toLocaleString('es-ES') + ' FCFA';
    const body = '¡PEDIDO RECIBIDO CORRECTAMENTE EN BBR!\\n\\nIMPORTE DEL PEDIDO: '+amount.toLocaleString('es-ES')+' FCFA\\nCÓDIGO: '+id+'\\nCLIENTE: '+order.customer_name+'\\nTELÉFONO / WHATSAPP: '+order.customer_phone+'\\nPRODUCTO: '+order.product_name+'\\nCANTIDAD: '+quantity+'\\nDIRECCIÓN: '+order.delivery_address+'\\nPAGO: '+(order.payment_method||'Efectivo contra entrega')+'\\nESTADO: '+(order.status||'PEDIDO RECIBIDO')+'\\n\\nNota: el pedido ha sido recibido; el pago aún no se considera cobrado.\\n\\nBBR — Soluciones inteligentes. Una vida mejor.';
    MailApp.sendEmail({to:BBR_EMAIL,subject:subject,body:body,name:'BBR SHOP'});
    return output_({ok:true,id:id});
  } catch(err) {
    console.error(err);
    return output_({ok:false,error:String(err.message||err)});
  }
}

function getActivitySheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('BBR_SHEET_ID');
  if (!id) throw new Error('Falta configurar la analítica. Ejecuta setupBBRDatabase() desde Apps Script.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName('Actividad');
  if (!sheet) throw new Error('Falta la hoja Actividad. Ejecuta setupBBRDatabase().');
  return sheet;
}

function parseOrderEmail_(message) {
  const body = message.getPlainBody();
  const field = label => {
    const re = new RegExp('(?:^|\\n)'+label+':\\s*([^\\n]*)','i');
    const match = body.match(re);
    return match ? match[1].trim() : '';
  };
  const amountText = field('IMPORTE DEL PEDIDO').replace(/[^0-9]/g,'');
  const quantity = Number(field('CANTIDAD')) || 0;
  return {
    id: field('CÓDIGO') || message.getId(),
    date: message.getDate(),
    customer: field('CLIENTE'),
    phone: field('TELÉFONO / WHATSAPP'),
    products: field('PRODUCTO'),
    quantity: quantity,
    total: Number(amountText) || 0,
    status: field('ESTADO') || 'REALIZADO'
  };
}

function getStats_(pin, callback) {
  const savedPin = PropertiesService.getScriptProperties().getProperty('BBR_ADMIN_PIN');
  if (!savedPin || pin !== savedPin) return output_({ok:false,error:'Clave incorrecta o aún no configurada.'}, callback);
  try {
    const query = 'to:'+BBR_EMAIL+' {subject:"Pedido realizado" subject:"Nuevo pedido recibido"}';
    const threads = GmailApp.search(query, 0, 500);
    let orders = [];
    threads.forEach(thread => thread.getMessages().forEach(message => {
      const subject = message.getSubject();
      if (BBR_ORDER_SUBJECTS.some(label => subject.indexOf(label) !== -1)) orders.push(parseOrderEmail_(message));
    }));
    orders.sort((a,b)=>a.date-b.date);
    const activitySheet = getActivitySheet_();
    const activity = activitySheet.getDataRange().getValues().slice(1).filter(r=>r[0]);
    const gross = orders.reduce((s,o)=>s+o.total,0);
    const completed = orders.filter(o=>String(o.status).toUpperCase()==='COMPLETADO').length;
    const clients = new Set(orders.map(o=>String(o.customer).trim().toLowerCase()).filter(Boolean)).size;
    const today = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd');
    const todayActivity = activity.filter(r=>Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone(),'yyyy-MM-dd')===today);
    const visitorsToday = new Set(todayActivity.map(r=>String(r[1]))).size;
    const uniqueVisitors = new Set(activity.map(r=>String(r[1]))).size;
    const productCounts = {};
    activity.filter(r=>r[4]).forEach(r=>{const k=String(r[4]);productCounts[k]=(productCounts[k]||0)+1;});
    const topProducts = Object.keys(productCounts).map(k=>({product:k,views:productCounts[k]})).sort((a,b)=>b.views-a.views).slice(0,8);
    const recent = orders.slice(-50).reverse().map(o=>({id:o.id,date:Utilities.formatDate(o.date,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'),customer:o.customer,phone:o.phone,products:o.products,quantity:o.quantity,total:o.total,status:o.status}));
    const data = {ok:true,metrics:{grossSales:gross,orders:orders.length,clients:clients,pending:orders.length-completed,completed:completed,units:orders.reduce((s,o)=>s+o.quantity,0),averageTicket:orders.length?Math.round(gross/orders.length):0,viewsToday:todayActivity.length,visitorsToday:visitorsToday,totalViews:activity.length,uniqueVisitors:uniqueVisitors,productViews:activity.filter(r=>r[4]).length},recent:recent,topProducts:topProducts};
    return output_(data,callback);
  } catch(err) { return output_({ok:false,error:String(err.message||err)},callback); }
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  if (callback && /^[a-zA-Z_$][0-9a-zA-Z_$\\.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
