
export default {
  routes: [
    {
      method: 'POST',
      path: '/discovery/google',
      handler: 'discovery.googleSync',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
