/**
 * Simple in-memory sliding-window rate limiter.
 *
 * ⚠️  In-memory means it resets per serverless cold start and doesn't share
 *     state across multiple function instances. It's still effective for
 *     single-instance deploys (Netlify / Railway) and provides meaningful
 *     protection against naive abuse.
 *
 *     For multi-instance production use, replace the Map with an
 *     Upstash Redis or similar shared store.
 */

interface Window {
  count: number;
  expiresAt: number;
}

const store = new Map<string, Window>();

/**
 * Check whether `key` (typically an IP address) is within the allowed rate.
 * Returns `true` if the request should be allowed, `false` if it should be blocked.
 *
 * @param key         Identifier — use the client IP
 * @param maxPerWindow Maximum number of allowed requests per window
 * @param windowMs    Window duration in milliseconds (default: 60 000 = 1 min)
 */
export function rateLimit(
  key: string,
  maxPerWindow = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.expiresAt) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxPerWindow) return false;

  entry.count += 1;
  return true;
}

/** Extract the best available client IP from a request. */
export function getClientIp(req: { headers: { get: (k: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
