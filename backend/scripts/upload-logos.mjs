
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/image_mapping.json';

async function uploadLogos() {
  console.log('🖼️ Iniciando carga masiva de logos (Versión Optimizada Strapi 5)...');

  const normalize = (s) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  try {
    // 1. Obtener mapeo de Negocios de Strapi Railway (Paginado)
    console.log('Cargando negocios desde Railway (Paginado de 100 en 100)...');
    let allBusinesses = [];
    let page = 1;
    let pageCount = 1;

    while (page <= pageCount) {
        console.log(`📡 Obteniendo página ${page}...`);
        const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[page]=${page}&pagination[pageSize]=100`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        
        if (!negResp.ok) {
            const errLog = await negResp.text();
            throw new Error(`Error ${negResp.status} al obtener negocios: ${errLog.substring(0, 100)}`);
        }

        const res = await negResp.json();
        if (res.data) allBusinesses = allBusinesses.concat(res.data);
        pageCount = res.meta?.pagination?.pageCount || 1;
        page++;
    }

    const businessIdMap = {};
    allBusinesses.forEach((n) => { businessIdMap[normalize(n.nombre)] = n.id; });
    console.log(`📊 Se cargaron ${allBusinesses.length} negocios de Strapi.`);

    // 2. Cargar mapeo JSON (Sin BOM)
    const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
    const cleanMapping = rawMapping.replace(/^\uFEFF/, '');
    const mapping = JSON.parse(cleanMapping);

    const processed = new Set();
    let count = 0;
    console.log(`📂 Mapeo JSON cargado: ${mapping.length} entradas.`);

    for (const entry of mapping) {
        const nombreRaw = entry.post_title?.trim();
        const imageUrl = entry._thumbnail_id?.trim();

        if (!nombreRaw || !imageUrl || imageUrl.includes('imagen-no-disponible') || !imageUrl.startsWith('http')) continue;
        
        const nombreNorm = normalize(nombreRaw);
        const businessId = businessIdMap[nombreNorm];

        if (!businessId) continue;
        if (processed.has(nombreNorm)) continue;
        processed.add(nombreNorm);

        console.log(`🚀 [${++count}] Procesando: ${nombreRaw}`);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Pausa de 1.5s
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

            if (uploadResp.ok) {
                console.log(`✅ OK: ${nombreRaw}`);
            } else {
                const status = uploadResp.status;
                let errMsg = await uploadResp.text();
                console.error(`❌ Error ${status} en Strapi (${nombreRaw}):`, errMsg.substring(0, 100));
            }
        } catch (e) {
            console.error(`⚠️ Error al procesar ${nombreRaw}: ${e.message}`);
        }
    }
  } catch (err) {
      console.error('❌ Error general:', err.message);
  }

  console.log('✅ Proceso de logos finalizado.');
}

uploadLogos();
