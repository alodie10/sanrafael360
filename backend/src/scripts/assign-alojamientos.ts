/**
 * SCRIPT DE MIGRACIÓN: Asignar subcategorías de Alojamientos
 * 
 * Este script lee todos los negocios de PRODUCCIÓN (Railway) y asigna
 * automáticamente la subcategoría de alojamiento correcta según el nombre.
 * 
 * Uso: npx ts-node --esm src/scripts/assign-alojamientos.ts
 *   o: npx tsx src/scripts/assign-alojamientos.ts
 */

const STRAPI_URL = "https://sanrafael360-production.up.railway.app";

// ---- IDs de Categorías (obtenidos de la API en paso 1) ----
const CATEGORY_IDS = {
  alojamientos:  "hutntrprmvs4mushbbq1mshq", // Alojamientos (padre)
  cabanas:       "o7wan3ifgfj8azjvkiz3u45s", // Cabañas
  hoteles:       "nfuj457oxzpgcbco4vz178oh", // Hoteles
  hostels:       "ok842256p6o7icf8lynx8elz", // Hostels
  apart_hoteles: "qx9108ymmcjqy9v63ra2ccy8", // Apart Hoteles
  posadas:       "cxznt2brh9nmr7actv2g5097", // Posadas
};

// ---- Lógica de clasificación por nombre ----
function detectarCategoria(nombre: string): string | null {
  const n = nombre.toLowerCase();
  
  if (n.includes("hostel"))                          return CATEGORY_IDS.hostels;
  if (n.includes("apart") || n.includes("apart-"))  return CATEGORY_IDS.apart_hoteles;
  if (n.includes("posada"))                          return CATEGORY_IDS.posadas;
  if (n.includes("cabaña") || n.includes("cabana") || n.includes("cabañas") || n.includes("cabanas")) return CATEGORY_IDS.cabanas;
  // hotel va DESPUÉS de hostel para no hacer false positive
  if (n.includes("hotel"))                           return CATEGORY_IDS.hoteles;
  
  return null; // No se pudo clasificar automáticamente
}

async function main() {
  // 1. Obtener admin JWT
  console.log("🔐 Autenticando con Strapi Admin...");
  const adminEmail    = process.env.STRAPI_ADMIN_EMAIL    || "";
  const adminPassword = process.env.STRAPI_ADMIN_PASSWORD || "";

  if (!adminEmail || !adminPassword) {
    console.error("❌ Debes pasar STRAPI_ADMIN_EMAIL y STRAPI_ADMIN_PASSWORD como variables de entorno.");
    console.error("   Ejemplo: STRAPI_ADMIN_EMAIL=tu@email.com STRAPI_ADMIN_PASSWORD=tu_password npx tsx src/scripts/assign-alojamientos.ts");
    process.exit(1);
  }

  const loginRes = await fetch(`${STRAPI_URL}/admin/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const loginData = await loginRes.json() as any;
  const token: string = loginData?.data?.token;

  if (!token) {
    console.error("❌ No se pudo obtener el token de admin:", JSON.stringify(loginData));
    process.exit(1);
  }
  console.log("✅ Autenticado correctamente.\n");

  // 2. Obtener todos los negocios (paginado)
  console.log("📥 Descargando todos los negocios...");
  let allNegocios: any[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const res = await fetch(
      `${STRAPI_URL}/api/negocios?populate[categoria][fields][0]=nombre&pagination[page]=${page}&pagination[pageSize]=100&sort=nombre:asc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json() as any;
    allNegocios = [...allNegocios, ...(data.data || [])];
    pageCount = data.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);

  console.log(`📊 Total negocios descargados: ${allNegocios.length}\n`);

  // 3. Filtrar negocios sin categoría O con categoría que sea "Alojamientos" (el padre genérico)
  //    y cuyo nombre sugiera una subcategoría específica
  const candidatos = allNegocios.filter(n => {
    const catNombre = (n.categoria?.nombre || "").toLowerCase();
    // Procesar si: no tiene categoria O ya está en "alojamientos" genérico
    return !n.categoria || catNombre === "alojamientos";
  });

  console.log(`🏠 Negocios candidatos a clasificar (sin cat. o con cat. genérica): ${candidatos.length}`);

  // 4. Clasificar y actualizar
  let actualizados = 0;
  let sinClasificar = 0;

  for (const negocio of candidatos) {
    const categoriaDocId = detectarCategoria(negocio.nombre);
    
    if (!categoriaDocId) {
      sinClasificar++;
      continue;
    }

    // Actualizar via REST API
    const updateRes = await fetch(`${STRAPI_URL}/api/negocios/${negocio.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: { categoria: categoriaDocId }
      }),
    });

    if (updateRes.ok) {
      const catName = Object.entries(CATEGORY_IDS).find(([, id]) => id === categoriaDocId)?.[0];
      console.log(`  ✅ ${negocio.nombre} → ${catName}`);
      actualizados++;
    } else {
      const err = await updateRes.text();
      console.error(`  ❌ Error actualizando ${negocio.nombre}: ${err}`);
    }
  }

  console.log(`\n🎉 Migración completada!`);
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ⚠️  Sin clasificar (requieren revisión manual): ${sinClasificar}`);
}

main().catch(console.error);
