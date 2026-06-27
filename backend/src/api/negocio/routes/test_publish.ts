export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/admin/test-publish',
      handler: async (ctx) => {
        try {
          const docs = await strapi.documents('api::negocio.negocio').findMany({ limit: 1 });
          if (!docs.length) return ctx.send("No docs");
          
          const doc = docs[0];
          
          await strapi.documents('api::negocio.negocio').update({
            documentId: doc.documentId,
            data: { premium_valid_until: "2030-01-01T00:00:00.000Z" },
            status: 'draft'
          });
          
          await strapi.documents('api::negocio.negocio').update({
            documentId: doc.documentId,
            data: { premium_valid_until: "2031-01-01T00:00:00.000Z" },
            status: 'published'
          });

          const draft = await strapi.documents('api::negocio.negocio').findOne({ documentId: doc.documentId, status: 'draft' });
          const pub = await strapi.documents('api::negocio.negocio').findOne({ documentId: doc.documentId, status: 'published' });

          return ctx.send({
            draft_date: draft.premium_valid_until,
            published_date: pub?.premium_valid_until
          });
        } catch (e) {
          return ctx.send({ error: e.message });
        }
      },
      config: { auth: false }
    }
  ]
}
