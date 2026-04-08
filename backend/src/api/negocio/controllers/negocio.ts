import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async claim(ctx) {
    try {
      const { id } = ctx.params; // Esto es el documentId en Strapi 5
      const { message } = ctx.request.body;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado para reclamar un negocio');
      }

      // Strapi 5: Usamos la API de Documents para buscar por documentId
      const negocio = await (strapi as any).documents('api::negocio.negocio').findFirst({
        documentId: id,
        populate: ['owner']
      });

      if (!negocio) {
        return ctx.notFound('Negocio no encontrado');
      }

      if (negocio.owner && negocio.estado_reclamo !== 'ninguno') {
        return ctx.badRequest('El negocio ya tiene un reclamo en proceso o asignado a un propietario');
      }

      // Strapi 5: Actualizamos usando documentId
      const updatedNegocio = await (strapi as any).documents('api::negocio.negocio').update({
        documentId: id,
        data: {
          estado_reclamo: 'pendiente',
          owner: user.id
        }
      });
      
      // Notify Admin - Blindaje total para evitar 500 si falla el correo
      try {
        const emailService = strapi.plugin('email')?.service('email');
        if (emailService) {
          await emailService.send({
            to: 'diegocristianalonso@gmail.com',
            from: 'admin@sanrafael360.com',
            subject: `Nuevo reclamo de negocio: ${negocio.nombre}`,
            text: `El usuario ${user.email} ha solicitado reclamar el negocio "${negocio.nombre}".\n\nMensaje: ${message || 'Sin mensaje'}\n\nPor favor aprueba o rechaza el reclamo desde el panel de Strapi.`,
          });
          console.log('✉️ Email de notificación enviado al admin.');
        } else {
          console.warn('⚠️ Plugin de email no disponible o no configurado.');
        }
      } catch (err) {
        console.error('❌ Error no bloqueante al enviar email de reclamo:', err);
      }

      return ctx.send({ message: 'Reclamo enviado correctamente', data: updatedNegocio });

    } catch (err) {
      console.error('💥 Error crítico en el endpoint de claim:', err);
      return ctx.internalServerError('Error interno al procesar el reclamo. Por favor contacte al soporte.');
    }
  }
}));
