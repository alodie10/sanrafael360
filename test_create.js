const axios = require('axios');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 1337,
  path: '/api/negocios/admin/pagos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  monto: 1000,
  estado: 'aprobado',
  fecha_pago: new Date().toISOString(),
  external_reference: 'Test',
  negocio: 'some-doc-id',
  extendMonths: 1
}));
req.end();
