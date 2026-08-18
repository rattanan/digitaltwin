import { randomUUID } from "node:crypto";
import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requestMetadata } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireIotIngestAuth } from "@/lib/iot/ingest-auth";
import { iotReadingSchema } from "@/lib/validations/iot";
import { decimalToNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const auth = await requireIotIngestAuth(request);
    const input = await parseBody(request, iotReadingSchema);
    const device = await prisma.iotDevice.findFirst({ where: { deletedAt: null, OR: [{ id: input.deviceId }, { publicId: input.deviceId }, { deviceCode: input.deviceId }] }, include: { metrics: true, latestValues: true } });
    if (!device) throw new ApiError("ไม่พบอุปกรณ์ IoT", 404);
    const metric = device.metrics.find((item) => item.metricKey === input.metricKey);
    if (!metric) throw new ApiError("ไม่พบ metric ของอุปกรณ์นี้", 422);
    const recordedAt = input.recordedAt ?? new Date();
    const idempotencyKey = input.idempotencyKey || null;
    if (idempotencyKey) {
      const existing = await prisma.iotReading.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.deviceId !== device.id || existing.metricKey !== metric.metricKey) {
          throw new ApiError("idempotencyKey นี้ถูกใช้กับข้อมูลรายการอื่นแล้ว", 409);
        }
        return success({ id: existing.id.toString(), deviceId: existing.deviceId, metricKey: existing.metricKey, value: decimalToNumber(existing.value), unit: existing.unit, recordedAt: existing.recordedAt.toISOString(), duplicate: true });
      }
    }
    const reading = await prisma.$transaction(async (transaction) => {
      const created = await transaction.iotReading.create({ data: { deviceId: device.id, metricId: metric.id, metricKey: metric.metricKey, value: input.value, unit: input.unit || metric.unit, recordedAt, idempotencyKey } });
      const latest = device.latestValues.find((item) => item.metricKey === metric.metricKey);
      if (!latest || latest.recordedAt <= recordedAt) {
        await transaction.iotLatestValue.upsert({ where: { deviceId_metricKey: { deviceId: device.id, metricKey: metric.metricKey } }, update: { value: input.value, unit: input.unit || metric.unit, recordedAt }, create: { id: randomUUID(), deviceId: device.id, metricKey: metric.metricKey, value: input.value, unit: input.unit || metric.unit, recordedAt } });
      }
      await transaction.iotDevice.update({ where: { id: device.id }, data: { ...(!device.lastHeartbeat || device.lastHeartbeat <= recordedAt ? { lastHeartbeat: recordedAt } : {}), ...(device.status === "OFFLINE" ? { status: "ONLINE" } : {}) } });
      return created;
    });
    const metadata = requestMetadata(request);
    await writeAuditLog({ actorId: auth.actorId, action: "CREATE", module: "iot", entityType: "reading", entityId: reading.id.toString(), ipAddress: metadata.ipAddress, userAgent: metadata.userAgent, afterData: { authMethod: auth.method, deviceCode: device.deviceCode, metricKey: metric.metricKey, value: input.value, recordedAt } });
    return success({ id: reading.id.toString(), deviceId: device.id, metricKey: reading.metricKey, value: decimalToNumber(reading.value), unit: reading.unit, recordedAt: reading.recordedAt.toISOString(), duplicate: false }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
