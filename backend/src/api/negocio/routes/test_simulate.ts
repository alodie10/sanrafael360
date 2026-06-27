export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/admin/simulate',
      handler: async (ctx) => {
        try {
          const negocio = 'y4yeaeb7hut7c9jl0fjy91mg'; // MAJAL SUSHI

          // Fetch current
          const b1 = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio, populate: ['pagos'] });
          const beforeCount = b1.pagos?.length || 0;

          // 1. Crear el pago
          await strapi.documents('api::pago.pago').create({
            data: {
              monto: 999,
              estado: 'aprobado',
              fecha_pago: new Date().toISOString(),
              external_reference: 'TEST_SIMULATE',
              negocio
            }
          });

          // Fetch after create
          const b2 = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio, populate: ['pagos'] });
          const afterCreateCount = b2.pagos?.length || 0;

          // 2. Update draft
          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: { is_premium: true },
            status: 'draft'
          });

          // Fetch after draft update
          const b3 = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio, populate: ['pagos'] });
          const afterDraftCount = b3.pagos?.length || 0;

          // 3. Update published
          await strapi.documents('api::negocio.negocio').update({
            documentId: negocio,
            data: { is_premium: true },
            status: 'published'
          });

          // Fetch after published update
          const b4 = await strapi.documents('api::negocio.negocio').findOne({ documentId: negocio, populate: ['pagos'] });
          const afterPublishedCount = b4.pagos?.length || 0;

          ctx.send({ 
            beforeCount, 
            afterCreateCount, 
            afterDraftCount, 
            afterPublishedCount
          });
        } catch (e) {
          ctx.send({ error: e.message });
        }
      },
      config: { auth: false, policies: [] }
    }
  ]
}
