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
    // --- LÓGICA TEMPORAL PARA RESETEO DE CONTRASEÑA ---
    try {
      const emailToReset = 'diegocristianalonso@gmail.com';
      const newPassword = 'DcaDca_0111#';
      
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: emailToReset }
      });

      if (user) {
        await strapi.plugin('users-permissions').service('user').edit(user.id, {
          password: newPassword
        });
        console.log('✅ [AUTH-FIX] Contraseña reseteada para:', emailToReset);
      }
    } catch (err: any) {
      console.error('❌ [AUTH-FIX] Error:', err.message);
    }
    // --- FIN LÓGICA TEMPORAL ---

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
            actions.push('api::negocio.negocio.me');
            actions.push('api::negocio.negocio.portalUpdate');
            actions.push('api::negocio.negocio.adminPendingClaims');
            actions.push('api::negocio.negocio.adminResolveClaim');
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
