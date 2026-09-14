export const ADMIN_PAGOS_TZ = 'America/Argentina/Mendoza';

export type AdminPagosFilterType = 'all' | 'premium' | 'expired' | 'expiring';

export type AdminPagosQuery = {
  search?: string;
  filterType?: AdminPagosFilterType;
  month?: string;
};

export type AdminPagoRow = {
  monto?: number | string | null;
  estado?: string | null;
  fecha_pago?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export function normalizePagos(raw: unknown): AdminPagoRow[] {
  if (Array.isArray(raw)) return raw as AdminPagoRow[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: AdminPagoRow[] }).data;
  }
  return [];
}

export function pagoYearMonth(pago: AdminPagoRow): string {
  const raw = pago.fecha_pago || pago.createdAt || pago.updatedAt;
  if (!raw) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_PAGOS_TZ,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(raw));
}

export function sumApprovedPagos(pagos: AdminPagoRow[], month?: string): number {
  return pagos.reduce((acc, pago) => {
    if (pago.estado !== 'aprobado') return acc;
    if (month && pagoYearMonth(pago) !== month) return acc;
    return acc + (Number(pago.monto) || 0);
  }, 0);
}

export function isEliteActive(negocio: { is_premium?: boolean; premium_valid_until?: string | null }, now: Date): boolean {
  if (!negocio.is_premium) return false;
  const validUntil = negocio.premium_valid_until ? new Date(negocio.premium_valid_until) : null;
  return !validUntil || validUntil > now;
}

export function matchesFilterType(
  negocio: { is_premium?: boolean; premium_valid_until?: string | null },
  filterType: AdminPagosFilterType,
  now: Date
): boolean {
  if (filterType === 'all') return true;
  const validUntil = negocio.premium_valid_until ? new Date(negocio.premium_valid_until) : null;
  if (filterType === 'premium') return isEliteActive(negocio, now);
  if (filterType === 'expired') return Boolean(validUntil && validUntil < now);
  if (filterType === 'expiring') {
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Boolean(validUntil && validUntil > now && validUntil < week);
  }
  return true;
}

function matchesSearch(negocio: { nombre?: string; owner?: { email?: string } }, search: string): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  const nombre = String(negocio.nombre || '').toLowerCase();
  const email = String(negocio.owner?.email || '').toLowerCase();
  return nombre.includes(needle) || email.includes(needle);
}

export function buildAdminPagosPayload(
  negocios: Array<{
    nombre?: string;
    is_premium?: boolean;
    premium_valid_until?: string | null;
    owner?: { email?: string };
    pagos?: unknown;
  }>,
  allPagos: AdminPagoRow[],
  query: AdminPagosQuery,
  now: Date
) {
  const filterType = query.filterType || 'premium';
  const stats = {
    total: sumApprovedPagos(allPagos, query.month),
    active: negocios.filter((n) => isEliteActive(n, now)).length,
    pending: allPagos.filter((p) => p.estado === 'pendiente').length,
  };
  const data = negocios.filter(
    (n) => matchesSearch(n, query.search || '') && matchesFilterType(n, filterType, now)
  );
  return { data, meta: { stats } };
}
