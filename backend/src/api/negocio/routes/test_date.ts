export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/admin/check-date',
      handler: async (ctx) => {
        try {
          const negs = await strapi.documents('api::negocio.negocio').findMany({ filters: { nombre: { $contains: 'Ortubia' } }, populate: ['pagos'] });
          ctx.send({ 
            pagos: negs[0]?.pagos
          });
        } catch (e) {
          ctx.send({ error: e.message });
        }
      },
      config: { auth: false, policies: [] }
    }
  ]
}
