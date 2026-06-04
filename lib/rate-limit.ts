/**
 * In-memory sliding-window rate limiter.
 *
 * State is per-process. On Vercel with multiple concurrent serverless
 * instances each instance has its own counter — limits are per-instance,
 * not globally enforced. For stricter global enforcement swap the Map
 * store for Upstash Redis (@upstash/ratelimit).
 */

interface Bucket {
  count: number;
  resetAt: number; // Unix ms
}

const store = new Map<string, Bucket>();

// Prune expired buckets every 5 min to avoid unbounded memory growth.
const pruneInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1_000);
pruneInterval.unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Check (and increment) a sliding counter for `key`.
 * @param key      Unique bucket id — e.g. `"login:1.2.3.4"`
 * @param limit    Max requests allowed within `windowMs`
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfterSec = allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1_000);

  return { allowed, remaining, retryAfterSec };
}

/** Best-effort client IP from Vercel / standard reverse-proxy headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
