import { randomUUID } from "node:crypto";
import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getIncidentDetail, getIncidentOverview } from "@/lib/operations/queries";
import { ALERT_SEVERITIES, INCIDENT_CATEGORIES, INCIDENT_STATUSES, type AlertSeverity, type IncidentCategory, type IncidentStatus } from "@/lib/operations/types";
import { incidentCreateSchema } from "@/lib/validations/operations";

export async function GET(request: Request) {
  try {
    await requireApiAuth("incidents.read");
    const { page, limit, search } = pageParams(request);
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const rawSeverity = url.searchParams.get("severity");
    const rawCategory = url.searchParams.get("category");
    if (rawStatus && !INCIDENT_STATUSES.includes(rawStatus as IncidentStatus)) throw new ApiError("สถานะเหตุการณ์ไม่ถูกต้อง", 422);
    if (rawSeverity && !ALERT_SEVERITIES.includes(rawSeverity as AlertSeverity)) throw new ApiError("ระดับความรุนแรงไม่ถูกต้อง", 422);
    if (rawCategory && !INCIDENT_CATEGORIES.includes(rawCategory as IncidentCategory)) throw new ApiError("ประเภทเหตุการณ์ไม่ถูกต้อง", 422);
    const overview = await getIncidentOverview({
      page,
      limit,
      search,
      status: rawStatus ? rawStatus as IncidentStatus : undefined,
      severity: rawSeverity ? rawSeverity as AlertSeverity : undefined,
      category: rawCategory ? rawCategory as IncidentCategory : undefined,
      districtId: url.searchParams.get("districtId") || undefined,
    });
    return success({ items: overview.items, summary: overview.summary, districts: overview.districts, province: overview.province, freshness: overview.freshness, isDemo: overview.isDemo }, overview.pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("incidents.manage");
    const input = await parseBody(request, incidentCreateSchema);
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true } });
    if (!province) throw new ApiError("ยังไม่พบพื้นที่จังหวัดสำหรับสร้างเหตุการณ์", 503);

    const [alert, camera, device, district] = await Promise.all([
      input.alertId ? prisma.alert.findFirst({ where: { provinceId: province.id, OR: [{ id: input.alertId }, { publicId: input.alertId }] }, select: { id: true } }) : null,
      input.cameraId ? prisma.cctvCamera.findFirst({ where: { provinceId: province.id, deletedAt: null, OR: [{ id: input.cameraId }, { publicId: input.cameraId }] }, select: { id: true } }) : null,
      input.deviceId ? prisma.iotDevice.findFirst({ where: { provinceId: province.id, deletedAt: null, OR: [{ id: input.deviceId }, { publicId: input.deviceId }] }, select: { id: true } }) : null,
      input.districtId ? prisma.district.findFirst({ where: { id: input.districtId, provinceId: province.id, deletedAt: null }, select: { id: true } }) : null,
    ]);
    if (input.alertId && !alert) throw new ApiError("ไม่พบการแจ้งเตือนที่เชื่อมโยง", 422);
    if (input.cameraId && !camera) throw new ApiError("ไม่พบกล้อง CCTV ที่เชื่อมโยง", 422);
    if (input.deviceId && !device) throw new ApiError("ไม่พบอุปกรณ์ IoT ที่เชื่อมโยง", 422);
    if (input.districtId && !district) throw new ApiError("ไม่พบพื้นที่ที่ระบุ", 422);

    const incident = await prisma.incident.create({
      data: {
        publicId: randomUUID(),
        incidentNo: `INC-SB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity,
        status: "DETECTED",
        dueAt: input.dueAt,
        provinceId: province.id,
        districtId: district?.id,
        alertId: alert?.id,
        cameraId: camera?.id,
        deviceId: device?.id,
        histories: { create: { status: "DETECTED", note: input.note || "สร้างเหตุการณ์จากศูนย์ปฏิบัติการ", actorId: auth.user.id } },
      },
    });
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "incidents", entityType: "incident", entityId: incident.id, afterData: { incidentNo: incident.incidentNo, title: incident.title, status: incident.status } });
    return success(await getIncidentDetail(incident.id), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
