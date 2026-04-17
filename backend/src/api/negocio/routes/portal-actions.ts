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
      handler: 'api::negocio.negocio.resetClaimForTest',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/:slug/test-upload-diag',
      handler: 'api::negocio.negocio.testUploadDiag',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
