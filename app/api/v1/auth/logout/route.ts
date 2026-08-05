import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { revokeCurrentSession, getCurrentAuthContext } from "@/lib/auth/session";
import { success } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST() {
  const context = await getCurrentAuthContext();
  await revokeCurrentSession();
  const response = NextResponse.json(success({ loggedOut: true }));
  clearAuthCookies(response);
  if (context) await writeAuditLog({ actorId: context.user.id, action: "LOGOUT", module: "auth", entityType: "session", entityId: context.sessionId });
  return response;
}
