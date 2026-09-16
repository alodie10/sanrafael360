export type RateLimitState = {
  count: number;
  resetAt: number;
};

export function parseRateLimitCookie(raw: string | undefined, now: number): RateLimitState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RateLimitState;
    if (!Number.isFinite(parsed.count) || !Number.isFinite(parsed.resetAt)) return null;
    if (parsed.resetAt <= now) return { count: 0, resetAt: now };
    return parsed;
  } catch {
    return null;
  }
}

export function consumeRateLimit(
  state: RateLimitState | null,
  now: number,
  max: number,
  windowMs: number
): { allowed: boolean; next: RateLimitState } {
  const base =
    !state || state.resetAt <= now ? { count: 0, resetAt: now + windowMs } : state;
  if (base.count >= max) return { allowed: false, next: base };
  return { allowed: true, next: { count: base.count + 1, resetAt: base.resetAt } };
}

export const RATE_LIMIT_COOKIE = "sr360_guide_rl";

type MemoryBucket = RateLimitState;
const ipBuckets = new Map<string, MemoryBucket>();
const MAX_IP_KEYS = 10_000;

function pruneIpBuckets(now: number) {
  if (ipBuckets.size < MAX_IP_KEYS) return;
  for (const [key, bucket] of ipBuckets) {
    if (bucket.resetAt <= now) ipBuckets.delete(key);
  }
}

/** Rate limit por IP (in-memory). Complementa la cookie, que se puede tirar. */
export function consumeIpRateLimit(
  key: string,
  now: number,
  max: number,
  windowMs: number
): { allowed: boolean } {
  pruneIpBuckets(now);
  const current = ipBuckets.get(key) ?? null;
  const result = consumeRateLimit(current, now, max, windowMs);
  ipBuckets.set(key, result.next);
  return { allowed: result.allowed };
}

export function __resetIpRateLimitForTests() {
  ipBuckets.clear();
}
