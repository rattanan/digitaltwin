import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { CCTV_STATUSES, type CctvStatus } from "@/lib/cctv/types";
import { getCctvDetail, getCctvOverview } from "@/lib/cctv/queries";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { cctvCreateSchema } from "@/lib/validations/cctv";

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

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("cctv.manage");
    const input = await parseBody(request, cctvCreateSchema);
    const duplicate = await prisma.cctvCamera.findUnique({ where: { cameraCode: input.cameraCode }, select: { id: true } });
    if (duplicate) throw new ApiError("รหัสกล้องนี้มีอยู่ในระบบแล้ว", 409);

    const district = input.districtId
      ? await prisma.district.findFirst({ where: { id: input.districtId, deletedAt: null }, select: { id: true, provinceId: true } })
      : null;
    if (input.districtId && !district) throw new ApiError("ไม่พบอำเภอที่เลือก", 422);
    const provinceId = district?.provinceId ?? (await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true }, orderBy: { nameTh: "asc" } }))?.id;
    if (!provinceId) throw new ApiError("ยังไม่พบจังหวัดสำหรับสร้างกล้อง CCTV", 503);

    const camera = await prisma.cctvCamera.create({
      data: {
        cameraCode: input.cameraCode,
        nameTh: input.nameTh,
        nameEn: input.nameEn || null,
        status: input.status,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        provinceId,
        districtId: district?.id ?? null,
      },
    });
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "cctv", entityType: "camera", entityId: camera.id, afterData: { cameraCode: camera.cameraCode, nameTh: camera.nameTh, status: camera.status } });
    const created = await getCctvDetail(camera.id);
    return success(created ?? { id: camera.id, publicId: camera.publicId, cameraCode: camera.cameraCode }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
