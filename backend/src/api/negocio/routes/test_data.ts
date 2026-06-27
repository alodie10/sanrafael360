export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/admin/check-data',
      handler: async (ctx) => {
        try {
          // This mimics exactly what the frontend requests
          const res = await strapi.documents('api::negocio.negocio').findMany({ populate: ['pagos'] });
          ctx.send({ data: res });
        } catch (e) {
          ctx.send({ error: e.message });
        }
      },
      config: { auth: false, policies: [] }
    }
  ]
}
