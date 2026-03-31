
/**
 * SCRIPT DE VERIFICACIÓN: Conteo de Negocios en Strapi
 */
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

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
