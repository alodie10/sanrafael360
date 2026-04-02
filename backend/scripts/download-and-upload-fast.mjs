
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

async function fetchWithRetry(url, options, retries = 3, backoff = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status >= 500) {
                console.log(`⚠️ Servidor con problemas (${res.status}). Reintentando en ${backoff/1000}s...`);
                await sleep(backoff);
                continue;
            }
            return res;
        } catch (err) {
            console.log(`📡 Error de conexión: ${err.message}. Reintentando...`);
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
            throw new Error(`Fallo Strapi Upload (${uploadRes.status}): ${errorText}`);
        }
        
        const data = await uploadRes.json();
        return data[0]?.id;
    } catch (error) {
        throw error;
    }
}

async function startFastSync() {
  console.log('🚀 Iniciando restauración rápida con mapeo de links originales...');

  const normalize = (s) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  try {
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8').replace(/^\uFEFF/, ''));
    console.log(`📂 Mapeo JSON cargado: ${mapping.length} entradas.`);

    const jsonMap = {};
    mapping.forEach(entry => {
        if (entry.post_title) jsonMap[normalize(entry.post_title)] = entry._thumbnail_id;
    });

    let page = 1;
    let pageCount = 1;
    let processed = 0;
    const PAGE_SIZE = 5;

    while (page <= pageCount) {
        console.log(`\n📡 Consultando negocios - Lote ${page}...`);
        const negResp = await fetchWithRetry(`${STRAPI_API_URL}/negocios?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        
        const res = await negResp.json();
        const businesses = res.data || [];
        pageCount = res.meta?.pagination?.pageCount || 1;

        for (const biz of businesses) {
            const bizName = biz.nombre;
            const docId = biz.documentId;
            const normName = normalize(bizName);
            const imageUrl = jsonMap[normName];

            if (!imageUrl || imageUrl.includes('imagen-no-disponible')) continue;

            console.log(`📦 [${++processed}] Procesando: ${bizName}`);

            try {
                await sleep(5000); // Pausa entre negocios
                const fileName = `logo_${biz.id}.jpg`;
                const fileId = await uploadMedia(imageUrl, fileName);

                if (fileId) {
                    await sleep(2000);
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
                        console.log(`   ✅ Completado con éxito.`);
                    } else {
                        console.error(`   ❌ Error al vincular.`);
                    }
                }
            } catch (err) {
                console.error(`   ⚠️ Error en este negocio: ${err.message}`);
                await sleep(10000); // Pausa extra en caso de error
            }
        }

        page++;
        await sleep(3000);
    }
  } catch (err) {
      console.error('❌ Error Crítico:', err.message);
  }

  console.log('\n🏁 Sincronización finalizada.');
}

startFastSync();
