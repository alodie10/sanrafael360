
import { DiscoveryService } from '../src/services/discovery-service';
import * as dotenv from 'dotenv';

dotenv.config();

async function testLive() {
  const service = new DiscoveryService();
  const name = "After House";
  
  console.log(`🚀 Probando descubrimiento real para: ${name}...`);
  
  try {
    const result = await service.discover(name);
    console.log("✅ Resultado:", JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("🔥 ¡ÉXITO! El scraper funciona correctamente con Playwright.");
    } else {
      console.error("❌ FALLO:", result.error);
    }
  } catch (err) {
    console.error("💥 ERROR CRÍTICO:", err);
  }
}

testLive();
