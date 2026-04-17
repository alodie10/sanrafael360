export default {
  routes: [
    {
      method: 'PUT',
      path: '/negocios/:id/portal-update',
      handler: 'negocio.portalUpdate',
      config: {
        policies: [],
        middlewares: ['api::negocio.negocio-validator'],
      },
    },
    {
      method: 'GET',
      path: '/negocios/admin/pending-claims',
      handler: 'negocio.adminPendingClaims',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/resolve-claim/:id',
      handler: 'negocio.adminResolveClaim',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/:slug/test-reset',
      handler: 'negocio.resetClaimForTest',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
