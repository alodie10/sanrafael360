export default {
  routes: [
    {
      method: 'POST',
      path: '/negocios/:id/claim',
      handler: 'negocio.claim',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-auth', 'api::negocio.negocio-validator'],
      },
    },
  ],
};
