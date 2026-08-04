import { ValidationError } from '../../../utils/errors';

export const MODOS_COBRO = ['mp_requerido', 'solo_local', 'mp_o_local'] as const;
export type ModoCobro = (typeof MODOS_COBRO)[number];
export type MetodoPagoCheckout = 'mp' | 'local';

export function normalizeModoCobro(raw: unknown): ModoCobro {
  const v = String(raw || '').trim();
  if ((MODOS_COBRO as readonly string[]).includes(v)) return v as ModoCobro;
  return 'mp_requerido';
}

export function parseModoCobroInput(raw: unknown): ModoCobro {
  const v = String(raw || '').trim();
  if (!(MODOS_COBRO as readonly string[]).includes(v)) {
    throw new ValidationError(
      `modo_cobro inválido (usar: ${MODOS_COBRO.join(' | ')})`
    );
  }
  return v as ModoCobro;
}

/** Live sin simulación permitido aunque no haya token MP. */
export function modoCobroAllowsLiveWithoutMp(modo: ModoCobro): boolean {
  return modo === 'solo_local';
}

export function resolveCheckoutMetodoPago(
  modo: ModoCobro,
  requested?: string | null
): MetodoPagoCheckout {
  const req = String(requested || '').trim().toLowerCase();
  if (modo === 'solo_local') return 'local';
  if (modo === 'mp_requerido') {
    if (req === 'local') {
      throw new ValidationError('Este comercio solo acepta pago anticipado con Mercado Pago');
    }
    return 'mp';
  }
  // mp_o_local
  if (req === 'local') return 'local';
  if (req === 'mp' || !req) return 'mp';
  throw new ValidationError('metodo_pago debe ser mp o local');
}
