import { handleApiError, pageParams, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getIotOverview } from "@/lib/iot/queries";
import { IOT_STATUSES, type IotStatus } from "@/lib/iot/types";

export async function GET(request: Request) {
  try {
    await requireApiAuth("iot.read");
    const { page, limit, search } = pageParams(request);
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    if (rawStatus && !IOT_STATUSES.includes(rawStatus as IotStatus)) throw new ApiError("สถานะอุปกรณ์ไม่ถูกต้อง", 422);
    const overview = await getIotOverview({
      page,
      limit,
      search,
      status: rawStatus ? rawStatus as IotStatus : undefined,
      typeId: url.searchParams.get("typeId") || undefined,
      districtId: url.searchParams.get("districtId") || undefined,
    });
    return success({ items: overview.items, summary: overview.summary, types: overview.types, districts: overview.districts, province: overview.province, freshness: overview.freshness, isDemo: overview.isDemo }, overview.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
