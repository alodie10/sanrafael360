export type GuideFicha = {
  objectID: string;
  nombre: string;
  slug: string;
  url: string;
  categoria: string | null;
  zona: string | null;
  is_premium: boolean;
  whatsapp: string | null;
  instagram_username: string | null;
  /** Texto de categoría + keywords Algolia, solo para filtrar rubro. */
  keywords?: string | null;
  /** Descripción en texto plano (sin HTML), para filtrar y redactar. */
  descripcion?: string | null;
};

export type GuideHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type GuideResponseType =
  | "results"
  | "clarify"
  | "anunciar"
  | "empty"
  | "error"
  | "reset";

export type GuideCta = {
  label: string;
  href: string;
};

export type GuideTurnResult = {
  type: GuideResponseType;
  text: string;
  hits: GuideFicha[];
  cta?: GuideCta;
};

export type GuideTurnInput = {
  message: string;
  history: GuideHistoryItem[];
  excludeIds: string[];
};

export type ParsedFilters = {
  categoria: string | null;
  zona: string | null;
  keywords: string | null;
};

export type RankableHit = {
  objectID: string;
  is_premium?: boolean;
};
