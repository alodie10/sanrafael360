import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions, ADMIN_EMAILS } from '@/lib/auth';
import { fetchAdminComercios } from '@/lib/reservas-admin';
import ReservasAdminAlta from '@/components/reservas/ReservasAdminAlta';
import '@/components/reservas/reservas-admin.css';

export default async function PortalReservasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const email = session.user.email || '';
  const role = (session.user as { role?: string }).role?.toLowerCase() || '';
  const isAdmin =
    role === 'admin' || role === 'super admin' || ADMIN_EMAILS.includes(email);

  const jwt = (session as { jwt?: string }).jwt || '';
  let comercios: any[] = [];
  try {
    comercios = await fetchAdminComercios(jwt);
  } catch {
    comercios = [];
  }

  // Dueño sin comercios linkeados: volver al portal. Admin siempre entra.
  if (!isAdmin && !comercios.length) redirect('/portal');

  // Un solo comercio (dueño típico): ir directo a la agenda
  if (!isAdmin && comercios.length === 1) {
    redirect(`/portal/reservas/${comercios[0].slug}`);
  }

  const linkedNegocioIds = comercios
    .map((c) => c.negocio?.documentId)
    .filter(Boolean) as string[];

  return (
    <main className="ra-page">
      <header className="ra-header">
        <p className="ra-kicker">{isAdmin ? 'Admin' : 'Portal'}</p>
        <h1>Reservas</h1>
        <p className="ra-hint">
          {isAdmin
            ? 'Comercios del módulo de turnos. Activá uno nuevo desde el directorio.'
            : 'Tus comercios con módulo de reservas.'}
        </p>
      </header>

      {isAdmin ? (
        <div className="ra-alta-wrap">
          <ReservasAdminAlta jwt={jwt} linkedNegocioIds={linkedNegocioIds} />
        </div>
      ) : null}

      <ul className="ra-comercios-list">
        {comercios.map((c) => (
          <li key={c.documentId}>
            <Link href={`/portal/reservas/${c.slug}`} className="ra-comercio-card">
              <span className="ra-comercio-name">{c.nombre_publico || c.nombre}</span>
              <span className="ra-muted">
                /reservas/{c.slug} · {c.recursos?.length || 0} recursos
                {c.modo_simulacion ? ' · simulación' : ''}
              </span>
            </Link>
          </li>
        ))}
        {!comercios.length ? (
          <li className="ra-muted">No hay comercios de reserva todavía.</li>
        ) : null}
      </ul>

      <p className="ra-back">
        <Link href={isAdmin ? '/portal/admin' : '/portal'}>← Volver</Link>
      </p>
    </main>
  );
}
