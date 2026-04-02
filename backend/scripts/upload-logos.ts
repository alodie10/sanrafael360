
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';
const MAPPING_PATH = 'c:/sanrafael360/backend/scripts/image_mapping.json';

async function uploadLogos() {
  console.log('🖼️ Iniciando carga masiva de logos (Versión Railway Final)...');

  const normalize = (s: string) => s ? s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() : '';

  // 1. Obtener mapeo de Negocios de Strapi Railway
  console.log('Cargando negocios desde Railway...');
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const negsData: any = await negResp.json();
  const businessIdMap: { [name: string]: number } = {};
  negsData.data.forEach((n: any) => { businessIdMap[normalize(n.nombre)] = n.id; });

  // 2. Cargar mapeo JSON (Sin BOM)
  const rawMapping = fs.readFileSync(MAPPING_PATH, 'utf-8');
  const cleanMapping = rawMapping.replace(/^\uFEFF/, '');
  const mapping = JSON.parse(cleanMapping);

  const processed = new Set<string>();
  let count = 0;
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

    console.log(`🚀 [${++count}/${mapping.length}] Subiendo logo: ${nombreRaw}`);

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
      form.append('field', 'logo'); // CORRECCIÓN: el campo se llama 'logo' en Strapi 5

      const uploadResp = await fetch(`${STRAPI_API_URL.replace('/api', '')}/api/upload`, {
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
