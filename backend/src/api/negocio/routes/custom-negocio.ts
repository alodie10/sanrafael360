export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/me',
      handler: 'api::negocio.negocio.me',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
