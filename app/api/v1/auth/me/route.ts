import { handleApiError, success } from "@/lib/api/http";
import { requireApiAuth, publicUser } from "@/lib/auth/guards";

export async function GET() {
  try {
    const context = await requireApiAuth();
    return success(publicUser(context.user));
  } catch (error) {
    return handleApiError(error);
  }
}
