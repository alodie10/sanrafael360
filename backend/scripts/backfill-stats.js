const strapi = require('@strapi/strapi');

async function run() {
  const app = await strapi().load();
  
  const negocios = await app.documents('api::negocio.negocio').findMany({ limit: -1 });
  console.log(`Encontrados ${negocios.length} negocios.`);
  
  let count = 0;
  for (const n of negocios) {
    if (Number(n.views) > 0 || Number(n.clicks_whatsapp) > 0 || Number(n.clicks_website) > 0) {
      await app.documents('api::daily-stat.daily-stat').create({
        data: {
          negocio_id: n.documentId,
          date: '2026-05-15',
          views: Number(n.views) || 0,
          clicks_whatsapp: Number(n.clicks_whatsapp) || 0,
          clicks_website: Number(n.clicks_website) || 0
        },
        status: 'published'
      });
      count++;
    }
  }
  
  console.log(`Backfill completado. Se crearon ${count} registros de daily-stat para el 15 de Mayo de 2026.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
