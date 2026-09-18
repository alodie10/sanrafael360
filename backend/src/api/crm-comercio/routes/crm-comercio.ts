import { factories } from '@strapi/strapi';

/** Sin REST público; el panel usa /api/crm/*. */
export default factories.createCoreRouter('api::crm-comercio.crm-comercio' as any, {
  only: [],
  config: {},
});
