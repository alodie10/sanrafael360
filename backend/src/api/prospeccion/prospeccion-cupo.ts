export const WHATSAPP_DAILY_LIMIT = 25;

export type CupoWhatsapp = {
  enviados: number;
  limite: number;
  fecha: string;
};

export function asDateOnly(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function resolveCupoWhatsapp(input: {
  storedFecha: string | null;
  storedCount: number;
  today: string;
  contactosHoy: number;
}): CupoWhatsapp {
  const stored = Math.max(0, Number(input.storedCount) || 0);
  const seed = Math.max(0, Number(input.contactosHoy) || 0);
  const enviados = input.storedFecha === input.today ? stored : seed;
  return {
    enviados,
    limite: WHATSAPP_DAILY_LIMIT,
    fecha: input.today,
  };
}

export function nextCupoCount(input: {
  storedFecha: string | null;
  storedCount: number;
  today: string;
  contactosHoy: number;
}): number {
  return resolveCupoWhatsapp(input).enviados + 1;
}
