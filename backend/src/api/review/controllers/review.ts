import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review' as any, ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    try {
      const body = ctx.request.body as any;
      const data = body.data || {};
      
      strapi.log.info(`[Review-Create] Intento de creación por usuario ${user.id} para negocio ${data.negocio}`);

      // 1. VALIDACIÓN DE SEGURIDAD (EL GUARDIA)
      if (data.negocio) {
        const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
          documentId: data.negocio,
          populate: ['owner']
        });

        if (negocio) {
          const ownerId = (negocio.owner as any)?.documentId || (negocio.owner as any)?.id;
          const currentUserId = user.documentId || user.id;

          if (ownerId && String(ownerId) === String(currentUserId)) {
            return ctx.badRequest("No puedes dejar una reseña en tu propio negocio.");
          }
        }
      }

      // 2. CORRECCIÓN DE LLAVE (Blindaje contra desajuste de esquema)
      const userIdToLink = user.documentId || user.id;
      data.autor = userIdToLink;
      
      // Eliminamos llaves viejas
      delete data.usuario;
      delete data.user;

      strapi.log.info(`[Review-Create] Payload final: ${JSON.stringify(data)}`);

      // Pasamos el contexto actualizado
      ctx.request.body.data = data;
      const response = await super.create(ctx);
      return response;

    } catch (err: any) {
      strapi.log.error(`[Review-Create] ERROR CRÍTICO: ${err.message}`);
      return ctx.internalServerError(`Error en el servidor: ${err.message}`);
    }
  }
}));
