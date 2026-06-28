const { createStrapi } = require('@strapi/strapi');

(async () => {
  const app = await createStrapi().load();
  try {
    const algolia = require('./src/api/negocio/services/algolia');
    console.log("Checking algolia:", algolia);
  } catch (err) {
    console.error("Error loading algolia module:", err);
  }
  process.exit(0);
})();
