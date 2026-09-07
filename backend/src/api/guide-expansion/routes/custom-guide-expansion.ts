export default {
  routes: [
    {
      method: 'GET',
      path: '/guide-runtime/map',
      handler: 'api::guide-expansion.guide-expansion.publicRuntime',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/guide-admin/expansions',
      handler: 'api::guide-expansion.guide-expansion.adminList',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'POST',
      path: '/guide-admin/expansions',
      handler: 'api::guide-expansion.guide-expansion.adminCreate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-expansion.expansion-write-validator'],
      },
    },
    {
      method: 'PATCH',
      path: '/guide-admin/expansions/:documentId',
      handler: 'api::guide-expansion.guide-expansion.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-expansion.expansion-write-validator'],
      },
    },
    {
      method: 'POST',
      path: '/guide-admin/expansions/:documentId/duplicate',
      handler: 'api::guide-expansion.guide-expansion.adminDuplicate',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
  ],
};
