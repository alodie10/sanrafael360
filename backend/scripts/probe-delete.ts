
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
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
