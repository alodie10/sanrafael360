import { factories } from '@strapi/strapi';

// @ts-ignore
export default factories.createCoreRouter('api::review.review', {
  config: {
    create: {
      middlewares: ['api::review.review-create-validator'],
    },
  },
});
