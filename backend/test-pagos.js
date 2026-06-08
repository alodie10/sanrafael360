const http = require('http');

http.get('http://localhost:1337/api/negocios?populate[pagos]=true', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`Total negocios: ${json.data?.length}`);
      const withPagos = json.data?.filter(n => n.pagos && n.pagos.length > 0);
      console.log(`Negocios con pagos: ${withPagos?.length}`);
      if (withPagos?.length > 0) {
        console.log("Ejemplo de pagos:", JSON.stringify(withPagos[0].pagos, null, 2));
      }
    } catch(e) {
      console.error(e);
    }
  });
});
