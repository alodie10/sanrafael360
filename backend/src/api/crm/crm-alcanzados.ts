export const SIN_CAMPANA = 'Sin campaña';

export type CrmEnvioResumen = {
  campana: string;
  enviadoAt: string;
  plantillaIndex: number | null;
};

export type AlcanzadoFiltro = {
  estado?: string;
  desde?: string;
  hasta?: string;
  campana?: string;
};

export function mapCrmAlcanzado(row: any) {
  const contacto = row?.contacto || {};
  return {
    documentId: contacto.documentId || row.documentId,
    enviadoAt: row.createdAt,
    nombre: contacto.nombre || '',
    telefono: contacto.telefono || '',
    nota: contacto.nota || '',
    estado: contacto.estado || 'contactado',
    origen: contacto.origen || 'manual',
    categoriaNombre: contacto.categoria?.nombre || '',
    negocioSlug: contacto.negocio?.slug || '',
    contactoDocumentId: contacto.documentId || '',
  };
}

export function mapEnvio(row: any): CrmEnvioResumen {
  return {
    campana: String(row?.campana || '').trim() || SIN_CAMPANA,
    enviadoAt: row?.createdAt || '',
    plantillaIndex: indicePlantilla(row?.plantilla_index),
  };
}

export function foldAlcanzados(rows: any[]) {
  const groups = new Map<string, { head: ReturnType<typeof mapCrmAlcanzado>; envios: CrmEnvioResumen[] }>();
  const order: string[] = [];
  for (const row of rows || []) {
    const mapped = mapCrmAlcanzado(row);
    const key = mapped.contactoDocumentId || mapped.documentId;
    const envio = mapEnvio(row);
    const group = groups.get(key);
    if (!group) {
      order.push(key);
      groups.set(key, { head: mapped, envios: [envio] });
      continue;
    }
    group.envios.push(envio);
    if (String(envio.enviadoAt) > String(group.head.enviadoAt || '')) group.head = mapped;
  }
  return order.map((key) => {
    const group = groups.get(key)!;
    const envios = [...group.envios].sort((a, b) => String(b.enviadoAt).localeCompare(String(a.enviadoAt)));
    return { ...group.head, envios };
  });
}

export function filterAlcanzados(
  rows: {
    estado?: string;
    enviadoAt?: string;
    envios?: { campana?: string; enviadoAt?: string }[];
  }[],
  filtro: AlcanzadoFiltro
) {
  const campana = String(filtro.campana || '').trim();
  return (rows || []).filter((row) => {
    if (filtro.estado && row.estado !== filtro.estado) return false;
    const envios = enviosDe(row);
    if (!campana) return enRango(dia(row.enviadoAt || envios[0]?.enviadoAt), filtro);
    return envios.some((envio) => envio.campana === campana && enRango(dia(envio.enviadoAt), filtro));
  });
}

function indicePlantilla(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 4) return null;
  return n;
}

function enviosDe(row: { enviadoAt?: string; envios?: { campana?: string; enviadoAt?: string }[] }) {
  if (row.envios?.length) return row.envios;
  return [{ campana: SIN_CAMPANA, enviadoAt: row.enviadoAt }];
}

function dia(iso?: string) {
  return String(iso || '').slice(0, 10);
}

function enRango(day: string, filtro: { desde?: string; hasta?: string }) {
  if (filtro.desde && day < filtro.desde) return false;
  if (filtro.hasta && day > filtro.hasta) return false;
  return true;
}
