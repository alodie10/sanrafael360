import { ValidationError } from '../../../utils/errors';

export type BroadcastAudience = 'all' | 'selected';

export function normalizeClienteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function filterBroadcastRecipients(
  clientes: Array<{ documentId: string; email: string; opt_out?: boolean }>,
  options: { audience: BroadcastAudience; documentIds?: string[] }
): Array<{ documentId: string; email: string }> {
  let pool = clientes.filter((c) => !c.opt_out && c.email);

  if (options.audience === 'selected') {
    const ids = new Set((options.documentIds || []).filter(Boolean));
    if (ids.size === 0) {
      throw new ValidationError('Seleccioná al menos un cliente para el envío');
    }
    pool = pool.filter((c) => ids.has(c.documentId));
  }

  return pool.map((c) => ({ documentId: c.documentId, email: c.email }));
}
