export default {
  routes: [
    {
      method: 'POST',
      path: '/reservas/checkout',
      handler: 'reserva.checkout',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.checkout-validator'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/simulate-success',
      handler: 'reserva.simulateSuccess',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/reservas/webhook',
      handler: 'reserva.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::mercadopago-webhook'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/webhook',
      handler: 'reserva.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::mercadopago-webhook'],
      },
    },
    {
      method: 'GET',
      path: '/reservas/codigo/:codigo',
      handler: 'reserva.publicByCodigo',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/reservas/admin/comercios',
      handler: 'reserva.adminListComercios',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-portal'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/comercios',
      handler: 'reserva.adminCreateComercio',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::reserva.admin-alta-validator'],
      },
    },
    {
      method: 'GET',
      path: '/reservas/admin/:slug/agenda',
      handler: 'reserva.adminAgenda',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/walk-in',
      handler: 'reserva.adminWalkIn',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/bloqueos',
      handler: 'reserva.adminCreateBloqueo',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'DELETE',
      path: '/reservas/admin/:slug/bloqueos/:documentId',
      handler: 'reserva.adminDeleteBloqueo',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/reservas/:documentId/cancelar',
      handler: 'reserva.adminCancelReserva',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'GET',
      path: '/reservas/admin/:slug/config',
      handler: 'reserva.adminGetConfig',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'PUT',
      path: '/reservas/admin/:slug/config',
      handler: 'reserva.adminUpdateConfig',
      config: {
        auth: false,
        policies: [],
        middlewares: [
          'api::reserva.require-reserva-access',
          'api::reserva.admin-config-validator',
        ],
      },
    },
    {
      method: 'GET',
      path: '/reservas/admin/:slug/mp/oauth/start',
      handler: 'reserva.adminMpOauthStart',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/mp/oauth/disconnect',
      handler: 'reserva.adminMpOauthDisconnect',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.require-reserva-access'],
      },
    },
    {
      method: 'GET',
      path: '/reservas/mp/oauth/callback',
      handler: 'reserva.mpOauthCallback',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/reservas/:slug/cancelar-info',
      handler: 'reserva.publicCancelInfo',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva.cancel-info-validator'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/:slug/cancelar',
      handler: 'reserva.publicCancel',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
