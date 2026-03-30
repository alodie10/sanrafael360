const strapi = require('@strapi/strapi');

console.log('--- Iniciando Strapi (Modo Producción) ---');
console.log('Cargando desde el directorio: ./dist');

strapi({ distDir: './dist' })
  .start()
  .then(() => {
    console.log('>>> Strapi está listo y escuchando en el puerto:', process.env.PORT || 1337);
  })
  .catch((error) => {
    console.error('!!! Error fatal al iniciar Strapi:', error);
    process.exit(1);
  });
