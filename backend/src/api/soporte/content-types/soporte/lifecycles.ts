
export default {
  async afterCreate(event: any) {
    const { result } = event;

    try {
      strapi.log.info(`📝 Registro de soporte creado (ID: ${result.id}). Notificación por email suspendida temporalmente por depuración.`);
      /*
      const emailService = strapi.plugin('email').service('email');
      await emailService.send({
        to: 'diegocristianalonso@gmail.com',
        from: 'San Rafael 360 <no-reply@sanrafael360.com>',
        subject: `Soporte SR360: ${result.asunto || 'Nueva Consulta'}`,
        html: `...`
      });
      strapi.log.info(`📧 Notificación de soporte enviada para consulta ID: ${result.id}`);
      */
    } catch (err: any) {
      strapi.log.error('❌ Error en lifecycle de soporte (afterCreate):', err.message);
    }
  },

  async afterUpdate(event: any) {
    const { result } = event;

    if (result.respuesta && result.estado === 'respondido' && result.email) {
      try {
        strapi.log.info(`📝 Respuesta de soporte detectada. Notificación al usuario suspendida temporalmente.`);
        /*
        const emailService = strapi.plugin('email').service('email');
        await emailService.send({
          to: result.email,
          from: 'San Rafael 360 <no-reply@sanrafael360.com>',
          subject: `Respuesta a tu consulta de Soporte: ${result.asunto}`,
          html: `...`
        });
        strapi.log.info(`📧 Respuesta de soporte enviada al usuario: ${result.email}`);
        */
      } catch (err: any) {
        strapi.log.error('❌ Error en lifecycle de soporte (afterUpdate):', err.message);
      }
    }
  }
};
