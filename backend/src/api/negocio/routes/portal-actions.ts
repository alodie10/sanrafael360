export default {
  routes: [
    {
      method: 'PUT',
      path: '/negocios/:id/portal-update',
      handler: 'negocio.portalUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
