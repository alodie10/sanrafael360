export default {
  routes: [
    {
      method: 'POST',
      path: '/pagos/create-preference',
      handler: 'pago.createPreference',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/pagos/webhook',
      handler: 'pago.webhook',
      config: {
        auth: false, // MP necesita entrar sin login
        policies: [],
        middlewares: [],
      },
    },
  ],
};
