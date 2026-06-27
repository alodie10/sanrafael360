const fs = require('fs');

// We will inject a temporary route to test what is happening with update and publish
let routesPath = 'backend/src/api/negocio/routes/portal-actions.ts';
let routesCode = fs.readFileSync(routesPath, 'utf-8');

if (!routesCode.includes('/negocios/test-publish-bug')) {
  routesCode = routesCode.replace('  ],\n};', `    {
      method: 'GET',
      path: '/negocios/test-publish-bug/:documentId',
      handler: 'negocio.testPublishBug',
      config: { auth: false, policies: [], middlewares: [] },
    },\n  ],\n};`);
  fs.writeFileSync(routesPath, routesCode);
}

let controllerPath = 'backend/src/api/negocio/controllers/negocio.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf-8');

if (!controllerCode.includes('testPublishBug(ctx)')) {
  const handler = `  async testPublishBug(ctx) {
    const { documentId } = ctx.params;
    const extendMonths = 2;
    
    let logs = [];
    const negocioObj = await strapi.documents('api::negocio.negocio').findOne({ documentId });
    logs.push("Found: " + !!negocioObj);
    if (negocioObj) {
      logs.push("Current valid: " + negocioObj.premium_valid_until);
      const validUntil = negocioObj.premium_valid_until ? new Date(negocioObj.premium_valid_until) : new Date();
      validUntil.setMonth(validUntil.getMonth() + extendMonths);
      logs.push("New valid: " + validUntil.toISOString());
      
      const updated = await strapi.documents('api::negocio.negocio').update({
        documentId,
        data: {
          premium_valid_until: validUntil.toISOString()
        }
      });
      logs.push("Updated draft: " + updated.premium_valid_until);
      
      if (negocioObj.publishedAt) {
        const pub = await strapi.documents('api::negocio.negocio').publish({ documentId });
        logs.push("Published: " + pub.premium_valid_until);
      }
    }
    ctx.send({ logs });
  },
`;
  controllerCode = controllerCode.replace('async adminCreatePayment(ctx) {', handler + '\n  async adminCreatePayment(ctx) {');
  fs.writeFileSync(controllerPath, controllerCode);
}
console.log("Injected test route");
