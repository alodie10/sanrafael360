import { factories } from '@strapi/strapi';

/** Core router sin endpoints públicos; el portal usa rutas admin. */
export default factories.createCoreRouter('api::cliente.cliente' as any, {
  only: [],
  config: {},
});
