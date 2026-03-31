
import fs from 'fs';
import path from 'path';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

// Mapeo de Categorías con sus respectivos archivos generados
const categoryImages = [
  { id: 2921, name: 'Hoteles', file: 'category_hoteles_cover_1774972479157.png' },
  { id: 2922, name: 'Cabañas', file: 'category_cabanas_cover_1774972605036.png' },
  { id: 2923, name: 'Gastronomía', file: 'category_gastronomia_cover_1774972632823.png' },
  { id: 2924, name: 'Atracciones', file: 'category_atracciones_cover_v2_1774972786010.png' },
  { id: 2925, name: 'Vinos', file: 'category_vinos_cover_v2_1774972823870.png' },
  { id: 2926, name: 'Farmacias', file: 'category_farmacias_cover_1774972847009.png' },
  { id: 2927, name: 'Servicios', file: 'category_servicios_cover_1774972714240.png' },
  { id: 2928, name: 'Comercios', file: 'category_comercios_cover_1774972866141.png' },
  { id: 2929, name: 'Hostels', file: 'category_hostels_cover_1774972886960.png' },
  { id: 2930, name: 'Posadas', file: 'category_posadas_cover_1774972744770.png' }
];

const ARTIFACTS_DIR = 'C:/Users/Argendeli/.gemini/antigravity/brain/ab330e6b-983c-4bde-8bba-1a46598bff88';

async function uploadCategoryCovers() {
  console.log('🚀 Iniciando subida de portadas de categorías...');

  for (const item of categoryImages) {
    const filePath = path.join(ARTIFACTS_DIR, item.file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`⚠️ Archivo no encontrado: ${item.file}`);
      continue;
    }

    console.log(`📤 Subiendo portada para: ${item.name}...`);

    try {
      const buffer = fs.readFileSync(filePath);
      const form = new FormData();
      const blob = new Blob([buffer]);
      
      form.append('files', blob, item.file);
      form.append('refId', item.id.toString());
      form.append('ref', 'api::categoria.categoria');
      form.append('field', 'imagen_portada');

      const resp = await fetch(`${STRAPI_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: form as any
      });

      if (resp.ok) {
        console.log(`✅ ${item.name}: Portada actualizada.`);
      } else {
        const err = await resp.json();
        console.error(`❌ Error en ${item.name}:`, JSON.stringify(err));
      }
    } catch (e: any) {
      console.error(`❌ Error fatal en ${item.name}: ${e.message}`);
    }
  }

  console.log('✨ Proceso finalizado.');
}

uploadCategoryCovers();
