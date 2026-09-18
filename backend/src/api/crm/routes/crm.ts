const portalAuth = {
  auth: false,
  policies: [],
};

const adminAuth = {
  auth: false,
  policies: [],
};

export default {
  routes: [
    {
      method: 'GET',
      path: '/crm/bootstrap',
      handler: 'crm.bootstrap',
      config: { ...portalAuth, middlewares: ['api::crm.require-crm-portal'] },
    },
    {
      method: 'GET',
      path: '/crm/contactos',
      handler: 'crm.listContactos',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-list-validator'],
      },
    },
    {
      method: 'POST',
      path: '/crm/contactos',
      handler: 'crm.createManual',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-manual-validator'],
      },
    },
    {
      method: 'PATCH',
      path: '/crm/contactos/:documentId',
      handler: 'crm.updateContacto',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-contacto-id-validator'],
      },
    },
    {
      method: 'POST',
      path: '/crm/ingestar',
      handler: 'crm.ingest',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-ingest-validator'],
      },
    },
    {
      method: 'PUT',
      path: '/crm/plantilla',
      handler: 'crm.updatePlantilla',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-plantilla-validator'],
      },
    },
    {
      method: 'POST',
      path: '/crm/enviar',
      handler: 'crm.enviarWhatsapp',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-enviar-validator'],
      },
    },
    {
      method: 'POST',
      path: '/crm/crear-ficha',
      handler: 'crm.crearFicha',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-ficha-validator'],
      },
    },
    {
      method: 'GET',
      path: '/crm/alcanzados',
      handler: 'crm.listAlcanzados',
      config: { ...portalAuth, middlewares: ['api::crm.require-crm-portal'] },
    },
    {
      method: 'POST',
      path: '/crm/limpiar-cola',
      handler: 'crm.limpiarCola',
      config: {
        ...portalAuth,
        middlewares: ['api::crm.require-crm-portal', 'api::crm.crm-limpiar-cola-validator'],
      },
    },
    {
      method: 'POST',
      path: '/crm/prestar',
      handler: 'crm.prestar',
      config: {
        ...adminAuth,
        middlewares: ['global::require-admin', 'api::crm.crm-prestar-validator'],
      },
    },
  ],
};
