
async function activate() {
  const businessId = 'nll3g521utlohf90cig60pcs'; // ID de After House sacado de tus logs
  console.log(`🚀 Activando Premium para After House (${businessId})...`);
  
  try {
    const result = await strapi.service('api::pago.pago').handlePaymentSuccess(businessId, 'MANUAL_ACTIVATION_' + Date.now());
    console.log('✅ Éxito:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

activate();
