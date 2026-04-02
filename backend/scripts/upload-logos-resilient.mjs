
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/image_mapping.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, backoff = 30000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 502 || res.status === 503 || res.status === 504) {
                console.log(`⚠️ Servidor saturado (${res.status}). Reintentando en ${backoff/1000}s... (Intento ${i+1}/${retries})`);
                await sleep(backoff);
                continue;
            }
            return res;
        } catch (err) {
            console.log(`📡 Error de conexión: ${err.message}. Reintentando en ${backoff/1000}s...`);
            await sleep(backoff);
        }
    }
    throw new Error(`Fallo tras ${retries} reintentos`);
}

async function uploadLogos() {
  console.log('🛡️ Iniciando migración en MODO RESILIENTE (Máxima Seguridad)...');

  const normalize = (s) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  try {
    // 1. Obtener Negocios en páginas pequeñas
    console.log('Cargando negocios en lotes de 20 para evitar crashes...');
    let allBusinesses = [];
    let page = 1;
    let pageCount = 1;

    while (page <= pageCount) {
        console.log(`📡 Obteniendo página ${page}...`);
        const negResp = await fetchWithRetry(`${STRAPI_API_URL}/negocios?pagination[page]=${page}&pagination[pageSize]=20`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        
        const res = await negResp.json();
        if (res.data) allBusinesses = allBusinesses.concat(res.data);
        pageCount = res.meta?.pagination?.pageCount || 1;
        page++;
        await sleep(3000); // Pausa entre páginas de negocios
    }

    const businessIdMap = {};
    allBusinesses.forEach((n) => { businessIdMap[normalize(n.nombre)] = n.id; });
    console.log(`📊 Total negocios en Strapi: ${allBusinesses.length}`);

    // 2. Cargar mapeo JSON
    const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
    const mapping = JSON.parse(rawMapping.replace(/^\uFEFF/, ''));
    console.log(`📂 Mapeo JSON cargado: ${mapping.length} entradas.`);

    let successCount = 0;
    const processed = new Set();

    for (const entry of mapping) {
        const nombreRaw = entry.post_title?.trim();
        const imageUrl = entry._thumbnail_id?.trim();

        if (!nombreRaw || !imageUrl || imageUrl.includes('imagen-no-disponible') || !imageUrl.startsWith('http')) continue;
        
        const nombreNorm = normalize(nombreRaw);
        const businessId = businessIdMap[nombreNorm];

        if (!businessId || processed.has(nombreNorm)) continue;
        processed.add(nombreNorm);

        console.log(`🚀 [${++successCount}] Subiendo: ${nombreRaw}`);

        try {
            await sleep(6000); // PAUSA LARGA (6 segundos) para respiro de Railway
            
            const imgResp = await fetchWithRetry(imageUrl, {});
            const buffer = await imgResp.arrayBuffer();
            const fileName = path.basename(imageUrl.split('?')[0]);

            const form = new FormData();
            const blob = new Blob([buffer]);
            form.append('files', blob, fileName);
            form.append('refId', businessId.toString());
            form.append('ref', 'api::negocio.negocio');
            form.append('field', 'logo');

            const uploadResp = await fetchWithRetry(`${STRAPI_API_URL.replace('/api', '')}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${API_TOKEN}` },
                body: form
            });

            if (uploadResp.ok) {
                console.log(`✅ EXITO: ${nombreRaw}`);
            } else {
                console.error(`❌ FALLO ${uploadResp.status} en ${nombreRaw}`);
            }
        } catch (e) {
            console.error(`⚠️ Error procesando ${nombreRaw}: ${e.message}`);
        }
    }
  } catch (err) {
      console.error('❌ Error Crítico:', err.message);
  }

  console.log('✔️ Proceso Resiliente finalizado.');
}

uploadLogos();
