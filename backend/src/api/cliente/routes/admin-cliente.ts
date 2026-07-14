export default {
  routes: [
    {
      method: 'GET',
      path: '/clientes/admin',
      handler: 'api::cliente.cliente.adminList',
      config: { policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'GET',
      path: '/clientes/admin/negocios-picker',
      handler: 'api::cliente.cliente.adminNegociosPicker',
      config: { policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'POST',
      path: '/clientes/admin/mail/test',
      handler: 'api::cliente.cliente.adminMailTest',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-mail-validator'],
      },
    },
    {
      method: 'POST',
      path: '/clientes/admin/mail/broadcast',
      handler: 'api::cliente.cliente.adminMailBroadcast',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-mail-validator'],
      },
    },
    {
      method: 'POST',
      path: '/clientes/admin',
      handler: 'api::cliente.cliente.adminCreate',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-write-validator'],
      },
    },
    {
      method: 'PUT',
      path: '/clientes/admin/:documentId',
      handler: 'api::cliente.cliente.adminUpdate',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-write-validator'],
      },
    },
    {
      method: 'DELETE',
      path: '/clientes/admin/:documentId',
      handler: 'api::cliente.cliente.adminDelete',
      config: { policies: [], middlewares: ['global::require-admin'] },
    },
    {
      method: 'POST',
      path: '/clientes/admin/:documentId/vincular-negocios',
      handler: 'api::cliente.cliente.adminLinkNegocios',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-link-validator'],
      },
    },
    {
      method: 'POST',
      path: '/clientes/admin/:documentId/desvincular-negocio',
      handler: 'api::cliente.cliente.adminUnlinkNegocio',
      config: {
        policies: [],
        middlewares: ['global::require-admin', 'api::cliente.cliente-unlink-validator'],
      },
    },
  ],
};
