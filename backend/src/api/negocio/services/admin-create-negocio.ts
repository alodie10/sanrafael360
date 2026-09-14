import { ConflictError, NotFoundError, ValidationError } from '../../../utils/errors';
import { createNegocioRepository } from '../repositories/negocio-repository';
import {
  asTrimmed,
  buildAdminCreateExtras,
  type AdminCreateNegocioInput,
} from './admin-create-negocio-fields';
import { uniqueNegocioSlug } from './negocio-utils';

export type { AdminCreateNegocioInput };

async function assertPlaceIdAvailable(repo: ReturnType<typeof createNegocioRepository>, placeId: unknown) {
  if (typeof placeId !== 'string' || !placeId) return;
  const existing = await repo.findByGooglePlaceId(placeId);
  if (existing) {
    throw new ConflictError(`Este negocio ya está en el directorio (“${existing.nombre}”).`);
  }
}

export async function adminCreateNegocio(strapi: any, input: AdminCreateNegocioInput) {
  const nombre = asTrimmed(input.nombre, 200);
  if (!nombre) throw new ValidationError('nombre es obligatorio');

  const categoriaId = asTrimmed(input.categoriaId, 80);
  if (!categoriaId) throw new ValidationError('categoria es obligatoria');

  const repo = createNegocioRepository(strapi);
  const categoria = await repo.findCategoriaByDocumentId(categoriaId);
  if (!categoria) throw new NotFoundError('Categoría');

  const extras = buildAdminCreateExtras(input);
  await assertPlaceIdAvailable(repo, extras.google_place_id);

  const direccion = asTrimmed(input.direccion, 300) || null;
  const telefono = asTrimmed(input.telefono, 40) || null;
  const slug = await uniqueNegocioSlug(
    (candidate) => repo.slugTaken(candidate),
    String(input.slug || nombre)
  );

  const created = await repo.create(
    {
      nombre,
      slug,
      descripcion:
        asTrimmed(input.descripcion, 2000) ||
        `${nombre} en ${direccion || 'San Rafael, Mendoza'}.`,
      direccion,
      telefono,
      whatsapp: telefono,
      categoria: categoria.documentId,
      reclamar_habilitado: true,
      ...extras,
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
