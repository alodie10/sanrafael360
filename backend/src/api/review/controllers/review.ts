import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    try {
      const { data } = ctx.request.body;
      strapi.log.info(`[Review-Create] Intento de creación por usuario ${user.id} para negocio ${data.negocio}`);

      // 1. VALIDACIÓN DE SEGURIDAD (EL GUARDIA)
      if (data.negocio) {
        const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
          documentId: data.negocio,
          populate: ['owner']
        });

        if (negocio) {
          const ownerId = negocio.owner?.documentId || negocio.owner?.id;
          const currentUserId = user.documentId || user.id;

          if (ownerId && String(ownerId) === String(currentUserId)) {
            return ctx.badRequest("No puedes dejar una reseña en tu propio negocio.");
          }
        }
      }

      // 2. CORRECCIÓN DE LLAVE (Blindaje contra desajuste de esquema)
      // Strapi 5 puede ser muy quisquilloso. Intentamos asignar el autor de la sesión.
      // Si el esquema es 'autor', lo ponemos ahí.
      const userIdToLink = user.documentId || user.id;
      data.autor = userIdToLink;
      
      // Por las dudas, eliminamos llaves viejas que puedan venir del frontend
      delete data.usuario;
      delete data.user;

      strapi.log.info(`[Review-Create] Payload final: ${JSON.stringify(data)}`);

      const response = await super.create(ctx);
      return response;

    } catch (err: any) {
      strapi.log.error(`[Review-Create] ERROR CRÍTICO: ${err.message}`);
      // Si el error es "Invalid key", Strapi tirará 500 antes de llegar aquí si el core falla,
      // pero si llega aquí, devolvemos un error claro.
      return ctx.internalServerError(`Error en el servidor: ${err.message}`);
    }
  }
}));
