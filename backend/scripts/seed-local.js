const strapi = require('@strapi/strapi');

async function main() {
  console.log('--- SEEDING START ---');
  const app = await strapi().load();

  try {
    const pass = 'DcaDca_01';
    const emails = ['argendeli01@gmail.com', 'diegocristianalonso@gmail.com'];
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
      console.log('✅ After House Created');
    }
    console.log('--- SEEDING COMPLETE ---');
  } catch (err) {
    console.error('❌ FATAL:', err.message);
  } finally {
    process.exit(0);
  }
}
main();
