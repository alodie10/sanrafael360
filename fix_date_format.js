const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

const brokenPart = `      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: premium_valid_until || null
        }
      });`;

const fixedPart = `      let validUntilISO = null;
      if (premium_valid_until) {
         const d = new Date(premium_valid_until);
         d.setHours(12, 0, 0, 0); // Evitar problemas de timezone
         validUntilISO = d.toISOString();
      }

      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        }
      });`;

code = code.replace(brokenPart, fixedPart);
fs.writeFileSync(controllerPath, code);
console.log("Fixed date format in backend");
