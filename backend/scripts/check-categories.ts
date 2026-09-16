
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
async function check() {
  console.log('🔍 Revisando categorías...');
  try {
    const catResp = await fetch(`${STRAPI_API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const cats = await catResp.json();
    console.log(`Total categorías: ${cats.meta?.pagination?.total}`);
    if (cats.data && cats.data.length > 0) {
      console.log('Muestra de categorías:', cats.data.slice(0, 3).map((c:any) => c.nombre));
    }

    console.log('\n🔍 Revisando un negocio al azar...');
    const negResp = await fetch(`${STRAPI_API_URL}/negocios?populate=*&pagination[limit]=1`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const negs = await negResp.json();
    if (negs.data && negs.data.length > 0) {
      const n = negs.data[0];
      console.log(`Negocio: ${n.nombre}`);
      console.log(`Categoría vinculada:`, n.categoria ? n.categoria.nombre : 'NINGUNA');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
