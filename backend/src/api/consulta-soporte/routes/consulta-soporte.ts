import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::consulta-soporte.consulta-soporte' as any, {
  config: {
    create: {
      middlewares: ['api::consulta-soporte.consulta-validator'],
    },
  },
});
