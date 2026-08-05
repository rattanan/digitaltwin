import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { envNumber, isProduction, optionalEnv } from "@/lib/env";

export const ACCESS_COOKIE = "dt_access";
export const REFRESH_COOKIE = "dt_refresh";

export type AccessClaims = {
  sub: string;
  sid: string;
  roles: string[];
};

function secret(name: string, developmentFallback: string) {
  const configured = optionalEnv(name);
  if (configured) return new TextEncoder().encode(configured);
  if (isProduction()) throw new Error(`Missing required environment variable: ${name}`);
  return new TextEncoder().encode(developmentFallback);
}

export async function signAccessToken(claims: AccessClaims) {
  return new SignJWT({ sid: claims.sid, roles: claims.roles })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${envNumber("ACCESS_TOKEN_TTL_SECONDS", 900)}s`)
    .sign(secret("AUTH_ACCESS_SECRET", "digitaltwin-development-access-secret"));
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(
    token,
    secret("AUTH_ACCESS_SECRET", "digitaltwin-development-access-secret"),
  );
  const payload = result.payload;
  if (!payload.sub || typeof payload.sid !== "string") {
    throw new Error("Invalid access token claims");
  }
  return {
    sub: payload.sub,
    sid: payload.sid,
    roles: Array.isArray(payload.roles)
      ? payload.roles.filter((role): role is string => typeof role === "string")
      : [],
  } satisfies AccessClaims;
}

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
