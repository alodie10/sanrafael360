export default {
  routes: [
    {
      method: 'POST',
      path: '/guide-runtime/miss',
      handler: 'api::guide-miss.guide-miss.recordPublic',
      config: { auth: false, policies: [], middlewares: ['api::guide-miss.miss-record-validator'] },
    },
    {
      method: 'GET',
      path: '/guide-admin/misses',
      handler: 'api::guide-miss.guide-miss.adminList',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'PATCH',
      path: '/guide-admin/misses/:documentId',
      handler: 'api::guide-miss.guide-miss.adminPatch',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-miss.miss-patch-validator'],
      },
    },
  ],
};
