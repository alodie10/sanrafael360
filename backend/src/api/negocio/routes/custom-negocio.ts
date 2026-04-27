export default {
  routes: [
    {
      method: 'POST',
      path: '/negocios/:id/stats',
      handler: 'api::negocio.negocio.incrementStats',
      config: {
        auth: false, // Permitimos que usuarios anónimos generen estadísticas
      },
    },
  ],
};
