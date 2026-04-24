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

      // Obtener el rol de propietario
      const ownerRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { name: 'propietario' }
      });

      if (!user) {
        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: lead.email,
            email: lead.email,
            password: Math.random().toString(36).slice(-10),
            confirmed: true,
            role: ownerRole?.id || 1, // Authenticated como fallback seguro
          }
        });
      } else if (user.role?.name !== 'propietario') {
        // Si el usuario existe pero no es propietario, subirle el rango
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { role: ownerRole?.id || user.role?.id }
        });
      }

      // 3. Verificar si el negocio ya tiene un dueño
      const negocio = await strapi.documents('api::negocio.negocio' as any).findOne({
        documentId: negocioId,
        populate: ['owner']
      });

      if (negocio?.owner) {
        return ctx.badRequest(`El negocio "${negocio.nombre}" ya tiene un dueño asignado.`);
      }

      // 4. Vincular el Usuario al Negocio
      await strapi.documents('api::negocio.negocio' as any).update({
        documentId: negocioId,
        data: {
          owner: user.id,
          reclamar_habilitado: true,
          verificado: true,
          estado_reclamo: 'aprobado'
        } as any
      });

      // 4. Actualizar estado del Lead y guardar relación
      await strapi.documents('api::lead.lead' as any).update({
        documentId: id,
        data: {
          estado: 'convertido',
          negocio_vinculado: negocioId
        } as any
      });

      // 5. Disparar el flujo de configuración de contraseña (Email de Bienvenida)
      // Usamos el servicio interno de Strapi para generar el token y enviar el email
      try {
        const authService: any = strapi.service('plugin::users-permissions.auth');
        await authService.forgotPassword({
          email: lead.email.toLowerCase().trim()
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

