import { NextResponse } from "next/server";
import { ApiError, handleApiError, parseBody } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/cache/redis";
import { findUserWithAccess, isLocked } from "@/lib/auth/access";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createAuthSession, requestMetadata } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { publicUser } from "@/lib/auth/guards";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, loginSchema);
    const metadata = requestMetadata(request);
    const rate = await enforceRateLimit(`login:${metadata.ipAddress ?? "unknown"}`, 10, 60);
    if (!rate.allowed) throw new ApiError("พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่", 429);

    const user = await findUserWithAccess({ username: input.username });
    const invalid = !user || !user.isActive || user.deletedAt || isLocked(user);
    if (invalid) throw new ApiError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง", 401);

    const validPassword = await verifyPassword(input.password, user.passwordHash);
    if (!validPassword) {
      const nextFailedCount = user.failedLoginCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: { increment: 1 },
          lockedUntil: nextFailedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      throw new ApiError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง", 401);
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const tokens = await createAuthSession(user, metadata);
    const response = NextResponse.json(
      { success: true, data: publicUser(user), message: null, meta: { requestId: crypto.randomUUID() } },
      { status: 200 },
    );
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    await writeAuditLog({ actorId: user.id, action: "LOGIN", module: "auth", entityType: "session", entityId: tokens.sessionId, ...metadata });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
