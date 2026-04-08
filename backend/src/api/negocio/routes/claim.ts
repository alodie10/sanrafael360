export default {
  routes: [
    {
      method: 'POST',
      path: '/negocios/:id/claim',
      handler: 'negocio.claim',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
