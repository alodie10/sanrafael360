import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions, ADMIN_EMAILS } from '@/lib/auth';
import { fetchAdminComercios } from '@/lib/reservas-admin';

export default async function PortalReservasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const email = session.user.email || '';
  const role = (session.user as { role?: string }).role?.toLowerCase() || '';
  const isAdmin =
    role === 'admin' || role === 'super admin' || ADMIN_EMAILS.includes(email);
  if (!isAdmin) redirect('/portal');

  const jwt = (session as { jwt?: string }).jwt || '';
  let comercios: any[] = [];
  try {
    comercios = await fetchAdminComercios(jwt);
  } catch {
    comercios = [];
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-500 mb-3">Admin</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl mb-2">Reservas</h1>
        <p className="text-zinc-400 mb-8">Comercios del módulo de turnos.</p>
        <ul className="space-y-3">
          {comercios.map((c) => (
            <li key={c.documentId}>
              <Link
                href={`/portal/reservas/${c.slug}`}
                className="block border border-white/10 rounded-2xl px-5 py-4 hover:border-amber-500/50 transition-colors"
              >
                <span className="text-lg font-medium">
                  {c.nombre_publico || c.nombre}
                </span>
                <span className="block text-sm text-zinc-500 mt-1">
                  /reservas/{c.slug} · {c.recursos?.length || 0} recursos
                </span>
              </Link>
            </li>
          ))}
          {!comercios.length ? (
            <li className="text-zinc-500">No hay comercios de reserva todavía.</li>
          ) : null}
        </ul>
        <p className="mt-8 text-sm">
          <Link href="/portal/admin" className="text-amber-500 hover:underline">
            ← Volver al admin
          </Link>
        </p>
      </div>
    </main>
  );
}
