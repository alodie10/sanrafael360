const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

// For adminCreatePayment
const paymentTarget = `          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });

          await strapi.documents('api::negocio.negocio').publish({ documentId: negocio });`;

const paymentReplacement = `          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            },
            status: 'draft'
          });
          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            },
            status: 'published'
          });`;

code = code.replace(paymentTarget, paymentReplacement);

// For adminUpdateValidity
const validTarget = `      const updatedObj = await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        }
      });
      console.log("UPDATE RETURNED:", updatedObj.premium_valid_until);

      await strapi.documents('api::negocio.negocio').publish({ documentId });`;

const validReplacement = `      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        },
        status: 'draft'
      });
      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: validUntilISO
        },
        status: 'published'
      });`;

code = code.replace(validTarget, validReplacement);

fs.writeFileSync(controllerPath, code);
console.log("Fixed publishing bug by writing directly to both draft and published status");
