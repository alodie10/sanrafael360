export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/favoritos/me',
      handler: 'negocio.getFavorites',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/:documentId/toggle-favorite',
      handler: 'negocio.toggleFavorite',
      config: {
        policies: [],
        middlewares: [],
      },
    },
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
    {
      method: 'POST',
      path: '/negocios/admin/backfill-stats',
      handler: 'negocio.backfillStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/reset-stats-backfill',
      handler: 'negocio.resetStatsBackfill',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
