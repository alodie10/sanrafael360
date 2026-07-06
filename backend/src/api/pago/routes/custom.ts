export default {
  routes: [
    {
      method: 'POST',
      path: '/pagos/create-preference',
      handler: 'pago.createPreference',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/pagos/simulate-success',
      handler: 'pago.simulateSuccess',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/pagos/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::mercadopago-webhook'],
      },
    },
    {
      method: 'POST',
      path: '/pagos/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::mercadopago-webhook'],
      },
    },
    {
      method: 'POST',
      path: '/pago/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::mercadopago-webhook'],
      },
    },
  ],
};
