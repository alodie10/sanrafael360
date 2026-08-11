export default {
  routes: [
    {
      method: 'DELETE',
      path: '/negocios/:negocioId/ofertas/:ofertaId',
      handler: 'negocio.deleteOferta',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/negocios/:documentId/algolia-sync',
      handler: 'negocio.algoliaSync',
      config: {
        policies: [],
        middlewares: [],
      },
    },
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
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/resolve-claim/:id',
      handler: 'negocio.adminResolveClaim',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::negocio.admin-resolve-claim-validator'],
      },
    },
    {
      method: 'POST',
      path: '/negocios/:slug/test-reset',
      handler: 'negocio.resetClaimForTest',
      config: {
        // auth:false → Users & Permissions no bloquea; require-admin valida JWT+admin.
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/backfill-stats',
      handler: 'negocio.backfillStats',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/pagos',
      handler: 'negocio.cargarPagoPortal',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::negocio.admin-pago-validator'],
      },
    },
    {
      method: 'DELETE',
      path: '/negocios/admin/pagos/:documentId',
      handler: 'negocio.borrarPagoPortal',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'PUT',
      path: '/negocios/admin/vigencia/:documentId',
      handler: 'negocio.modificarVigenciaPortal',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::negocio.admin-vigencia-validator'],
      },
    },
    {
      method: 'POST',
      path: '/negocios/admin/reset-stats-backfill',
      handler: 'negocio.resetStatsBackfill',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
  ],
};
