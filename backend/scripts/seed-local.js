const strapi = require('@strapi/strapi');

async function main() {
  console.log('--- SEEDING START ---');

  const pass = process.env.SEED_USER_PASSWORD;
  const emails = (process.env.SEED_USER_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (!pass || emails.length === 0) {
    console.error(
      '❌ Define SEED_USER_PASSWORD y SEED_USER_EMAILS (emails separados por coma) antes de ejecutar.'
    );
    process.exit(1);
  }

  const app = await strapi().load();

  try {
    const role = (await app.service('plugin::users-permissions.role').find()).find(r => r.type === 'authenticated');

    for (const email of emails) {
      const existing = await app.query('plugin::users-permissions.user').findOne({ where: { email } });
      if (existing) await app.query('plugin::users-permissions.user').delete({ where: { id: existing.id } });
      await app.service('plugin::users-permissions.user').add({
        username: email.split('@')[0],
        email, 
        password: pass, 
        confirmed: true, 
        role: role.id 
      });
      console.log(`✅ ${email} Ready`);
    }

    const neg = await app.documents('api::negocio.negocio').findMany({ filters: { slug: 'after-house' } });
    if (!neg.length) {
      await app.documents('api::negocio.negocio').create({
        data: { nombre: 'After House', slug: 'after-house', estado_reclamo: 'ninguno' },
        status: 'published'
      });
      console.log('✅ Negocio after-house creado');
    }
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
