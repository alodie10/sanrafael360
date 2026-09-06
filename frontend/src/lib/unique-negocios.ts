export function uniqueNegocios<T extends { documentId?: string; slug?: string }>(
  negocios: T[]
): T[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const unique: T[] = [];

  for (const negocio of negocios) {
    const documentId = String(negocio.documentId || "").trim();
    const slug = String(negocio.slug || "").trim();

    if (documentId && seenIds.has(documentId)) continue;
    if (slug && seenSlugs.has(slug)) continue;

    if (documentId) seenIds.add(documentId);
    if (slug) seenSlugs.add(slug);
    unique.push(negocio);
  }

  return unique;
}
