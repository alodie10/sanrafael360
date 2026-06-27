const fs = require('fs');

let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

// The original code in find(ctx) was:
//         if (fullItem?.owner) item.owner = { id: fullItem.owner.id };
//       }));
//     }
//     return { data, meta };

// Let's manually fix it by doing string replacements carefully.
// First, let's extract the new handlers I inserted:

const handlers = `  async adminCreatePayment(ctx) {
    try {
      const { monto, estado, fecha_pago, external_reference, negocio, extendMonths } = ctx.request.body;
      
      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        }
      });

      // Extender vigencia del negocio si se pidió
      if (extendMonths > 0) {
        const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio });
        if (negocioObj) {
          const now = new Date();
          const validUntil = negocioObj.premium_valid_until ? new Date(negocioObj.premium_valid_until) : new Date();
          const baseDate = validUntil < now ? now : validUntil;
          baseDate.setMonth(baseDate.getMonth() + extendMonths);

          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });
        }
      }

      ctx.send({ success: true, data: newPago });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error creando pago manual");
    }
  },

  async adminDeletePayment(ctx) {
    try {
      const { documentId } = ctx.params;
      await strapi.documents('api::pago.pago').delete({ documentId });
      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error eliminando pago");
    }
  },
`;

// Replace the broken part inside find(ctx)
const brokenPart = `        if (fullItem?.owner) item.owner = { id: fullItem.owner.id };
      
  async adminCreatePayment(ctx) {
    try {
      const { monto, estado, fecha_pago, external_reference, negocio, extendMonths } = ctx.request.body;
      
      // Crear el pago
      const newPago = await strapi.documents('api::pago.pago').create({
        data: {
          monto,
          estado,
          fecha_pago,
          external_reference,
          negocio
        }
      });

      // Extender vigencia del negocio si se pidió
      if (extendMonths > 0) {
        const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio });
        if (negocioObj) {
          const now = new Date();
          const validUntil = negocioObj.premium_valid_until ? new Date(negocioObj.premium_valid_until) : new Date();
          const baseDate = validUntil < now ? now : validUntil;
          baseDate.setMonth(baseDate.getMonth() + extendMonths);

          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });
        }
      }

      ctx.send({ success: true, data: newPago });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error creando pago manual");
    }
  },

  async adminDeletePayment(ctx) {
    try {
      const { documentId } = ctx.params;
      await strapi.documents('api::pago.pago').delete({ documentId });
      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error eliminando pago");
    }
  }
}));`;

code = code.replace(brokenPart, '        if (fullItem?.owner) item.owner = { id: fullItem.owner.id };\n      }));');

// Insert handlers at the end
code = code.replace(/}\)\);\s*$/, handlers + '}));\n');

fs.writeFileSync(controllerPath, code);
console.log("Syntax fixed!");
