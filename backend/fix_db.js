const { createStrapi } = require('@strapi/strapi');

async function fix() {
  const strapi = createStrapi({ distDir: './dist' });
  await strapi.load();
  
  const permissions = await strapi.db.query('plugin::users-permissions.permission').findMany();
  let bad = 0;
  for (const p of permissions) {
    if (!p.action || typeof p.action !== 'string') {
      console.log('Deleting bad permission:', p.id, p.action);
      await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: p.id } });
      bad++;
    }
  }
  console.log("Deleted bad permissions:", bad);
  process.exit(0);
}

fix().catch(console.error);
