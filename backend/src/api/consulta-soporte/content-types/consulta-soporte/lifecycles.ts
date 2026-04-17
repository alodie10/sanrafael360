export default {
  async afterCreate(event: any) {
    const { result } = event;

    try {
      await strapi.plugin('email').service('email').send({
        to: 'diegocristianalonso@gmail.com',
        from: 'San Rafael 360 <no-reply@sanrafael360.com>',
        subject: `Nueva Consulta de Soporte: ${result.nombre || 'Usuario'}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>Nueva consulta recibida</h2>
            <p><strong>De:</strong> ${result.nombre} (${result.email})</p>
            <p><strong>Mensaje:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px;">${result.mensaje}</blockquote>
          </div>
        `,
      });
      strapi.log.info(`📧 Notificación de soporte enviada para consulta ID: ${result.id}`);
    } catch (err: any) {
      strapi.log.error('❌ Error enviando email de soporte:', err.message);
    }
  },
};
