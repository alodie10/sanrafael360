const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

const paymentTarget = `      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        },
        status: 'draft'
      });
      await strapi.documents('api::pago.pago').publish({ documentId: newPago.documentId });`;

const paymentReplacement = `      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        }
      });`;

code = code.replace(paymentTarget, paymentReplacement);

fs.writeFileSync(controllerPath, code);
console.log("Reverted create payment to fix server crash");
