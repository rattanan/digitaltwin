import { handleApiError, success } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { revokeAllSessions } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST() {
  try {
    const context = await requireApiAuth();
    await revokeAllSessions(context.user.id);
    await writeAuditLog({ actorId: context.user.id, action: "LOGOUT_ALL", module: "auth", entityType: "user", entityId: context.user.id });
    return success({ loggedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
