import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { getIotDetail } from "@/lib/iot/queries";
import { iotUpdateSchema } from "@/lib/validations/iot";

type IotContext = { params: Promise<{ id: string }> };

async function findDevice(id: string) {
  return prisma.iotDevice.findFirst({
    where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
    select: { id: true, publicId: true, deviceCode: true, nameTh: true, status: true },
  });
}

export async function GET(_request: Request, context: IotContext) {
  try {
    await requireApiAuth("iot.read");
    const { id } = await context.params;
    const device = await getIotDetail(id);
    if (!device) throw new ApiError("ไม่พบอุปกรณ์ IoT", 404);
    return success(device);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: IotContext) {
  try {
    const auth = await requireApiAuth("iot.manage");
    const { id } = await context.params;
    const existing = await findDevice(id);
    if (!existing) throw new ApiError("ไม่พบอุปกรณ์ IoT", 404);
    const input = await parseBody(request, iotUpdateSchema);
    const device = await prisma.iotDevice.update({
      where: { id: existing.id },
      data: {
        ...(input.nameTh !== undefined ? { nameTh: input.nameTh } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "iot", entityType: "device", entityId: existing.id, beforeData: { deviceCode: existing.deviceCode, nameTh: existing.nameTh, status: existing.status }, afterData: { deviceCode: device.deviceCode, nameTh: device.nameTh, status: device.status } });
    const updated = await getIotDetail(existing.id);
    return success(updated ?? { id: device.id, publicId: device.publicId, deviceCode: device.deviceCode });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IotContext) {
  try {
    const auth = await requireApiAuth("iot.manage");
    const { id } = await context.params;
    const existing = await findDevice(id);
    if (!existing) throw new ApiError("ไม่พบอุปกรณ์ IoT", 404);
    await prisma.iotDevice.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "iot", entityType: "device", entityId: existing.id, beforeData: { deviceCode: existing.deviceCode, nameTh: existing.nameTh, status: existing.status } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
