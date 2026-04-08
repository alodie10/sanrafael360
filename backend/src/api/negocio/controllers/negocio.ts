import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::negocio.negocio', ({ strapi }) => ({
  async claim(ctx) {
    try {
      const { id } = ctx.params; // documentId en Strapi 5
      const { message } = ctx.request.body;
      const user = ctx.state.user;

      console.log(`🚀 [CLAIM] Iniciando proceso para negocio: ${id} | Usuario: ${user?.email}`);

      if (!user) {
        return ctx.unauthorized('Debes estar autenticado para reclamar un negocio');
      }

      // 1. Buscar el negocio
      // Usamos strapi.query por ser el motor más probado y estable para relaciones
      const negocio = await strapi.query('api::negocio.negocio').findOne({
        where: { documentId: id },
        populate: { owner: true }
      });

      if (!negocio) {
        console.error(`❌ [CLAIM] Negocio no encontrado: ${id}`);
        return ctx.notFound('Negocio no encontrado');
      }

      if (negocio.owner && negocio.estado_reclamo !== 'ninguno') {
        return ctx.badRequest('El negocio ya tiene un reclamo en proceso o asignado a un propietario');
      }

      // 2. Actualización de Base de Datos (PRIORIDAD ABSOLUTA)
      console.log(`📝 [CLAIM] Actualizando base de datos para: ${negocio.nombre}`);
      
      const updatedNegocio = await strapi.query('api::negocio.negocio').update({
        where: { documentId: id },
        data: {
          estado_reclamo: 'pendiente',
          owner: user.id
        }
      });
      
      console.log(`✅ [CLAIM] Base de datos actualizada exitosamente.`);

      // 3. Notificación por Email (TOTALMENTE AISLADA - FIRE & FORGET)
      // Envolvemos en try/catch independiente para que NUNCA afecte la respuesta al cliente
      try {
        const emailService = strapi.plugin('email')?.service('email');
        if (emailService) {
          console.log('📬 [CLAIM] Lanzando proceso de email en background...');
          emailService.send({
            to: 'diegocristianalonso@gmail.com',
            from: 'admin@sanrafael360.com',
            subject: `Nuevo reclamo de negocio: ${negocio.nombre}`,
            text: `El usuario ${user.email} ha solicitado reclamar el negocio "${negocio.nombre}".\n\nMensaje: ${message || 'Sin mensaje'}\n\nPor favor aprueba o rechaza el reclamo desde el panel de Strapi.`,
          }).then(() => {
            console.log('✉️ [CLAIM] Email enviado con éxito.');
          }).catch((err: any) => {
            console.error('❌ [CLAIM] Error asíncrono en servidor SMTP:', err.message);
          });
        }
      } catch (emailErr: any) {
        // Error al intentar inicializar el envío, no bloqueamos la respuesta
        console.warn('⚠️ [CLAIM] No se pudo inicializar el servicio de email:', emailErr.message);
      }

      // 4. Respuesta de Éxito Inmediata
      return ctx.send({ 
        message: 'Reclamo enviado correctamente', 
        data: {
          id: updatedNegocio.id,
          documentId: updatedNegocio.documentId,
          estado_reclamo: 'pendiente'
        } 
      });

    } catch (err: any) {
      console.error('💥 [CLAIM] ERROR CRÍTICO:', err.message);
      console.error(err.stack);
      return ctx.internalServerError(`Error interno al procesar el reclamo: ${err.message}`);
    }
  }
}));
