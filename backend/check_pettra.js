const strapiFactory = require('@strapi/strapi');

async function check() {
  // Load with environment variables
  const strapi = await strapiFactory.default().load();
  
  try {
    const negocios = await strapi.documents('api::negocio.negocio').findMany({
      filters: {
        nombre: { $containsi: 'Pettra' }
      },
      populate: ['owner'],
      status: 'published'
    });

    console.log('--- AUDITORÍA DE PETTRA ---');
    if (negocios.length === 0) {
      console.log('❌ No se encontró ningún negocio con "Pettra" en el nombre.');
    } else {
      negocios.forEach(n => {
        console.log(`Nombre: ${n.nombre}`);
        console.log(`Slug: ${n.slug}`);
        console.log(`DocumentId: ${n.documentId}`);
        console.log(`ID: ${n.id}`);
        console.log(`Status: ${n.status}`);
        console.log(`Owner: ${n.owner ? n.owner.email + ' (ID: ' + n.owner.id + ')' : 'SIN DUEÑO'}`);
        console.log('---------------------------');
      });
    }
    
    const users = await strapi.query('plugin::users-permissions.user').findMany({
        filters: { email: 'argendeli01@gmail.com' }
    });
    console.log('--- AUDITORÍA DE USUARIO ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`ID: ${u.id}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();
