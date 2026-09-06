import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchDisponibilidad } from '@/lib/reservas';
import ReservasPublicClient from '@/components/reservas/ReservasPublicClient';
import { getSiteUrl } from '@/lib/site';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchDisponibilidad(slug, { dias: 1 }).catch(() => null);
  const canonical = `${getSiteUrl()}/reservas/${slug}`;
  if (!data) {
    return {
      title: 'Reservas',
      robots: { index: false, follow: false },
      alternates: { canonical },
    };
  }
  const name = data.comercio.nombre_publico || 'Reservas';
  return {
    title: `${name} · Reservar turno`,
    description: data.comercio.texto_llegada || `Reservá tu turno en ${name}`,
    alternates: { canonical },
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
