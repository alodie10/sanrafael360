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
  descripcion?: string;
  imagen_portada?: StrapiMedia;
  negocios?: Negocio[];
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
  sitio_web?: string;
  instagram?: string;
  facebook?: string;
  logo?: StrapiMedia;
  imagen_portada?: StrapiMedia;
  galeria?: StrapiMedia[];
  categoria?: Categoria;
  destacado?: boolean;
  horarios?: string;
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
