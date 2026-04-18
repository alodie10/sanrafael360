
async function main() {
  const email = 'diegocristianalonso@gmail.com';
  const slug = 'after-house';

  console.log(`🚀 Iniciando vinculación: ${slug} -> ${email}`);

  // @ts-ignore
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email }
  });

  // @ts-ignore
  const negocio = await strapi.db.query('api::negocio.negocio').findOne({
    where: { slug }
  });

  if (!user || !negocio) {
    console.error('❌ Error: Usuario o Negocio no encontrado');
    process.exit(1);
  }

  // @ts-ignore
  await strapi.documents('api::negocio.negocio').update({
    documentId: negocio.documentId,
    data: {
      owner: user.id,
      estado_reclamo: 'aprobado'
    }
  });

  console.log('✅ ÉXITO: Negocio asignado correctamente.');
  process.exit(0);
}

// @ts-ignore
main().catch(err => {
  console.error(err);
  process.exit(1);
});
