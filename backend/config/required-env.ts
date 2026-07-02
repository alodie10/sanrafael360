type EnvFn = (key: string, defaultValue?: string) => string | undefined;

const BUILD_PLACEHOLDERS = new Set([
  'build-placeholder',
  'build-key-1',
  'build-key-2',
  'build-key-3',
  'build-key-4',
]);

/** Nombres alternativos usados en Vercel u otros servicios */
const ENV_ALIASES: Record<string, string[]> = {
  CLOUDINARY_NAME: ['CLOUDINARY_CLOUD_NAME'],
  CLOUDINARY_KEY: ['CLOUDINARY_API_KEY'],
  CLOUDINARY_SECRET: ['CLOUDINARY_API_SECRET'],
};

function resolveEnvValue(env: EnvFn, key: string): string | undefined {
  const candidates = [key, ...(ENV_ALIASES[key] ?? [])];

  for (const name of candidates) {
    const fromStrapi = env(name);
    if (fromStrapi && !BUILD_PLACEHOLDERS.has(fromStrapi)) return fromStrapi;

    const fromProcess = process.env[name];
    if (fromProcess && !BUILD_PLACEHOLDERS.has(fromProcess)) return fromProcess;
  }

  return undefined;
}

/**
 * Falla al arrancar Strapi si falta una variable crítica.
 * Lee env() de Strapi y process.env (Railway inyecta aquí en runtime).
 */
export function requireEnv(env: EnvFn, key: string): string {
  const value = resolveEnvValue(env, key);

  if (value === undefined || value === '') {
    throw new Error(
      `[San Rafael 360] Variable de entorno requerida no definida: ${key}. ` +
        `Configúrala en Railway → servicio backend → Variables (no solo build). ` +
        `Ver backend/.env.example.`
    );
  }

  return value;
}

export function requireEnvArray(env: EnvFn, key: string): string[] {
  const value = requireEnv(env, key);
  const items = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) {
    throw new Error(`[San Rafael 360] ${key} debe contener al menos un valor.`);
  }
  return items;
}

export const REQUIRED_RUNTIME_ENV_KEYS = [
  'ADMIN_JWT_SECRET',
  'API_TOKEN_SALT',
  'TRANSFER_TOKEN_SALT',
  'ENCRYPTION_KEY',
  'APP_KEYS',
  'JWT_SECRET',
  'CLOUDINARY_NAME',
  'CLOUDINARY_KEY',
  'CLOUDINARY_SECRET',
  'RESEND_API_KEY',
] as const;

export function getMissingRuntimeEnvKeys(): string[] {
  const dummyEnv = (key: string) => process.env[key];
  return REQUIRED_RUNTIME_ENV_KEYS.filter((key) => {
    try {
      if (key === 'APP_KEYS') {
        requireEnvArray(dummyEnv, key);
      } else {
        requireEnv(dummyEnv, key);
      }
      return false;
    } catch {
      return true;
    }
  });
}
