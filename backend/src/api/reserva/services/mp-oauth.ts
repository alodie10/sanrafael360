import crypto from 'crypto';
import { ValidationError, UnauthorizedError } from '../../../utils/errors';
import { encryptSecret, decryptSecret, hasMpTokenEncryptionKey, secretHint } from '../../../utils/secret-crypto';
import { createReservaComercioRepository } from '../../reserva-comercio/repositories/reserva-comercio-repository';
import { clearEncryptedMpTokenPatch } from './mp-token';

const MP_AUTH_URL = 'https://auth.mercadopago.com/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';
const STATE_TTL_MS = 15 * 60 * 1000;

export function isMpOauthConfigured(): boolean {
  return Boolean(
    process.env.MP_OAUTH_CLIENT_ID?.trim() &&
      process.env.MP_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.MP_OAUTH_REDIRECT_URI?.trim()
  );
}

function oauthEnv() {
  const clientId = process.env.MP_OAUTH_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.MP_OAUTH_CLIENT_SECRET?.trim() || '';
  const redirectUri = process.env.MP_OAUTH_REDIRECT_URI?.trim() || '';
  if (!clientId || !clientSecret || !redirectUri) {
    throw new ValidationError(
      'OAuth MP no configurado. Faltan MP_OAUTH_CLIENT_ID / MP_OAUTH_CLIENT_SECRET / MP_OAUTH_REDIRECT_URI.'
    );
  }
  return { clientId, clientSecret, redirectUri };
}

function stateSecret(): string {
  const key =
    process.env.MP_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    '';
  if (!key) {
    throw new ValidationError('Falta secreto para firmar state OAuth (MP_TOKEN_ENCRYPTION_KEY o JWT_SECRET)');
  }
  return key;
}

function signState(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyState(state: string): { slug: string; userId: number; exp: number } {
  const [body, sig] = String(state || '').split('.');
  if (!body || !sig) throw new UnauthorizedError('state OAuth inválido');
  const expected = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new UnauthorizedError('state OAuth inválido');
  }
  let parsed: any;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new UnauthorizedError('state OAuth inválido');
  }
  if (!parsed?.slug || !parsed?.userId || !parsed?.exp) {
    throw new UnauthorizedError('state OAuth incompleto');
  }
  if (Date.now() > Number(parsed.exp)) {
    throw new UnauthorizedError('state OAuth expirado; volvé a conectar');
  }
  return {
    slug: String(parsed.slug),
    userId: Number(parsed.userId),
    exp: Number(parsed.exp),
  };
}

export function buildOauthTokenPatch(accessToken: string, refreshToken?: string | null, userId?: string | number | null) {
  if (!hasMpTokenEncryptionKey()) {
    throw new ValidationError(
      'Falta MP_TOKEN_ENCRYPTION_KEY (64 hex). Generá con: openssl rand -hex 32'
    );
  }
  const access = String(accessToken || '').trim();
  if (access.length < 20) {
    throw new ValidationError('Access Token OAuth inválido');
  }
  const patch: Record<string, unknown> = {
    mp_access_token_enc: encryptSecret(access),
    mp_token_hint: secretHint(access),
    mp_oauth_connected_at: new Date().toISOString(),
    mp_token_env: null,
  };
  if (refreshToken && String(refreshToken).trim()) {
    patch.mp_refresh_token_enc = encryptSecret(String(refreshToken).trim());
  }
  if (userId !== undefined && userId !== null && String(userId).trim()) {
    patch.mp_oauth_user_id = String(userId);
  }
  return patch;
}

export function clearOauthMpPatch() {
  return {
    ...clearEncryptedMpTokenPatch(),
    mp_refresh_token_enc: null,
    mp_oauth_user_id: null,
    mp_oauth_connected_at: null,
  };
}

/** Inicia Authorization Code: URL de MP + state firmado. */
export async function startMpOauth(
  strapi: any,
  slug: string,
  user: { id: number }
) {
  if (!isMpOauthConfigured()) {
    throw new ValidationError(
      'OAuth MP no está habilitado en este entorno (faltan variables MP_OAUTH_*).'
    );
  }
  const { clientId, redirectUri } = oauthEnv();
  const repo = createReservaComercioRepository(strapi);
  const comercio = await repo.findBySlug(slug.trim(), {});
  if (!comercio) {
    throw new ValidationError('Comercio de reservas no encontrado');
  }

  const state = signState({
    slug: comercio.slug,
    userId: user.id,
    exp: Date.now() + STATE_TTL_MS,
    n: crypto.randomBytes(8).toString('hex'),
  });

  const url = new URL(MP_AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);

  return {
    authorizeUrl: url.toString(),
    slug: comercio.slug,
  };
}

async function exchangeAuthorizationCode(code: string) {
  const { clientId, clientSecret, redirectUri } = oauthEnv();
  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: String(code).trim(),
      redirect_uri: redirectUri,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || !json.access_token) {
    const msg = json.message || json.error_description || json.error || `OAuth token ${res.status}`;
    throw new ValidationError(`Mercado Pago OAuth falló: ${msg}`);
  }
  return {
    accessToken: String(json.access_token),
    refreshToken: json.refresh_token ? String(json.refresh_token) : null,
    userId: json.user_id ?? json.userId ?? null,
  };
}

/**
 * Callback público: valida state, intercambia code, guarda tokens cifrados.
 * Devuelve slug para redirect al portal.
 */
export async function completeMpOauth(
  strapi: any,
  query: { code?: string; state?: string; error?: string }
) {
  if (query.error) {
    throw new ValidationError(`Autorización cancelada o rechazada (${query.error})`);
  }
  if (!query.code || !query.state) {
    throw new ValidationError('Faltan code o state en el callback OAuth');
  }

  const { slug } = verifyState(query.state);
  const tokens = await exchangeAuthorizationCode(query.code);
  const repo = createReservaComercioRepository(strapi);
  const comercio = await repo.findBySlug(slug, {});
  if (!comercio) {
    throw new ValidationError('Comercio de reservas no encontrado tras OAuth');
  }

  await repo.update(
    comercio.documentId,
    buildOauthTokenPatch(tokens.accessToken, tokens.refreshToken, tokens.userId)
  );

  strapi.log.info(
    `[MP OAuth] Comercio ${slug} conectado (user_id=${tokens.userId ?? 'n/a'}).`
  );

  return { slug, connected: true };
}

export async function disconnectMpOauth(strapi: any, slug: string) {
  const repo = createReservaComercioRepository(strapi);
  const comercio = await repo.findBySlug(slug.trim(), {});
  if (!comercio) {
    throw new ValidationError('Comercio de reservas no encontrado');
  }
  await repo.update(comercio.documentId, {
    ...clearOauthMpPatch(),
    modo_simulacion: true,
  });
  return { slug: comercio.slug, disconnected: true };
}

/** Lee slug del state sin validar firma (solo para redirect de error). */
export function peekSlugFromOauthState(state?: string): string | null {
  try {
    const body = String(state || '').split('.')[0];
    if (!body) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return parsed?.slug ? String(parsed.slug) : null;
  } catch {
    return null;
  }
}

/** Para tests unitarios del state. */
export const __test = { signState, verifyState };
