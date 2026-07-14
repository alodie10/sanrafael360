import { Core } from '@strapi/strapi';
import { createDailyStatRepository } from './api/daily-stat/repositories/daily-stat-repository';

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
            'api::negocio.negocio.getstatstimeseries',
            'api::review.review.find',
            'api::review.review.findOne',
            'api::review.review.create', // Permiso vital para reseñas
            'api::atributo.atributo.find',
            'api::atributo.atributo.findOne',
            'api::atributo.atributo.create',
            'api::pago.pago.find',
            'api::pago.pago.findOne',
          ];

          if (roleType === 'authenticated') {
            actions.push(
              'api::cliente.cliente.adminlist',
              'api::cliente.cliente.admincreate',
              'api::cliente.cliente.adminupdate',
              'api::cliente.cliente.admindelete',
              'api::cliente.cliente.adminlinknegocios',
              'api::cliente.cliente.adminunlinknegocio',
              'api::cliente.cliente.adminnegociospicker',
              'api::cliente.cliente.adminmailtest',
              'api::cliente.cliente.adminmailbroadcast',
              'api::lead.lead.convert',
              'api::lead.lead.find',
              'api::lead.lead.findOne'
            );
          }

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
        const dailyStatRepo = createDailyStatRepository(strapi);
        const statsCount = await dailyStatRepo.count();
        if (statsCount === 0) {
          strapi.log.info('   ⚠️ No se encontraron estadísticas diarias. Iniciando backfill distribuido en últimos 30 días...');
          const negociosStats = await strapi.documents('api::negocio.negocio' as any).findMany({ limit: -1 });
          let backfillCount = 0;

          // Distribuimos los totales históricos en los últimos 30 días
          // con un patrón de crecimiento natural (más reciente = más actividad)
          const DAYS = 30;
          const today = new Date();

          for (const n of negociosStats) {
            const totalViews = Number(n.views) || 0;
            const totalWsp = Number(n.clicks_whatsapp) || 0;
            const totalWeb = Number(n.clicks_website) || 0;

            if (totalViews === 0 && totalWsp === 0 && totalWeb === 0) continue;

            // Pesos por día: los últimos días tienen más peso (crecimiento lineal)
            const weights = Array.from({ length: DAYS }, (_, i) => i + 1);
            const totalWeight = weights.reduce((a, b) => a + b, 0);

            for (let i = 0; i < DAYS; i++) {
              const date = new Date(today);
              date.setDate(today.getDate() - (DAYS - 1 - i));
              const dateStr = date.toISOString().split('T')[0];
              const w = weights[i];

              const dayViews = Math.round((totalViews * w) / totalWeight);
              const dayWsp = Math.round((totalWsp * w) / totalWeight);
              const dayWeb = Math.round((totalWeb * w) / totalWeight);

              if (dayViews > 0 || dayWsp > 0 || dayWeb > 0) {
                await dailyStatRepo.create({
                  negocio_id: n.documentId,
                  date: dateStr,
                  views: dayViews,
                  clicks_whatsapp: dayWsp,
                  clicks_website: dayWeb,
                });
                backfillCount++;
              }
            }
          }
          strapi.log.info(`   ✅ Backfill completado. Se crearon ${backfillCount} registros distribuidos en 30 días.`);
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

      // 7. STRApi 5 DOCUMENT SERVICE MIDDLEWARE (Para atrapar Publish/Unpublish)
      strapi.documents.use(async (context, next) => {
        const result = await next();
        
        if (context.uid === 'api::negocio.negocio') {
          // Importamos las funciones dinámicamente para no romper el boot si hay un error arriba
          const algoliaService = require('./api/negocio/services/algolia');
          
          if (context.action === 'publish') {
            const docId = (result as any)?.documentId;
            if (docId) {
               strapi.log.info(`[Algolia Middleware] Publicación detectada para: ${docId}`);
               try {
                 await algoliaService.syncNegocioToAlgolia(docId);
               } catch (err: any) {
                 strapi.log.error('Algolia publish error:', err);
               }
            }
          } else if (context.action === 'unpublish') {
            const docId = (result as any)?.documentId;
            if (docId) {
               strapi.log.info(`[Algolia Middleware] Despublicación detectada para: ${docId}`);
               try {
                 await algoliaService.deleteNegocioFromAlgolia(docId);
               } catch (err: any) {
                 strapi.log.error('Algolia unpublish error:', err);
               }
            }
          }
        }
        
        return result;
      });
      strapi.log.info('✅ Document Service Middleware para Algolia registrado.');

    } catch (error) {
      strapi.log.error('❌ Error general en bootstrap:', error);
    }
  },
};
