
const strapi = require('@strapi/strapi');

async function testDiagnostics() {
  console.log("--- INICIANDO DIAGNÓSTICO DE SERVICIOS ---");
  
  try {
    const app = await strapi().load();
    
    // 1. Prueba de Log de Actividad
    console.log("\n1. Probando creación de Actividad...");
    try {
      const actividad = await app.documents('api::actividad.actividad').create({
        data: {
          accion: 'Test Diágnostico',
          detalles: 'Verificando persistencia de logs',
          tipo: 'info'
        }
      });
      console.log("✅ Actividad creada con éxito:", actividad.documentId);
    } catch (actErr) {
      console.error("❌ ERROR en Actividad:", actErr.message);
      if (actErr.details) console.error("Detalles:", JSON.stringify(actErr.details, null, 2));
    }

    // 2. Prueba de Email (Resend)
    console.log("\n2. Probando envío de Email...");
    try {
      const emailService = app.plugin('email').service('email');
      const res = await emailService.send({
        to: 'diegocristianalonso@gmail.com',
        from: 'San Rafael 360 <no-reply@sanrafael360.com.ar>',
        subject: 'Test Diagnóstico SR360',
        html: '<h1>Prueba de conexión exitosa</h1>'
      });
      console.log("✅ Email enviado con éxito (Resend aceptó la petición)");
    } catch (mailErr) {
      console.error("❌ ERROR en Email:", mailErr.message);
      if (mailErr.details) console.error("Detalles:", JSON.stringify(mailErr.details, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
  }
}

testDiagnostics();
