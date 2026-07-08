export default {
  routes: [
    {
      method: 'POST',
      path: '/pagos/create-preference',
      handler: 'pago.createPreference',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::pago.pago-preference-validator', 'global::require-payments-enabled'],
      },
    },
    {
      method: 'POST',
      path: '/pagos/simulate-success',
      handler: 'pago.simulateSuccess',
      config: {
        auth: false,
        middlewares: ['global::require-payments-enabled'],
      },
    },
    {
      method: 'GET',
      path: '/pagos/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-payments-enabled', 'global::mercadopago-webhook'],
      },
    },
    {
      method: 'POST',
      path: '/pagos/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-payments-enabled', 'global::mercadopago-webhook'],
      },
    },
    {
      method: 'POST',
      path: '/pago/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-payments-enabled', 'global::mercadopago-webhook'],
      },
    },
  ],
};
