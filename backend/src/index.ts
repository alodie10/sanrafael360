// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const actions = [
          'api::negocio.negocio.find',
          'api::negocio.negocio.findOne',
          'api::categoria.categoria.find',
          'api::categoria.categoria.findOne',
        ];

        for (const action of actions) {
          const exists = await strapi.query('plugin::users-permissions.permission').findOne({
            where: { action, role: publicRole.id },
          });

          if (!exists) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: { action, role: publicRole.id, target: null },
            });
          }
        }
        console.log('✅ Permisos de Strapi configurados correctamente.');
      }
    } catch (error) {
      console.error('❌ Error configurando permisos en bootstrap:', error);
    }
  },
};
