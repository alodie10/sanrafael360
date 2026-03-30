const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  
  let report = "--- DIAGNOSTICO DE SAN RAFAEL 360 ---\n\n";
  
  // 1. Verificar carpetas críticas
  report += `Carpeta actual: ${__dirname}\n`;
  report += `¿Existe dist?: ${fs.existsSync(path.join(__dirname, 'dist'))}\n`;
  report += `¿Existe node_modules?: ${fs.existsSync(path.join(__dirname, 'node_modules'))}\n\n`;

  // 2. Intentar cargar Strapi
  try {
    report += "Intentando cargar modulo @strapi/strapi...\n";
    const strapi = require('@strapi/strapi');
    report += ">>> Modulo cargado con EXITO.\n\n";
    
    report += "Si ves esto, el problema es el arranque de la Base de Datos o RAM.\n";
  } catch (err) {
    report += "!!! ERROR AL CARGAR STRAPI:\n";
    report += err.stack + "\n";
  }

  res.end(report);
});

const port = process.env.PORT || 1337;
server.listen(port, () => {
  console.log(`Diagnostico corriendo en puerto ${port}`);
});
