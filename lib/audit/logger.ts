import { prisma } from "@/lib/db/prisma";
import { serializeJsonText } from "@/lib/db/legacy-json";

type AuditInput = {
  actorId?: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  beforeData?: unknown;
  afterData?: unknown;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        beforeData: serializeJsonText(input.beforeData),
        afterData: serializeJsonText(input.afterData),
      },
    });
  } catch (error) {
    console.error("Audit log write failed", error);
    if (process.env.NODE_ENV === "production") throw error;
  }
}
