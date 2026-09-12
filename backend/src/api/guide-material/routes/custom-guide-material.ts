export default {
  routes: [
    {
      method: 'GET',
      path: '/guide-admin/materials',
      handler: 'api::guide-material.guide-material.adminList',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'POST',
      path: '/guide-admin/materials',
      handler: 'api::guide-material.guide-material.adminCreate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-material.material-write-validator'],
      },
    },
    {
      method: 'PATCH',
      path: '/guide-admin/materials/:documentId',
      handler: 'api::guide-material.guide-material.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-material.material-write-validator'],
      },
    },
    {
      method: 'DELETE',
      path: '/guide-admin/materials/:documentId',
      handler: 'api::guide-material.guide-material.adminDelete',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
  ],
};
