
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
if (process.env.STRAPI_ALLOW_WIPE !== '1') {
  throw new Error('wipe-data bloqueado. Para ejecutarlo: STRAPI_ALLOW_WIPE=1');
}

async function wipe() {
  console.log('🧹 Iniciando limpieza profunda OPTIMIZADA de la base de datos remota...');
  
  try {
    // Proceso para Negocios
    let hasMoreNegocios = true;
    while (hasMoreNegocios) {
      const negResp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=100`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      });
      const negData: any = await negResp.json();
      
      if (negData.data && negData.data.length > 0) {
        console.log(`Borrando lote de ${negData.data.length} negocios en paralelo...`);
        // Borramos en grupos de 10 para no saturar el servidor pero ser más rápidos
        const batchSize = 10;
        for (let i = 0; i < negData.data.length; i += batchSize) {
          const batch = negData.data.slice(i, i + batchSize);
          await Promise.all(batch.map((n: any) => 
            fetch(`${STRAPI_API_URL}/negocios/${n.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            })
          ));
        }
      } else {
        hasMoreNegocios = false;
      }
    }

    // Proceso para Categorías
    let hasMoreCategorias = true;
    while (hasMoreCategorias) {
      const catResp = await fetch(`${STRAPI_API_URL}/categorias?pagination[limit]=100`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      });
      const catData: any = await catResp.json();
      
      if (catData.data && catData.data.length > 0) {
        console.log(`Borrando lote de ${catData.data.length} categorías...`);
        await Promise.all(catData.data.map((c: any) => 
          fetch(`${STRAPI_API_URL}/categorias/${c.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${API_TOKEN}` }
          })
        ));
      } else {
        hasMoreCategorias = false;
      }
    }

    console.log('✅ Base de datos completamente limpia.');
  } catch (err) {
    console.error('Error durante el wipe:', err);
  }
}

wipe();
