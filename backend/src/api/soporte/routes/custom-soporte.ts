export default {
  routes: [
    {
      method: 'POST',
      path: '/soportes',
      handler: 'soporte.createTicket',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-auth', 'api::soporte.consulta-validator'],
      },
    },
    {
      method: 'GET',
      path: '/soportes/admin',
      handler: 'soporte.adminFind',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
    {
      method: 'PUT',
      path: '/soportes/admin/:documentId',
      handler: 'soporte.adminUpdate',
      config: {
        auth: false,
        policies: [],
        middlewares: ['global::require-admin'],
      },
    },
  ],
};
