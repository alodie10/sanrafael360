import { factories } from '@strapi/strapi';

/** Core CRUD cerrado: create/list/update van por custom-soporte. */
export default factories.createCoreRouter('api::soporte.soporte' as any, {
  only: [],
  config: {},
});
