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
    {
      method: 'GET',
      path: '/feed/meta-offers',
      handler: 'feed.metaOffers',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
