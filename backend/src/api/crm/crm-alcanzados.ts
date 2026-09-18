export function mapCrmAlcanzado(row: any) {
  const contacto = row?.contacto || {};
  return {
    documentId: contacto.documentId || row.documentId,
    enviadoAt: row.createdAt,
    nombre: contacto.nombre || '',
    telefono: contacto.telefono || '',
    nota: contacto.nota || '',
    estado: contacto.estado || 'contactado',
    origen: contacto.origen || 'manual',
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

export function filterAlcanzados(
  rows: { estado?: string; enviadoAt?: string }[],
  filtro: { estado?: string; desde?: string; hasta?: string }
) {
  return (rows || []).filter((row) => {
    if (filtro.estado && row.estado !== filtro.estado) return false;
    const day = String(row.enviadoAt || '').slice(0, 10);
    if (filtro.desde && day < filtro.desde) return false;
    if (filtro.hasta && day > filtro.hasta) return false;
    return true;
  });
}
