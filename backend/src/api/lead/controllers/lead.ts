import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lead.lead' as any, ({ strapi }) => ({
  async convert(ctx) {
    const { id } = ctx.params;
    const { negocioId } = ctx.request.body;

    if (!negocioId) {
      return ctx.badRequest('Negocio ID es requerido');
    }

    try {
      // 1. Buscar el Lead
      const lead = await strapi.documents('api::lead.lead' as any).findOne({
        documentId: id
      });

      if (!lead) {
        return ctx.notFound('Lead no encontrado');
      }

      // 2. Buscar o Crear el Usuario (Propietario)
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: lead.email }
      });

      if (!user) {
        // Obtener el rol de propietario
        const ownerRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { name: 'propietario' }
        });

        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: lead.email,
            email: lead.email,
            password: Math.random().toString(36).slice(-10), // Password temporal aleatoria
            confirmed: true,
            role: ownerRole?.id || 2, // Fallback al ID 2 si no se encuentra
          }
        });
      }

      // 3. Vincular el Usuario al Negocio
      await strapi.documents('api::negocio.negocio' as any).update({
        documentId: negocioId,
        data: {
          owner: user.id,
          reclamar_habilitado: true,
          verificado: true,
          estado_reclamo: 'aprobado'
        } as any
      });

      // 4. Actualizar estado del Lead
      await strapi.documents('api::lead.lead' as any).update({
        documentId: id,
        data: {
          estado: 'convertido'
        } as any
      });

      // 5. Disparar el flujo de configuración de contraseña (Email de Bienvenida)
      // Usamos el servicio interno de Strapi para generar el token y enviar el email
      try {
        await strapi.plugin('users-permissions').service('auth').forgotPassword({
          email: lead.email
        });
        strapi.log.info(`📧 Email de bienvenida y configuración enviado a: ${lead.email}`);
      } catch (emailErr: any) {
        strapi.log.error(`❌ Error al enviar email de onboarding: ${emailErr.message}`);
        // No bloqueamos la respuesta exitosa si el email falla, pero lo logueamos
      }
      
      return ctx.send({ 
        success: true, 
        message: 'Lead convertido y email de bienvenida enviado',
        userId: user.id
      });

    } catch (err: any) {
      strapi.log.error(err);
      return ctx.internalServerError('Error al convertir el lead: ' + err.message);
    }
  }
}));

