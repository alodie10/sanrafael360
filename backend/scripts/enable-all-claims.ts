
import fetch from 'node-fetch';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '15a9b510789a322b3984bde54ee75c94dd3feb717e916779aedf8de9cc8e07a61f779167efccf3657e0d1831074e31870029e6eded789dedf987b4ead9f189e5c1d6b9e1c1439f6927edbee3d19c3a013423df3b8f2b620826fb572caaac559f84e46faa1c22c656449348922cf933f515c92cf2d698c233fa52bd88efe73635';

async function enableAllClaims() {
  console.log('🚀 Iniciando habilitación masiva de reclamos...');

  try {
    // 1. Obtener todos los negocios
    console.log('Consultando lista de negocios...');
    const resp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    
    const data: any = await resp.json();
    if (!data.data) {
       console.error('Error al obtener negocios:', data);
       return;
    }

    const businesses = data.data;
    console.log(`Encontrados ${businesses.length} negocios.`);

    let count = 0;
    for (const biz of businesses) {
      if (biz.reclamar_habilitado) {
        console.log(`⏩ [${++count}/${businesses.length}] ${biz.nombre} ya está habilitado.`);
        continue;
      }

      console.log(`✅ [${++count}/${businesses.length}] Habilitando reclamo para: ${biz.nombre}`);
      
      const updateResp = await fetch(`${STRAPI_API_URL}/negocios/${biz.documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            reclamar_habilitado: true
          }
        })
      });

      if (!updateResp.ok) {
        const err = await updateResp.json();
        console.error(`❌ Error actualizando ${biz.nombre}:`, err);
      }
    }

    console.log('✨ Proceso finalizado con éxito.');

  } catch (error: any) {
    console.error('💥 Error crítico:', error.message);
  }
}

enableAllClaims();
