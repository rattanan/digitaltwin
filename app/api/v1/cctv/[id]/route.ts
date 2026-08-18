import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { cctvUpdateSchema } from "@/lib/validations/cctv";
import { getCctvDetail } from "@/lib/cctv/queries";
import { isGoogleDriveFolderUrl } from "@/lib/cctv/google-drive";

type CctvContext = { params: Promise<{ id: string }> };

async function findCamera(id: string) {
  return prisma.cctvCamera.findFirst({
    where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
    select: { id: true, publicId: true, cameraCode: true, nameTh: true, nameEn: true, status: true, latitude: true, longitude: true, nfsFolderPath: true },
  });
}

export async function GET(_request: Request, context: CctvContext) {
  try {
    await requireApiAuth("cctv.read");
    const { id } = await context.params;
    const camera = await getCctvDetail(id);
    if (!camera) throw new ApiError("ไม่พบกล้อง CCTV", 404);
    return success(camera);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: CctvContext) {
  try {
    const auth = await requireApiAuth("cctv.manage");
    const { id } = await context.params;
    const existing = await findCamera(id);
    if (!existing) throw new ApiError("ไม่พบกล้อง CCTV", 404);
    const input = await parseBody(request, cctvUpdateSchema);
    const district = input.districtId
      ? await prisma.district.findFirst({ where: { id: input.districtId, deletedAt: null }, select: { id: true, provinceId: true } })
      : null;
    if (input.districtId && !district) throw new ApiError("ไม่พบอำเภอที่เลือก", 422);
    const camera = await prisma.cctvCamera.update({
      where: { id: existing.id },
      data: {
        ...(input.nameTh !== undefined ? { nameTh: input.nameTh } : {}),
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        ...(input.districtId !== undefined ? { districtId: district?.id ?? null, ...(district ? { provinceId: district.provinceId } : {}) } : {}),
        ...(input.googleDriveFolderUrl
          ? { nfsFolderPath: input.googleDriveFolderUrl }
          : input.googleDriveFolderUrl === "" && isGoogleDriveFolderUrl(existing.nfsFolderPath)
            ? { nfsFolderPath: null }
            : {}),
      },
    });
    await writeAuditLog({
      actorId: auth.user.id,
      action: "UPDATE",
      module: "cctv",
      entityType: "camera",
      entityId: existing.id,
      beforeData: { cameraCode: existing.cameraCode, nameTh: existing.nameTh, status: existing.status },
      afterData: { cameraCode: camera.cameraCode, nameTh: camera.nameTh, status: camera.status },
    });
    const updated = await getCctvDetail(existing.id);
    return success(updated ?? { id: camera.id, publicId: camera.publicId, cameraCode: camera.cameraCode });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: CctvContext) {
  try {
    const auth = await requireApiAuth("cctv.manage");
    const { id } = await context.params;
    const existing = await findCamera(id);
    if (!existing) throw new ApiError("ไม่พบกล้อง CCTV", 404);
    await prisma.cctvCamera.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "cctv", entityType: "camera", entityId: existing.id, beforeData: { cameraCode: existing.cameraCode, nameTh: existing.nameTh, status: existing.status } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
