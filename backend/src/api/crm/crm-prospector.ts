import { ValidationError } from '../../utils/errors';
import { resolveVigenciaUpdate } from '../../utils/premium-vigencia';
import { normalizeOwnerEmail } from './crm-tenant';

export function resolveProspectorVigencia(until: string | null) {
  const { is_premium, validUntilISO } = resolveVigenciaUpdate(until);
  return { is_prospector: is_premium, validUntilISO };
}

export function ownerEmailFromNegocio(negocio: { owner?: { email?: string } } | null) {
  return normalizeOwnerEmail(negocio?.owner?.email);
}

export function assertProspectorOwnerEmail(negocio: { owner?: { email?: string } } | null) {
  const email = ownerEmailFromNegocio(negocio);
  if (!email) {
    throw new ValidationError('Asigná un dueño con email al negocio antes de activar Prospector');
  }
  return email;
}

export function isProspectorVigente(
  negocio: { is_prospector?: boolean; prospector_valid_until?: string | Date | null },
  now: Date = new Date()
) {
  if (!negocio.is_prospector) return false;
  if (!negocio.prospector_valid_until) return true;
  const until =
    negocio.prospector_valid_until instanceof Date
      ? negocio.prospector_valid_until
      : new Date(negocio.prospector_valid_until);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() >= now.getTime();
}

export function mapNotaActividades(rows: { tipo?: string; texto?: string; createdAt?: string }[]) {
  return (rows || [])
    .filter((row) => row.tipo === 'nota' && String(row.texto || '').trim())
    .map((row) => ({
      texto: String(row.texto || ''),
      createdAt: row.createdAt || '',
    }));
}
