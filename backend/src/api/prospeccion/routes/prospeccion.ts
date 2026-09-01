const adminAuth = {
  auth: false,
  policies: [],
};

export default {
  routes: [
    {
      method: 'GET',
      path: '/prospeccion/plantilla',
      handler: 'prospeccion.getPlantilla',
      config: { ...adminAuth, middlewares: ['global::require-admin'] },
    },
    {
      method: 'PUT',
      path: '/prospeccion/plantilla',
      handler: 'prospeccion.updatePlantilla',
      config: {
        ...adminAuth,
        middlewares: [
          'global::require-admin',
          'api::prospeccion.prospeccion-plantilla-validator',
        ],
      },
    },
    {
      method: 'GET',
      path: '/prospeccion/alcanzados',
      handler: 'prospeccion.listAlcanzados',
      config: {
        ...adminAuth,
        middlewares: [
          'global::require-admin',
          'api::prospeccion.prospeccion-alcanzados-validator',
        ],
      },
    },
    {
      method: 'GET',
      path: '/prospeccion/negocios-picker',
      handler: 'prospeccion.searchNegocios',
      config: { ...adminAuth, middlewares: ['global::require-admin'] },
    },
    {
      method: 'GET',
      path: '/prospeccion/negocios/:documentId',
      handler: 'prospeccion.getNegocio',
      config: { ...adminAuth, middlewares: ['global::require-admin'] },
    },
    {
      method: 'POST',
      path: '/prospeccion/enviar',
      handler: 'prospeccion.enviar',
      config: {
        ...adminAuth,
        middlewares: [
          'global::require-admin',
          'api::prospeccion.prospeccion-enviar-validator',
        ],
      },
    },
  ],
};
