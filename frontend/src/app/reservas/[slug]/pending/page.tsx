import Link from 'next/link';
import '@/components/reservas/reservas-public.css';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ codigo?: string }>;
};

export default async function ReservaPendingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { codigo } = await searchParams;

  return (
    <div className="rp-page">
      <div className="rp-status">
        <div>
          <h1>Pago pendiente</h1>
          <p>
            Cuando Mercado Pago confirme el cobro, tu turno queda firme. Guardá tu código por las
            dudas.
          </p>
          {codigo ? <p>Código: {codigo}</p> : null}
          <p>
            <Link href={`/reservas/${slug}`}>Volver a la grilla</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
