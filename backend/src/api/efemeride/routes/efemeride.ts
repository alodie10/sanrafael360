import { factories } from '@strapi/strapi';

/** Core router vacío: el público y el admin usan rutas custom. */
export default factories.createCoreRouter('api::efemeride.efemeride' as any, {
  only: [],
  config: {},
});
