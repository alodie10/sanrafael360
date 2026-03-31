
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';

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
