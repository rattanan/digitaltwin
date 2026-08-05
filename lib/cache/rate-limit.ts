type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  buckets: Map<string, RateLimitBucket>;
  lastPrunedAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: RateLimitStore;
};

const store = globalForRateLimit.rateLimitStore ?? {
  buckets: new Map<string, RateLimitBucket>(),
  lastPrunedAt: 0,
};

globalForRateLimit.rateLimitStore = store;

function pruneExpiredBuckets(now: number) {
  if (now - store.lastPrunedAt < 60_000 && store.buckets.size < 10_000) return;
  for (const [key, bucket] of store.buckets) {
    if (bucket.resetAt <= now) store.buckets.delete(key);
  }
  store.lastPrunedAt = now;
}

/**
 * Process-local rate limiter. It requires no Redis or extra database schema.
 * Run a single PM2 instance, or put a shared rate limiter at the edge when
 * the application is scaled horizontally.
 */
export function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const current = store.buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowSeconds * 1000 }
    : current;

  bucket.count += 1;
  store.buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
