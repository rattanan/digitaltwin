import { handleApiError, success } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export async function GET() {
  try {
    await requireApiAuth("dashboard.read");
    return success(await getDashboardSummary());
  } catch (error) {
    return handleApiError(error);
  }
}
