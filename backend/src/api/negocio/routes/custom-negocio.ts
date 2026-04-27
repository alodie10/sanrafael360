export default {
  routes: [
    {
      method: 'GET',
      path: '/negocios/me',
      handler: 'negocio.me',
    },
    {
      method: 'GET',
      path: '/negocios/stats/summary',
      handler: 'negocio.getStatsSummary',
    },
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
