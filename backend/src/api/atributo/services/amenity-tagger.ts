import { AMENITY_CATALOG, type AmenityRubro } from './amenity-catalog';
import { AMENITY_PATTERNS, type PatternKind } from './amenity-dictionary';
import { rubrosFromSlugs } from './amenity-rubros';

export type Confianza = 'alta' | 'dudosa' | 'negada' | 'rechazada';

export type NegocioParaEtiquetar = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoriaSlugs?: string[];
  tagSlugs?: string[];
  resenas?: string[];
  amenitiesYaVinculados?: string[];
};

export type TagProposal = {
  negocioId: string;
  nombre: string;
  rubro: string;
  amenity: string;
  amenitySlug: string;
  confianza: Confianza;
  evidencia: string;
  llm: boolean;
};

const NEG_BEFORE =
  /(?:\bsin(?:\s+\w+){0,2}\s*)$|(?:\bno\s*)$|(?:no se aceptan|no aceptan|no acepta|no admiten|no admite|no cuenta con|no tiene|no hay|no incluye|no ofrecemos|carece de|no se admite|no permitimos|no se permiten|prohibido|prohibida)\s*$/;

const NEG_AFTER =
  /^\s*[:\-]?\s*(?:no incluida|no incluido|no disponible|no se admiten|no se aceptan|no admitimos|no aceptamos|no admiten|no aceptan)/;

const BOILERPLATE =
  /negocio importado desde google maps\.?\s*(ubicado en san rafael,?\s*mendoza,?\s*argentina\.?)?/g;

export function foldText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, ' ')
    .replace(/[*_#]+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function usableDescription(value: string | null | undefined): string {
  if (!value) return '';
  return foldText(value).replace(BOILERPLATE, ' ').replace(/\s+/g, ' ').trim();
}

function quoteAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  return text.slice(start, end).trim();
}

function isNegated(text: string, index: number, length: number): boolean {
  const before = text.slice(Math.max(0, index - 70), index);
  const after = text.slice(index + length, index + length + 48);
  return NEG_BEFORE.test(before) || NEG_AFTER.test(after);
}

function routeSlug(
  route: 'parking-private' | 'parking-public' | 'delivery' | undefined,
  slug: string,
  rubros: AmenityRubro[]
): string | null {
  const lodging = rubros.includes('alojamiento');
  const gastro = rubros.includes('gastronomia');
  const shops = rubros.includes('comercios');
  if (route === 'parking-private') {
    if (lodging) return 'cochera';
    if (gastro || shops) return 'estacionamiento';
    return null;
  }
  if (route === 'parking-public') {
    if (gastro || shops) return 'estacionamiento';
    if (lodging) return 'cochera';
    return null;
  }
  if (route === 'delivery') {
    if (gastro) return 'delivery';
    if (shops) return 'envios-a-domicilio';
    return null;
  }
  return slug;
}

function amenityAllowed(slug: string, rubros: AmenityRubro[]): boolean {
  const amenity = AMENITY_CATALOG.find((item) => item.slug === slug);
  if (!amenity) return false;
  return amenity.rubros.some((rubro) => rubros.includes(rubro));
}

type Hit = { slug: string; kind: PatternKind; quote: string; negated: boolean; source: 'descripcion' | 'resenas' };

function hitsIn(text: string, source: Hit['source'], rubros: AmenityRubro[]): Hit[] {
  const hits: Hit[] = [];
  for (const pattern of AMENITY_PATTERNS) {
    const slug = routeSlug(pattern.route, pattern.slug, rubros);
    if (!slug || !amenityAllowed(slug, rubros)) continue;
    pattern.re.lastIndex = 0;
    for (const match of text.matchAll(pattern.re)) {
      const index = match.index ?? 0;
      const near = text.slice(Math.max(0, index - 24), index + match[0].length + 40);
      if (pattern.rejectNear?.test(near)) continue;
      hits.push({
        slug,
        kind: pattern.kind,
        quote: quoteAround(text, index, match[0].length),
        negated: isNegated(text, index, match[0].length),
        source,
      });
    }
  }
  return hits;
}

function decide(hits: Hit[]): { confianza: Confianza; evidencia: string; llm: boolean } | null {
  if (!hits.length) return null;
  const description = hits.filter((hit) => hit.source === 'descripcion');
  const denied = description.find((hit) => hit.negated);
  const alta = description.find((hit) => !hit.negated && hit.kind === 'alta');
  const ambigua = description.find((hit) => !hit.negated && hit.kind === 'ambigua');
  const review = hits.find((hit) => hit.source === 'resenas' && !hit.negated);
  if (denied) return { confianza: 'negada', evidencia: `descripcion: ${denied.quote}`, llm: false };
  if (alta) return { confianza: 'alta', evidencia: `descripcion: ${alta.quote}`, llm: false };
  if (ambigua) return { confianza: 'dudosa', evidencia: `descripcion: ${ambigua.quote}`, llm: true };
  if (review) return { confianza: 'dudosa', evidencia: `resenas: ${review.quote}`, llm: false };
  const negatedReview = hits.find((hit) => hit.negated);
  if (negatedReview) {
    return { confianza: 'negada', evidencia: `${negatedReview.source}: ${negatedReview.quote}`, llm: false };
  }
  return null;
}

export function tagNegocio(negocio: NegocioParaEtiquetar): TagProposal[] {
  const rubros = rubrosFromSlugs([...(negocio.categoriaSlugs || []), ...(negocio.tagSlugs || [])]);
  if (!rubros.length) return [];
  const description = usableDescription(negocio.descripcion);
  const reviews = (negocio.resenas || []).map(foldText).filter(Boolean).join(' ');
  const already = new Set(negocio.amenitiesYaVinculados || []);
  const hits = [
    ...(description ? hitsIn(description, 'descripcion', rubros) : []),
    ...(reviews ? hitsIn(reviews, 'resenas', rubros) : []),
  ];
  const bySlug = new Map<string, Hit[]>();
  for (const hit of hits) {
    const list = bySlug.get(hit.slug) || [];
    list.push(hit);
    bySlug.set(hit.slug, list);
  }
  const proposals: TagProposal[] = [];
  for (const [slug, group] of bySlug) {
    if (already.has(slug)) continue;
    const decision = decide(group);
    if (!decision) continue;
    const amenity = AMENITY_CATALOG.find((item) => item.slug === slug);
    proposals.push({
      negocioId: negocio.id,
      nombre: negocio.nombre,
      rubro: rubros.join('|'),
      amenity: amenity?.nombre || slug,
      amenitySlug: slug,
      confianza: decision.confianza,
      evidencia: decision.evidencia,
      llm: decision.llm,
    });
  }
  return proposals.sort((a, b) => a.amenity.localeCompare(b.amenity));
}

export function applyLlmDecisions(
  proposals: TagProposal[],
  decisions: Record<string, 'si' | 'no'>
): TagProposal[] {
  return proposals.map((proposal) => {
    if (!proposal.llm || proposal.confianza !== 'dudosa') return proposal;
    const decision = decisions[`${proposal.negocioId}|${proposal.amenitySlug}`];
    if (decision === 'no') {
      return { ...proposal, confianza: 'rechazada', evidencia: `llm: no. ${proposal.evidencia}`, llm: false };
    }
    if (decision === 'si') {
      return { ...proposal, evidencia: `llm: si. ${proposal.evidencia}` };
    }
    return proposal;
  });
}

export function proposalsToApply(proposals: TagProposal[]): TagProposal[] {
  return proposals.filter((proposal) => proposal.confianza === 'alta');
}
