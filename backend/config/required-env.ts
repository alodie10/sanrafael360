type EnvFn = (key: string, defaultValue?: string) => string | undefined;

/**
 * Falla al arrancar Strapi si falta una variable crítica.
 * Evita usar secretos hardcodeados como fallback en config.
 */
export function requireEnv(env: EnvFn, key: string): string {
  const value = env(key);
  if (value === undefined || value === '') {
    throw new Error(
      `[San Rafael 360] Variable de entorno requerida no definida: ${key}. ` +
        `Configúrala en backend/.env (ver backend/.env.example).`
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
