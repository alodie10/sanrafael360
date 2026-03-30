// Script de diagnóstico TEMPORAL para Railway
// Muestra el error real dentro del AggregateError
const { Client } = require('pg');

async function test() {
  console.log('=== RAILWAY DB DIAGNOSTIC ===');
  console.log('DATABASE_HOST:', process.env.DATABASE_HOST || 'NO DEFINIDO');
  console.log('DATABASE_PORT:', process.env.DATABASE_PORT || 'NO DEFINIDO');
  console.log('DATABASE_NAME:', process.env.DATABASE_NAME || 'NO DEFINIDO');
  console.log('DATABASE_USERNAME:', process.env.DATABASE_USERNAME || 'NO DEFINIDO');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINIDO (oculto)' : 'NO DEFINIDO');
  console.log('DATABASE_SSL:', process.env.DATABASE_SSL || 'NO DEFINIDO');
  console.log('NODE_VERSION:', process.version);

  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        ssl: { rejectUnauthorized: false },
      };

  console.log('Config usada (sin password):', {
    ...config,
    password: config.password ? '***' : undefined,
    connectionString: config.connectionString ? config.connectionString.replace(/:([^:@]+)@/, ':***@') : undefined,
  });

  const client = new Client(config);

  try {
    console.log('Intentando conectar...');
    await client.connect();
    console.log('=== CONEXION EXITOSA ===');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('=== FALLO DE CONEXION ===');
    console.error('Tipo de error:', err.constructor.name);
    console.error('Mensaje:', err.message);
    if (err.errors) {
      console.error('Errores internos:');
      err.errors.forEach((e, i) => {
        console.error(`  [${i}] code=${e.code} msg=${e.message} addr=${e.address}`);
      });
    }
    process.exit(1);
  }
}

test();
