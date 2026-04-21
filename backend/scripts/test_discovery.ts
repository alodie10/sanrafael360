
import { DiscoveryService } from '../src/services/discovery-service';

async function test() {
  const service = new DiscoveryService();
  console.log('Testing discovery for: La cocina de Pettra');
  const result = await service.discover('La cocina de Pettra');
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
