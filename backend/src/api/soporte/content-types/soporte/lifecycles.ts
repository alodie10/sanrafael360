import { ADMIN_EMAILS } from '../../../../utils/constants';

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // BLINDAJE SENIOR: El fallo de un servicio externo (Email) NUNCA debe tumbar la petición (500)
    try {
      const emailService = strapi.plugin('email').service('email');
      
      // Notificar a todos los admins
      const sendPromises = ADMIN_EMAILS.map(adminEmail => 
        emailService.send({
          to: adminEmail,
        from: 'San Rafael 360 <no-reply@sanrafael360.com>',
        subject: `Soporte SR360: ${result.asunto || 'Nueva Consulta'}`,
        html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #1a1a1a;">Nueva consulta de soporte</h2>
          <p style="color: #666;">Has recibido un nuevo mensaje desde el portal.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>De:</strong> ${result.nombre || 'Usuario'} (${result.email || 'No proveído'})</p>
          <p><strong>Asunto:</strong> ${result.asunto}</p>
          <div style="background: #fdfdfd; padding: 20px; border-radius: 8px; border: 1px solid #f0f0f0; margin-top: 10px;">
            <p style="margin: 0; line-height: 1.6; color: #444;">${result.mensaje}</p>
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://sanrafael360-production.up.railway.app/admin/content-manager/collection-types/api::soporte.soporte/${result.documentId}" 
               style="background: #111; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Responder en Strapi</a>
          </div>
        </div>`
        }).catch((e: any) => strapi.log.error(`❌ Error asíncrono en envío de email a ${adminEmail}:`, e.message))
      );
      
      await Promise.all(sendPromises);
      strapi.log.info(`📧 Intento de notificación de soporte procesado para ID: ${result.id}`);
    } catch (err: any) {
      strapi.log.error('❌ Error crítico (pero controlado) en lifecycle de soporte (afterCreate):', err.message);
      // Silencio absoluto hacia el cliente: la petición de la DB ya fue exitosa.
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;

    if (result.respuesta && result.estado === 'respondido' && result.email) {
      try {
        const emailService = strapi.plugin('email').service('email');

        await emailService.send({
          to: result.email,
          from: 'San Rafael 360 <no-reply@sanrafael360.com>',
          subject: `Respuesta a tu consulta de Soporte: ${result.asunto}`,
          html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
            <h2 style="color: #2563eb;">Hola, recibiste una respuesta</h2>
            <p style="color: #444;">El equipo de San Rafael 360 ha respondido a tu consulta de soporte.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0; line-height: 1.6; color: #1e293b;">${result.respuesta}</p>
            </div>
          </div>`
        }).catch((e: any) => strapi.log.error('❌ Error asíncrono en respuesta soporte:', e.message));
      } catch (err: any) {
        strapi.log.error('❌ Error en lifecycle soporte (afterUpdate):', err.message);
      }
    }
  }
};
