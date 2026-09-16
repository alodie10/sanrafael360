import { DiscoveryService } from '../src/services/discovery-service';

const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
if (!API_TOKEN) {
  throw new Error('Falta STRAPI_API_TOKEN en el entorno');
}
async function bulkDiscovery() {
  console.log('🔍 Iniciando Proceso de Auto-Descubrimiento Masivo...');
  
  const discoveryService = new DiscoveryService();

  // 1. Obtener todos los negocios de Strapi
  console.log('Obteniendo negocios desde Railway...');
  const resp = await fetch(`${STRAPI_API_URL}/negocios?pagination[limit]=1000`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` }
  });
  
  const data: any = await resp.json();
  const negocios = data.data || [];
  
  console.log(`Se encontraron ${negocios.length} negocios.`);

  let successCount = 0;
  let failCount = 0;

  for (const negocio of negocios) {
    // Solo descubrimos si no tiene sitio web o si está marcado como pendiente
    if (!negocio.website || negocio.discovery_pending) {
      console.log(`\n🚀 Procesando: ${negocio.nombre} [id: ${negocio.id}]`);
      
      const result = await discoveryService.discover(negocio.nombre);
      
      if (result.success) {
        successCount++;
        console.log(`✅ Éxito para ${negocio.nombre}:`);
        if (result.website) console.log(`   - Website: ${result.website}`);
        if (result.reserva_url) console.log(`   - Reserva: ${result.reserva_url}`);
        
        // Actualizar en Strapi
        await fetch(`${STRAPI_API_URL}/negocios/${negocio.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              website: negocio.website || result.website,
              reserva_url: negocio.reserva_url || result.reserva_url,
              google_maps_url: result.google_maps_url,
              horarios_texto: result.horarios_texto,
              discovery_pending: false,
              discovery_verified: false // Requiere verificación humana posterior
            }
          })
        });
      } else {
        failCount++;
        console.warn(`❌ Fallo para ${negocio.nombre}: ${result.error}`);
        
        await fetch(`${STRAPI_API_URL}/negocios/${negocio.id}`, {
            method: 'PUT',
            headers: { 
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: {
                discovery_pending: false // Marcamos como procesado aunque haya fallado para no re-intentar infinitamente
              }
            })
          });
      }

      // Throttling para evitar bloqueos de Google Maps
      const delay = 3000 + Math.random() * 4000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  const total = successCount + failCount;
  const rate = total > 0 ? (successCount / total) * 100 : 0;
  
  console.log('\n--- RESUMEN FINAL ---');
  console.log(`Total procesados: ${total}`);
  console.log(`Éxitos: ${successCount}`);
  console.log(`Fallos: ${failCount}`);
  console.log(`Tasa de éxito: ${rate.toFixed(2)}%`);

  if (rate < 70 && total > 10) {
    console.error('⚠️ ALERTA: La tasa de éxito es inferior al 70%. Revisar selectores.');
  }
}

bulkDiscovery().catch(console.error);
