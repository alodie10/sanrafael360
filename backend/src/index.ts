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
    // Automatizar permisos para el rol Público
    try {
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const permissions = [
          { action: 'api::negocio.negocio.find', role: publicRole.id },
          { action: 'api::negocio.negocio.findOne', role: publicRole.id },
          { action: 'api::categoria.categoria.find', role: publicRole.id },
          { action: 'api::categoria.categoria.findOne', role: publicRole.id },
        ];

        for (const perm of permissions) {
          const exists = await strapi.query('plugin::users-permissions.permission').findOne({
            where: { action: perm.action, role: publicRole.id },
          });

          if (!exists) {
            await strapi.query('plugin::users-permissions.permission').create({ data: perm });
          }
        }
        console.log('✅ Permisos públicos configurados automáticamente.');
      }
    } catch (error) {
      console.error('❌ Error configurando permisos:', error);
    }
  },
};
