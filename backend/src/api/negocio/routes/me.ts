export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/me',
      handler: 'api::negocio.negocio.me',
      config: {
        // Dejamos que Strapi maneje la autenticación vía Users-Permissions Dashboard/Bootstrap
        auth: {},
      },
    },
  ],
};
