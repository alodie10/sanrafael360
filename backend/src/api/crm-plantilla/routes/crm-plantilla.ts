import { factories } from '@strapi/strapi';

/** Sin REST público; el panel usa /api/crm/*. */
export default factories.createCoreRouter('api::crm-plantilla.crm-plantilla' as any, {
  only: [],
  config: {},
});
