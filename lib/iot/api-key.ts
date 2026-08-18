import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isValidIotIngestApiKey(provided: string, configured: string) {
  return timingSafeEqual(digest(provided), digest(configured));
}
