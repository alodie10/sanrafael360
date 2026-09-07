import { createGuideExpansionRepository } from '../repositories/guide-expansion-repository';
import seedMap from '../../negocio/data/guide-intent-map.json';

export async function seedGuideExpansionsIfEmpty(strapi: any): Promise<number> {
  const repo = createGuideExpansionRepository(strapi);
  const count = await repo.count();
  if (count > 0) return 0;
  let created = 0;
  for (const [key, entry] of Object.entries(seedMap as Record<string, any>)) {
    await repo.create({
      key,
      aliases: entry.aliases || [],
      queries: entry.queries || [],
      categories: entry.categories || [],
      match_mode: entry.match || 'default',
      exclude_name_needles: entry.excludeNameNeedles || [],
      prefer_name_needles: entry.preferNameNeedles || [],
      activo: true,
      notas: 'Seed inicial',
    });
    created += 1;
  }
  return created;
}
