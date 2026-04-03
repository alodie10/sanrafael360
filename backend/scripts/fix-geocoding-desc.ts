
import fs from 'fs';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';
const CSV_PATH = 'c:/sanrafael360/backend/scripts/legacy/importar_listeo_geocodificado.csv';

// Normalización para comparaciones de nombres
const normalize = (s: string) => s ? s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim() : '';

// Función para limpiar la descripción
const sanitizeDescription = (desc: string) => {
  if (!desc) return '';
  // Remover la URL y el texto "Más información en:" o similar que suele precederla
  let clean = desc.replace(/(?:Más información en:|Más info en:|Más info:|Más información:|Ver más en:)?\s*https?:\/\/sanrafaelturismo\.gov\.ar\/[^\s]*/gi, '');
  return clean.trim();
};

async function fixData() {
  console.log('🚀 Iniciando corrección de Geocodificación y limpieza de Descripciones...');

  // 1. Obtener todos los negocios de Strapi
  console.log('Obteniendo negocios de Strapi...');
  const res = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const strapiData = await res.json() as any;
  const negocios = strapiData.data || [];
  console.log(`Encontrados ${negocios.length} negocios en Strapi.`);

  // 2. Leer y parsear CSV (A mano para evitar dependencias extra)
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const titleIdx = headers.indexOf('post_title');
  const latIdx = headers.indexOf('_geolocation_lat');
  const lngIdx = headers.indexOf('_geolocation_long');
  const contentIdx = headers.indexOf('post_content');

  // Mapear datos del CSV por nombre normalizado
  const csvMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Regex para manejar comas dentro de comillas
    const title = row[titleIdx]?.replace(/"/g, '').trim();
    if (title) {
      csvMap.set(normalize(title), {
        lat: row[latIdx],
        lng: row[lngIdx],
        content: row[contentIdx]?.replace(/^"|"$/g, '').trim()
      });
    }
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const negocio of negocios) {
    const nombreNorm = normalize(negocio.nombre);
    const csvEntry = csvMap.get(nombreNorm);

    if (!csvEntry) {
      console.log(`⚠️ No encontrado en CSV: ${negocio.nombre}`);
      skippedCount++;
      continue;
    }

    const newLat = parseFloat(csvEntry.lat);
    const newLng = parseFloat(csvEntry.lng);
    const originalDesc = negocio.descripcion || '';
    const cleanedDesc = sanitizeDescription(csvEntry.content || originalDesc);

    // Solo actualizar si hay cambios significativos o si los campos están vacíos
    // (En este caso el usuario pide CORREGIR, así que actualizamos siempre que haya datos en el CSV)
    
    console.log(`🔄 Actualizando: ${negocio.nombre}...`);

    try {
      const updateRes = await fetch(`${STRAPI_API_URL}/negocios/${negocio.documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            latitud: newLat,
            longitud: newLng,
            descripcion: cleanedDesc
          }
        })
      });

      if (updateRes.ok) {
        console.log(`✅ OK: ${negocio.nombre}`);
        updatedCount++;
      } else {
        const error = await updateRes.json() as any;
        console.error(`❌ Fallo: ${negocio.nombre}`, error.error?.message || 'Error desconocido');
      }
    } catch (e: any) {
      console.error(`❌ Error fatal en: ${negocio.nombre}`, e.message);
    }

    // Delay para no saturar Strapi / Railway
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✨ Proceso finalizado.`);
  console.log(`Actualizados: ${updatedCount}`);
  console.log(`Omitidos: ${skippedCount}`);
}

fixData();
