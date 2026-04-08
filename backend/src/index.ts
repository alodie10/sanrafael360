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
      // 1. Configurar permisos para roles Públicos y Autenticados
      const rolesToConfigure = ['public', 'authenticated'];
      
      for (const roleType of rolesToConfigure) {
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: roleType },
        });

        if (role) {
          const actions = [
            'api::negocio.negocio.find',
            'api::negocio.negocio.findOne',
            'api::categoria.categoria.find',
            'api::categoria.categoria.findOne',
          ];

          // El rol autenticado necesita específicamente el permiso de reclamar y actualizar
          if (roleType === 'authenticated') {
            actions.push('api::negocio.negocio.claim');
            actions.push('api::negocio.negocio.update');
          }

          for (const action of actions) {
            const exists = await strapi.query('plugin::users-permissions.permission').findOne({
              where: { action, role: role.id },
            });

            if (!exists) {
              await strapi.query('plugin::users-permissions.permission').create({
                data: { action, role: role.id, target: null },
              });
            }
          }
        }
      }
      console.log('✅ Permisos de Strapi (Public & Authenticated) configurados correctamente.');
    } catch (error) {
      console.error('❌ Error configurando permisos en bootstrap:', error);
    }
  },
};
