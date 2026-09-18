import { ValidationError } from '../../utils/errors';

export const CRM_ESTADOS = [
  'nuevo',
  'contactado',
  'en_conversacion',
  'error',
  'ganado',
  'descartado',
] as const;

export type CrmEstado = (typeof CRM_ESTADOS)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertEstado(value: unknown): CrmEstado {
  if (typeof value !== 'string' || !CRM_ESTADOS.includes(value as CrmEstado)) {
    throw new ValidationError('estado inválido');
  }
  return value as CrmEstado;
}

export function assertFechaFiltro(value: unknown, label: string): string | undefined {
  if (value == null || value === '') return undefined;
  const text = String(value).trim();
  if (!DATE_RE.test(text)) throw new ValidationError(`${label} inválida`);
  return text;
}

export type CrmListQuery = {
  estado?: CrmEstado;
  desde?: string;
  hasta?: string;
  soloCola: boolean;
};

export function parseCrmListQuery(input: Record<string, unknown> = {}): CrmListQuery {
  const estado = input.estado ? assertEstado(input.estado) : undefined;
  const desde = assertFechaFiltro(input.desde, 'fecha desde');
  const hasta = assertFechaFiltro(input.hasta, 'fecha hasta');
  const colaRaw = input.cola;
  const colaExplicit = colaRaw === '1' || colaRaw === 'true' || colaRaw === true;
  const colaOff = colaRaw === '0' || colaRaw === 'false' || colaRaw === false;
  let soloCola = !colaOff;
  if ((estado || desde || hasta) && colaRaw == null) soloCola = false;
  if (colaExplicit) soloCola = true;
  return { estado, desde, hasta, soloCola };
}

export function createdAtRange(desde?: string, hasta?: string) {
  if (!desde && !hasta) return undefined;
  const range: Record<string, string> = {};
  if (desde) range.$gte = `${desde}T00:00:00.000`;
  if (hasta) range.$lte = `${hasta}T23:59:59.999`;
  return range;
}

export function estadoYNotaPatch(patch: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (patch.estado != null) {
    data.estado = assertEstado(patch.estado);
    if (data.estado === 'nuevo') data.en_cola = true;
  }
  if (patch.nota != null) data.nota = String(patch.nota);
  return data;
}
