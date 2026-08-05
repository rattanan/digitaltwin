import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { agencySchema } from "@/lib/validations/admin";

type AgencyContext = { params: Promise<{ id: string }> };

async function findAgency(id: string) {
  return prisma.agency.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { users: true } } } });
}

function serializeAgency(agency: NonNullable<Awaited<ReturnType<typeof findAgency>>>) {
  return { id: agency.id, publicId: agency.publicId, code: agency.code, nameTh: agency.nameTh, nameEn: agency.nameEn, description: agency.description, contactName: agency.contactName, contactPhone: agency.contactPhone, contactEmail: agency.contactEmail, isActive: agency.isActive, userCount: agency._count.users };
}

export async function GET(_request: Request, context: AgencyContext) {
  try {
    await requireApiAuth("agencies.read");
    const { id } = await context.params;
    const agency = await findAgency(id);
    if (!agency) throw new ApiError("ไม่พบหน่วยงาน", 404);
    return success(serializeAgency(agency));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: AgencyContext) {
  try {
    const auth = await requireApiAuth("agencies.manage");
    const { id } = await context.params;
    const existing = await findAgency(id);
    if (!existing) throw new ApiError("ไม่พบหน่วยงาน", 404);
    const input = await parseBody(request, agencySchema.partial());
    const agency = await prisma.agency.update({ where: { id }, data: { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn, description: input.description, contactName: input.contactName, contactPhone: input.contactPhone, contactEmail: input.contactEmail, isActive: input.isActive }, include: { _count: { select: { users: true } } } });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "agencies", entityType: "agency", entityId: id, beforeData: { code: existing.code, nameTh: existing.nameTh }, afterData: { code: agency.code, nameTh: agency.nameTh } });
    return success(serializeAgency(agency));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: AgencyContext) {
  try {
    const auth = await requireApiAuth("agencies.manage");
    const { id } = await context.params;
    const existing = await findAgency(id);
    if (!existing) throw new ApiError("ไม่พบหน่วยงาน", 404);
    await prisma.agency.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "agencies", entityType: "agency", entityId: id, beforeData: { code: existing.code, nameTh: existing.nameTh } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
