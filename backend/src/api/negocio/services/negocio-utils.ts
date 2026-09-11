import { ValidationError } from '../../../utils/errors';

export function slugifyNegocioNombre(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function uniqueNegocioSlug(
  slugTaken: (slug: string) => Promise<boolean>,
  raw: string
): Promise<string> {
  const slug = slugifyNegocioNombre(raw);
  if (!slug) throw new ValidationError('slug inválido');
  let candidate = slug;
  for (let n = 2; n <= 50; n += 1) {
    if (!(await slugTaken(candidate))) return candidate;
    candidate = `${slug}-${n}`;
  }
  throw new ValidationError('No se pudo generar un slug único');
}
