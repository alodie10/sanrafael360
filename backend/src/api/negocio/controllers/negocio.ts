import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async claim(ctx) {
    try {
      const { id } = ctx.params;
      const { message } = ctx.request.body;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado para reclamar un negocio');
      }

      // Check if business exists
      const negocio = await strapi.entityService.findOne('api::negocio.negocio', id, {
        populate: ['owner']
      });

      if (!negocio) {
        return ctx.notFound('Negocio no encontrado');
      }

      if ((negocio as any).owner && negocio.estado_reclamo !== 'ninguno') {
        return ctx.badRequest('El negocio ya tiene un reclamo en proceso o asignado a un propietario');
      }

      // Update business state
      const updatedNegocio = await strapi.entityService.update('api::negocio.negocio', id, {
        data: {
          estado_reclamo: 'pendiente',
          owner: user.id
        }
      });
      
      // Notify Admin
      try {
        await strapi.plugin('email').service('email').send({
          to: 'diegocristianalonso@gmail.com',
          from: 'admin@sanrafael360.com',
          subject: `Nuevo reclamo de negocio: ${negocio.nombre}`,
          text: `El usuario ${user.email} ha solicitado reclamar el negocio "${negocio.nombre}".\n\nMensaje: ${message || 'Sin mensaje'}\n\nPor favor aprueba o rechaza el reclamo desde el panel de Strapi.`,
        });
      } catch (err) {
        console.error('Error sending claim email:', err);
      }

      return ctx.send({ message: 'Reclamo enviado correctamente', data: updatedNegocio });

    } catch (err) {
      console.error(err);
      return ctx.internalServerError('Error interno al procesar el reclamo');
    }
  }
}));
