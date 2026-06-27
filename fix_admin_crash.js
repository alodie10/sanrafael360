const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

const target = `const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        }
      });`;

const replacement = `const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado: estado || 'aprobado',
          fecha_pago,
          external_reference: external_reference || "",
          mp_preference_id: "manual_" + Date.now(), // Asegurar que sea string
          mp_payment_id: "manual_" + Date.now(),    // Asegurar que sea string
          negocio
        },
        status: 'published'
      });`;

controllerCode = controllerCode.replace(target, replacement);
fs.writeFileSync(controllerPath, controllerCode);
console.log("Patched adminCreatePayment to prevent undefined string fields.");
