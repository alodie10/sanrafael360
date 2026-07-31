'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStrapiUrl } from '@/lib/strapi';
import '@/components/reservas/reservas-public.css';

type Props = {
  slug: string;
  token: string;
};

export default function ReservaCancelClient({ slug, token }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const onCancel = async () => {
    setStatus('loading');
    setMessage(null);
    try {
      const res = await fetch(`${getStrapiUrl()}/api/reservas/${encodeURIComponent(slug)}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error?.message || `Error ${res.status}`);
      }
      setStatus('ok');
      setMessage(
        json?.data?.refundAmount > 0
          ? `Cancelada. Reembolso estimado: $${json.data.refundAmount}.`
          : 'Cancelada. Según la política, no hubo reembolso.'
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'No se pudo cancelar');
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-status">
        <div>
          <h1>Cancelar reserva</h1>
          {status === 'ok' ? (
            <>
              <p>{message}</p>
              <p>
                <Link href={`/reservas/${slug}`}>Volver a la grilla</Link>
              </p>
            </>
          ) : (
            <>
              <p>¿Confirmás que querés cancelar tu turno?</p>
              {message ? <p className="rp-error">{message}</p> : null}
              <button
                type="button"
                className="rp-cta"
                disabled={status === 'loading' || !token}
                onClick={() => void onCancel()}
              >
                {status === 'loading' ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
              <p style={{ marginTop: '1rem' }}>
                <Link href={`/reservas/${slug}`}>Volver sin cancelar</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
