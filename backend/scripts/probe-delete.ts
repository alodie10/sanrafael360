
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

async function probe() {
  console.log('🧪 Iniciando prueba de borrado...');
  const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  const data: any = await negResp.json();
  if (data.data && data.data.length > 0) {
    const id = data.data[0].id;
    console.log(`Intentando borrar ID: ${id} (${data.data[0].nombre})`);
    const delResp = await fetch(`${STRAPI_API_URL}/negocios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    console.log(`Status de respuesta: ${delResp.status}`);
    const res = await delResp.json();
    console.log('Cuerpo de respuesta:', JSON.stringify(res, null, 2));
  } else {
    console.log('No quedan negocios para borrar.');
  }
}

probe();
