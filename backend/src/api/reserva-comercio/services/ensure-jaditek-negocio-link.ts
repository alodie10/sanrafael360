import { JADITEK_SLUG } from './seed-jaditek';

/**
 * Asegura negocio Jaditek en directorio como reclamo APROBADO + link a reserva-comercio.
 * Owner: JADITEK_OWNER_EMAIL (default argendeli01@gmail.com).
 */
export async function ensureJaditekNegocioLink(strapi: any): Promise<void> {
  const ownerEmail = (process.env.JADITEK_OWNER_EMAIL || 'argendeli01@gmail.com')
    .trim()
    .toLowerCase();

  const owner = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: ownerEmail },
  });
  if (!owner?.id) {
    strapi.log.warn(`[Reservas Seed] No existe user ${ownerEmail}; no se puede aprobar reclamo.`);
    return;
  }

  const comercios = await strapi.documents('api::reserva-comercio.reserva-comercio').findMany({
    filters: { slug: { $eq: JADITEK_SLUG } },
    limit: 1,
    populate: { negocio: { fields: ['documentId', 'slug'] } },
  });
  const comercio = comercios?.[0];
  if (!comercio) {
    strapi.log.warn('[Reservas Seed] No hay reserva-comercio jaditek.');
    return;
  }

  let negocio = (
    await strapi.documents('api::negocio.negocio').findMany({
      filters: { slug: { $eq: JADITEK_SLUG } },
      limit: 1,
      status: 'published',
    })
  )?.[0];

  const claimApprovedData = {
    nombre: 'Jaditek Sim Racing',
    slug: JADITEK_SLUG,
    descripcion:
      'Sim racing en San Rafael. Reservas online de turnos vía módulo San Rafael 360.',
    reserva_url: `/reservas/${JADITEK_SLUG}`,
    reserva_habilitada: true,
    estado_reclamo: 'aprobado',
    verificado: true,
    owner: owner.id,
    ...(process.env.JADITEK_WHATSAPP
      ? { whatsapp: String(process.env.JADITEK_WHATSAPP).trim() }
      : {}),
  };

  if (!negocio) {
    negocio = await strapi.documents('api::negocio.negocio').create({
      data: claimApprovedData,
      status: 'published',
    });
    strapi.log.info(`[Reservas Seed] Negocio Jaditek creado + aprobado (${negocio.documentId}).`);
  } else {
    negocio = await strapi.documents('api::negocio.negocio').update({
      documentId: negocio.documentId,
      data: {
        owner: owner.id,
        estado_reclamo: 'aprobado',
        verificado: true,
        reserva_url: `/reservas/${JADITEK_SLUG}`,
        reserva_habilitada: true,
        ...(process.env.JADITEK_WHATSAPP
          ? { whatsapp: String(process.env.JADITEK_WHATSAPP).trim() }
          : {}),
      },
      status: 'published',
    });
    strapi.log.info(
      `[Reservas Seed] Negocio Jaditek actualizado como reclamo aprobado → ${ownerEmail}`
    );
  }

  await strapi.documents('api::reserva-comercio.reserva-comercio').update({
    documentId: comercio.documentId,
    data: { negocio: negocio.documentId },
  });

  strapi.log.info(
    `[Reservas Seed] ✅ Jaditek: owner=${ownerEmail}, estado_reclamo=aprobado, módulo linkeado.`
  );
}
