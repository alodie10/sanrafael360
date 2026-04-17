// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    // Handlers de proceso globales para resiliencia (GEMINI.md)
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // En producción podrías querer un shutdown graceful aquí
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });
  },

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
            'api::negocio.negocio.resetClaimForTest',
          ];

          // El rol autenticado necesita específicamente el permiso de reclamar y actualizar
          if (roleType === 'authenticated') {
            actions.push('api::negocio.negocio.claim');
            actions.push('api::negocio.negocio.update');
            actions.push('api::negocio.negocio.me');
            actions.push('api::negocio.negocio.portalUpdate');
            actions.push('api::negocio.negocio.adminPendingClaims');
            actions.push('api::negocio.negocio.adminResolveClaim');
            actions.push('api::negocio.negocio.resetClaimForTest');
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

      // 2. Seeding de Test Data si se solicita
      if (process.env.SEED_TEST_DATA === 'true') {
        console.log('🧪 Seeding test data...');
        const pass = 'DcaDca_01';
        const authRole = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
        
        const testUsers = [
          { email: 'argendeli01@gmail.com', username: 'argendeli_test' },
          { email: 'diegocristianalonso@gmail.com', username: 'diego_admin_test' }
        ];

        for (const u of testUsers) {
          const existing = await strapi.query('plugin::users-permissions.user').findOne({ where: { email: u.email } });
          if (existing) {
            // Use the service to ensure password hashing
            await strapi.plugin('users-permissions').service('user').edit(existing.id, {
              password: pass,
              confirmed: true,
              role: authRole.id
            });
          } else {
            await strapi.plugin('users-permissions').service('user').add({
              ...u,
              password: pass,
              confirmed: true,
              role: authRole.id,
              provider: 'local'
            });
          }
          console.log(`👤 Test user refreshed: ${u.email}`);
        }

        const neg = await strapi.documents('api::negocio.negocio').findMany({ filters: { slug: 'after-house' } });
        if (neg.length === 0) {
          await strapi.documents('api::negocio.negocio').create({
            data: { nombre: 'After House', slug: 'after-house', estado_reclamo: 'ninguno', reclamar_habilitado: true },
            status: 'published'
          });
          console.log('🏨 Test business created: after-house');
        }
      }
    } catch (error) {
      console.error('❌ Error configurando bootstrap:', error);
    }
  },
};
