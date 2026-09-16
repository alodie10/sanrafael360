/**
 * atributo router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::atributo.atributo' as any, {
  config: {
    create: {
      middlewares: ['global::require-auth'],
    },
  },
});
