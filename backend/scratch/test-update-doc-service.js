const strapi = require('@strapi/strapi');

(async () => {
  const app = await strapi().load();
  
  // Try to update user using document service
  try {
     const user = await app.documents('plugin::users-permissions.user').findOne({
       documentId: 'u4ntvsqsif1j8a2tkk1v10o8', // user 9's document ID if I can find it? Wait, I don't know it.
       populate: ['favoritos']
     });
     console.log("User:", user);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
})();
