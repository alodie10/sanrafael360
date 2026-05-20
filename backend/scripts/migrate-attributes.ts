import { createStrapi } from '@strapi/strapi';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('🚀 Iniciando migración silenciosa de categorías a atributos (tags)...');
  
  // 1. Iniciar contexto de Strapi
  const app = await createStrapi().load();
  
  try {
    // 2. Obtener todas las categorías
    const categorias = await app.entityService.findMany('api::categoria.categoria');
    console.log(`📦 Encontradas ${categorias.length} categorías.`);

    const categoryToAttributeMap = new Map();

    // 3. Crear atributos por cada categoría si no existen
    for (const cat of categorias) {
      // Buscar si el atributo ya existe
      let atributosExistentes = await app.entityService.findMany('api::atributo.atributo', {
        filters: { slug: cat.slug }
      });
      
      let atributoId;
      if (atributosExistentes && atributosExistentes.length > 0) {
        atributoId = atributosExistentes[0].id;
        console.log(`⏩ Atributo [${cat.nombre}] ya existe (ID: ${atributoId}).`);
      } else {
        const nuevoAtributo = await app.entityService.create('api::atributo.atributo', {
          data: {
            nombre: cat.nombre,
            slug: cat.slug,
            tipo: 'tag',
            icono: cat.icono || null,
            publishedAt: new Date(), // Publicar automáticamente
          }
        });
        atributoId = nuevoAtributo.id;
        console.log(`✅ Creado nuevo atributo: [${cat.nombre}] (ID: ${atributoId}).`);
      }
      categoryToAttributeMap.set(cat.id, atributoId);
    }

    // 4. Obtener todos los negocios con su categoría y atributos actuales
    const negocios = await app.entityService.findMany('api::negocio.negocio', {
      populate: ['categoria', 'atributos']
    });
    console.log(`\n🏢 Procesando ${negocios.length} negocios...`);

    let negociosActualizados = 0;

    // 5. Asignar atributos a negocios basados en su categoría actual
    for (const negocio of (negocios as any[])) {
      if (!negocio.categoria) {
        continue;
      }
      
      const atributoId = categoryToAttributeMap.get(negocio.categoria.id);
      
      if (atributoId) {
        // Verificar si ya tiene el atributo
        const atributosActualesIds = negocio.atributos ? negocio.atributos.map((a: any) => a.id) : [];
        if (!atributosActualesIds.includes(atributoId)) {
          // Actualizar negocio
          await app.entityService.update('api::negocio.negocio', negocio.id, {
            data: {
              atributos: [...atributosActualesIds, atributoId]
            }
          });
          negociosActualizados++;
        }
      }
    }
    
    console.log(`\n🎉 Migración silenciosa completada.`);
    console.log(`Resumen: Se copiaron datos para probar la nueva estructura relacional de Atributos.`);
    console.log(`Negocios actualizados con nuevos tags: ${negociosActualizados}`);
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
