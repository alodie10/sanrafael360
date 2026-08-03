import { getStrapiUrl } from '@/lib/strapi';

function authHeaders(jwt: string) {
  return {
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchAdminComercios(jwt: string) {
  const res = await fetch(`${getStrapiUrl()}/api/reservas/admin/comercios`, {
    headers: authHeaders(jwt),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Comercios ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export async function fetchAdminAgenda(
  jwt: string,
  slug: string,
  opts: { fecha?: string; dias?: number } = {}
) {
  const params = new URLSearchParams();
  if (opts.fecha) params.set('fecha', opts.fecha);
  if (opts.dias) params.set('dias', String(opts.dias));
  const qs = params.toString();
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/agenda${qs ? `?${qs}` : ''}`,
    { headers: authHeaders(jwt), cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Agenda ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function postWalkIn(
  jwt: string,
  slug: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/walk-in`,
    { method: 'POST', headers: authHeaders(jwt), body: JSON.stringify(body) }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Walk-in ${res.status}`);
  return json.data;
}

export async function postBloqueo(
  jwt: string,
  slug: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/bloqueos`,
    { method: 'POST', headers: authHeaders(jwt), body: JSON.stringify(body) }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Bloqueo ${res.status}`);
  return json.data;
}

export async function deleteBloqueo(jwt: string, slug: string, documentId: string) {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/bloqueos/${documentId}`,
    { method: 'DELETE', headers: authHeaders(jwt) }
  );
  if (!res.ok) throw new Error(`Delete bloqueo ${res.status}`);
  return true;
}

export async function postCancelReserva(jwt: string, slug: string, documentId: string) {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/reservas/${documentId}/cancelar`,
    { method: 'POST', headers: authHeaders(jwt) }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Cancel ${res.status}`);
  return json.data;
}

export type ReservaComercioConfig = {
  documentId: string;
  nombre: string;
  nombre_publico?: string | null;
  slug: string;
  activo: boolean;
  timezone?: string;
  duracion_minutos: number;
  buffer_limpieza_minutos: number;
  anticipacion_llegada_minutos: number;
  texto_llegada?: string | null;
  precio_ars: number;
  horario: { dias: Record<string, Array<{ inicio: string; fin: string }>> };
  cancelacion_horas_minimas: number;
  cancelacion_politica?: {
    dentro_ventana?: { reembolso_porcentaje?: number; cargo_fijo_ars?: number };
    fuera_ventana?: {
      permitir_self_service?: boolean;
      reembolso_porcentaje?: number;
      cargo_fijo_ars?: number | null;
    };
  };
  hold_ttl_minutos: number;
  mp_token_env?: string | null;
  mp_configured?: boolean;
  mp_token_hint?: string | null;
  modo_simulacion: boolean;
  logo_url?: string | null;
  portada_url?: string | null;
};

export async function fetchAdminConfig(jwt: string, slug: string): Promise<ReservaComercioConfig> {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/config`,
    { headers: authHeaders(jwt), cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Config ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function putAdminConfig(
  jwt: string,
  slug: string,
  fields: Record<string, unknown>,
  files?: { logo?: File | null; portada?: File | null }
) {
  const hasFiles = Boolean(files?.logo || files?.portada);
  const url = `${getStrapiUrl()}/api/reservas/admin/${encodeURIComponent(slug)}/config`;

  // Sin archivos: JSON (FormData a veces llega vacío en PUT y el save “no hace nada”).
  if (!hasFiles) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error?.message || `Config update ${res.status}`);
    }
    return json.data as ReservaComercioConfig;
  }

  const form = new FormData();
  form.append('data', JSON.stringify(fields));
  if (files?.logo) form.append('logo', files.logo);
  if (files?.portada) form.append('imagen_portada', files.portada);

  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Config update ${res.status}`);
  return json.data as ReservaComercioConfig;
}
