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
  parent?: Categoria;
  subcategorias?: Categoria[];
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
  tipo_oferta: "Descuento" | "Promocion2x1" | "Regalo" | "Especial";
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
}

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  favoritos?: Negocio[];
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
