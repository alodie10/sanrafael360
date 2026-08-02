import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { fetchAdminAgenda } from '@/lib/reservas-admin';
import ReservasAdminClient from '@/components/reservas/ReservasAdminClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
};

export default async function PortalReservaComercioPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const { slug } = await params;
  const { fecha } = await searchParams;
  const jwt = (session as { jwt?: string }).jwt || '';

  // Gate real: API (admin soberano o dueño del negocio linkeado).
  let agenda: any = null;
  try {
    agenda = await fetchAdminAgenda(jwt, slug, { fecha, dias: 1 });
  } catch {
    redirect('/portal');
  }

  if (!agenda) notFound();

  return (
    <ReservasAdminClient
      slug={slug}
      jwt={jwt}
      initialAgenda={agenda}
      initialFecha={agenda.desde}
    />
  );
}
