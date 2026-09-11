import { NotFoundError, ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../repositories/negocio-repository';
import { uniqueNegocioSlug } from './negocio-utils';

export type AdminCreateNegocioInput = {
  nombre?: unknown;
  slug?: unknown;
  categoriaId?: unknown;
  direccion?: unknown;
  telefono?: unknown;
  descripcion?: unknown;
};

function asTrimmed(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function adminCreateNegocio(strapi: any, input: AdminCreateNegocioInput) {
  const nombre = asTrimmed(input.nombre, 200);
  if (!nombre) throw new ValidationError('nombre es obligatorio');

  const categoriaId = asTrimmed(input.categoriaId, 80);
  if (!categoriaId) throw new ValidationError('categoria es obligatoria');

  const repo = createNegocioRepository(strapi);
  const categoria = await repo.findCategoriaByDocumentId(categoriaId);
  if (!categoria) throw new NotFoundError('Categoría');

  const direccion = asTrimmed(input.direccion, 300) || null;
  const telefono = asTrimmed(input.telefono, 40) || null;
  const descripcion =
    asTrimmed(input.descripcion, 2000) ||
    `${nombre} en ${direccion || 'San Rafael, Mendoza'}.`;
  const slug = await uniqueNegocioSlug(
    (candidate) => repo.slugTaken(candidate),
    String(input.slug || nombre)
  );

  const created = await repo.create(
    {
      nombre,
      slug,
      descripcion,
      direccion,
      telefono,
      whatsapp: telefono,
      categoria: categoria.documentId,
      reclamar_habilitado: true,
    },
    'published'
  );

  return {
    documentId: created.documentId,
    nombre: created.nombre,
    slug: created.slug,
    categoria: categoria.nombre,
  };
}
