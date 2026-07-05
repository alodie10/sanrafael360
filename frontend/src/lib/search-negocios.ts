import { fetchFromStrapi } from '@/lib/strapi';
import { Negocio } from '@/types/strapi';

export type HomeSearchParams = {
  query?: string;
  localidad?: string;
  categoryDocId?: string | null;
};

function buildNegociosSearchPath({ query, localidad, categoryDocId }: HomeSearchParams): string {
  const parts: string[] = [];

  const text = [query, localidad]
    .filter((v) => v && v !== 'San Rafael, Mendoza')
    .join(' ')
    .trim();

  if (text) {
    parts.push(`filters[$or][0][nombre][$containsi]=${encodeURIComponent(text)}`);
    parts.push(`filters[$or][1][direccion][$containsi]=${encodeURIComponent(text)}`);
  }

  if (categoryDocId) {
    parts.push(`filters[categoria][documentId][$eq]=${encodeURIComponent(categoryDocId)}`);
  }

  const populate = [
    'populate[categoria][fields][0]=nombre',
    'populate[categoria][fields][1]=slug',
    'populate[logo][fields][0]=url',
    'populate[imagen_portada][fields][0]=url',
    'populate[atributos][fields][0]=nombre',
    'populate[atributos][fields][1]=tipo',
    'populate[owner][fields][0]=id',
    'populate[owner][fields][1]=documentId',
    'fields[0]=nombre',
    'fields[1]=slug',
    'fields[2]=direccion',
    'fields[3]=is_premium',
    'fields[4]=premium_valid_until',
    'fields[5]=price_range',
    'fields[6]=rating',
    'fields[7]=review_count',
    'fields[8]=google_rating',
    'fields[9]=google_review_count',
    'fields[10]=tripadvisor_rating',
    'fields[11]=tripadvisor_review_count',
    'fields[12]=latitud',
    'fields[13]=longitud',
  ].join('&');

  const filterQuery = parts.length ? `${parts.join('&')}&` : '';
  return `negocios?${filterQuery}${populate}&pagination[pageSize]=100&sort=nombre:asc`;
}

/** Búsqueda de comercios contra el Strapi configurado (local en dev). */
export async function searchNegociosFromStrapi(params: HomeSearchParams): Promise<Negocio[]> {
  const res = await fetchFromStrapi(buildNegociosSearchPath(params));
  return (res.data ?? []) as Negocio[];
}
