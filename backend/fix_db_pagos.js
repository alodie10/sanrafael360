const fs = require('fs');

async function fix() {
  const strapi = require('@strapi/strapi')();
  await strapi.load();
  
  const pagos = await strapi.documents('api::pago.pago').findMany({ limit: -1 });
  
  for (const p of pagos) {
    let changed = false;
    const data = {};
    
    if (!p.mp_preference_id) {
      data.mp_preference_id = 'manual_' + p.id;
      changed = true;
    }
    if (!p.mp_payment_id) {
      data.mp_payment_id = 'manual_' + p.id;
      changed = true;
    }
    if (!p.external_reference) {
      data.external_reference = 'manual_' + p.id;
      changed = true;
    }
    
    if (changed) {
      await strapi.documents('api::pago.pago').update({
        documentId: p.documentId,
        data,
        status: 'published'
      });
      console.log('Fixed pago:', p.id);
    }
  }
  
  console.log("Done");
  process.exit(0);
}

fix().catch(console.error);
