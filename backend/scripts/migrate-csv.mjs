/**
 * Script de migración: importar_listeo_geocodificado.csv → Strapi API
 *
 * Uso (en la carpeta backend/):
 *   node scripts/migrate-csv.mjs
 *
 * Requiere Strapi corriendo en http://localhost:1337
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ────────────────────────────────────────────────────────────────
const STRAPI_URL = 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '15eb44fac98bef78f58aa794d90486352e5b2d997de60c8de87c2b6d670dbb09479f1fee55e48b3949b00f0d2fad335913020ab63c22c0e0478ab56a5fa6e38798f56968b9f6e9593c3ffbe1a2273187481d610714c801b5a9b47181432740da11664e09b8dd1481197c3264076d8b6352d0ed2d7eba47ec81871acdb9c75899';
const CSV_PATH = path.resolve(__dirname, '../../importar_listeo_geocodificado.csv');
// ────────────────────────────────────────────────────────────────────────────

const jsonHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${STRAPI_TOKEN}`,
};

const authHeaders = {
  Authorization: `Bearer ${STRAPI_TOKEN}`,
};

// ─── UTILS ──────────────────────────────────────────────────────────────────

/** Parsea una línea CSV respetando comillas */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Limpia la descripción:
 * - Elimina "Más información en: https://sanrafaelturismo.gov.ar/..."
 * - Elimina frases de repetición del nombre del negocio al final
 */
function limpiarDescripcion(texto, nombreNegocio) {
  if (!texto) return '';
  let limpio = texto
    // Eliminar patrones tipo "Nombre en San Rafael. Más información en: URL"
    .replace(/\s*M[aá]s informaci[oó]n en:\s*https?:\/\/sanrafaelturismo\.gov\.ar\/\S*/gi, '')
    // Eliminar "Nombre en San Rafael." al inicio si es repetitivo
    .replace(new RegExp(`^${escapeRegex(nombreNegocio)}\\s+en San Rafael\\.?\\s*`, 'i'), '')
    .trim();
  return limpio;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Genera un slug simple */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Descarga una imagen desde una URL y la sube a Strapi.
 * Devuelve el ID del media en Strapi, o null si falla.
 */
async function subirImagenDesdeURL(url, nombreArchivo) {
  if (!url || !url.startsWith('http')) return null;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());

    // Construir multipart/form-data manualmente
    const boundary = `----FormBoundary${Math.random().toString(16).slice(2)}`;
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${nombreArchivo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;

    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`,
      `Content-Type: ${contentType}\r\n\r\n`,
    ];

    const prefix = Buffer.from(bodyParts.join(''));
    const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([prefix, buffer, suffix]);

    const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!uploadRes.ok) return null;
    const uploadData = await uploadRes.json();
    return uploadData[0]?.id || null;
  } catch {
    return null;
  }
}

/** Obtiene o crea una categoría, devuelve su id */
const categoriaCache = {};
async function obtenerOCrearCategoria(nombre) {
  if (!nombre) return null;
  const key = nombre.toLowerCase().trim();
  if (categoriaCache[key]) return categoriaCache[key];

  const buscar = await fetch(
    `${STRAPI_URL}/api/categorias?filters[nombre][$eq]=${encodeURIComponent(nombre)}&fields=id`,
    { headers: jsonHeaders }
  );
  const buscarData = await buscar.json();
  if (buscarData.data?.length > 0) {
    const id = buscarData.data[0].id;
    categoriaCache[key] = id;
    return id;
  }

  const crear = await fetch(`${STRAPI_URL}/api/categorias`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ 
      data: { 
        nombre, 
        slug: slugify(nombre),
        publishedAt: new Date().toISOString() 
      } 
    }),
  });
  const crearData = await crear.json();
  const id = crearData.data?.id;
  if (id) categoriaCache[key] = id;
  return id;
}

/** Crea un negocio en Strapi con sus datos e imágenes */
async function crearNegocio(row, categoriaId, portadaId) {
  const descripcionLimpia = limpiarDescripcion(row.post_content, row.post_title);

  const body = {
    data: {
      nombre: row.post_title?.trim(),
      slug: slugify(row.post_title?.trim()),
      descripcion: descripcionLimpia || null,
      direccion: row._address?.trim() || null,
      telefono: row._phone?.trim() || null,
      whatsapp: row._whatsapp?.trim() || null,
      email: row._email?.trim() || null,
      website: row._website?.trim() || null,
      instagram: row._instagram?.trim() || null,
      facebook: row._facebook?.trim() || null,
      latitud: row._geolocation_lat ? parseFloat(row._geolocation_lat) : null,
      longitud: row._geolocation_long ? parseFloat(row._geolocation_long) : null,
      imagen_portada: portadaId ? portadaId : undefined,
      logo: portadaId ? portadaId : undefined,
      categoria: categoriaId ? { connect: [categoriaId] } : undefined,
      publishedAt: new Date().toISOString(),
    },
  };

  const res = await fetch(`${STRAPI_URL}/api/negocios`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });

  return res.json();
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Leyendo CSV:', CSV_PATH);

  // Leer como UTF-8 y eliminar BOM si existe
  let raw = fs.readFileSync(CSV_PATH, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1); // strip UTF-8 BOM
    console.log('ℹ️  BOM detectado y eliminado');
  }

  // Normalizar saltos de línea (CRLF → LF) y filtrar líneas vacías
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  const [headerLine, ...allDataLines] = lines;
  const cols = parseCSVLine(headerLine);

  // Deduplicar por nombre de negocio (primera columna)
  const seen = new Set();
  const dataLines = allDataLines.filter(line => {
    const firstField = line.split(',')[0].replace(/"/g, '').trim();
    if (seen.has(firstField)) return false;
    seen.add(firstField);
    return true;
  });

  console.log(`📊 Filas en CSV: ${allDataLines.length} → Únicos: ${dataLines.length}`);
  console.log(`📋 Columnas: ${cols.join(', ')}`);
  console.log('');

  let importados = 0;
  let errores = 0;
  let imagenesSubidas = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const values = parseCSVLine(dataLines[i]);
    const row = Object.fromEntries(cols.map((col, idx) => [col, values[idx] || '']));

    if (!row.post_title?.trim()) continue;

    const label = `[${i + 1}/${dataLines.length}] ${row.post_title}`;

    try {
      // 1. Categoría
      const categoriaId = await obtenerOCrearCategoria(row.listing_category);

      // 2. Imagen de portada (thumbnail)
      let portadaId = null;
      if (row._thumbnail_id?.startsWith('http')) {
        portadaId = await subirImagenDesdeURL(row._thumbnail_id, row.post_title);
        if (portadaId) imagenesSubidas++;
      }

      // 3. Crear negocio
      const result = await crearNegocio(row, categoriaId, portadaId);

      if (result.data?.id) {
        importados++;
        const imgTag = portadaId ? '🖼️' : '  ';
        console.log(`✅ ${imgTag} ${label}`);
      } else {
        errores++;
        console.warn(`⚠️  ${label} — ERROR:`, JSON.stringify(result.error?.message || result));
      }
    } catch (err) {
      errores++;
      console.error(`❌ ${label} — ${err.message}`);
    }
  }

  console.log('');
  console.log(`🏁 Migración completa:`);
  console.log(`   ✅ Importados: ${importados}`);
  console.log(`   🖼️  Imágenes subidas: ${imagenesSubidas}`);
  console.log(`   ❌ Errores: ${errores}`);
}

main().catch(console.error);
