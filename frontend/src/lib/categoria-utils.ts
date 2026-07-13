import { Categoria } from "@/types/strapi";

/** Formas en que Strapi puede devolver una relación `parent` según el nivel de populate. */
type StrapiParentShape = NonNullable<Categoria["parent"]> & {
  data?: {
    documentId?: string;
    slug?: string;
    attributes?: { documentId?: string; slug?: string };
  };
};

/** Resuelve el documentId del parent sin importar el nivel de población de Strapi. */
export function resolveParentDocumentId(
  parent: Categoria["parent"]
): string | undefined {
  if (!parent || typeof parent !== "object") return undefined;
  const p = parent as StrapiParentShape;
  if (p.documentId) return p.documentId;
  if (p.data?.documentId) return p.data.documentId;
  return p.data?.attributes?.documentId;
}

/** Resuelve el slug del parent para links de subcategorías. */
export function resolveParentSlug(parent: Categoria["parent"]): string | undefined {
  if (!parent || typeof parent !== "object") return undefined;
  const p = parent as StrapiParentShape;
  if (p.slug) return p.slug;
  return p.data?.attributes?.slug;
}

/** True si la categoría es de primer nivel (sin parent válido). */
export function isMainCategoria(categoria: Categoria): boolean {
  if (!categoria.parent) return true;
  return !resolveParentDocumentId(categoria.parent);
}

/** True si la subcategoría pertenece al parent indicado. */
export function isSubcategoriaOf(
  categoria: Categoria,
  parentDocumentId: string
): boolean {
  const parentId = resolveParentDocumentId(categoria.parent);
  return parentId === parentDocumentId;
}
