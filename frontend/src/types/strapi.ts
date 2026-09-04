export interface StrapiMedia {
  id: number;
  documentId?: string;
  url: string;
  name: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  formats?: {
    large?: { url: string };
    medium?: { url: string };
    small?: { url: string };
    thumbnail?: { url: string };
  };
}

export interface Categoria {
  id: number;
  documentId: string;
  nombre: string;
  slug?: string;
  descripcion?: string;
  imagen_portada?: StrapiMedia;
  negocios?: Negocio[];
  /** Puede venir poblado o como wrapper `data` según el nivel de populate de Strapi. */
  parent?: Categoria | StrapiRelationRef;
  subcategorias?: Categoria[];
  palabras_clave?: string;
}

/** Relación Strapi con distintos niveles de población (v4 attributes / v5 data). */
export interface StrapiRelationRef {
  documentId?: string;
  slug?: string;
  data?: {
    documentId?: string;
    slug?: string;
    attributes?: { documentId?: string; slug?: string };
  };
}

export interface Atributo {
  id: number;
  documentId: string;
  nombre: string;
  slug?: string;
  tipo?: string;
  icono?: string;
}

export interface Oferta {
  id: number;
  documentId: string;
  titulo: string;
  tipo_oferta: "Descuento" | "Promocion2x1" | "Regalo" | "Especial" | "Experiencia";
  precio_original?: number;
  precio_descuento?: number;
  porcentaje_descuento?: number;
  descripcion?: string;
  valida_desde: string;
  valida_hasta: string;
  condiciones?: string;
  activa: boolean;
  negocio?: Negocio;
}

export interface Negocio {
  id: number;
  documentId: string;
  nombre: string;
  slug?: string;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  horarios_texto?: string;
  instagram?: string;
  facebook?: string;
  logo?: StrapiMedia;
  imagen_portada?: StrapiMedia;
  galeria?: StrapiMedia[];
  categoria?: Categoria;
  atributos?: Atributo[];
  destacado?: boolean;
  horarios?: string;
  reserva_url?: string;
  google_maps_url?: string;
  google_rating?: number;
  google_review_count?: number;
  google_place_id?: string;
  google_reviews?: Array<{
    author_name: string;
    author_url?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }> | null;
  google_reviews_synced_at?: string | null;
  tripadvisor_rating?: number;
  tripadvisor_review_count?: number;
  tripadvisor_url?: string;
  youtube_url?: string;
  discovery_verified?: boolean;
  rating?: number;
  review_count?: number;
  price_range?: string;
  is_premium?: boolean;
  premium_valid_until?: string;
  premium_notes?: string;
  owner?: { id: number | string; documentId?: string; email?: string };
  schedules?: any[];
  telefono_whatsapp?: string;
  reclamar_habilitado?: boolean;
  estado_reclamo?: string;
  reserva_habilitada?: boolean;
  cta_habilitado?: boolean;
  cta_titulo?: string;
  cta_texto?: string;
  cta_boton_texto?: string;
  cta_link?: string;
  cta_tag_confirmacion?: boolean;
  cta_tag_sin_comisiones?: boolean;
  crop_gravity?: string;
  galeria_config?: Record<string, any>; // { cropGravity?: string, isInternal?: boolean }
  promocion_activa?: boolean;
  promocion_flyer?: StrapiMedia;
  ofertas?: Oferta[];
  /** Soft-link al módulo de reservas SR360 */
  reserva_comercio?: { documentId?: string; slug?: string; nombre?: string } | null;
  /** Campo Algolia que coincidió: nombre → etiquetas → rubro → intención → descripción */
  searchMatch?: "nombre" | "atributos" | "categoria" | "keywords" | "descripcion";
}

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  favoritos?: Negocio[];
}

export interface Efemeride {
  documentId: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  encabezado?: StrapiMedia | null;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  publicationStatus?: "draft" | "published";
  vigente?: boolean;
  participantesCount?: number;
  negocios?: string[];
}

export type EfemeridePublicItem =
  | { kind: "oferta"; negocio: Negocio; oferta: Oferta }
  | { kind: "negocio"; negocio: Negocio };

export interface EfemeridePublic {
  documentId: string;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  encabezado?: StrapiMedia | null;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  items: EfemeridePublicItem[];
}

export interface EfemeridePremiumPickerItem {
  documentId: string;
  nombre: string;
  slug?: string;
  categoria?: string | null;
  label: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
