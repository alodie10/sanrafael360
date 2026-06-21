module.exports = async (strapi) => {
  const negocio = await strapi.documents('api::negocio.negocio').findOne({
    documentId: 'hhvpwru2dvmm1e8septtux29'
  });
  console.log("negocio id:", negocio.id);
  console.log("negocio documentId:", negocio.documentId);
  
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: 1 },
    populate: ['favoritos']
  });
  console.log("user favoritos:", JSON.stringify(user?.favoritos, null, 2));
};
