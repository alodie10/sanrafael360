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

      try {
        await originalRegister(ctx);

        if (ctx.status === 200 && tipo_registro === 'propietario') {
          const user = ctx.body.user;
          
          // Buscar dinámicamente el ID del rol "Propietario"
          const propietarioRole = await strapi.query('plugin::users-permissions.role').findOne({
            where: { name: 'Propietario' }
          });
          
          if (propietarioRole) {
            await strapi.query('plugin::users-permissions.user').update({
              where: { id: user.id },
              data: { role: propietarioRole.id, tipo_registro: 'propietario' },
            });
            ctx.body.user.role = { id: propietarioRole.id, name: 'Propietario' };
            strapi.log.info(`👤 Usuario [${user.email}] registrado como Propietario (Role ID: ${propietarioRole.id}).`);
          } else {
            strapi.log.error(`❌ Rol 'Propietario' no encontrado en la base de datos para el usuario [${user.email}]. Quedará con rol por defecto.`);
          }
        }
      } catch (error: any) {
        strapi.log.warn(`[auth.register] Error capturado: ${error.message}`);
        // Forzar una respuesta 400 para que el frontend pueda manejar el error
        return ctx.badRequest(error.message || 'Error de validación durante el registro');
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
            'plugin::users-permissions.auth.forgotPassword',
            'plugin::users-permissions.auth.resetPassword',
            'api::lead.lead.create',
            'api::negocio.negocio.incrementStats',
            'api::negocio.negocio.getStatsSummary',
            'api::review.review.find',
          ];

          // El rol autenticado (y los nuevos residentes/propietarios) necesitan permisos de gestion
          if (['authenticated', 'residente', 'propietario'].includes(roleType)) {
            actions.push('api::negocio.negocio.create');
            actions.push('api::negocio.negocio.claim');
            actions.push('api::negocio.negocio.update');
            actions.push('api::negocio.negocio.me');
            actions.push('api::negocio.negocio.portalUpdate');
            actions.push('api::review.review.create');
            actions.push('api::negocio.negocio.adminPendingClaims');
            actions.push('api::negocio.negocio.adminResolveClaim');
            actions.push('api::negocio.negocio.resetClaimForTest');
            actions.push('api::discovery.discovery.googleSync');
            actions.push('api::actividad.actividad.find');
            actions.push('api::actividad.actividad.create');
            actions.push('api::soporte.soporte.find');
            actions.push('api::soporte.soporte.findOne');
            actions.push('api::soporte.soporte.create');
            actions.push('api::soporte.soporte.update');
            actions.push('api::lead.lead.find');
            actions.push('api::lead.lead.findOne');
            actions.push('api::lead.lead.update');
            actions.push('api::lead.lead.convert');
          }

          strapi.log.info(`🔑 Configurando permisos para rol: ${roleType} (ID: ${role.id})`);

          for (const action of actions) {
            try {
              const exists = await strapi.query('plugin::users-permissions.permission').findOne({
                where: { action, role: role.id },
              });

              if (!exists) {
                await strapi.query('plugin::users-permissions.permission').create({
                  data: { action, role: role.id, target: null },
                });
                strapi.log.debug(`   ✅ Permiso añadido: ${action}`);
              }
            } catch (permErr: any) {
              strapi.log.error(`   ❌ Error en permiso ${action}: ${permErr.message}`);
            }
          }
        } else {
          strapi.log.warn(`⚠️ Rol no encontrado: ${roleType}`);
        }
      }
      strapi.log.info('✅ Configuración de permisos finalizada.');

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

      // 3. Asegurar que existan los roles personalizados
      // Asegurar que existan los roles personalizados
      const customRoles = ['propietario', 'residente'];
      for (const roleName of customRoles) {
        const existingRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { name: roleName }
        });
        if (!existingRole) {
          strapi.log.info(`🛠️ Creando rol faltante: ${roleName}`);
          await strapi.query('plugin::users-permissions.role').create({
            data: {
              name: roleName,
              description: `Rol para ${roleName} de San Rafael 360`,
              type: roleName
            }
          });
        }
      }

      // 4. Configurar el remitente de email para Users-Permissions (Evitar error strapi.io en Resend)
      const upStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
      const upSettings = await upStore.get();
      const defaultEmail = process.env.RESEND_DEFAULT_FROM || 'no-reply@sanrafael360.com';
      
      if (upSettings.email_confirmation_redirection !== process.env.PUBLIC_URL + '/restablecer-password') {
        await upStore.set({
          value: {
            ...upSettings,
            email_confirmation_redirection: process.env.PUBLIC_URL + '/restablecer-password'
          }
        });
      }

      // Actualizar plantillas de email (Forgot Password)
      const emailStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'email' });
      const emailTemplates = await emailStore.get();
      
      if (emailTemplates.reset_password.options.from.email.includes('strapi.io') || !emailTemplates.reset_password.options.message.includes('San Rafael 360')) {
        emailTemplates.reset_password.options.from.email = defaultEmail;
        emailTemplates.reset_password.options.from.name = 'San Rafael 360';
        emailTemplates.reset_password.options.object = 'Configuración de acceso - San Rafael 360';
        emailTemplates.reset_password.options.message = `<p>¡Gracias por ser parte de San Rafael 360!</p>
<p>Para gestionar tu negocio, por favor define tu contraseña en el siguiente enlace:</p>
<p><%= URL %>?code=<%= TOKEN %></p>
<p>Si no has solicitado este acceso, puedes ignorar este mensaje.</p>`;
        
        await emailStore.set({ value: emailTemplates });
        strapi.log.info(`📧 Plantilla de email (Reset/Welcome) actualizada con éxito.`);
      }

      // 5. INICIALIZACIÓN DE ESTADÍSTICAS (Poner 0 donde hay null)
      strapi.log.info('📊 Iniciando limpieza de estadísticas...');
      try {
        await (strapi.db.connection as any).raw(`
          UPDATE negocios 
          SET views = COALESCE(views, 0), 
              clicks_whatsapp = COALESCE(clicks_whatsapp, 0), 
              clicks_website = COALESCE(clicks_website, 0);
        `);
        strapi.log.info('✅ Estadísticas inicializadas a 0.');
      } catch (err: any) {
        strapi.log.error('❌ Error inicializando estadísticas:', err.message);
      }

      // 6. SINCRONIZACIÓN GLOBAL DE RATINGS (A prueba de balas)
      strapi.log.info('⭐ Iniciando sincronización global de Ratings...');
      try {
        const negocios = await strapi.documents('api::negocio.negocio' as any).findMany({
          fields: ['nombre', 'rating', 'review_count'],
          populate: ['reviews'],
          limit: -1
        });

        for (const neg of negocios) {
          const reviews = neg.reviews || [];
          const count = reviews.length;
          const sum = reviews.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 0), 0);
          const average = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

          if (Number(neg.rating) !== average || Number(neg.review_count) !== count) {
            await strapi.documents('api::negocio.negocio' as any).update({
              documentId: neg.documentId,
              data: {
                rating: average,
                review_count: count
              } as any,
              status: 'published'
            });
            strapi.log.info(`   ✅ [${neg.nombre}] Sincronizado: ${average} estrellas (${count} reseñas)`);
          }
        }
        strapi.log.info('✨ Sincronización de Ratings finalizada.');
      } catch (err: any) {
        strapi.log.error('❌ Error en sincronización de Ratings:', err.message);
      }

    } catch (error) {
      console.error('❌ Error configurando bootstrap:', error);
    }
  },
};
