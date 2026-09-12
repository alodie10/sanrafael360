import { ValidationError } from '../../../utils/errors';

const ORIGENES = new Set(['pegado', 'archivo']);
const MAX_BODY = 50_000;

export function validateMaterialInput(body: Record<string, unknown>, partial = false) {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const cuerpo = typeof body.cuerpo === 'string' ? body.cuerpo.trim() : '';
  if (!partial) {
    if (titulo.length < 3) throw new ValidationError('titulo es requerido');
    if (cuerpo.length < 20) throw new ValidationError('cuerpo es demasiado corto');
  }
  if (body.titulo !== undefined && titulo.length < 3) {
    throw new ValidationError('titulo es requerido');
  }
  if (body.cuerpo !== undefined && cuerpo.length < 20) {
    throw new ValidationError('cuerpo es demasiado corto');
  }
  if (cuerpo.length > MAX_BODY) throw new ValidationError('cuerpo supera 50.000 caracteres');
  if (body.origen != null && !ORIGENES.has(String(body.origen))) {
    throw new ValidationError('origen inválido');
  }
  return {
    titulo: body.titulo !== undefined ? titulo : undefined,
    cuerpo: body.cuerpo !== undefined ? cuerpo : undefined,
    activo: typeof body.activo === 'boolean' ? body.activo : undefined,
    origen: body.origen ? String(body.origen) : undefined,
    nombre_archivo: typeof body.nombre_archivo === 'string' ? body.nombre_archivo.trim() : undefined,
  };
}
