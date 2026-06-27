const fs = require('fs');
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let code = fs.readFileSync(controllerPath, 'utf-8');

const targetPart = `      const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId });
      if (negocioObj && negocioObj.publishedAt) {
         await strapi.documents('api::negocio.negocio').publish({ documentId });
      }`;

const newPart = `      await strapi.documents('api::negocio.negocio').publish({ documentId });`;

code = code.replace(targetPart, newPart);
fs.writeFileSync(controllerPath, code);
console.log("Forced publish in backend");
