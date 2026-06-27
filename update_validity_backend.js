const fs = require('fs');

// 1. Modificar Rutas
let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let routesCode = fs.readFileSync(routesPath, 'utf-8');

const newRoutes = `    {
      method: 'PUT',
      path: '/negocios/admin/vigencia/:documentId',
      handler: 'negocio.adminUpdateValidity',
      config: { policies: [], middlewares: [] },
    },
  ],
};`;

routesCode = routesCode.replace('  ],\n};', newRoutes);
fs.writeFileSync(routesPath, routesCode);

// 2. Modificar Controlador
let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

const newHandlers = `  async adminUpdateValidity(ctx) {
    try {
      const { documentId } = ctx.params;
      const { premium_valid_until } = ctx.request.body;
      
      const is_premium = premium_valid_until ? (new Date(premium_valid_until) >= new Date(new Date().setHours(0,0,0,0))) : false;

      await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          is_premium,
          premium_valid_until: premium_valid_until || null
        }
      });

      const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId });
      if (negocioObj && negocioObj.publishedAt) {
         await strapi.documents('api::negocio.negocio').publish({ documentId });
      }

      ctx.send({ success: true });
    } catch (err) {
      console.error(err);
      ctx.badRequest("Error actualizando vigencia");
    }
  },
`;

// Insert the new handler before adminCreatePayment
controllerCode = controllerCode.replace('async adminCreatePayment(ctx) {', newHandlers + '\n  async adminCreatePayment(ctx) {');
fs.writeFileSync(controllerPath, controllerCode);

console.log("Backend updated!");
