export type CrmEstado =
  | "nuevo"
  | "contactado"
  | "en_conversacion"
  | "error"
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
  { id: "error", label: "Error WSP" },
  { id: "ganado", label: "Ganado" },
  { id: "descartado", label: "Descartado" },
];

export type CrmLeadFiltro = {
  estado: "" | CrmEstado;
  desde: string;
  hasta: string;
};

export function crmQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  const text = q.toString();
  return text ? `?${text}` : "";
}

export function crmSlugQuery(slug?: string) {
  return crmQuery({ slug });
}

export function crmListQuery(slug: string | undefined, filtro: CrmLeadFiltro) {
  return crmQuery({
    slug,
    cola: "0",
    estado: filtro.estado || undefined,
    desde: filtro.desde || undefined,
    hasta: filtro.hasta || undefined,
  });
}

export function formatCrmFecha(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { dateStyle: "short" });
}
