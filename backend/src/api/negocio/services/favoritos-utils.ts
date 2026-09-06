export function favoritoDocumentId(
  negocio: { documentId?: string; document_id?: string } | null | undefined
): string {
  return String(negocio?.documentId || negocio?.document_id || '').trim();
}

export function normalizeFavorito(negocio: any) {
  return {
    ...negocio,
    documentId: favoritoDocumentId(negocio),
    categoria: negocio.categoria
      ? {
          ...negocio.categoria,
          documentId: favoritoDocumentId(negocio.categoria),
        }
      : null,
  };
}

export function isSameFavorito(negocio: any, documentId: string): boolean {
  return Boolean(documentId) && favoritoDocumentId(negocio) === documentId;
}

export function idsExcludingDocument(favorites: any[], documentId: string): number[] {
  return favorites
    .filter((item) => !isSameFavorito(item, documentId))
    .map((item) => Number(item.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

/** Strapi 5 draft+publish can return the same negocio twice (two numeric ids). */
export function dedupeFavoritos(negocios: any[]): any[] {
  const byDoc = new Map<string, any>();

  for (const negocio of negocios) {
    const normalized = normalizeFavorito(negocio);
    const key = normalized.documentId || `id:${negocio?.id}`;
    const existing = byDoc.get(key);

    if (!existing || (normalized.publishedAt && !existing.publishedAt)) {
      byDoc.set(key, normalized);
    }
  }

  return [...byDoc.values()];
}

export function nextFavoritoIds(
  favorites: any[],
  documentId: string,
  negocioNumericId: number
): { isFavorited: boolean; ids: number[] } {
  const isFavorited = favorites.some((item) => isSameFavorito(item, documentId));
  const others = idsExcludingDocument(favorites, documentId);

  return {
    isFavorited,
    ids: isFavorited ? others : [...others, negocioNumericId],
  };
}
