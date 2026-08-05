import { handleApiError, pageParams, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { CCTV_STATUSES, type CctvStatus } from "@/lib/cctv/types";
import { getCctvOverview } from "@/lib/cctv/queries";

export async function GET(request: Request) {
  try {
    await requireApiAuth("cctv.read");
    const { page, limit, search } = pageParams(request);
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    if (rawStatus && !CCTV_STATUSES.includes(rawStatus as CctvStatus)) {
      throw new ApiError("สถานะกล้องไม่ถูกต้อง", 422);
    }
    const overview = await getCctvOverview({
      page,
      limit,
      search,
      status: rawStatus ? rawStatus as CctvStatus : undefined,
      districtId: url.searchParams.get("districtId") || undefined,
    });
    return success({ items: overview.items, summary: overview.summary, districts: overview.districts, province: overview.province, freshness: overview.freshness, isDemo: overview.isDemo }, overview.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
