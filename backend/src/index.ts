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
            'api::review.review.create' // Permiso vital para reseñas
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

    } catch (error) {
      strapi.log.error('❌ Error general en bootstrap:', error);
    }
  },
};
