export type AlgoliaQueryRequest = Record<string, unknown> & {
  restrictSearchableAttributes?: string[];
  attributesToHighlight?: string[];
};

type AlgoliaSearchClient<T extends AlgoliaQueryRequest> = {
  search: (arg: { requests: T[] }) => Promise<{ results: unknown[] }>;
};

const MISSING_ATTR_RE =
  /attribute\s+[`'"]?([A-Za-z0-9_.]+)[`'"]?\s+is not in searchableAttributes/i;

export function errorMessageFromUnknown(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error || "");
}

export function isSearchableAttributeMismatch(message: string): boolean {
  return /searchableAttributes/i.test(message) && /restrictSearchableAttributes|is not in searchable/i.test(message);
}

export function missingSearchableAttribute(message: string): string | null {
  return message.match(MISSING_ATTR_RE)?.[1] ?? null;
}

export function algoliaResultErrorMessage(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const row = result as { hits?: unknown; message?: unknown; status?: unknown };
  if (Array.isArray(row.hits)) return null;
  if (typeof row.message === "string" && row.message.trim()) return row.message;
  if (typeof row.status === "number" && row.status >= 400) {
    return `Algolia ${row.status}`;
  }
  return null;
}

function dropFromList(list: string[] | undefined, attribute: string): string[] | undefined {
  if (!list) return list;
  const next = list.filter((item) => item !== attribute);
  return next.length ? next : undefined;
}

export function dropRestrictAttribute<T extends AlgoliaQueryRequest>(request: T, attribute: string): T {
  const next: T = { ...request };
  next.restrictSearchableAttributes = dropFromList(request.restrictSearchableAttributes, attribute);
  next.attributesToHighlight = dropFromList(request.attributesToHighlight, attribute);
  if (!next.restrictSearchableAttributes) delete next.restrictSearchableAttributes;
  if (!next.attributesToHighlight) delete next.attributesToHighlight;
  return next;
}

export function omitRestrictAttributes<T extends AlgoliaQueryRequest>(request: T): T {
  const next: T = { ...request };
  delete next.restrictSearchableAttributes;
  return next;
}

export function relaxSearchRequests<T extends AlgoliaQueryRequest>(
  requests: T[],
  message: string
): T[] | null {
  if (!isSearchableAttributeMismatch(message)) return null;
  const missing = missingSearchableAttribute(message);
  if (missing) return requests.map((request) => dropRestrictAttribute(request, missing));
  return requests.map(omitRestrictAttributes);
}

function firstResultError(results: unknown[]): string | null {
  for (const result of results) {
    const message = algoliaResultErrorMessage(result);
    if (message) return message;
  }
  return null;
}

export async function searchAlgoliaWithRestrictFallback<T extends AlgoliaQueryRequest>(
  client: AlgoliaSearchClient<T>,
  requests: T[]
): Promise<unknown[]> {
  let current = requests;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const { results } = await client.search({ requests: current });
      const failed = firstResultError(results);
      if (!failed) return results;
      const next = relaxSearchRequests(current, failed);
      if (!next) throw new Error(failed);
      console.warn("[Algolia] Searchable attributes mismatch, retrying:", failed);
      current = next;
    } catch (error) {
      const message = errorMessageFromUnknown(error);
      const next = relaxSearchRequests(current, message);
      if (!next) throw error;
      console.warn("[Algolia] Searchable attributes mismatch, retrying:", message);
      current = next;
    }
  }
  const { results } = await client.search({
    requests: current.map(omitRestrictAttributes),
  });
  return results;
}
