import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async claim(ctx) {
    try {
      const { id } = ctx.params;
      const { message } = ctx.request.body;
      const user = ctx.state.user;

      console.log(`🚀 Iniciando proceso de reclamo para negocio ID: ${id} por usuario: ${user?.email}`);

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado para reclamar un negocio');
      }

      // 1. Buscar el negocio (usando Document API para Strapi 5)
      const negocio = await (strapi as any).documents('api::negocio.negocio').findFirst({
        documentId: id,
        populate: ['owner']
      });

      if (!negocio) {
        console.error(`❌ Negocio no encontrado: ${id}`);
        return ctx.notFound('Negocio no encontrado');
      }

      if (negocio.owner && negocio.estado_reclamo !== 'ninguno') {
        return ctx.badRequest('El negocio ya tiene un reclamo en proceso o asignado a un propietario');
      }

      // 2. Actualizar el estado del negocio
      // Usamos db.query como fallback ultra-robusto si Documents API da problemas con relaciones de usuarios
      console.log(`📝 Actualizando estado de reclamo para: ${negocio.nombre}`);
      
      const updatedNegocio = await (strapi as any).documents('api::negocio.negocio').update({
        documentId: id,
        data: {
          estado_reclamo: 'pendiente',
          owner: user.id // Relación con el ID numérico del usuario
        }
      });
      
      console.log(`✅ Negocio actualizado exitosamente. Estado: pendiente`);

      // 3. Notificar al Admin (TOTALMENTE ASÍNCRONO - FIRE & FORGET)
      // No usamos 'await' para que la respuesta al usuario sea instantánea
      try {
        const emailService = strapi.plugin('email')?.service('email');
        if (emailService) {
          emailService.send({
            to: 'diegocristianalonso@gmail.com',
            from: 'admin@sanrafael360.com',
            subject: `Nuevo reclamo de negocio: ${negocio.nombre}`,
            text: `El usuario ${user.email} ha solicitado reclamar el negocio "${negocio.nombre}".\n\nMensaje: ${message || 'Sin mensaje'}\n\nPor favor aprueba o rechaza el reclamo desde el panel de Strapi.`,
          }).catch((err: any) => console.error('❌ Error asíncrono enviando email:', err.message));
          
          console.log('✉️ Proceso de envío de email iniciado (background).');
        }
      } catch (err: any) {
        console.warn('⚠️ No se pudo iniciar el servicio de email:', err.message);
      }

      return ctx.send({ 
        message: 'Reclamo enviado correctamente', 
        data: {
          id: updatedNegocio.id,
          documentId: updatedNegocio.documentId,
          estado_reclamo: 'pendiente'
        } 
      });

    } catch (err: any) {
      console.error('💥 ERROR CRÍTICO en /claim:', err.message);
      console.error(err.stack);
      return ctx.internalServerError(`Error interno al procesar el reclamo: ${err.message}`);
    }
  }
}));
