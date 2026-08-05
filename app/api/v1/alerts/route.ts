import { handleApiError, pageParams, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getAlertOverview } from "@/lib/operations/queries";
import { ALERT_SEVERITIES, ALERT_SOURCES, ALERT_STATUSES, type AlertSeverity, type AlertSource, type AlertStatus } from "@/lib/operations/types";

export async function GET(request: Request) {
  try {
    await requireApiAuth("alerts.read");
    const { page, limit, search } = pageParams(request);
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const rawSeverity = url.searchParams.get("severity");
    const rawSource = url.searchParams.get("source");
    if (rawStatus && !ALERT_STATUSES.includes(rawStatus as AlertStatus)) throw new ApiError("สถานะแจ้งเตือนไม่ถูกต้อง", 422);
    if (rawSeverity && !ALERT_SEVERITIES.includes(rawSeverity as AlertSeverity)) throw new ApiError("ระดับความรุนแรงไม่ถูกต้อง", 422);
    if (rawSource && !ALERT_SOURCES.includes(rawSource as AlertSource)) throw new ApiError("แหล่งที่มาไม่ถูกต้อง", 422);
    const overview = await getAlertOverview({
      page,
      limit,
      search,
      status: rawStatus ? rawStatus as AlertStatus : undefined,
      severity: rawSeverity ? rawSeverity as AlertSeverity : undefined,
      source: rawSource ? rawSource as AlertSource : undefined,
      districtId: url.searchParams.get("districtId") || undefined,
    });
    return success({ items: overview.items, summary: overview.summary, districts: overview.districts, province: overview.province, freshness: overview.freshness, isDemo: overview.isDemo }, overview.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}
