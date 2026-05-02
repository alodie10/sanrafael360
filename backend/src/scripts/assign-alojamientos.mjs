(async () => {
  const TOKEN = "ed461f9f-39d4-4e5e-92b6-0c009dac1315";
  const BASE  = "https://sanrafael360-production.up.railway.app";
  const H     = { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` };

  const CAT = {
    cabanas:  "o7wan3ifgfj8azjvkiz3u45s",
    hoteles:  "nfuj457oxzpgcbco4vz178oh",
    hostels:  "ok842256p6o7icf8lynx8elz",
    apart:    "qx9108ymmcjqy9v63ra2ccy8",
    posadas:  "cxznt2brh9nmr7actv2g5097",
  };

  const detect = nombre => {
    const n = nombre.toLowerCase();
    if (n.includes("hostel"))  return CAT.hostels;
    if (n.includes("apart"))   return CAT.apart;
    if (n.includes("posada"))  return CAT.posadas;
    if (n.includes("caba"))    return CAT.cabanas;   // cabaña / cabañas / cabanas
    if (n.includes("hotel"))   return CAT.hoteles;
    return null;
  };

  // 1. Descargar todos los negocios
  let all = [], p = 1, pc = 1;
  do {
    const r = await fetch(`${BASE}/api/negocios?populate[categoria][fields][0]=nombre&pagination[page]=${p}&pagination[pageSize]=100`, { headers: H });
    const d = await r.json();
    all = [...all, ...(d.data || [])];
    pc = d.meta?.pagination?.pageCount || 1;
    p++;
    console.log(`Página ${p-1}/${pc} descargada...`);
  } while (p <= pc);

  console.log(`\n📊 Total negocios: ${all.length}`);

  // 2. Filtrar candidatos (sin categoría o con categoría padre "Alojamientos")
  const cands = all.filter(n => !n.categoria || n.categoria.nombre.toLowerCase() === "alojamientos");
  console.log(`🏠 Candidatos a clasificar: ${cands.length}\n`);

  let ok = 0, skip = [];
  for (const neg of cands) {
    const cat = detect(neg.nombre);
    if (!cat) { skip.push(neg.nombre); continue; }

    const catKey = Object.entries(CAT).find(([, id]) => id === cat)?.[0];
    const r = await fetch(`${BASE}/api/negocios/${neg.documentId}`, {
      method: "PUT", headers: H,
      body: JSON.stringify({ data: { categoria: cat } })
    });
    if (r.ok) { console.log(`✅ ${neg.nombre} → ${catKey}`); ok++; }
    else       { const e = await r.text(); console.error(`❌ ${neg.nombre}:`, e); }
  }

  console.log(`\n🎉 MIGRACIÓN COMPLETADA`);
  console.log(`   ✅ Actualizados: ${ok}`);
  console.log(`   ⚠️  Sin clasificar: ${skip.length}`);
  if (skip.length) { console.log("Sin clasificar:"); skip.forEach(n => console.log(" -", n)); }
})();
