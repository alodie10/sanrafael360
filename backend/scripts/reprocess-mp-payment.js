/**
 * Reprocesa un webhook de pago MP (confirmación de reserva).
 * Uso: node scripts/reprocess-mp-payment.js <paymentId>
 * En prod: railway run -s sanrafael360 -- node scripts/reprocess-mp-payment.js <id>
 */
const { createStrapi } = require('@strapi/strapi');

async function main() {
  const paymentId = process.argv[2];
  if (!paymentId) {
    console.error('Uso: node scripts/reprocess-mp-payment.js <paymentId>');
    process.exit(1);
  }

  const app = await createStrapi({ distDir: './dist' }).load();
  try {
    const { processReservaPaymentNotification } = require('../dist/src/api/reserva/services/checkout');
    const result = await processReservaPaymentNotification(app, String(paymentId));
    console.log(JSON.stringify({ ok: true, paymentId, result }, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
