/**
 * Sync de reseñas Google Places → cache en Negocio.
 * Usa Place Details legacy (mismo stack que Discovery) para Atmosphere Data.
 * El frontend NUNCA debe llamar Places por pageview.
 */

export type CachedGoogleReview = {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
};

type LegacyPlaceReview = {
  author_name?: string;
  author_url?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
};

const MIN_RATING = 4;
const REQUEST_GAP_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mapLegacyReviews(raw: LegacyPlaceReview[] | undefined): CachedGoogleReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => (r.rating ?? 0) >= MIN_RATING)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .map((r) => ({
      author_name: r.author_name ?? 'Usuario',
      author_url: r.author_url,
      profile_photo_url: r.profile_photo_url,
      rating: r.rating ?? 0,
      relative_time_description: r.relative_time_description ?? '',
      text: r.text ?? '',
    }));
}

export async function fetchGooglePlaceReviews(
  placeId: string,
  apiKey: string
): Promise<{
  reviews: CachedGoogleReview[];
  rating?: number;
  reviewCount?: number;
}> {
  const fields = 'reviews,rating,user_ratings_total';
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}&language=es`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Places Details HTTP ${res.status}`);
  }

  const data: any = await res.json();
  if (data.status !== 'OK') {
    throw new Error(`Places Details status=${data.status} ${data.error_message || ''}`.trim());
  }

  const result = data.result || {};
  return {
    reviews: mapLegacyReviews(result.reviews),
    rating: typeof result.rating === 'number' ? result.rating : undefined,
    reviewCount:
      typeof result.user_ratings_total === 'number' ? result.user_ratings_total : undefined,
  };
}

export type SyncGoogleReviewsResult = {
  checked: number;
  synced: number;
  failed: number;
  skipped: number;
};

export async function syncGoogleReviewsForSlug(
  strapi: any,
  slug: string
): Promise<SyncGoogleReviewsResult> {
  const result: SyncGoogleReviewsResult = { checked: 0, synced: 0, failed: 0, skipped: 0 };
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    strapi.log.warn('[GoogleReviewsSync] GOOGLE_MAPS_API_KEY ausente — skip');
    return result;
  }

  const { createNegocioRepository } = await import(
    '../api/negocio/repositories/negocio-repository'
  );
  const repo = createNegocioRepository(strapi);
  const rows = await strapi.documents('api::negocio.negocio').findMany({
    filters: { slug: { $eq: slug } },
    fields: ['documentId', 'nombre', 'google_place_id', 'google_reviews_synced_at', 'is_premium'],
    limit: 1,
    status: 'published',
  });
  const negocio = rows[0];
  result.checked = rows.length;
  if (!negocio?.is_premium) {
    result.skipped = 1;
    strapi.log.warn(`[GoogleReviewsSync] Skip no-premium slug=${slug}`);
    return result;
  }
  if (!negocio?.google_place_id) {
    result.skipped = 1;
    strapi.log.warn(`[GoogleReviewsSync] Sin place_id para slug=${slug}`);
    return result;
  }

  try {
    const fetched = await fetchGooglePlaceReviews(negocio.google_place_id, apiKey);
    const payload: {
      google_reviews: CachedGoogleReview[];
      google_reviews_synced_at: string;
      google_rating?: number;
      google_review_count?: number;
    } = {
      google_reviews: fetched.reviews,
      google_reviews_synced_at: new Date().toISOString(),
    };
    if (fetched.rating !== undefined) payload.google_rating = fetched.rating;
    if (fetched.reviewCount !== undefined) payload.google_review_count = fetched.reviewCount;
    await repo.saveGoogleReviewsCache(negocio.documentId, payload);
    result.synced = 1;
    strapi.log.info(
      `[GoogleReviewsSync] OK ${negocio.nombre} (${fetched.reviews.length} reseñas)`
    );
  } catch (err: any) {
    result.failed = 1;
    strapi.log.error(`[GoogleReviewsSync] FAIL ${negocio.nombre}: ${err?.message || err}`);
  }
  return result;
}

/**
 * Sincroniza negocios con cache stale/null. Máx. 1 llamada Places por negocio / staleDays.
 */
export async function syncStaleGoogleReviews(
  strapi: any,
  opts: { staleDays?: number; limit?: number } = {}
): Promise<SyncGoogleReviewsResult> {
  const staleDays = opts.staleDays ?? 30;
  const limit = opts.limit ?? 100;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const result: SyncGoogleReviewsResult = { checked: 0, synced: 0, failed: 0, skipped: 0 };

  if (!apiKey) {
    strapi.log.warn('[GoogleReviewsSync] GOOGLE_MAPS_API_KEY ausente — skip');
    return result;
  }

  const { createNegocioRepository } = await import(
    '../api/negocio/repositories/negocio-repository'
  );
  const repo = createNegocioRepository(strapi);
  const pending = await repo.findNeedingGoogleReviewsSync(staleDays, limit);
  result.checked = pending.length;

  for (const negocio of pending) {
    const placeId = negocio.google_place_id as string | undefined;
    if (!placeId) {
      result.skipped += 1;
      continue;
    }

    try {
      const fetched = await fetchGooglePlaceReviews(placeId, apiKey);
      const payload: {
        google_reviews: CachedGoogleReview[];
        google_reviews_synced_at: string;
        google_rating?: number;
        google_review_count?: number;
      } = {
        google_reviews: fetched.reviews,
        google_reviews_synced_at: new Date().toISOString(),
      };
      if (fetched.rating !== undefined) payload.google_rating = fetched.rating;
      if (fetched.reviewCount !== undefined) payload.google_review_count = fetched.reviewCount;

      await repo.saveGoogleReviewsCache(negocio.documentId, payload);
      result.synced += 1;
      strapi.log.info(
        `[GoogleReviewsSync] OK ${negocio.nombre} (${fetched.reviews.length} reseñas)`
      );
    } catch (err: any) {
      result.failed += 1;
      strapi.log.error(
        `[GoogleReviewsSync] FAIL ${negocio.nombre}: ${err?.message || err}`
      );
    }

    await sleep(REQUEST_GAP_MS);
  }

  return result;
}
