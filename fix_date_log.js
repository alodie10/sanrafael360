const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

const targetPart = `      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        }
      });`;

const newPart = `      const updatedObj = await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        }
      });
      console.log("UPDATE RETURNED:", updatedObj.premium_valid_until);`;

code = code.replace(targetPart, newPart);
fs.writeFileSync(controllerPath, code);
console.log("Added logging");
