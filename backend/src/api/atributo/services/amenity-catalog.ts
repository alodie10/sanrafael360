import catalogJson from './amenity-catalog.json';

export const AMENITY_RUBROS = ['alojamiento', 'gastronomia', 'comercios'] as const;

export type AmenityRubro = (typeof AMENITY_RUBROS)[number];

export type AmenityDefinition = {
  nombre: string;
  slug: string;
  icono: string;
  rubros: AmenityRubro[];
};

type AmenitySeed = {
  nombre: string;
  icono: string;
  rubros: AmenityRubro[];
};

export function amenitySlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const AMENITY_CATALOG: AmenityDefinition[] = (catalogJson as AmenitySeed[]).map((item) => ({
  nombre: item.nombre,
  slug: amenitySlug(item.nombre),
  icono: item.icono,
  rubros: [...item.rubros],
}));

function sameRubros(left: unknown, right: AmenityRubro[]): boolean {
  return Array.isArray(left) && JSON.stringify(left) === JSON.stringify(right);
}

type AmenityDocs = {
  findMany: (params: unknown) => Promise<any[]>;
  create: (params: unknown) => Promise<unknown>;
  update: (params: unknown) => Promise<unknown>;
};

async function syncAmenity(
  docs: AmenityDocs,
  item: AmenityDefinition,
  warn: (msg: string) => void
): Promise<'created' | 'updated' | 'skipped' | 'unchanged'> {
  const found = await docs.findMany({
    filters: { slug: { $eq: item.slug } },
    fields: ['nombre', 'tipo', 'icono', 'rubros'],
    status: 'published',
    limit: 1,
  });
  const current = found?.[0];
  if (!current) {
    await docs.create({
      data: {
        nombre: item.nombre,
        slug: item.slug,
        tipo: 'facilidad',
        icono: item.icono,
        rubros: item.rubros,
      },
      status: 'published',
    });
    return 'created';
  }
  if (current.tipo !== 'facilidad') {
    warn(`[Amenities] ${item.slug} existe como ${current.tipo}. No se modifica.`);
    return 'skipped';
  }
  const aligned =
    current.nombre === item.nombre &&
    current.icono === item.icono &&
    sameRubros(current.rubros, item.rubros);
  if (aligned) return 'unchanged';
  const data = { nombre: item.nombre, tipo: 'facilidad' as const, icono: item.icono, rubros: item.rubros };
  await docs.update({ documentId: current.documentId, data, status: 'published' });
  await docs.update({ documentId: current.documentId, data });
  return 'updated';
}

export async function ensureAmenityCatalog(strapi: {
  documents: (uid: string) => AmenityDocs;
  log: { info: (msg: string) => void; warn: (msg: string) => void };
}): Promise<{ created: number; updated: number; skipped: number }> {
  const counts = { created: 0, updated: 0, skipped: 0 };
  const docs = strapi.documents('api::atributo.atributo');
  for (const item of AMENITY_CATALOG) {
    const result = await syncAmenity(docs, item, strapi.log.warn);
    if (result === 'unchanged') continue;
    counts[result] += 1;
  }
  strapi.log.info(
    `[Amenities] catálogo created=${counts.created} updated=${counts.updated} skipped=${counts.skipped}`
  );
  return counts;
}
