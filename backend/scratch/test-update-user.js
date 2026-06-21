const strapi = require('@strapi/strapi');

(async () => {
  const app = await strapi().load();
  
  try {
     const user = await app.db.query('plugin::users-permissions.user').findOne({ where: { id: 9 } });
     console.log("Found user documentId:", user.documentId);
     
     await app.documents('plugin::users-permissions.user').update({
       documentId: user.documentId,
       data: {
         favoritos: [] // empty
       }
     });
     console.log("Update successful via documents!");
  } catch (e) {
     console.error("Update via documents failed:", e.message);
     try {
       await app.entityService.update('plugin::users-permissions.user', user.id, {
         data: { favoritos: [] }
       });
       console.log("Update successful via entityService!");
     } catch (e2) {
       console.error("Update via entityService failed:", e2.message);
     }
  }
  process.exit(0);
})();
