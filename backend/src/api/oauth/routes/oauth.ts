export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/google/exchange',
      handler: 'oauth.exchangeGoogle',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
