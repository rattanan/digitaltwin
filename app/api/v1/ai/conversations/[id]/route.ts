import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { getAiConversation } from "@/lib/ai/queries";
import { archiveAiConversation, findOwnedConversation, updateAiConversation } from "@/lib/ai/service";
import { aiConversationUpdateSchema } from "@/lib/validations/ai";

type ConversationContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: ConversationContext) {
  try {
    const auth = await requireApiAuth("ai.read");
    const { id } = await context.params;
    const result = await getAiConversation(auth.user.id, id);
    if (!result.data) throw new ApiError("ไม่พบบทสนทนา AI", 404);
    return success(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: ConversationContext) {
  try {
    const auth = await requireApiAuth("ai.use");
    const { id } = await context.params;
    const existing = await findOwnedConversation(auth.user.id, id);
    if (!existing) throw new ApiError("ไม่พบบทสนทนา AI", 404);
    const input = await parseBody(request, aiConversationUpdateSchema);
    const conversation = await updateAiConversation(auth.user.id, existing.id, input);
    if (!conversation) throw new ApiError("ไม่พบบทสนทนา AI", 404);
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "ai", entityType: "conversation", entityId: existing.id, beforeData: { title: existing.title }, afterData: { title: conversation.title, isPinned: conversation.isPinned } });
    return success(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: ConversationContext) {
  try {
    const auth = await requireApiAuth("ai.use");
    const { id } = await context.params;
    const existing = await findOwnedConversation(auth.user.id, id);
    if (!existing) throw new ApiError("ไม่พบบทสนทนา AI", 404);
    await archiveAiConversation(auth.user.id, existing.id);
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "ai", entityType: "conversation", entityId: existing.id, beforeData: { title: existing.title } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
