const strapi = require('@strapi/strapi');
const http = require('http');

console.log('--- Iniciando Strapi (Modo Producción) ---');
console.log('Cargando desde el directorio: ./dist');

const port = process.env.PORT || 1337;

strapi({ distDir: './dist' })
  .start()
  .then(() => {
    console.log('>>> Strapi está listo y escuchando en el puerto:', port);
  })
  .catch((error) => {
    console.error('!!! Error fatal al iniciar Strapi:', error);
    
    // Iniciar servidor de rescate para mostrar el error 
    const server = http.createServer((req, res) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      let msg = "--- ERROR CRITICO DE STRAPI ---\n\n";
      msg += error.stack || error.message || JSON.stringify(error);
      
      msg += "\n\n--- VARIABLES DE ENTORNO EN EL SERVIDOR ---\n";
      msg += `DATABASE_CLIENT: ${process.env.DATABASE_CLIENT || 'NO DEFINIDA (Strapi usara SQLite por defecto y fallara)'}\n`;
      msg += `NODE_ENV: ${process.env.NODE_ENV || 'NO DEFINIDA'}\n`;
      
      res.end(msg);
    });
    
    server.listen(port, () => {
      console.log('>>> Servidor de rescate escuchando en puerto', port);
    });
  });
