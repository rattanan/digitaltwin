import { handleApiError, success } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getAiWorkspace } from "@/lib/ai/queries";

export async function GET() {
  try {
    const auth = await requireApiAuth("ai.read");
    return success(await getAiWorkspace(auth.user.id, auth.permissions));
  } catch (error) {
    return handleApiError(error);
  }
}
