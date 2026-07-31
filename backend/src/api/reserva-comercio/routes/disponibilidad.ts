export default {
  routes: [
    {
      method: 'GET',
      path: '/reserva-comercios/:slug/disponibilidad',
      handler: 'reserva-comercio.disponibilidad',
      config: {
        auth: false,
        policies: [],
        middlewares: ['api::reserva-comercio.disponibilidad-validator'],
      },
    },
  ],
};
