import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { authOptions, ADMIN_EMAILS } from '@/lib/auth';
import { fetchAdminAgenda } from '@/lib/reservas-admin';
import ReservasAdminClient from '@/components/reservas/ReservasAdminClient';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
};

export default async function PortalReservaComercioPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const email = session.user.email || '';
  const role = (session.user as { role?: string }).role?.toLowerCase() || '';
  const isAdmin =
    role === 'admin' || role === 'super admin' || ADMIN_EMAILS.includes(email);
  if (!isAdmin) redirect('/portal');

  const { slug } = await params;
  const { fecha } = await searchParams;
  const jwt = (session as { jwt?: string }).jwt || '';

  let agenda: any = null;
  try {
    agenda = await fetchAdminAgenda(jwt, slug, { fecha, dias: 1 });
  } catch {
    notFound();
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
