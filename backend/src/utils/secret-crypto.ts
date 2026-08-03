import crypto from 'crypto';
import { ValidationError } from './errors';

const PREFIX = 'v1';
const KEY_ENV = 'MP_TOKEN_ENCRYPTION_KEY';

/**
 * Clave AES-256: 64 hex chars (32 bytes) en MP_TOKEN_ENCRYPTION_KEY.
 */
export function getMpTokenEncryptionKey(): Buffer {
  const raw = (process.env[KEY_ENV] || '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new ValidationError(
      `${KEY_ENV} debe ser 64 caracteres hex (32 bytes). Generá con: openssl rand -hex 32`
    );
  }
  return Buffer.from(raw, 'hex');
}

export function hasMpTokenEncryptionKey(): boolean {
  const raw = (process.env[KEY_ENV] || '').trim();
  return /^[0-9a-fA-F]{64}$/.test(raw);
}

/** AES-256-GCM → `v1:iv:tag:ciphertext` (base64url). */
export function encryptSecret(plaintext: string, key = getMpTokenEncryptionKey()): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    enc.toString('base64url'),
  ].join(':');
}

export function decryptSecret(payload: string, key = getMpTokenEncryptionKey()): string {
  const parts = String(payload || '').split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new ValidationError('Secreto cifrado inválido');
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const data = Buffer.from(dataB64, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function secretHint(plaintext: string): string {
  const s = String(plaintext || '').trim();
  if (s.length < 4) return '****';
  return `…${s.slice(-4)}`;
}
