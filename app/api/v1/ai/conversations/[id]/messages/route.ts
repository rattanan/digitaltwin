import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { sendAiMessage, findOwnedConversation } from "@/lib/ai/service";
import { aiMessageSchema } from "@/lib/validations/ai";

type MessageContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: MessageContext) {
  try {
    const auth = await requireApiAuth("ai.use");
    const { id } = await context.params;
    const existing = await findOwnedConversation(auth.user.id, id);
    if (!existing) throw new ApiError("ไม่พบบทสนทนา AI", 404);
    const input = await parseBody(request, aiMessageSchema);
    const conversation = await sendAiMessage(auth.user.id, existing.id, input.content, auth.permissions);
    await writeAuditLog({ actorId: auth.user.id, action: "QUERY", module: "ai", entityType: "conversation", entityId: existing.id, afterData: { messageLength: input.content.length, assistantMessageCount: conversation.messages.filter((message) => message.role === "ASSISTANT").length } });
    return success(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}
