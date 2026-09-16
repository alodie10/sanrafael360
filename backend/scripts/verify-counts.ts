
/**
 * SCRIPT DE VERIFICACIÓN: Conteo de Negocios en Strapi
 */
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
async function verify() {
  console.log('🔍 Consultando base de datos remota...');
  
  try {
    const resp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    
    const data: any = await resp.json();
    
    if (data.meta && data.meta.pagination) {
        console.log('--- RESUMEN DE MIGRACIÓN ---');
        console.log(`Total de negocios en Strapi: ${data.meta.pagination.total}`);
        if (data.meta.pagination.total >= 365) {
            console.log('✅ Verificación exitosa: Se alcanzó la meta de negocios únicos.');
        } else {
            console.log(`⚠️ Aún faltan negocios (Meta: 365, Actual: ${data.meta.pagination.total}).`);
        }
    } else {
        console.error('No se pudo obtener el conteo de la API.', data);
    }
  } catch (err) {
    console.error('Error de conexión:', err);
  }
}

verify();
