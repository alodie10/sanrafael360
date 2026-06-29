export default {
  routes: [
    {
      method: 'GET',
      path: '/feed/meta-catalog',
      handler: 'feed.metaCatalog',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
