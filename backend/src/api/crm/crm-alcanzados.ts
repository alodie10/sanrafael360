export function mapCrmAlcanzado(row: any) {
  const contacto = row?.contacto || {};
  return {
    documentId: row.documentId,
    enviadoAt: row.createdAt,
    nombre: contacto.nombre || '',
    telefono: contacto.telefono || '',
    categoriaNombre: contacto.categoria?.nombre || '',
    negocioSlug: contacto.negocio?.slug || '',
    contactoDocumentId: contacto.documentId || '',
  };
}

export function foldAlcanzados(rows: any[]) {
  const seen = new Set<string>();
  const out = [];
  for (const row of rows || []) {
    const mapped = mapCrmAlcanzado(row);
    const key = mapped.contactoDocumentId || mapped.documentId;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(mapped);
  }
  return out;
}
