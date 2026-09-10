import { factories } from '@strapi/strapi';

/** Core CRUD cerrado: pagos se crean por webhook / admin custom, no por REST público. */
export default factories.createCoreRouter('api::pago.pago', {
  only: [],
  config: {},
});
