// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    // Handlers de proceso globales para resiliencia (GEMINI.md)
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });

    // 🏆 Sobrescritura de Controlador de Registro (Hito 1)
    const authController = strapi.plugin('users-permissions').controller('auth');
    const originalRegister = authController.register;

    authController.register = async (ctx: any) => {
      const { tipo_registro } = ctx.request.body;
      
      // Limpiamos el campo para que el validador estricto de Strapi 5 no lo rechace
      delete ctx.request.body.tipo_registro;

      await originalRegister(ctx);

      if (ctx.status === 200 && tipo_registro === 'propietario') {
        const user = ctx.body.user;
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { role: 8, tipo_registro: 'propietario' },
        });
        ctx.body.user.role = { id: 8, name: 'Propietario' };
        strapi.log.info(`👤 Usuario [${user.email}] registrado como Propietario.`);
      }
    };
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
      // 🚨 MIGRACIÓN DE EMERGENCIA: Reparar tabla up_users (Columna provider faltante)
      try {
        await (strapi.db.connection as any).raw(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='up_users' AND column_name='provider') THEN
              ALTER TABLE up_users ADD COLUMN provider VARCHAR(255) DEFAULT 'local';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='up_users' AND column_name='confirmed') THEN
              ALTER TABLE up_users ADD COLUMN confirmed BOOLEAN DEFAULT TRUE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='up_users' AND column_name='blocked') THEN
              ALTER TABLE up_users ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
            END IF;
          END
          $$;
        `);
        strapi.log.info('🛠️ Base de Datos: Tabla up_users verificada y reparada.');
      } catch (dbErr: any) {
        console.error('⚠️ Error en migración manual:', dbErr.message);
      }

      // 1. Configurar permisos para roles Públicos, Autenticados, Residente y Propietario
      const rolesToConfigure = ['public', 'authenticated', 'residente', 'propietario'];

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
            'plugin::users-permissions.user.me',
          ];

          // El rol autenticado (y los nuevos residentes/propietarios) necesitan permisos de gestion
          if (['authenticated', 'residente', 'propietario'].includes(roleType)) {
            actions.push('api::negocio.negocio.claim');
            actions.push('api::negocio.negocio.update');
            actions.push('api::negocio.negocio.me');
            actions.push('api::negocio.negocio.portalUpdate');
            actions.push('api::negocio.negocio.adminPendingClaims');
            actions.push('api::negocio.negocio.adminResolveClaim');
            actions.push('api::negocio.negocio.resetClaimForTest');
            actions.push('api::discovery.discovery.googleSync'); // Fix 403
            actions.push('api::actividad.actividad.find');       // Fix 500
            actions.push('api::actividad.actividad.create');
            actions.push('api::soporte.soporte.find');           // Fix Soporte 403
            actions.push('api::soporte.soporte.findOne');
            actions.push('api::soporte.soporte.create');
            actions.push('api::soporte.soporte.update');
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

      // 3. Lifecycle Hook para asignar roles dinámicos (Hito 1)
      strapi.db.lifecycles.subscribe({
        models: ['plugin::users-permissions.user'],
        async afterCreate(event: any) {
          const { result, params } = event;
          
          // Si el usuario se registró como propietario
          if (params.data.tipo_registro === 'propietario') {
            try {
              await strapi.query('plugin::users-permissions.user').update({
                where: { id: result.id },
                data: { role: 8 }, // ID del rol Propietario
              });
              strapi.log.info(`✅ Rol Propietario asignado a: ${result.email}`);
            } catch (err) {
              strapi.log.error(`❌ Error asignando rol Propietario:`, err);
            }
          }
        },
      });

    } catch (error) {
      console.error('❌ Error configurando bootstrap:', error);
    }
  },
};
