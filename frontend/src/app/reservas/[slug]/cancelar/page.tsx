import type { Metadata } from 'next';
import { noIndexPage } from '@/lib/seo';
import ReservaCancelClient from './ReservaCancelClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return noIndexPage(`/reservas/${slug}/cancelar`, 'Cancelar reserva');
}

export default async function ReservaCancelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;
  return <ReservaCancelClient slug={slug} token={token || ''} />;
}
