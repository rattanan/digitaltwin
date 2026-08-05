import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getAlertDetail } from "@/lib/operations/queries";
import { ALERT_FINAL_STATUSES, ALERT_STATUS_LABELS, type AlertStatus } from "@/lib/operations/types";
import { alertUpdateSchema } from "@/lib/validations/operations";

type AlertContext = { params: Promise<{ id: string }> };

async function findAlert(id: string) {
  return prisma.alert.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    select: { id: true, publicId: true, title: true, severity: true, status: true, acknowledgedAt: true, resolvedAt: true },
  });
}

export async function GET(_request: Request, context: AlertContext) {
  try {
    await requireApiAuth("alerts.read");
    const { id } = await context.params;
    const alert = await getAlertDetail(id);
    if (!alert) throw new ApiError("ไม่พบรายการแจ้งเตือน", 404);
    return success(alert);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: AlertContext) {
  try {
    const auth = await requireApiAuth("alerts.manage");
    const { id } = await context.params;
    const existing = await findAlert(id);
    if (!existing) throw new ApiError("ไม่พบรายการแจ้งเตือน", 404);
    const input = await parseBody(request, alertUpdateSchema);
    const nextStatus = input.status as AlertStatus;
    const now = new Date();
    const updated = await prisma.$transaction(async (transaction) => {
      const alert = await transaction.alert.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          acknowledgedAt: nextStatus === "NEW" ? null : existing.acknowledgedAt ?? now,
          resolvedAt: ALERT_FINAL_STATUSES.includes(nextStatus) ? existing.resolvedAt ?? now : null,
        },
      });
      await transaction.alertHistory.create({ data: { alertId: existing.id, action: nextStatus, note: input.note || null, actorId: auth.user.id, createdAt: now } });
      return alert;
    });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE_STATUS", module: "alerts", entityType: "alert", entityId: existing.id, beforeData: { status: existing.status }, afterData: { status: updated.status, statusLabel: ALERT_STATUS_LABELS[nextStatus], note: input.note || null } });
    const detail = await getAlertDetail(existing.id);
    return success(detail ?? { id: updated.id, publicId: updated.publicId, status: updated.status });
  } catch (error) {
    return handleApiError(error);
  }
}
