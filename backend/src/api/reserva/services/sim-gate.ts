import { ValidationError } from '../../../utils/errors';
import { isComercioMpConfigured } from './mp-token';
import {
  modoCobroAllowsLiveWithoutMp,
  normalizeModoCobro,
  type ModoCobro,
} from './modo-cobro';

type ComercioMpFields = {
  mp_access_token_enc?: string | null;
  mp_token_hint?: string | null;
  mp_token_env?: string | null;
  modo_simulacion?: boolean | null;
  modo_cobro?: string | null;
};

function willClearEncryptedToken(body: Record<string, unknown>): boolean {
  if (
    body.mp_access_token_clear === true ||
    body.mp_access_token_clear === 'true' ||
    body.mp_access_token_clear === '1'
  ) {
    return true;
  }
  if (body.mp_access_token !== undefined && body.mp_access_token !== null) {
    return !String(body.mp_access_token).trim();
  }
  return false;
}

function willSetEncryptedToken(body: Record<string, unknown>): boolean {
  if (willClearEncryptedToken(body)) return false;
  if (body.mp_access_token === undefined || body.mp_access_token === null) return false;
  return String(body.mp_access_token).trim().length >= 20;
}

/** Estado MP efectivo tras aplicar el body (sin mutar DB). */
export function willMpBeConfigured(
  comercio: ComercioMpFields,
  body: Record<string, unknown>
): boolean {
  const projected: ComercioMpFields = {
    mp_access_token_enc: comercio.mp_access_token_enc,
    mp_token_env: comercio.mp_token_env,
  };
  if (willClearEncryptedToken(body)) {
    projected.mp_access_token_enc = null;
  } else if (willSetEncryptedToken(body)) {
    projected.mp_access_token_enc = 'pending';
  }
  return isComercioMpConfigured(projected);
}

export function resolveEffectiveModoCobro(
  comercio: ComercioMpFields,
  body: Record<string, unknown>
): ModoCobro {
  if (body.modo_cobro !== undefined) {
    return normalizeModoCobro(body.modo_cobro);
  }
  return normalizeModoCobro(comercio.modo_cobro);
}

/** Live (sim OFF) permitido: hay MP, o el comercio cobra solo en el local. */
export function canDisableSimulacion(
  comercio: ComercioMpFields,
  body: Record<string, unknown> = {}
): boolean {
  if (willMpBeConfigured(comercio, body)) return true;
  return modoCobroAllowsLiveWithoutMp(resolveEffectiveModoCobro(comercio, body));
}

/**
 * E2 / RES-DEC-009 (+ modo_cobro): sin token MP no se puede apagar simulación
 * salvo modo solo_local.
 * Si el patch deja el comercio sin forma de cobrar en vivo, fuerza modo_simulacion=true.
 */
export function applySimulacionGate(
  comercio: ComercioMpFields,
  body: Record<string, unknown>,
  patch: Record<string, unknown>
): void {
  const liveOk = canDisableSimulacion(comercio, body);
  const wantsSimOff =
    patch.modo_simulacion === false ||
    (body.modo_simulacion !== undefined &&
      (body.modo_simulacion === false ||
        body.modo_simulacion === 'false' ||
        body.modo_simulacion === '0'));

  if (!liveOk) {
    if (wantsSimOff) {
      throw new ValidationError(
        'Sin Access Token de Mercado Pago no podés apagar la simulación (salvo modo cobro “solo en el local”). Conectá MP o cambiá el modo de cobro.'
      );
    }
    patch.modo_simulacion = true;
  }
}
