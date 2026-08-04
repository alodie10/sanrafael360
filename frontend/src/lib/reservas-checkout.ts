import { getStrapiUrl } from '@/lib/strapi';
import type { ReservaDisponibilidad } from '@/lib/reservas';

export type CheckoutPayload = {
  slug: string;
  recursoDocumentId: string;
  inicio: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  metodo_pago?: 'mp' | 'local';
};

export type CheckoutResult = {
  simulated: boolean;
  pago_en_local?: boolean;
  codigo: string;
  reservaDocumentId: string;
  init_point: string;
  preferenceId?: string;
  metodo_pago?: string;
};

export async function postCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const res = await fetch(`${getStrapiUrl()}/api/reservas/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Checkout error ${res.status}`;
    throw new Error(msg);
  }
  return json.data as CheckoutResult;
}

export type ReservaPublica = {
  codigo: string;
  estado: string;
  inicio: string;
  fin: string;
  cliente_nombre: string;
  monto_ars: number;
  comercio?: { nombre?: string; nombre_publico?: string; slug?: string; texto_llegada?: string };
  recurso?: { nombre?: string };
};

export async function fetchReservaByCodigo(codigo: string): Promise<ReservaPublica | null> {
  const res = await fetch(
    `${getStrapiUrl()}/api/reservas/codigo/${encodeURIComponent(codigo)}`,
    { cache: 'no-store' }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Reserva ${res.status}`);
  const json = await res.json();
  return json.data as ReservaPublica;
}

export type { ReservaDisponibilidad };
