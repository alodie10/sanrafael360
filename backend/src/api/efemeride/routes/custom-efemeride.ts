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
      method: 'POST',
      path: '/efemerides/admin/encabezado',
      handler: 'api::efemeride.efemeride.adminUploadEncabezado',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'POST',
      path: '/efemerides/admin',
      handler: 'api::efemeride.efemeride.adminCreate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::efemeride.efemeride-admin-validator'],
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
    {
      method: 'DELETE',
      path: '/efemerides/admin/:documentId',
      handler: 'api::efemeride.efemeride.adminDelete',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
  ],
};
