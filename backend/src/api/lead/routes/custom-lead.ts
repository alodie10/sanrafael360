export default {
  routes: [
    {
      method: 'GET',
      path: '/leads/admin',
      handler: 'api::lead.lead.adminFind',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'PUT',
      path: '/leads/admin/:documentId',
      handler: 'api::lead.lead.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::lead.lead-admin-validator'],
      },
    },
    {
      method: 'POST',
      path: '/leads/:id/convert',
      handler: 'api::lead.lead.convert',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin', 'api::lead.lead-convert-validator'],
      },
    },
  ],
};
