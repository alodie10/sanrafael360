'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStrapiUrl } from '@/lib/strapi';
import '@/components/reservas/reservas-public.css';

type CancelInfo = {
  estado: string;
  codigo: string;
  comercioNombre?: string;
  recursoNombre?: string;
  cuando?: string;
  whatsappUrl: string | null;
  mensaje: string;
};

type Props = {
  slug: string;
  token: string;
};

export default function ReservaCancelClient({ slug, token }: Props) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<CancelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Falta el enlace de cancelación. Abrí el link que llegó en el mail.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const url = `${getStrapiUrl()}/api/reservas/${encodeURIComponent(slug)}/cancelar-info?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || `Error ${res.status}`);
        }
        if (!cancelled) setInfo(json.data as CancelInfo);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudo cargar la solicitud');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  return (
    <div className="rp-page">
      <div className="rp-status">
        <div>
          <h1>Solicitar cancelación</h1>
          {loading ? <p>Cargando…</p> : null}
          {error ? <p className="rp-error">{error}</p> : null}
          {!loading && info ? (
            <>
              {info.estado === 'cancelada' ? (
                <p>{info.mensaje}</p>
              ) : (
                <>
                  <p>{info.mensaje}</p>
                  <p>
                    <strong>{info.codigo}</strong>
                    {info.cuando ? ` · ${info.cuando}` : ''}
                    {info.recursoNombre ? ` · ${info.recursoNombre}` : ''}
                  </p>
                  {info.whatsappUrl ? (
                    <p style={{ marginTop: '1.25rem' }}>
                      <a
                        className="rp-cta"
                        href={info.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="reserva-cancel-whatsapp"
                      >
                        Escribir por WhatsApp
                      </a>
                    </p>
                  ) : (
                    <p className="rp-error">{info.mensaje}</p>
                  )}
                </>
              )}
              <p style={{ marginTop: '1.25rem' }}>
                <Link href={`/reservas/${slug}`}>Volver a la grilla</Link>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
