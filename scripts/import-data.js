require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const strapi = require('@strapi/strapi');

// Configuración
const CSV_PATH = path.join(__dirname, 'legacy', 'importar_listeo_geocodificado.csv');
const LIMIT = 10; // Prueba inicial

async function downloadFile(url) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const fileName = path.basename(url).split('?')[0];
    const tmpPath = path.join(__dirname, '..', 'public', 'uploads', 'tmp_' + fileName);
    fs.writeFileSync(tmpPath, response.data);
    return {
      path: tmpPath,
      name: fileName,
      type: response.headers['content-type'],
      size: response.data.length,
    };
  } catch (err) {
    console.error(`Error descargando ${url}: ${err.message}`);
    return null;
  }
}

async function uploadToStrapi(fileData) {
  if (!fileData) return null;
  try {
    const entity = {
      name: fileData.name,
      hash: path.parse(fileData.name).name + '_' + Date.now(),
      ext: path.extname(fileData.name),
      mime: fileData.type,
      size: (fileData.size / 1024).toFixed(2),
      path: null,
      getStream: () => fs.createReadStream(fileData.path),
    };

    const uploadedFile = await global.strapi.plugins.upload.services.upload.upload({
      data: {},
      files: fileData
    });

    // Limpiar temporal
    if (fs.existsSync(fileData.path)) fs.unlinkSync(fileData.path);
    
    return Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
  } catch (err) {
    console.error(`Error subiendo a Strapi: ${err.message}`);
    return null;
  }
}

function parseCSVLine(line) {
  // Regex simple para manejar comas dentro de comillas
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  return line.split(regex).map(val => val.replace(/^"|"$/g, '').trim());
}

async function importData() {
  console.log('--- Iniciando importación de prueba ---');
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Archivo no encontrado: ${CSV_PATH}`);
    return;
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Procesar solo los primeros LIMIT
  const dataLines = lines.slice(0, LIMIT);

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i]);
    if (cols.length < 5) continue;

    const row = {
      nombre: cols[0],
      categoria_name: cols[1],
      direccion: cols[2],
      telefono: cols[3],
      whatsapp: cols[4],
      email: cols[5],
      website: cols[6],
      instagram: cols[7],
      facebook: cols[8],
      logo_url: cols[9],
      gallery_url: cols[10],
      latitud: parseFloat(cols[11]),
      longitud: parseFloat(cols[12]),
      descripcion: cols[13]
    };

    console.log(`[${i+1}/${LIMIT}] Procesando: ${row.nombre}`);

    try {
      // 1. Manejar Categoría
      let categoria = await global.strapi.db.query('api::categoria.categoria').findOne({
        where: { nombre: row.categoria_name }
      });

      if (!categoria && row.categoria_name) {
        console.log(`   Creando categoría: ${row.categoria_name}`);
        categoria = await global.strapi.db.query('api::categoria.categoria').create({
          data: { nombre: row.categoria_name, slug: row.categoria_name.toLowerCase().replace(/\s+/g, '-') }
        });
      }

      // 2. Manejar Multimedia (Logo)
      let logoId = null;
      if (row.logo_url) {
        const fileData = await downloadFile(row.logo_url);
        const uploaded = await uploadToStrapi(fileData);
        if (uploaded) {
          logoId = uploaded.id;
          console.log(`   Imagen subida ID: ${logoId}`);
        }
      }

      // 3. Crear Negocio
      const existing = await global.strapi.db.query('api::negocio.negocio').findOne({
        where: { nombre: row.nombre }
      });

      if (existing) {
        console.log(`   Aviso: El negocio '${row.nombre}' ya existe. Saltando.`);
        continue;
      }

      await global.strapi.entityService.create('api::negocio.negocio', {
        data: {
          nombre: row.nombre,
          descripcion: row.descripcion,
          direccion: row.direccion,
          telefono: row.telefono,
          whatsapp: row.whatsapp,
          email: row.email,
          website: row.website,
          instagram: row.instagram,
          facebook: row.facebook,
          latitud: isNaN(row.latitud) ? null : row.latitud,
          longitud: isNaN(row.longitud) ? null : row.longitud,
          categoria: categoria ? categoria.id : null,
          logo: logoId,
          imagen_portada: logoId, // Usamos la misma por ahora
          verificado: false,
          reclamar_habilitado: false,
          publishedAt: new Date(),
        }
      });

      console.log(`   ✅ Guardado con éxito.`);
    } catch (err) {
      console.error(`   ❌ Error guardando '${row.nombre}': ${err.message}`);
    }
  }

  console.log('--- Importación finalizada ---');
}

// Bootstrap de Strapi
const { createStrapi } = require('@strapi/strapi');

const appDir = process.cwd();
const distDir = path.join(appDir, 'dist');

console.log('Iniciando Strapi con appDir:', appDir, 'y distDir:', distDir);

const start = async () => {
  try {
    const app = createStrapi({ appDir, distDir });
    await app.load(); // Importante: Cargar configuración antes de bootstrap
    await app.bootstrap();
    
    console.log('Strapi inicializado correctamente.');
    global.strapi = app;
    await importData();
    process.exit(0);
  } catch (err) {
    console.error('Error inicializando Strapi:', err);
    process.exit(1);
  }
};

start();
