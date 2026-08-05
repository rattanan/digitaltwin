import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { envNumber } from "@/lib/env";
import {
  isLocked,
  permissionCodes,
  roleCodes,
  userAccessInclude,
  type UserWithAccess,
} from "@/lib/auth/access";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  createRefreshToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth/tokens";

type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

function expiry(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

export function requestMetadata(request: Request | NextRequest): RequestMetadata {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

async function issueAccessToken(user: UserWithAccess, sessionId: string) {
  return signAccessToken({
    sub: user.id,
    sid: sessionId,
    roles: roleCodes(user),
  });
}

export async function createAuthSession(user: UserWithAccess, metadata: RequestMetadata) {
  const refreshToken = createRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: createRefreshToken(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt: expiry(envNumber("REFRESH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30)),
      refreshTokens: {
        create: {
          userId: user.id,
          tokenHash: hashToken(refreshToken),
          expiresAt: expiry(envNumber("REFRESH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30)),
        },
      },
    },
  });
  return {
    accessToken: await issueAccessToken(user, session.id),
    refreshToken,
    sessionId: session.id,
  };
}

export async function rotateRefreshToken(rawRefreshToken: string, metadata: RequestMetadata) {
  const current = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawRefreshToken) },
    include: { session: true, user: { include: userAccessIncludeForSession() } },
  });
  if (
    !current ||
    current.usedAt ||
    current.revokedAt ||
    current.expiresAt <= new Date() ||
    current.session.revokedAt ||
    current.session.expiresAt <= new Date() ||
    !current.user.isActive ||
    current.user.deletedAt ||
    isLocked(current.user)
  ) {
    throw new Error("Invalid refresh token");
  }

  const nextRaw = createRefreshToken();
  const next = await prisma.$transaction(async (transaction) => {
    const created = await transaction.refreshToken.create({
      data: {
        sessionId: current.sessionId,
        userId: current.userId,
        tokenHash: hashToken(nextRaw),
        expiresAt: expiry(envNumber("REFRESH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30)),
      },
    });
    await transaction.refreshToken.update({
      where: { id: current.id },
      data: { usedAt: new Date(), replacedById: created.id },
    });
    await transaction.session.update({
      where: { id: current.sessionId },
      data: { ipAddress: metadata.ipAddress, userAgent: metadata.userAgent },
    });
    return created;
  });

  return {
    accessToken: await issueAccessToken(current.user, next.sessionId),
    refreshToken: nextRaw,
    sessionId: next.sessionId,
    user: current.user,
  };
}

function userAccessIncludeForSession() {
  return userAccessInclude;
}

export async function getCurrentAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims = await verifyAccessToken(token);
    const session = await prisma.session.findFirst({
      where: {
        id: claims.sid,
        userId: claims.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { isActive: true, deletedAt: null },
      },
      include: { user: { include: userAccessIncludeForSession() } },
    });
    if (!session || isLocked(session.user)) return null;
    return {
      user: session.user,
      roles: roleCodes(session.user),
      permissions: permissionCodes(session.user),
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}

export async function revokeCurrentSession() {
  const context = await getCurrentAuthContext();
  if (!context) return;
  await prisma.$transaction([
    prisma.session.updateMany({
      where: { id: context.sessionId },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { sessionId: context.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function revokeAllSessions(userId: string) {
  await prisma.$transaction([
    prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function getRefreshCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}
