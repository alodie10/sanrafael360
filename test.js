const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hola desde San Rafael 360 - El servidor Node.js de Hostinger esta VIVO\n');
});

const port = process.env.PORT || 1337;
server.listen(port, () => {
  console.log(`--- PRUEBA DE VIDA EXITOSA ---`);
  console.log(`Servidor de prueba corriendo en el puerto: ${port}`);
});
