const fs = require('fs');

const normalizeText = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

async function test() {
  const negRes = await fetch('https://sanrafael360-production.up.railway.app/api/negocios?populate[categoria][fields][0]=nombre&populate[categoria][fields][1]=slug&pagination[pageSize]=500').then(r => r.json());
  const catRes = await fetch('https://sanrafael360-production.up.railway.app/api/categorias?populate[parent]=true&pagination[pageSize]=100').then(r => r.json());

  const negocios = negRes.data;
  const categorias = catRes.data;

  // Simulate state
  const searchQuery = ""; 
  const localidadQuery = "";
  const selectedCategoryDocId = "au4ekzxupeo4vszyxgbzq0h1"; // Belleza & Estetica

  const filteredNegocios = negocios.filter((negocio) => {
    // 1. Filtro de Búsqueda (Texto)
    const normalizedQuery = normalizeText(searchQuery);
    let matchesSearch = true;
    if (normalizedQuery.length > 0) {
      const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
      const bizName = normalizeText(negocio.nombre);
      const bizDesc = normalizeText(negocio.descripcion || "");
      const bizCat = normalizeText(negocio.categoria?.nombre || "");
      const bizAttrs = (negocio.atributos || []).map((a) => normalizeText(a.nombre)).join(" ");
      matchesSearch = searchTerms.every(term => 
        bizName.includes(term) || bizDesc.includes(term) || bizCat.includes(term) || bizAttrs.includes(term)
      );
    }

    // 2. Filtro de Localidad (Dirección)
    let matchesLocation = true;
    if (localidadQuery && localidadQuery !== "San Rafael, Mendoza") {
      const bizAddress = normalizeText(negocio.direccion || "");
      const bizCity = normalizeText(negocio.ciudad || "");
      const searchLoc = normalizeText(localidadQuery);
      matchesLocation = bizAddress.includes(searchLoc) || bizCity.includes(searchLoc);
    }

    // 3. Filtro de Categoría de la barra
    let matchesBarCategory = true;
    if (selectedCategoryDocId) {
      const selectedCat = categorias.find(c => c.documentId === selectedCategoryDocId);
      const bizCatName = (negocio.categoria?.nombre || "").toLowerCase();
      let validCategoryNames = [selectedCat?.nombre.toLowerCase()];
      categorias.forEach(c => {
        if (c.parent?.documentId === selectedCategoryDocId) {
          validCategoryNames.push(c.nombre.toLowerCase());
        }
      });
      matchesBarCategory = validCategoryNames.includes(bizCatName);
    }

    return matchesSearch && matchesLocation && matchesBarCategory;
  });

  console.log("Filtered length:", filteredNegocios.length);
}

test();
