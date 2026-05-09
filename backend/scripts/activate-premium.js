
async function run() {
  const strapi = require('@strapi/strapi');
  const app = await strapi().load();
  
  const externalReference = "afga4e2wnl804a026ny7la0j"; // Agata Viajes
  
  console.log(`🚀 Iniciando activación manual para: ${externalReference}`);
  
  try {
    const result = await app.service('api::pago.pago').handlePaymentSuccess(externalReference, 'MANUAL_ACTIVATION_SCRATCH');
    console.log(`✅ Resultado: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
  
  process.exit(0);
}

run();
