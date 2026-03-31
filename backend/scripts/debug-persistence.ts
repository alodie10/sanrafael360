
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

async function debugPersistance() {
  console.log('🧪 Iniciando diagnóstico de persistencia profunda...');
  
  // 1. Obtener un negocio al azar
  const resp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1&_cb=${Date.now()}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Cache-Control': 'no-cache' }
  });
  const data: any = await resp.json();
  
  if (!data.data || data.data.length === 0) {
    console.log('No quedan negocios en la base de datos (¡o la caché está vacía!)');
    return;
  }

  const id = data.data[0].id;
  const name = data.data[0].nombre;
  console.log(`Intentando borrar ID: ${id} (${name})`);

  // 2. Borrarlo
  const delResp = await fetch(`${STRAPI_API_URL}/negocios/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  console.log(`Status de DELETE: ${delResp.status}`);

  // 3. Intentar recuperarlo inmediatamente con No-Cache
  console.log('Verificando si realmente desapareció...');
  const verResp = await fetch(`${STRAPI_API_URL}/negocios/${id}?_cb=${Date.now()}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Cache-Control': 'no-cache' }
  });
  
  if (verResp.status === 404) {
    console.log('✅ Éxito: El negocio desapareció (404 Not Found).');
  } else {
    const checkData: any = await verResp.json();
    console.log(`⚠️ ALARMA: El negocio con ID ${id} SIGUE EXISTIENDO tras el borrado (Status: ${verResp.status})`);
    console.log('Datos actuales:', JSON.stringify(checkData.data, null, 2));
  }
}

debugPersistance();
