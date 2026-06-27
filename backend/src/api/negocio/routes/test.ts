export default {
  routes: [
    {
      method: 'GET',
      path: '/test',
      handler: async (ctx) => {
        try {
          const negs = await strapi.documents('api::negocio.negocio').findMany({});
          if (negs.length === 0) return ctx.send("No negocios");
          
          const docId = negs[0].documentId;
          const current = negs[0].premium_valid_until;
          
          await strapi.documents('api::negocio.negocio').update({
            documentId: docId,
            data: { premium_valid_until: "2099-01-01" }
          });
          
          const mid = await strapi.documents('api::negocio.negocio').findOne({ documentId: docId, status: 'draft' });
          
          await strapi.documents('api::negocio.negocio').publish({ documentId: docId });
          
          const final = await strapi.documents('api::negocio.negocio').findOne({ documentId: docId });
          
          ctx.send({ current, draftAfterUpdate: mid?.premium_valid_until, finalAfterPublish: final?.premium_valid_until });
        } catch (e) {
          ctx.send({ error: e.message });
        }
      },
      config: { auth: false, policies: [] }
    }
  ]
}
