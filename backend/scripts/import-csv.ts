
import fs from 'fs';
import path from 'path';

/**
 * CONFIGURACIÓN DE MIGRACIÓN
 * Reemplaza con tus valores remotos.
 */
const STRAPI_API_URL = 'https://sanrafael360-production.up.railway.app/api';
const API_TOKEN = '6ee12bf2e9646870143ec904da3255ac0b8e238cc19d4444e1a296caa7ada195d8d7f1073a83175b403fedcc9d3ed93789d1132aab1d4d6a0f7affb0ad04ac432dbd5fa652793fabc368a38b29fea2389f25d7c2dabe9b0fe93864e3c42f137eadf569b286b3405e1e03caa85929121735e0f0daee2f99f64541bacc8e639a0b';
const CSV_PATH = path.join(__dirname, '../../scripts/legacy/importar_listeo_geocodificado.csv');

interface NegocioCSV {
  nombre: string;
  categoria: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  imagen_url: string;
}

// Mapa de categorías para evitar duplicados y múltiples búsquedas
const categoryMap: { [key: string]: number } = {};

async function getOrCreateCategory(name: string): Promise<number | null> {
  if (categoryMap[name]) return categoryMap[name];

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const slug = slugify(name);

  try {
    const searchRes = await fetch(`${STRAPI_API_URL}/categorias?filters[nombre][$eq]=${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    const searchData: any = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      categoryMap[name] = searchData.data[0].id;
      return searchData.data[0].id;
    }

    // Crear si no existe
    console.log(`- Creando categoría: ${name} (slug: ${slug})`);
    const createRes = await fetch(`${STRAPI_API_URL}/categorias`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: { nombre: name, slug: slug } })
    });
    
    const createData: any = await createRes.json();
    if (createData.data) {
      categoryMap[name] = createData.data.id;
      return createData.data.id;
    } else {
      console.error(`❌ Error al crear categoría ${name}:`, JSON.stringify(createData.error, null, 2));
    }
  } catch (error) {
    console.error(`Error procesando categoría ${name}:`, error);
  }
  return null;
}

async function runMigration() {
  console.log('🚀 Iniciando migración de datos...');

  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ No se encontró el archivo CSV en:', CSV_PATH);
    return;
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  // post_title,listing_category,_address,_phone,_whatsapp,_email,_website,_instagram,_facebook,_thumbnail_id,_gallery,_geolocation_lat,_geolocation_long,post_content
  
  // Set para deduplicación en memoria (evita procesar el mismo título dos veces en esta ejecución)
  const processedTitles = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const cleanValue = (val: string) => val ? val.trim() : null;

    const rawNombre = cleanValue(values[0]);
    if (!rawNombre) continue;

    // Normalizamos el nombre para comparar en el Set
    const normalizedTitle = rawNombre.toLowerCase();
    if (processedTitles.has(normalizedTitle)) {
        console.log(`[${i}/${lines.length-1}] ⏭️ Ignorando duplicado en CSV: ${rawNombre}`);
        continue;
    }
    processedTitles.add(normalizedTitle);

    const data: any = {
      nombre: rawNombre,
      categoriaName: cleanValue(values[1]),
      direccion: cleanValue(values[2]),
      telefono: cleanValue(values[3]),
      whatsapp: cleanValue(values[4]),
      email: cleanValue(values[5]),
      website: cleanValue(values[6]),
      instagram: cleanValue(values[7]),
      facebook: cleanValue(values[8]),
      latitud: parseFloat(values[11]) || 0,
      longitud: parseFloat(values[12]) || 0,
      descripcion: values[13] ? values[13].replace(/"/g, '').trim() : ''
    };

    console.log(`[${i}/${lines.length-1}] 🔄 Procesando: ${data.nombre}`);

    const slugify = (text: string) => {
      if (!text) return 'sin-nombre';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const categoriaId = await getOrCreateCategory(data.categoriaName);

    const negocioData: any = {
      nombre: data.nombre,
      slug: slugify(data.nombre),
      descripcion: data.descripcion || null,
      direccion: data.direccion || "San Rafael",
      telefono: data.telefono || null,
      whatsapp: data.whatsapp || null,
      email: (data.email && isValidEmail(data.email)) ? data.email : null,
      website: data.website || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      latitud: data.latitud,
      longitud: data.longitud,
      categoria: categoriaId,
      publishedAt: new Date()
    };

    try {
      const resp = await fetch(`${STRAPI_API_URL}/negocios`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: negocioData })
      });

      const resData = await resp.json();

      if (!resp.ok) {
        // Manejamos específicamente errores de duplicidad en la base de datos
        if (resData.error && resData.error.message === "This attribute must be unique") {
            console.log(`[${i}/${lines.length-1}] 📍 Ya existía en Strapi: ${data.nombre}`);
        } else {
            console.error(`❌ Error en ${data.nombre}:`, JSON.stringify(resData.error, null, 2));
        }
      } else {
        console.log(`[${i}/${lines.length-1}] ✅ Creado satisfactoriamente: ${data.nombre}`);
      }
    } catch (e) {
      console.error(`❌ Fallo crítico en ${data.nombre}:`, e);
    }
  }

  console.log('✅ Migración finalizada.');
}

runMigration();
