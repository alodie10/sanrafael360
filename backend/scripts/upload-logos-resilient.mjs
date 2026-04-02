
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

async function uploadMedia(imageUrl, fileName) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Fallo descarga imagen: ${response.status}`);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('files', blob, fileName);

        const uploadRes = await fetch(`${STRAPI_API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${API_TOKEN}` },
            body: formData
        });

        if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error(`❌ Error Strapi Upload (${uploadRes.status}):`, errorText);
            throw new Error(`Fallo Strapi Upload: ${uploadRes.status}`);
        }
        
        const data = await uploadRes.json();
        return data[0]?.id;
    } catch (error) {
        throw error;
    }
}

async function startMigration() {
  console.log('🛡️ Iniciando migración ULTRA-RESILIENTE (Logos + Portadas)...');

  const normalize = (s) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  try {
    // 1. Cargar mapeo JSON (lo necesitamos para saber qué imágenes corresponden a qué nombres)
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8').replace(/^\uFEFF/, ''));
    console.log(`📂 Mapeo JSON: ${mapping.length} entradas.`);

    // 2. Obtener Negocios en páginas pequeñas
    const CHUNK_SIZE = 5;
    let page = 1;
    let pageCount = 1;
    let processedCount = 0;

    // Crear un mapa para búsqueda rápida del JSON
    const jsonMap = {};
    mapping.forEach(entry => {
        if (entry.post_title) jsonMap[normalize(entry.post_title)] = entry._thumbnail_id;
    });

    while (page <= pageCount) {
        console.log(`📡 Obteniendo negocios - Página ${page} (Bloque de ${CHUNK_SIZE})...`);
        const negResp = await fetchWithRetry(`${STRAPI_API_URL}/negocios?pagination[page]=${page}&pagination[pageSize]=${CHUNK_SIZE}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        
        const res = await negResp.json();
        const businesses = res.data || [];
        pageCount = res.meta?.pagination?.pageCount || 1;

        console.log(`📦 Procesando ${businesses.length} negocios de esta página...`);

        for (const biz of businesses) {
            const bizName = biz.nombre;
            const docId = biz.documentId;
            const normName = normalize(bizName);
            const imageUrl = jsonMap[normName];

            if (!imageUrl || imageUrl.includes('imagen-no-disponible')) {
                // console.log(`   ⏭️ Sin imagen para: ${bizName}`);
                continue;
            }

            console.log(`🚀 [${++processedCount}] Procesando: ${bizName}`);

            try {
                await sleep(5000); // Pausa entre operaciones
                const fileName = `logo_${biz.id}.jpg`;
                const fileId = await uploadMedia(imageUrl, fileName);

                if (fileId) {
                    await sleep(3000);
                    const updateResp = await fetch(`${STRAPI_API_URL}/negocios/${docId}`, {
                        method: 'PUT',
                        headers: { 
                            'Authorization': `Bearer ${API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            data: {
                                logo: fileId,
                                imagen_portada: fileId
                            }
                        })
                    });

                    if (updateResp.ok) {
                        console.log(`   ✅ EXITO: ${bizName}`);
                    } else {
                        console.error(`   ❌ FALLO vinculación: ${bizName}`);
                    }
                }
            } catch (e) {
                console.error(`   ⚠️ Error en ${bizName}: ${e.message}`);
            }
        }

        page++;
        console.log('⏳ Descansando 5s para el siguiente lote...');
        await sleep(5000); 
    }
  } catch (err) {
      console.error('❌ Error Crítico:', err.message);
  }

  console.log('✔️ Restauración Completa finalizada.');
}

startMigration();
