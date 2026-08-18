import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getIotDetail, getIotOverview } from "@/lib/iot/queries";
import { IOT_STATUSES, type IotStatus } from "@/lib/iot/types";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { iotCreateSchema } from "@/lib/validations/iot";

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

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("iot.manage");
    const input = await parseBody(request, iotCreateSchema);
    const [duplicate, type, district] = await Promise.all([
      prisma.iotDevice.findUnique({ where: { deviceCode: input.deviceCode }, select: { id: true } }),
      prisma.iotDeviceType.findUnique({ where: { id: input.typeId }, select: { id: true } }),
      input.districtId ? prisma.district.findFirst({ where: { id: input.districtId, deletedAt: null }, select: { id: true, provinceId: true } }) : null,
    ]);
    if (duplicate) throw new ApiError("รหัสอุปกรณ์นี้มีอยู่ในระบบแล้ว", 409);
    if (!type) throw new ApiError("ไม่พบชนิดอุปกรณ์ที่เลือก", 422);
    if (input.districtId && !district) throw new ApiError("ไม่พบอำเภอที่เลือก", 422);
    const provinceId = district?.provinceId ?? (await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true }, orderBy: { nameTh: "asc" } }))?.id;
    if (!provinceId) throw new ApiError("ยังไม่พบจังหวัดสำหรับสร้างอุปกรณ์ IoT", 503);

    const device = await prisma.iotDevice.create({ data: { deviceCode: input.deviceCode, nameTh: input.nameTh, status: input.status, typeId: type.id, battery: input.battery ?? null, provinceId, districtId: district?.id ?? null } });
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "iot", entityType: "device", entityId: device.id, afterData: { deviceCode: device.deviceCode, nameTh: device.nameTh, status: device.status } });
    const created = await getIotDetail(device.id);
    return success(created ?? { id: device.id, publicId: device.publicId, deviceCode: device.deviceCode }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
