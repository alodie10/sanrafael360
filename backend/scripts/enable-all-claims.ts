
import fetch from 'node-fetch';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
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
