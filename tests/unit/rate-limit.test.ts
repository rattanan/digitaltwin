import { describe, expect, it } from "vitest";
import { enforceRateLimit } from "@/lib/cache/rate-limit";

describe("process-local rate limiter", () => {
  it("allows requests up to the configured limit", () => {
    const key = `test-rate-limit-${Date.now()}-${Math.random()}`;
    expect(enforceRateLimit(key, 2, 60)).toMatchObject({ allowed: true, remaining: 1 });
    expect(enforceRateLimit(key, 2, 60)).toMatchObject({ allowed: true, remaining: 0 });
    expect(enforceRateLimit(key, 2, 60)).toMatchObject({ allowed: false, remaining: 0 });
  });
});
