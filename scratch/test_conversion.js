
const strapi = require('@strapi/strapi');

async function main() {
  const app = await strapi.strapi().load();
  
  try {
    // 1. Crear Negocio
    const biz = await app.documents('api::negocio.negocio').create({ 
      data: { nombre: 'Hotel Tower Test', slug: 'hotel-tower-test' }, 
      status: 'published' 
    });
    
    // 2. Crear Lead
    const lead = await app.documents('api::lead.lead').create({ 
      data: { nombre_completo: 'Diego Test', email: 'diego@test.com', nombre_negocio: 'Hotel Tower Test' }, 
      status: 'published' 
    });

    console.log('--- TEST DATA CREATED ---');
    console.log('Biz ID:', biz.documentId);
    console.log('Lead ID:', lead.documentId);
    
    // 3. Simular llamada al controlador de conversión
    const ctx = {
      params: { id: lead.documentId },
      request: { body: { negocioId: biz.documentId } },
      badRequest: (msg) => console.log('BadRequest:', msg),
      notFound: (msg) => console.log('NotFound:', msg),
      internalServerError: (msg) => console.log('Error:', msg),
      send: (data) => console.log('SUCCESS:', JSON.stringify(data))
    };

    const leadController = app.plugin('api::lead').controller('lead');
    // En Strapi 5 los controladores de core se acceden distinto si son factories
    // Pero podemos llamar a la función directamente del objeto exportado
    const leadApi = app.api('lead').controllers.lead;
    // Si es una factory, el objeto tiene la función convert
    await leadApi({ strapi: app }).convert(ctx);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit(0);
  }
}

main();
