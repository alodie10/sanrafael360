
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const MAPPING_PATH = 'c:/sanrafael360/scripts/csv_mapping.json';
const CSV_FULL_PATH = 'c:/sanrafael360/scripts/legacy/importar_listeo_geocodificado.csv';

async function uploadLogos() {
  console.log('🖼️ Iniciando carga masiva de logos (Versión Final)...');

  // Función de normalización
  const normalize = (s: string) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  // 1. Obtener mapeo de Negocios de Strapi
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const negsData: any = await negResp.json();
  const businessIdMap: { [name: string]: number } = {};
  negsData.data.forEach((n: any) => { businessIdMap[normalize(n.nombre)] = n.id; });

  // 2. Cargar mapeo JSON (Sin BOM)
  const mappingPath = 'c:/sanrafael360/scripts/image_mapping.json';
  const rawMapping = fs.readFileSync(mappingPath, 'utf-8');
  const cleanMapping = rawMapping.replace(/^\uFEFF/, '');
  const mapping = JSON.parse(cleanMapping);

  const processed = new Set<string>();
  console.log(`Procesando ${mapping.length} entradas de imágenes...`);

  for (const entry of mapping) {
    const nombreRaw = entry.post_title?.trim();
    const imageUrl = entry._thumbnail_id?.trim();

    if (!nombreRaw || !imageUrl || imageUrl.includes('imagen-no-disponible') || !imageUrl.startsWith('http')) continue;
    
    const nombreNorm = normalize(nombreRaw);
    const businessId = businessIdMap[nombreNorm];
    if (!businessId) continue;

    if (processed.has(nombreNorm)) continue;
    processed.add(nombreNorm);

    console.log(`🚀 Subiendo logo: ${nombreRaw}`);

    try {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) throw new Error(`URL no accesible (${imgResp.status})`);
      const buffer = await imgResp.arrayBuffer();
      const fileName = path.basename(imageUrl.split('?')[0]);

      const form = new FormData();
      const blob = new Blob([buffer]);
      form.append('files', blob, fileName);
      form.append('refId', businessId.toString());
      form.append('ref', 'api::negocio.negocio');
      form.append('field', 'imagen');

      const uploadResp = await fetch(`${STRAPI_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: form as any
      });

      if (uploadResp.ok) {
        console.log(`✅ OK: ${nombreRaw}`);
      } else {
        const err = await uploadResp.json();
        console.error(`❌ Error en Strapi (${nombreRaw}):`, err.error?.message || 'Error desconocido');
      }
    } catch (e: any) {
      console.error(`⚠️ Error al procesar ${nombreRaw}: ${e.message}`);
    }
  }

  console.log('✅ Finalizado.');
}

uploadLogos();
