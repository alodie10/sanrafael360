import { notFound } from 'next/navigation';
import { fetchDisponibilidad } from '@/lib/reservas';
import ReservasPublicClient from '@/components/reservas/ReservasPublicClient';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchDisponibilidad(slug, { dias: 1 }).catch(() => null);
  const name = data?.comercio.nombre_publico || 'Reservas';
  return {
    title: `${name} · Reservar turno`,
    description: data?.comercio.texto_llegada || `Reservá tu turno en ${name}`,
  };
}

export default async function ReservasPublicPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { fecha } = await searchParams;

  const data = await fetchDisponibilidad(slug, {
    fecha: fecha || undefined,
    dias: 7,
  }).catch(() => null);

  if (!data) {
    notFound();
  }

  return <ReservasPublicClient initial={data} />;
}
