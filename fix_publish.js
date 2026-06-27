const fs = require('fs');

let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

const brokenPart = `          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });
        }`;

const fixedPart = `          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: {
              is_premium: true,
              premium_valid_until: baseDate.toISOString()
            }
          });
          
          if (negocioObj.publishedAt) {
            await strapi.documents('api::negocio.negocio').publish({ documentId: negocio });
          }
        }`;

code = code.replace(brokenPart, fixedPart);
fs.writeFileSync(controllerPath, code);
console.log("Fix applied!");
