export default {
  routes: [
    {
      method: 'POST',
      path: '/leads/:id/convert',
      handler: 'api::lead.lead.convert',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::lead.lead-convert-validator'],
      },
    },
  ],
};
