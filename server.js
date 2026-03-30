const strapi = require('@strapi/strapi');

console.log('Iniciando servidor Strapi desde server.js...');

strapi({ distDir: './dist' })
  .start()
  .then(() => {
    console.log('Servidor iniciado correctamente.');
  })
  .catch((err) => {
    console.error('Error al iniciar Strapi:', err);
    process.exit(1);
  });
