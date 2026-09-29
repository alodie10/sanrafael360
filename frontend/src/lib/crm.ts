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
  plantilla: { mensaje: string; firma: string; prompt_ia: string; slots: { titulo: string; texto: string }[] };
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
  campana: string;
};

export const SIN_CAMPANA = "Sin campaña";
export const AVISO_RECIENTE_DIAS = 30;

export type CrmEnvio = {
  campana: string;
  enviadoAt: string;
  plantillaIndex: number | null;
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

export function isProspectorVigente(negocio: {
  is_prospector?: boolean;
  prospector_valid_until?: string | null;
}) {
  if (!negocio.is_prospector) return false;
  if (!negocio.prospector_valid_until) return true;
  const until = new Date(negocio.prospector_valid_until);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() >= Date.now();
}

export function formatCrmFecha(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { dateStyle: "short" });
}

export type CrmAlcanzado = {
  documentId: string;
  enviadoAt: string;
  nombre: string;
  telefono: string;
  nota: string;
  estado: CrmEstado;
  origen: CrmContacto["origen"];
  categoriaNombre: string;
  negocioSlug: string;
  contactoDocumentId: string;
  envios: CrmEnvio[];
};

export function idAlcanzado(row: { contactoDocumentId?: string; documentId: string }) {
  return row.contactoDocumentId || row.documentId;
}

export function opcionesCampana(slots: { titulo: string }[], rows: CrmAlcanzado[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (titulo: string) => {
    const label = titulo.trim();
    if (!label || seen.has(label)) return;
    seen.add(label);
    out.push(label);
  };
  slots.forEach((slot) => push(slot.titulo));
  rows.forEach((row) => (row.envios || []).forEach((envio) => push(envio.campana)));
  return out;
}

export function ultimoEnvioReciente(
  row: { envios?: CrmEnvio[]; enviadoAt?: string },
  now = Date.now(),
  dias = AVISO_RECIENTE_DIAS
) {
  const envios = enviosDe(row);
  const latest = envios.reduce<(typeof envios)[number] | null>((best, envio) => {
    if (!best || String(envio.enviadoAt) > String(best.enviadoAt)) return envio;
    return best;
  }, null);
  if (!latest?.enviadoAt) return null;
  const at = new Date(latest.enviadoAt).getTime();
  if (Number.isNaN(at)) return null;
  if (now - at >= dias * 24 * 60 * 60 * 1000) return null;
  return { campana: latest.campana || SIN_CAMPANA, enviadoAt: latest.enviadoAt };
}

export function alcanzadoAsContacto(row: CrmAlcanzado): CrmContacto {
  return {
    documentId: row.contactoDocumentId || row.documentId,
    nombre: row.nombre,
    telefono: row.telefono,
    instagram: "",
    nota: row.nota || "",
    origen: row.origen || "manual",
    estado: row.estado || "contactado",
    no_contactar: false,
    categoriaNombre: row.categoriaNombre,
    createdAt: row.enviadoAt,
  };
}

export function filterAlcanzadosUi(rows: CrmAlcanzado[], filtro: CrmLeadFiltro) {
  const campana = filtro.campana.trim();
  return rows.filter((row) => {
    if (filtro.estado && row.estado !== filtro.estado) return false;
    const envios = enviosDe(row);
    if (!campana) return enRango(dia(row.enviadoAt || envios[0]?.enviadoAt), filtro);
    return envios.some((envio) => envio.campana === campana && enRango(dia(envio.enviadoAt), filtro));
  });
}

function enviosDe(row: { envios?: CrmEnvio[]; enviadoAt?: string }): CrmEnvio[] {
  if (row.envios?.length) return row.envios;
  return [{ campana: SIN_CAMPANA, enviadoAt: row.enviadoAt || "", plantillaIndex: null }];
}

function dia(iso?: string) {
  return String(iso || "").slice(0, 10);
}

function enRango(day: string, filtro: { desde?: string; hasta?: string }) {
  if (filtro.desde && day < filtro.desde) return false;
  if (filtro.hasta && day > filtro.hasta) return false;
  return true;
}
