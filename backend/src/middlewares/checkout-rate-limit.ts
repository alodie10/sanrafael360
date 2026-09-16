import { hitMemoryRateLimit } from '../utils/memory-rate-limit';
import { clientIpFromKoa } from '../utils/client-ip';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

export default (_config: unknown, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const ip = clientIpFromKoa(ctx);
    if (!hitMemoryRateLimit(`checkout:${ip}`, MAX_REQUESTS, WINDOW_MS)) {
      strapi.log.warn(`[CheckoutRateLimit] Bloqueado ${ip}`);
      ctx.status = 429;
      ctx.body = { error: { message: 'Demasiadas reservas. Probá en un minuto.' } };
      return;
    }
    await next();
  };
};
