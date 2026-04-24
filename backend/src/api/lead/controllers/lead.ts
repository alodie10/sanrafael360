import { factories } from '@strapi/strapi';
import crypto from 'crypto';

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
      const userEmail = lead.email.toLowerCase().trim();
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: userEmail }
      });

      // Obtener el rol de propietario (Nota: En index.ts se usa 'Propietario' con P mayúscula)
      const ownerRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { name: 'Propietario' }
      });

      if (!user) {
        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: userEmail,
            email: userEmail,
            password: crypto.randomBytes(20).toString('hex'),
            confirmed: true,
            role: ownerRole?.id || 1,
          }
        });
      } else if (user.role?.name !== 'Propietario') {
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

      // 4. Actualizar estado del Lead
      await strapi.documents('api::lead.lead' as any).update({
        documentId: id,
        data: {
          estado: 'convertido',
          negocio_vinculado: negocioId
        } as any
      });

      // 5. BLINDAJE SENIOR: Envío manual de Email de Bienvenida
      try {
        // Generar Token de Reset (Estándar Strapi)
        const resetPasswordToken = crypto.randomBytes(64).toString('hex');
        
        // Actualizar usuario con el token (Aseguramos ambos campos por compatibilidad)
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { 
            resetPasswordToken: resetPasswordToken,
            reset_password_token: resetPasswordToken // Fallback para algunas versiones de DB
          }
        });

        // Obtener configuración de emails de Strapi
        const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
        const emailSettings: any = await pluginStore.get({ key: 'email' });
        const advancedSettings: any = await pluginStore.get({ key: 'advanced' });
        
        const resetPasswordSettings = emailSettings?.reset_password?.options || {};
        // El link de reset debe apuntar al frontend (usamos la config oficial de Strapi)
        let resetLink = advancedSettings.email_reset_password || 'https://www.sanrafael360.com/restablecer-password';
        
        // Asegurar que el link tenga el token
        resetLink = resetLink.includes('?') 
          ? `${resetLink}&code=${resetPasswordToken}` 
          : `${resetLink}?code=${resetPasswordToken}`;

        // Usar el servicio de email DIRECTO (el que funciona en soporte)
        await strapi.plugin('email').service('email').send({
          to: userEmail,
          from: `San Rafael 360 <${process.env.RESEND_DEFAULT_FROM || 'no-reply@sanrafael360.com'}>`,
          subject: 'Configuración de acceso - San Rafael 360',
          html: `
            <div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
              <h2 style="color: #111;">¡Gracias por ser parte de San Rafael 360!</h2>
              <p>Para gestionar tu negocio, por favor define tu contraseña en el siguiente enlace:</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${resetLink}" 
                   style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Configurar mi Contraseña</a>
              </div>
              <p style="color: #666; font-size: 12px;">Si no has solicitado este acceso, puedes ignorar este mensaje.</p>
            </div>
          `
        });

        strapi.log.info(`📧 Email de bienvenida enviado con éxito vía motor directo a: ${userEmail}`);
      } catch (emailErr: any) {
        strapi.log.error(`❌ Error en blindaje de email: ${emailErr.message}`);
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

