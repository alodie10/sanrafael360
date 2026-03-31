
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

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
