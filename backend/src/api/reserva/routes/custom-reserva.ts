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
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'GET',
      path: '/reservas/admin/:slug/agenda',
      handler: 'reserva.adminAgenda',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/walk-in',
      handler: 'reserva.adminWalkIn',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/bloqueos',
      handler: 'reserva.adminCreateBloqueo',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'DELETE',
      path: '/reservas/admin/:slug/bloqueos/:documentId',
      handler: 'reserva.adminDeleteBloqueo',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/reservas/admin/:slug/reservas/:documentId/cancelar',
      handler: 'reserva.adminCancelReserva',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
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
