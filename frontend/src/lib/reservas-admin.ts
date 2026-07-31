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
