require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

console.log('Intentando conectar a:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));

client.connect()
  .then(() => {
    console.log('Conexión exitosa a la base de datos!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Respuesta de la BD:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Error de conexión:', err);
    process.exit(1);
  });
