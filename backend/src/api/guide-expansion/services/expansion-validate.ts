import { ValidationError } from '../../../utils/errors';
import { asStringList, normalizeGuideKey } from './guide-text';

const MATCH_MODES = new Set(['default', 'category', 'category_or_name', 'name_or_desc']);

export function validateExpansionInput(body: Record<string, unknown>, partial = false) {
  const key = typeof body.key === 'string' ? normalizeGuideKey(body.key) : '';
  if (!partial && !key) throw new ValidationError('key es requerida');
  if (body.key !== undefined && !key) throw new ValidationError('key es requerida');

  const queries = body.queries !== undefined ? asStringList(body.queries) : undefined;
  const categories = body.categories !== undefined ? asStringList(body.categories) : undefined;
  if (!partial) {
    if (!(queries?.length || categories?.length)) {
      throw new ValidationError('queries o categories: al menos uno no vacío');
    }
  }
  if (partial && queries && categories && !queries.length && !categories.length) {
    throw new ValidationError('queries o categories: al menos uno no vacío');
  }

  if (body.match_mode != null && !MATCH_MODES.has(String(body.match_mode))) {
    throw new ValidationError('match_mode inválido');
  }

  return {
    key: key || undefined,
    aliases: body.aliases !== undefined ? asStringList(body.aliases) : undefined,
    queries,
    categories,
    match_mode: body.match_mode ? String(body.match_mode) : undefined,
    exclude_name_needles:
      body.exclude_name_needles !== undefined ? asStringList(body.exclude_name_needles) : undefined,
    prefer_name_needles:
      body.prefer_name_needles !== undefined ? asStringList(body.prefer_name_needles) : undefined,
    activo: typeof body.activo === 'boolean' ? body.activo : undefined,
    notas: typeof body.notas === 'string' ? body.notas : undefined,
  };
}
