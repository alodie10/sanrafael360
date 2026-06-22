import { Core } from '@strapi/strapi';

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      strapi.log.info('🚀 Iniciando configuración de San Rafael 360...');

      // 1. CONFIGURACIÓN AUTOMÁTICA DE PERMISOS (Blindaje de API)
      const roleTypes = ['authenticated', 'residente', 'propietario', 'public'];
      
      for (const roleType of roleTypes) {
        const role = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: roleType },
        });

        if (role) {
          const actions = [
            'api::categoria.categoria.find',
            'api::categoria.categoria.findOne',
            'api::negocio.negocio.find',
            'api::negocio.negocio.findOne',
            'api::negocio.negocio.stats',
            'api::negocio.negocio.claim',
            'api::review.review.find',
            'api::review.review.findOne',
            'api::review.review.create', // Permiso vital para reseñas
            'api::atributo.atributo.find',
            'api::atributo.atributo.findOne',
            'api::atributo.atributo.create',
            'api::pago.pago.find',
            'api::pago.pago.findOne'
          ];

          for (const action of actions) {
            try {
              const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
                where: { action, role: role.id },
              });

              if (!existingPermission) {
                await strapi.query('plugin::users-permissions.permission').create({
                  data: { action, role: role.id, target: null },
                });
                strapi.log.debug(`   ✅ Permiso añadido (${roleType}): ${action}`);
              }
            } catch (permErr: any) {
              strapi.log.error(`   ❌ Error en permiso ${action}: ${permErr.message}`);
            }
          }
        }
      }
      strapi.log.info('✅ Configuración de permisos de API finalizada.');

      // 2. Asegurar que existan los roles personalizados
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

      // 3. Sincronización global de Ratings al arrancar
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

      // 4. MIGRACIÓN SILENCIOSA: Categorías -> Atributos
      strapi.log.info('🏷️ Iniciando migración de categorías a atributos...');
      try {
        const categorias = await strapi.documents('api::categoria.categoria' as any).findMany({ limit: -1 });
        const mapCategoriaToAtributo = new Map();
        
        for (const cat of categorias) {
          const existentes = await strapi.documents('api::atributo.atributo' as any).findMany({
            filters: { slug: cat.slug },
            limit: 1
          });
          
          let atributoId;
          if (existentes && existentes.length > 0) {
            atributoId = existentes[0].documentId;
          } else {
            const nuevo = await strapi.documents('api::atributo.atributo' as any).create({
              data: {
                nombre: cat.nombre,
                slug: cat.slug,
                tipo: 'tag',
                icono: cat.icono || null
              } as any,
              status: 'published'
            });
            atributoId = nuevo.documentId;
            strapi.log.info(`   ✅ Creado nuevo atributo: ${cat.nombre}`);
          }
          mapCategoriaToAtributo.set(cat.documentId, atributoId);
          mapCategoriaToAtributo.set(cat.id, atributoId);
        }

        const negocios = await strapi.documents('api::negocio.negocio' as any).findMany({
          populate: ['categoria', 'atributos'],
          limit: -1
        });

        let actualizados = 0;
        for (const neg of negocios) {
          if (neg.categoria) {
            const catId = neg.categoria.documentId || neg.categoria.id;
            const atributoId = mapCategoriaToAtributo.get(catId);
            
            if (atributoId) {
              const atributosActuales = neg.atributos || [];
              const idsActuales = atributosActuales.map((a: any) => a.documentId || a.id);
              
              if (!idsActuales.includes(atributoId)) {
                await strapi.documents('api::negocio.negocio' as any).update({
                  documentId: neg.documentId,
                  data: {
                    atributos: [...atributosActuales.map((a:any) => a.documentId), atributoId]
                  } as any,
                  status: 'published'
                });
                actualizados++;
              }
            }
          }
        }
        strapi.log.info(`✨ Migración de atributos finalizada. Negocios actualizados: ${actualizados}`);
      } catch (err: any) {
        strapi.log.error('❌ Error en migración de Atributos:', err.message);
      }

      // 5. MIGRACIÓN SILENCIOSA: Backfill de Estadísticas a daily-stat
      strapi.log.info('📊 Verificando si es necesario backfill de estadísticas...');
      try {
        const statsCount = await strapi.documents('api::daily-stat.daily-stat' as any).count({});
        if (statsCount === 0) {
          strapi.log.info('   ⚠️ No se encontraron estadísticas diarias. Iniciando backfill con fecha 15 de Mayo...');
          const negociosStats = await strapi.documents('api::negocio.negocio' as any).findMany({ limit: -1 });
          let backfillCount = 0;
          for (const n of negociosStats) {
            if (Number(n.views) > 0 || Number(n.clicks_whatsapp) > 0 || Number(n.clicks_website) > 0) {
              await strapi.documents('api::daily-stat.daily-stat' as any).create({
                data: {
                  negocio_id: n.documentId,
                  date: '2026-05-15',
                  views: Number(n.views) || 0,
                  clicks_whatsapp: Number(n.clicks_whatsapp) || 0,
                  clicks_website: Number(n.clicks_website) || 0
                },
                status: 'published'
              });
              backfillCount++;
            }
          }
          strapi.log.info(`   ✅ Backfill completado. Se crearon ${backfillCount} registros.`);
        } else {
          strapi.log.info(`   ✅ Backfill omitido. Ya existen ${statsCount} registros.`);
        }
      } catch (err: any) {
        strapi.log.error('❌ Error en backfill de estadísticas:', err.message);
      }

      // 6. LIFECYCLE HOOKS — Auto-inicialización al crear/publicar un negocio
      strapi.log.info('🔗 Registrando lifecycle hooks de Negocio...');
      strapi.db.lifecycles.subscribe({
        models: ['api::negocio.negocio'],

        /**
         * beforeCreate: se dispara antes de crear el negocio.
         * Garantiza que discovery_pending=true y discovery_verified=false sin query adicional.
         */
        async beforeCreate(event) {
          if (event.params.data) {
            event.params.data.discovery_pending = true;
            event.params.data.discovery_verified = false;
          }
        },

        async afterCreate(event) {
          const { result } = event;
          strapi.log.info(`[NegocioLifecycle] 🆕 Nuevo negocio creado: "${result.nombre}" (${result.documentId})`);
        },

        /**
         * afterUpdate: detecta cuando un negocio que era draft pasa a published
         * (publishedAt cambia de null a una fecha). Envía email al admin.
         * En Strapi v5 la publicación es un update con publishedAt.
         */
        async afterUpdate(event) {
          const { result, params } = event;
          if (!result?.nombre) return;

          // Solo notificamos si acaba de publicarse (publishedAt presente y recién seteado)
          const wasJustPublished =
            result.publishedAt &&
            params?.data?.publishedAt &&
            !params?.data?.status; // evitar re-notificar en updates normales

          if (!wasJustPublished) return;

          strapi.log.info(`[NegocioLifecycle] 📢 Negocio publicado: "${result.nombre}" (slug: ${result.slug})`);
          try {
            const from = 'San Rafael 360 <no-reply@sanrafael360.com>';
            const adminEmails: string[] = (process.env.ADMIN_EMAILS || 'hola@sanrafael360.com').split(',');
            const subject = `🆕 Nuevo negocio publicado: ${result.nombre}`;
            const html = `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;">
                <h2 style="color:#D6AF37;">San Rafael 360 — Nuevo Negocio</h2>
                <p>Se acaba de publicar un nuevo negocio en el directorio:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr><td style="padding:8px;font-weight:bold;color:#888;">Nombre</td><td style="padding:8px;">${result.nombre}</td></tr>
                  <tr><td style="padding:8px;font-weight:bold;color:#888;">Slug</td><td style="padding:8px;">${result.slug || '—'}</td></tr>
                  <tr><td style="padding:8px;font-weight:bold;color:#888;">Discovery</td><td style="padding:8px;">${result.discovery_pending ? '⏳ Pendiente' : '✅ Verificado'}</td></tr>
                </table>
                <a href="https://www.sanrafael360.com/negocios/${result.slug}" style="display:inline-block;padding:12px 24px;background:#D6AF37;color:#000;font-weight:bold;border-radius:8px;text-decoration:none;">Ver ficha pública</a>
              </div>
            `;
            for (const adminEmail of adminEmails) {
              await strapi.plugins['email'].services.email.send({
                to: adminEmail.trim(),
                from,
                subject,
                html,
              });
            }
            strapi.log.info(`[NegocioLifecycle] ✅ Email de nuevo negocio enviado a admins.`);
          } catch (emailErr: any) {
            strapi.log.warn(`[NegocioLifecycle] ⚠️ No se pudo enviar email de notificación: ${emailErr.message}`);
          }
        },
      });
      strapi.log.info('✅ Lifecycle hooks de Negocio registrados correctamente.');

    } catch (error) {
      strapi.log.error('❌ Error general en bootstrap:', error);
    }
  },
};
