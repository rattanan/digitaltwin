import Redis from "ioredis";
import { optionalEnv } from "@/lib/env";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

export function getRedis() {
  const url = optionalEnv("REDIS_URL");
  if (!url) return null;
  if (globalForRedis.redis) return globalForRedis.redis;

  const redis = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  redis.on("error", (error) => {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Redis connection unavailable:", error.message);
    }
  });
  globalForRedis.redis = redis;
  return redis;
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === "production") return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: limit };
  }

  try {
    if (redis.status === "wait") await redis.connect();
    const bucket = `rate:${key}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, windowSeconds);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit };
  }
}
