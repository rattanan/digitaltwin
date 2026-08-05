import { handleApiError, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getAiSuggestedQuestions } from "@/lib/ai/queries";
import { AI_MODULES, type AiModule } from "@/lib/ai/types";

export async function GET(request: Request) {
  try {
    await requireApiAuth("ai.read");
    const rawModule = new URL(request.url).searchParams.get("module");
    if (rawModule && !AI_MODULES.includes(rawModule as AiModule)) throw new ApiError("โมดูล AI ไม่ถูกต้อง", 422);
    const result = await getAiSuggestedQuestions(rawModule ? rawModule as AiModule : undefined);
    return success({ items: result.data, isDemo: result.isDemo });
  } catch (error) {
    return handleApiError(error);
  }
}
