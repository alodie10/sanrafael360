import { DiscoveryService } from './src/services/discovery-service';

const svc = new DiscoveryService();
svc.discover("El Viejo Bodegon San Rafael").then(console.log).catch(console.error);
