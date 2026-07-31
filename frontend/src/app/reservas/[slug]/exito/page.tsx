import Link from 'next/link';
import { fetchReservaByCodigo } from '@/lib/reservas-checkout';
import '@/components/reservas/reservas-public.css';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ codigo?: string }>;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export default async function ReservaExitoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { codigo } = await searchParams;
  const reserva = codigo ? await fetchReservaByCodigo(codigo).catch(() => null) : null;
  const brand =
    reserva?.comercio?.nombre_publico || reserva?.comercio?.nombre || 'tu reserva';

  return (
    <div className="rp-page">
      <div className="rp-status">
        <div>
          <h1>Reserva confirmada</h1>
          {reserva?.estado === 'confirmada' ? (
            <>
              <p>
                {brand} · {reserva.recurso?.nombre}
              </p>
              <p>{formatWhen(reserva.inicio)}</p>
              <p>Código {reserva.codigo}</p>
              {reserva.comercio?.texto_llegada ? <p>{reserva.comercio.texto_llegada}</p> : null}
            </>
          ) : (
            <p>
              {codigo
                ? 'Estamos confirmando tu pago. Si no ves el turno en unos minutos, contactá al local con tu código.'
                : 'Falta el código de reserva.'}
              {codigo ? ` Código: ${codigo}` : null}
            </p>
          )}
          <p>
            <Link href={`/reservas/${slug}`}>Volver a la grilla</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
