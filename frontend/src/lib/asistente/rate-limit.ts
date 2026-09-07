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
