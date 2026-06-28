const strapi = require('@strapi/strapi');

(async () => {
  const app = await strapi().load();
  try {
    const res = await app.documents('api::oferta.oferta').create({
      data: {
        titulo: 'Prueba',
        status: 'published',
        publishedAt: new Date().toISOString(),
        valida_desde: new Date().toISOString(),
        valida_hasta: new Date().toISOString(),
        activa: true
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error creating:", err);
  }
  process.exit(0);
})();
