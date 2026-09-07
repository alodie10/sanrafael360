export default {
  routes: [
    {
      method: 'GET',
      path: '/guide-admin/settings',
      handler: 'api::guide-setting.guide-setting.adminGet',
      config: { auth: false, policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'PUT',
      path: '/guide-admin/settings',
      handler: 'api::guide-setting.guide-setting.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::guide-setting.settings-write-validator'],
      },
    },
  ],
};
