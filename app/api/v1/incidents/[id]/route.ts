import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getIncidentDetail } from "@/lib/operations/queries";
import { INCIDENT_FINAL_STATUSES, INCIDENT_STATUS_LABELS, type IncidentStatus } from "@/lib/operations/types";
import { incidentUpdateSchema } from "@/lib/validations/operations";

type IncidentContext = { params: Promise<{ id: string }> };

async function findIncident(id: string) {
  return prisma.incident.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    select: { id: true, publicId: true, incidentNo: true, title: true, severity: true, status: true, closedAt: true, resolution: true },
  });
}

export async function GET(_request: Request, context: IncidentContext) {
  try {
    await requireApiAuth("incidents.read");
    const { id } = await context.params;
    const incident = await getIncidentDetail(id);
    if (!incident) throw new ApiError("ไม่พบรายการเหตุการณ์", 404);
    return success(incident);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: IncidentContext) {
  try {
    const auth = await requireApiAuth("incidents.manage");
    const { id } = await context.params;
    const existing = await findIncident(id);
    if (!existing) throw new ApiError("ไม่พบรายการเหตุการณ์", 404);
    const input = await parseBody(request, incidentUpdateSchema);
    const nextStatus = input.status as IncidentStatus;
    const now = new Date();
    const updated = await prisma.$transaction(async (transaction) => {
      const incident = await transaction.incident.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          resolution: input.resolution !== undefined ? input.resolution || null : existing.resolution,
          closedAt: INCIDENT_FINAL_STATUSES.includes(nextStatus) ? existing.closedAt ?? now : null,
        },
      });
      await transaction.incidentHistory.create({ data: { incidentId: existing.id, status: nextStatus, note: input.note || null, actorId: auth.user.id, createdAt: now } });
      return incident;
    });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE_STATUS", module: "incidents", entityType: "incident", entityId: existing.id, beforeData: { status: existing.status }, afterData: { status: updated.status, statusLabel: INCIDENT_STATUS_LABELS[nextStatus], note: input.note || null, resolution: updated.resolution } });
    const detail = await getIncidentDetail(existing.id);
    return success(detail ?? { id: updated.id, publicId: updated.publicId, incidentNo: updated.incidentNo, status: updated.status });
  } catch (error) {
    return handleApiError(error);
  }
}
