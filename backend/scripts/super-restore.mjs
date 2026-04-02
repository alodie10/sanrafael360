
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURACIÓN CLOUDINARY (REST API) ---
const CLOUD_NAME = 'dg0msu8ru';
const API_KEY = '517598867933172';
const API_SECRET = '6frfOJz7L7V_x-GEjttlfkibYRQ';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/image_mapping.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para generar firma de Cloudinary sin SDK
function generateSignature(params, apiSecret) {
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
    return crypto.createHash('sha1').update(signatureString).digest('hex');
}

async function uploadToCloudinaryNative(imageUrl, publicId) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
        folder: 'sanrafael360_logos',
        public_id: publicId,
        timestamp: timestamp
    };
    
    const signature = generateSignature(params, API_SECRET);
    
    const formData = new FormData();
    formData.append('file', imageUrl); // Cloudinary REST acepta URLs directamente
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', 'sanrafael360_logos');
    formData.append('public_id', publicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Cloudinary Error: ${err}`);
    }

    return await res.json();
}

async function main() {
    console.log('🚀 Iniciando SUPER-RESTAURACIÓN NATIVA Node 20 (Local -> Cloudinary -> Strapi)...');
    
    try {
        const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8').replace(/^\uFEFF/, ''));
        console.log(`📂 Mapeo JSON: ${mapping.length} entradas.`);

        const normalize = (s) => s ? s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .trim() : '';

        const jsonMap = {};
        mapping.forEach(entry => {
            if (entry.post_title) jsonMap[normalize(entry.post_title)] = entry._thumbnail_id;
        });

        let page = 1;
        let pageCount = 1;
        let processed = 0;
        const PAGE_SIZE = 5;

        while (page <= pageCount) {
            console.log(`\n📡 Consultando Strapi - Página ${page}...`);
            const res = await fetch(`${STRAPI_API_URL}/negocios?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`, {
                headers: { Authorization: `Bearer ${API_TOKEN}` }
            });
            const data = await res.json();
            const businesses = data.data || [];
            pageCount = data.meta?.pagination?.pageCount || 1;

            for (const biz of businesses) {
                const bizName = biz.nombre;
                const docId = biz.documentId;
                const imageUrl = jsonMap[normalize(bizName)];

                if (!imageUrl || imageUrl.includes('imagen-no-disponible')) continue;

                if (biz.logo) {
                    console.log(`   ⏭️ Saltando (Ya tiene logo): ${bizName}`);
                    continue;
                }

                console.log(`📦 [${++processed}] Sincronizando: ${bizName}`);

                try {
                    // 1. Subida nativa a Cloudinary (Pura API REST)
                    const uploadRes = await uploadToCloudinaryNative(imageUrl, `logo_${biz.id}`);

                    // 2. Registro rápido en Strapi
                    const regRes = await fetch(`${STRAPI_API_URL}/negocios/register-cloudinary`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${API_TOKEN}`
                         },
                        body: JSON.stringify({
                            url: uploadRes.secure_url,
                            name: `logo_${biz.id}.${uploadRes.format}`,
                            hash: uploadRes.public_id,
                            size: Math.round(uploadRes.bytes / 1024),
                            width: uploadRes.width,
                            height: uploadRes.height,
                            ext: `.${uploadRes.format}`,
                            mime: `image/${uploadRes.format}`
                        })
                    });

                    const fileInfo = await regRes.json();
                    
                    if (fileInfo.id) {
                        // 3. Vincular al negocio
                        await fetch(`${STRAPI_API_URL}/negocios/${docId}`, {
                            method: 'PUT',
                            headers: { 
                                'Authorization': `Bearer ${API_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                data: {
                                    logo: fileInfo.id,
                                    imagen_portada: fileInfo.id
                                }
                            })
                        });
                        console.log(`   ✅ ÉXITO: ${bizName}`);
                    }
                } catch (err) {
                    console.error(`   ⚠️ Error en ${bizName}: ${err.message}`);
                }
                
                await sleep(1500); // Pausa de seguridad
            }
            page++;
        }
    } catch (err) {
        console.error('❌ Error Crítico:', err.message);
    }
}

main();
