const strapi = require('@strapi/strapi');

// Iniciar Strapi desde la carpeta 'dist' que ya contiene el build de producción
strapi({ distDir: './dist' }).start();
