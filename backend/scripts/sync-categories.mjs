
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/csv_mapping.json';

async function sync() {
  console.log('🔄 Sincronizando categorías (Optimizado para 365 Negocios)...');

  // 1. Obtener categorías reales de Railway
  const catResp = await fetch(`${STRAPI_API_URL}/categorias`, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
  const catsData = await catResp.json();
  const categoryIdMap = {};
  catsData.data.forEach(c => { categoryIdMap[c.nombre.trim()] = c.id; });
  
  // 2. Obtener negocios actuales
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
  const negsData = await negResp.json();
  const businessIdMap = {};
  negsData.data.forEach(n => { businessIdMap[n.nombre.trim()] = n.id; });

  // 3. Cargar y procesar mapeo JSON (Reducir a únicos)
  const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
  const mapping = JSON.parse(rawMapping.replace(/^\uFEFF/, ''));

  const uniqueMapping = new Map();
  mapping.forEach(entry => {
    const nombre = entry.post_title?.trim();
    if (nombre && !uniqueMapping.has(nombre)) {
      uniqueMapping.set(nombre, entry.listing_category?.trim());
    }
  });

  console.log(`🚀 Procesando ${uniqueMapping.size} negocios únicos...`);
  let count = 0;

  for (const [nombre, catNameRaw] of uniqueMapping.entries()) {
    let catName = catNameRaw;
    if (nombre.toLowerCase().includes('vinos') || catName?.toLowerCase().includes('vinos')) {
        catName = "Vinos, licores y conservas gourmet y artesanales";
    }

    const businessId = businessIdMap[nombre];
    const categoryId = categoryIdMap[catName];

    if (businessId && categoryId) {
      process.stdout.write(`\r🔗 [${++count}/${uniqueMapping.size}] Vinculando: ${nombre.substring(0, 30)}...`);
      await fetch(`${STRAPI_API_URL}/negocios/${businessId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { categoria: categoryId } })
      });
    }
  }

  console.log('\n✅ Vinculación completada con éxito.');
}

sync();
