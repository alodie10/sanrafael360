import { getStrapiMedia, getStrapiUrl } from '@/lib/strapi';

export type ReservaRecursoSlot = {
  documentId: string;
  nombre: string;
  orden: number;
  disponible: boolean;
};

export type ReservaSlot = {
  inicio: string;
  fin: string;
  hora: string;
  disponibles: number;
  recursos: ReservaRecursoSlot[];
};

export type ReservaDia = {
  fecha: string;
  slots: ReservaSlot[];
};

export type ReservaDisponibilidad = {
  comercio: {
    documentId: string;
    slug: string;
    nombre: string;
    nombre_publico: string;
    texto_llegada: string | null;
    anticipacion_llegada_minutos: number;
    precio_ars: number;
    duracion_minutos: number;
    buffer_limpieza_minutos: number;
    timezone: string;
    logo_url: string | null;
    portada_url: string | null;
  };
  recursos: { documentId: string; nombre: string; orden: number }[];
  desde: string;
  dias: ReservaDia[];
};

function absolutizeMedia(url: string | null): string | null {
  if (!url) return null;
  return getStrapiMedia(url);
}

export async function fetchDisponibilidad(
  slug: string,
  opts: { fecha?: string; dias?: number } = {}
): Promise<ReservaDisponibilidad | null> {
  const base = getStrapiUrl();
  const params = new URLSearchParams();
  if (opts.fecha) params.set('fecha', opts.fecha);
  if (opts.dias) params.set('dias', String(opts.dias));
  const qs = params.toString();
  const url = `${base}/api/reserva-comercios/${encodeURIComponent(slug)}/disponibilidad${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Disponibilidad error: ${res.status}`);
  }

  const json = await res.json();
  const data = json.data as ReservaDisponibilidad;
  return {
    ...data,
    comercio: {
      ...data.comercio,
      logo_url: absolutizeMedia(data.comercio.logo_url),
      portada_url: absolutizeMedia(data.comercio.portada_url),
    },
  };
}
