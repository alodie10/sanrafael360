const { createStrapi } = require('@strapi/strapi');

(async () => {
  const strapi = await createStrapi().load();
  try {
    const res = await strapi.documents('api::oferta.oferta').create({
      data: {
        titulo: "Test Oferta",
        activa: true,
        negocio: "an_existing_id"
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error creating oferta:");
    console.error(err);
    console.error(err.stack);
  }
  process.exit(0);
})();
