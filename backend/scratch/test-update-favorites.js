const strapi = require('@strapi/strapi');

(async () => {
  const app = await strapi().load();
  
  // Try to add negocio ID 1 to user ID 9
  const result = await app.db.query('plugin::users-permissions.user').update({
    where: { id: 9 },
    data: {
      favoritos: [1]
    }
  });
  
  console.log("Update result:", result);
  
  // Verify
  const user = await app.db.query('plugin::users-permissions.user').findOne({
    where: { id: 9 },
    populate: ['favoritos']
  });
  
  console.log("Favorites after update:", user.favoritos.map(f => f.id));
  process.exit(0);
})();
