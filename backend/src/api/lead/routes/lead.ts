import { factories } from '@strapi/strapi';

/** Core CRUD cerrado: el inbox admin usa /leads/admin + convert. */
export default factories.createCoreRouter('api::lead.lead' as any, {
  only: [],
  config: {},
});
