import { handleApiError, pageParams, parseBody, success } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { createAiConversation } from "@/lib/ai/service";
import { getAiConversations } from "@/lib/ai/queries";
import { aiConversationCreateSchema } from "@/lib/validations/ai";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth("ai.read");
    const { page, limit } = pageParams(request);
    const result = await getAiConversations(auth.user.id);
    const items = result.data.slice((page - 1) * limit, page * limit);
    return success({ items, isDemo: result.isDemo }, { page, limit, total: result.data.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("ai.use");
    const input = await parseBody(request, aiConversationCreateSchema);
    const conversation = await createAiConversation(auth.user.id, input);
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "ai", entityType: "conversation", entityId: conversation.id, afterData: { title: conversation.title, contextModule: conversation.contextModule } });
    return success(conversation, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
