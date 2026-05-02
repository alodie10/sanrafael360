/**
 * SCRIPT DE MIGRACIÓN: Asignar subcategorías de Alojamientos
 * Uso: node src/scripts/assign-alojamientos.mjs
 */

const STRAPI_URL = "https://sanrafael360-production.up.railway.app";

const CATEGORY_IDS = {
  cabanas:       "o7wan3ifgfj8azjvkiz3u45s",
  hoteles:       "nfuj457oxzpgcbco4vz178oh",
  hostels:       "ok842256p6o7icf8lynx8elz",
  apart_hoteles: "qx9108ymmcjqy9v63ra2ccy8",
  posadas:       "cxznt2brh9nmr7actv2g5097",
  alojamientos:  "hutntrprmvs4mushbbq1mshq",
};

function detectarCategoria(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes("hostel"))                                              return CATEGORY_IDS.hostels;
  if (n.includes("apart") || n.includes("departamento"))                return CATEGORY_IDS.apart_hoteles;
  if (n.includes("posada"))                                             return CATEGORY_IDS.posadas;
  if (n.includes("caba") /* cabaña/cabana/cabañas/cabanas */)           return CATEGORY_IDS.cabanas;
  if (n.includes("hotel"))                                              return CATEGORY_IDS.hoteles;
  return null;
}

async function main() {
  const adminEmail    = "diegocristianalonso@gmail.com";
  const adminPassword = "DcaDca_0111#";

  console.log("🔐 Autenticando con Strapi Admin...");
  const loginRes = await fetch(`${STRAPI_URL}/admin/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const loginData = await loginRes.json();
  const token = loginData?.data?.token;

  if (!token) {
    console.error("❌ Login fallido:", JSON.stringify(loginData));
    process.exit(1);
  }
  console.log("✅ Autenticado.\n");

  // Bajar todos los negocios
  console.log("📥 Descargando negocios...");
  let allNegocios = [];
  let page = 1;
  let pageCount = 1;

  do {
    const res = await fetch(
      `${STRAPI_URL}/api/negocios?populate[categoria][fields][0]=nombre&pagination[page]=${page}&pagination[pageSize]=100&sort=nombre:asc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    allNegocios = [...allNegocios, ...(data.data || [])];
    pageCount = data.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);

  console.log(`📊 Total negocios: ${allNegocios.length}`);

  // Filtrar candidatos: sin categoría o con categoría genérica "Alojamientos"
  const candidatos = allNegocios.filter(n => {
    const catNombre = (n.categoria?.nombre || "").toLowerCase();
    return !n.categoria || catNombre === "alojamientos";
  });

  console.log(`🏠 Candidatos a clasificar: ${candidatos.length}\n`);

  let actualizados = 0;
  let sinClasificar = [];

  for (const negocio of candidatos) {
    const categoriaDocId = detectarCategoria(negocio.nombre);

    if (!categoriaDocId) {
      sinClasificar.push(negocio.nombre);
      continue;
    }

    const updateRes = await fetch(`${STRAPI_URL}/api/negocios/${negocio.documentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { categoria: categoriaDocId } }),
    });

    const catKey = Object.entries(CATEGORY_IDS).find(([, id]) => id === categoriaDocId)?.[0];

    if (updateRes.ok) {
      console.log(`  ✅ "${negocio.nombre}" → ${catKey}`);
      actualizados++;
    } else {
      const err = await updateRes.text();
      console.error(`  ❌ Error con "${negocio.nombre}": ${err}`);
    }
  }

  console.log(`\n🎉 MIGRACIÓN COMPLETADA`);
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ⚠️  Sin clasificar automáticamente: ${sinClasificar.length}`);
  if (sinClasificar.length > 0) {
    console.log("   Estos necesitan asignación manual:");
    sinClasificar.forEach(n => console.log(`     - ${n}`));
  }
}

main().catch(console.error);
