
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/image_mapping.json';

async function uploadLogos() {
  console.log('🖼️ Iniciando carga masiva de logos (Optimizado para 365 Negocios)...');

  const normalize = (s) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  // 1. Obtener mapeo de Negocios de Strapi Railway
  console.log('Cargando negocios desde Railway...');
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const negsData = await negResp.json();
  const businessIdMap = {};
  negsData.data.forEach((n) => { businessIdMap[normalize(n.nombre)] = n.id; });

  // 2. Cargar y agrupar por negocio único
  const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
  const mapping = JSON.parse(rawMapping.replace(/^\uFEFF/, ''));

  const uniqueLogos = new Map();
  mapping.forEach(entry => {
    const nombre = entry.post_title?.trim();
    const url = entry._thumbnail_id?.trim();
    if (nombre && url && url.startsWith('http') && !url.includes('imagen-no-disponible')) {
      if (!uniqueLogos.has(nombre)) {
        uniqueLogos.set(nombre, url);
      }
    }
  });

  console.log(`🚀 Procesando ${uniqueLogos.size} logos únicos...`);
  let count = 0;

  for (const [nombreRaw, imageUrl] of uniqueLogos.entries()) {
    const nombreNorm = normalize(nombreRaw);
    const businessId = businessIdMap[nombreNorm];
    if (!businessId) continue;

    process.stdout.write(`\r🚀 [${++count}/${uniqueLogos.size}] Subiendo: ${nombreRaw.substring(0, 30)}...`);

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
      form.append('field', 'logo');

      const uploadResp = await fetch(`${STRAPI_API_URL.replace('/api', '')}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: form
      });

      if (!uploadResp.ok) {
        const err = await uploadResp.json();
        console.error(`\n❌ Error en Strapi (${nombreRaw}):`, err.error?.message || 'Error desconocido');
      }
    } catch (e) {
      console.error(`\n⚠️ Error al procesar ${nombreRaw}: ${e.message}`);
    }
  }

  console.log('\n✅ Carga de logos finalizada.');
}

uploadLogos();
