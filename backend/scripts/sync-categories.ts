
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const MAPPING_PATH = 'c:/sanrafael360/scripts/csv_mapping.json';
const CSV_PATH = 'c:/sanrafael360/scripts/legacy/importar_listeo_geocodificado.csv';

// Mapeo manual basado en IDs reales obtenidos de Strapi
const categoryIdMap: { [key: string]: number } = {
  "Hoteles": 2911,
  "Cabañas": 2913,
  "Apart Hoteles": 2915,
  "Hostels": 2917,
  "Posadas": 2919,
  "Gastronomía": 2921,
  "Bodegas": 2923,
  "Vinos, licores y conservas gourmet y artesanales": 2925,
  "Agencias de Viaje": 2927
};

async function sync() {
  console.log('🔄 Sincronizando categorías desde mapeo JSON...');

  // 1. Corregir categoría "Vinos" en Strapi
  await fetch(`${STRAPI_API_URL}/categorias/2925`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { nombre: "Vinos, licores y conservas gourmet y artesanales", slug: "vinos-licores-conservas" } })
  });
  console.log('✅ Categoría corregida: Vinos, licores y conservas.');

  // 2. Obtener IDs de todos los negocios actuales
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const negsData: any = await negResp.json();
  const strapiNegocios = negsData.data;
  
  const businessIdMap: { [name: string]: number } = {};
  strapiNegocios.forEach((n: any) => {
    businessIdMap[n.nombre.trim()] = n.id;
  });

  // 3. Cargar mapeo JSON (generado por PowerShell)
  const mappingPath = 'c:/sanrafael360/scripts/csv_mapping.json';
  const rawMapping = fs.readFileSync(mappingPath, 'utf-8');
  const cleanMapping = rawMapping.replace(/^\uFEFF/, '');
  const mapping = JSON.parse(cleanMapping);

  const processedLinks = new Set<string>();

  for (const entry of mapping) {
    const nombre = entry.post_title?.trim();
    let categoriaName = entry.listing_category?.trim();

    if (!nombre) continue;

    // Normalización para categorías de vinos con comas
    if (nombre.toLowerCase().includes('vinos') || categoriaName?.toLowerCase().includes('vinos')) {
        categoriaName = "Vinos, licores y conservas gourmet y artesanales";
    }

    if (processedLinks.has(nombre)) continue;
    processedLinks.add(nombre);

    const businessId = businessIdMap[nombre];
    const categoryId = categoryIdMap[categoriaName];

    if (businessId && categoryId) {
      console.log(`🔗 Vinculando: ${nombre} -> ${categoriaName}`);
      await fetch(`${STRAPI_API_URL}/negocios/${businessId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { categoria: categoryId } })
      });
    }
  }

  console.log('✅ Vinculación completada con éxito.');
}

sync();
