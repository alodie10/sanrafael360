const strapi = require('@strapi/strapi');

async function test() {
  const app = await strapi().load();
  const dbUser = await app.db.query('plugin::users-permissions.user').findOne({
    where: { id: 9 },
    populate: ['favoritos'],
  });
  console.log("Favoritos antes:", dbUser.favoritos.length);
  if (dbUser.favoritos.length > 0) {
    const negocioId = dbUser.favoritos[0].id;
    console.log("Disconnecting", negocioId);
    await app.db.query('plugin::users-permissions.user').update({
      where: { id: 9 },
      data: {
        favoritos: { disconnect: [{ id: negocioId }] }
      }
    });
    const after = await app.db.query('plugin::users-permissions.user').findOne({
      where: { id: 9 },
      populate: ['favoritos'],
    });
    console.log("Favoritos después:", after.favoritos.length);
  }
  process.exit(0);
}
test();
