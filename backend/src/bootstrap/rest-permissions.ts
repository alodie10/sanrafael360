/** REST grants that any visitor (or Google login) must never get. */
export const REVOKE_UNTRUSTED_REST_ACTIONS = [
  'api::pago.pago.find',
  'api::pago.pago.findOne',
  'api::lead.lead.find',
  'api::lead.lead.findOne',
  'api::lead.lead.update',
  'api::lead.lead.delete',
  'api::lead.lead.create',
  'api::lead.lead.convert',
  'api::efemeride.efemeride.adminlist',
  'api::efemeride.efemeride.adminget',
  'api::efemeride.efemeride.adminupdate',
  'api::efemeride.efemeride.admincreate',
  'api::efemeride.efemeride.admindelete',
  'api::efemeride.efemeride.adminuploadencabezado',
  'api::efemeride.efemeride.adminpremiumpicker',
  'api::negocio.negocio.admincreate',
  'api::cliente.cliente.adminlist',
  'api::cliente.cliente.admincreate',
  'api::cliente.cliente.adminupdate',
  'api::cliente.cliente.admindelete',
  'api::cliente.cliente.adminlinknegocios',
  'api::cliente.cliente.adminunlinknegocio',
  'api::cliente.cliente.adminnegociospicker',
  'api::cliente.cliente.adminmailtest',
  'api::cliente.cliente.adminmailbroadcast',
] as const;

export const PUBLIC_READ_ACTIONS = [
  'api::categoria.categoria.find',
  'api::categoria.categoria.findOne',
  'api::negocio.negocio.find',
  'api::negocio.negocio.findOne',
  'api::negocio.negocio.stats',
  'api::negocio.negocio.claim',
  'api::negocio.negocio.getstatstimeseries',
  'api::negocio.negocio.getStatsSummary',
  'api::review.review.find',
  'api::review.review.findOne',
  'api::review.review.create',
  'api::atributo.atributo.find',
  'api::atributo.atributo.findOne',
  'api::atributo.atributo.create',
  'api::reserva-comercio.reserva-comercio.find',
  'api::reserva-comercio.reserva-comercio.findOne',
  'api::reserva-recurso.reserva-recurso.find',
  'api::reserva-recurso.reserva-recurso.findOne',
] as const;

const UNTRUSTED_ROLE_TYPES = ['authenticated', 'residente', 'propietario', 'public'] as const;

async function grantAction(strapi: any, roleId: number, action: string) {
  const existing = await strapi.query('plugin::users-permissions.permission').findOne({
    where: { action, role: roleId },
  });
  if (existing) return;
  await strapi.query('plugin::users-permissions.permission').create({
    data: { action, role: roleId, target: null },
  });
}

async function revokeAction(strapi: any, roleId: number, action: string) {
  const existing = await strapi.query('plugin::users-permissions.permission').findOne({
    where: { action, role: roleId },
  });
  if (!existing) return;
  await strapi.query('plugin::users-permissions.permission').delete({
    where: { id: existing.id },
  });
}

export async function syncUntrustedRestPermissions(strapi: any): Promise<void> {
  for (const roleType of UNTRUSTED_ROLE_TYPES) {
    const role = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: roleType },
    });
    if (!role) continue;

    for (const action of REVOKE_UNTRUSTED_REST_ACTIONS) {
      await revokeAction(strapi, role.id, action);
    }
    for (const action of PUBLIC_READ_ACTIONS) {
      await grantAction(strapi, role.id, action);
    }
  }
}
