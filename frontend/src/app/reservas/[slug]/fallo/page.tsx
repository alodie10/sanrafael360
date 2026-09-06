import Link from 'next/link';
import type { Metadata } from 'next';
import { noIndexPage } from '@/lib/seo';
import '@/components/reservas/reservas-public.css';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ codigo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return noIndexPage(`/reservas/${slug}/fallo`, 'Pago no completado');
}

export default async function ReservaFalloPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { codigo } = await searchParams;

  return (
    <div className="rp-page">
      <div className="rp-status">
        <div>
          <h1>Pago no completado</h1>
          <p>Tu turno no quedó reservado. Podés elegir otro hueco e intentar de nuevo.</p>
          {codigo ? <p>Código de intento: {codigo}</p> : null}
          <p>
            <Link href={`/reservas/${slug}`}>Volver a la grilla</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
