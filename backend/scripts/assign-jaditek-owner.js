/**
 * Asigna Jaditek al dueño de portal como reclamo aprobado.
 * Uso: node scripts/assign-jaditek-owner.js
 * (parar `strapi develop` antes si SQLite está bloqueado)
 */
const { createStrapi } = require('@strapi/strapi');

const OWNER_EMAIL = (process.env.JADITEK_OWNER_EMAIL || 'argendeli01@gmail.com')
  .trim()
  .toLowerCase();
const SLUG = 'jaditek';

async function main() {
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    const user = await app.db.query('plugin::users-permissions.user').findOne({
      where: { email: OWNER_EMAIL },
    });
    if (!user) throw new Error(`Usuario no encontrado: ${OWNER_EMAIL}`);

    let negocio = (
      await app.documents('api::negocio.negocio').findMany({
        filters: { slug: { $eq: SLUG } },
        limit: 1,
        status: 'published',
      })
    )?.[0];

    if (!negocio) {
      negocio = await app.documents('api::negocio.negocio').create({
        data: {
          nombre: 'Jaditek Sim Racing',
          slug: SLUG,
          descripcion:
            'Sim racing en San Rafael. Reservas online de turnos vía módulo San Rafael 360.',
          reserva_url: `/reservas/${SLUG}`,
          reserva_habilitada: true,
          estado_reclamo: 'aprobado',
          verificado: true,
          owner: user.id,
        },
        status: 'published',
      });
      console.log('Negocio creado:', negocio.documentId);
    } else {
      await app.documents('api::negocio.negocio').update({
        documentId: negocio.documentId,
        data: {
          owner: user.id,
          estado_reclamo: 'aprobado',
          verificado: true,
          reserva_url: `/reservas/${SLUG}`,
          reserva_habilitada: true,
        },
        status: 'published',
      });
      console.log('Negocio actualizado (reclamo aprobado):', negocio.documentId);
    }

    const comercio = (
      await app.documents('api::reserva-comercio.reserva-comercio').findMany({
        filters: { slug: { $eq: SLUG } },
        limit: 1,
      })
    )?.[0];

    if (!comercio) throw new Error('reserva-comercio jaditek no existe');

    await app.documents('api::reserva-comercio.reserva-comercio').update({
      documentId: comercio.documentId,
      data: { negocio: negocio.documentId },
    });

    const check = await app.documents('api::negocio.negocio').findMany({
      filters: { owner: user.id },
      fields: ['nombre', 'slug', 'estado_reclamo', 'documentId'],
      status: 'published',
      populate: { reserva_comercio: { fields: ['slug'] } },
    });
    console.log(
      'findByOwner check:',
      check.map((n) => ({
        slug: n.slug,
        estado: n.estado_reclamo,
        reservas: n.reserva_comercio?.slug || null,
      }))
    );
    console.log(`OK: ${OWNER_EMAIL} es dueño de Jaditek (estado_reclamo=aprobado).`);
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
