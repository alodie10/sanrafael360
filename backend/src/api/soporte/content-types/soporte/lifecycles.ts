import { ADMIN_EMAILS } from '../../../../utils/constants';
import { escapeHtml } from '../../../../utils/html-escape';

export default {
  async afterCreate(event: any) {
    const { result } = event;

    try {
      const emailService = strapi.plugin('email').service('email');
      const sendPromises = ADMIN_EMAILS.map((adminEmail) =>
        emailService
          .send({
            to: adminEmail,
            from: 'San Rafael 360 <no-reply@sanrafael360.com>',
            subject: `Soporte SR360: ${escapeHtml(result.asunto || 'Nueva Consulta')}`,
            html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #1a1a1a;">Nueva consulta de soporte</h2>
          <p style="color: #666;">Has recibido un nuevo mensaje desde el portal.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>De:</strong> ${escapeHtml(result.nombre || 'Usuario')} (${escapeHtml(result.email || 'No proveído')})</p>
          <p><strong>Asunto:</strong> ${escapeHtml(result.asunto)}</p>
          <div style="background: #fdfdfd; padding: 20px; border-radius: 8px; border: 1px solid #f0f0f0; margin-top: 10px;">
            <p style="margin: 0; line-height: 1.6; color: #444;">${escapeHtml(result.mensaje)}</p>
          </div>
        </div>`,
          })
          .catch((e: any) =>
            strapi.log.error(`❌ Error asíncrono en envío de email a ${adminEmail}:`, e.message)
          )
      );

      await Promise.all(sendPromises);
      strapi.log.info(`📧 Intento de notificación de soporte procesado para ID: ${result.id}`);
    } catch (err: any) {
      strapi.log.error('❌ Error crítico (pero controlado) en lifecycle de soporte (afterCreate):', err.message);
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;

    if (result.respuesta && result.estado === 'respondido' && result.email) {
      try {
        const emailService = strapi.plugin('email').service('email');

        await emailService
          .send({
            to: result.email,
            from: 'San Rafael 360 <no-reply@sanrafael360.com>',
            subject: `Respuesta a tu consulta de Soporte: ${escapeHtml(result.asunto)}`,
            html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #f0f0f0; border-radius: 12px; max-width: 600px; margin: auto;">
            <h2 style="color: #2563eb;">Hola, recibiste una respuesta</h2>
            <p style="color: #444;">El equipo de San Rafael 360 ha respondido a tu consulta de soporte.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0; line-height: 1.6; color: #1e293b;">${escapeHtml(result.respuesta)}</p>
            </div>
          </div>`,
          })
          .catch((e: any) => strapi.log.error('❌ Error asíncrono en respuesta soporte:', e.message));
      } catch (err: any) {
        strapi.log.error('❌ Error en lifecycle soporte (afterUpdate):', err.message);
      }
    }
  },
};
