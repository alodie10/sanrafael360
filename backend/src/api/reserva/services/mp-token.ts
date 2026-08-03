import {
  decryptSecret,
  encryptSecret,
  hasMpTokenEncryptionKey,
  secretHint,
} from '../../../utils/secret-crypto';
import { ValidationError } from '../../../utils/errors';

type ComercioMpFields = {
  mp_access_token_enc?: string | null;
  mp_token_hint?: string | null;
  mp_token_env?: string | null;
};

function resolveNamedEnvToken(envName?: string | null): string | null {
  const key = String(envName || '').trim();
  if (!key) return null;
  const value = process.env[key];
  return value ? value : null;
}

/**
 * Prioridad: token cifrado del comercio → variable nombrada en `mp_token_env`.
 * No usa `MP_ACCESS_TOKEN` global a ciegas (evita que todos los comercios
 * parezcan “con token” solo porque hay un .env de Jaditek/dev).
 */
export function resolveComercioMpAccessToken(comercio: ComercioMpFields): string | null {
  const enc = comercio.mp_access_token_enc;
  if (enc && hasMpTokenEncryptionKey()) {
    try {
      const plain = decryptSecret(enc);
      if (plain.trim()) return plain.trim();
    } catch {
      // corrupt / wrong key → fallback env nombrado
    }
  }
  return resolveNamedEnvToken(comercio.mp_token_env);
}

/** True solo si este comercio tiene secreto propio (cifrado o env nombrado). */
export function isComercioMpConfigured(comercio: ComercioMpFields): boolean {
  if (comercio.mp_access_token_enc) return true;
  return Boolean(resolveNamedEnvToken(comercio.mp_token_env));
}

export function buildEncryptedMpTokenPatch(plaintext: string): {
  mp_access_token_enc: string;
  mp_token_hint: string;
} {
  const token = String(plaintext || '').trim();
  if (token.length < 20) {
    throw new ValidationError('Access Token MP inválido (muy corto)');
  }
  if (!hasMpTokenEncryptionKey()) {
    throw new ValidationError(
      'Falta MP_TOKEN_ENCRYPTION_KEY (64 hex). Generá con: openssl rand -hex 32'
    );
  }
  return {
    mp_access_token_enc: encryptSecret(token),
    mp_token_hint: secretHint(token),
  };
}

export function clearEncryptedMpTokenPatch() {
  return {
    mp_access_token_enc: null,
    mp_token_hint: null,
    mp_refresh_token_enc: null,
    mp_oauth_user_id: null,
    mp_oauth_connected_at: null,
  };
}
