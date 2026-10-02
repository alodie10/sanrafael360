import { factories } from '@strapi/strapi';

/** Sin REST público; el panel usa /api/crm/*. */
export default factories.createCoreRouter('api::crm-pieza.crm-pieza' as any, {
  only: [],
  config: {},
});
