import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/csv_mapping.json';

const OLD_GOURMET_NAME = "Vinos, licores y conservas gourmet y artesanales";
const NEW_GOURMET_NAME = "Productos Gourmet";

/**
 * Script para Normalización de Categorías y Vinculación Masiva
 * 1. Renombra la categoría gourmet si existe con el nombre largo.
 * 2. Asocia cada negocio a su respectiva categoría según el mapeo JSON.
 */
async function sync() {
  console.log('🔄 Iniciando Sincronización Pro Vibe (Railway)...');

  try {
    // 1. Obtener categorías actuales de Strapi
    const catResp = await fetch(`${STRAPI_API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const catsData: any = await catResp.json();
    const categoryIdMap: { [key: string]: number } = {};
    
    for (const c of catsData.data) {
      const currentName = c.nombre.trim();
      
      // RENOMBRADO: Si detectamos el nombre largo heredado de Hostinger
      if (currentName === OLD_GOURMET_NAME) {
        console.log(`📝 Detectada categoría antigua. Renombrando a: ${NEW_GOURMET_NAME}`);
        await fetch(`${STRAPI_API_URL}/categorias/${c.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { nombre: NEW_GOURMET_NAME } })
        });
        categoryIdMap[NEW_GOURMET_NAME] = c.id;
      } else {
        categoryIdMap[currentName] = c.id;
      }
    }
    
    console.log('✅ Catálogo de categorías listo:', Object.keys(categoryIdMap));

    // 2. Obtener inventario de negocios
    console.log('Cargando inventario de negocios de Railway...');
    const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const negsData: any = await negResp.json();
    const businessIdMap: { [name: string]: number } = {};
    negsData.data.forEach((n: any) => {
      businessIdMap[n.nombre.trim()] = n.id;
    });

    // 3. Procesar Mapeo JSON
    const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
    const mapping = JSON.parse(rawMapping.replace(/^\uFEFF/, ''));

    console.log(`🚀 Iniciando vinculación de ${mapping.length} entradas...`);
    let count = 0;
    let errors = 0;

    for (const entry of mapping) {
      const nombre = entry.post_title?.trim();
      let categoriaName = entry.listing_category?.trim();

      if (!nombre || !categoriaName) continue;

      // Normalización dinámica para Vinos y Gourmet
      if (
        nombre.toLowerCase().includes('vinos') || 
        categoriaName.toLowerCase().includes('vinos') || 
        categoriaName.toLowerCase().includes('licores') ||
        categoriaName === OLD_GOURMET_NAME
      ) {
          categoriaName = NEW_GOURMET_NAME;
      }

      const businessId = businessIdMap[nombre];
      const categoryId = categoryIdMap[categoriaName];

      if (businessId && categoryId) {
        console.log(`🔗 [${++count}] Vinculando: ${nombre} -> ${categoriaName}`);
        const updateResp = await fetch(`${STRAPI_API_URL}/negocios/${businessId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { categoria: categoryId } })
        });
        if (!updateResp.ok) errors++;
      }
    }

    console.log(`\n🎉 Migración completada exitosamente.`);
    console.log(`📊 Totales: ${count} negocios vinculados, ${errors} fallos.`);

  } catch (error) {
    console.error('❌ Error fatal durante la sincronización:', error);
  }
}

sync();
