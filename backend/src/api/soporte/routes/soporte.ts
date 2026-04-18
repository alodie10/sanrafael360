import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::soporte.soporte' as any, {
  config: {
    create: {
      middlewares: ['api::soporte.consulta-validator'],
    },
  },
});
