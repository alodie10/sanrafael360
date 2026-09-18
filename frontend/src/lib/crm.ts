export type CrmEstado =
  | "nuevo"
  | "contactado"
  | "en_conversacion"
  | "ganado"
  | "descartado";

export type CrmModo = "guia" | "agenda";

export type CrmContacto = {
  documentId: string;
  nombre: string;
  telefono: string;
  instagram: string;
  nota: string;
  origen: "manual" | "lista_ia";
  estado: CrmEstado;
  no_contactar: boolean;
  categoriaId?: string;
  categoriaNombre?: string;
  negocio?: { documentId: string; slug: string; nombre: string } | null;
  createdAt?: string;
};

export type CrmCupo = {
  enviados: number;
  limite: number;
  fecha: string;
};

export type CrmTenant = {
  slug: string;
  nombre: string;
  modo: CrmModo;
  owner_email?: string;
  activo?: boolean;
};

export type CrmBootstrap = {
  comercio: CrmTenant;
  plantilla: { mensaje: string; firma: string; prompt_ia: string };
  cupo: CrmCupo;
  contactos: CrmContacto[];
  canPrestar?: boolean;
  tenants?: CrmTenant[];
};

export const CRM_ESTADOS: { id: CrmEstado; label: string }[] = [
  { id: "nuevo", label: "Nuevo" },
  { id: "contactado", label: "Contactado" },
  { id: "en_conversacion", label: "En conversación" },
  { id: "ganado", label: "Ganado" },
  { id: "descartado", label: "Descartado" },
];

export function crmSlugQuery(slug?: string) {
  return slug ? `?slug=${encodeURIComponent(slug)}` : "";
}
