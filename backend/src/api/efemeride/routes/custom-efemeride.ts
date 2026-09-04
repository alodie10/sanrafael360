export default {
  routes: [
    {
      method: 'GET',
      path: '/efemerides/public',
      handler: 'api::efemeride.efemeride.publicList',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/efemerides/public/:slug',
      handler: 'api::efemeride.efemeride.publicBySlug',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/efemerides/admin',
      handler: 'api::efemeride.efemeride.adminList',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'GET',
      path: '/efemerides/admin/premium-picker',
      handler: 'api::efemeride.efemeride.adminPremiumPicker',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'GET',
      path: '/efemerides/admin/:documentId',
      handler: 'api::efemeride.efemeride.adminGet',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'PUT',
      path: '/efemerides/admin/:documentId',
      handler: 'api::efemeride.efemeride.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::efemeride.efemeride-admin-validator'],
      },
    },
  ],
};
