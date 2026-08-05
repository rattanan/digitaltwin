import { handleApiError, pageParams, parseBody, success } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { agencySchema } from "@/lib/validations/admin";

function serializeAgency(agency: Awaited<ReturnType<typeof listAgencies>>["items"][number]) {
  return { id: agency.id, publicId: agency.publicId, code: agency.code, nameTh: agency.nameTh, nameEn: agency.nameEn, description: agency.description, contactName: agency.contactName, contactPhone: agency.contactPhone, contactEmail: agency.contactEmail, isActive: agency.isActive, userCount: agency._count.users };
}

async function listAgencies(page: number, limit: number, search?: string) {
  const where = { deletedAt: null, ...(search ? { OR: [{ code: { contains: search } }, { nameTh: { contains: search } }, { nameEn: { contains: search } }] } : {}) };
  const [total, items] = await Promise.all([
    prisma.agency.count({ where }),
    prisma.agency.findMany({ where, include: { _count: { select: { users: true } } }, orderBy: { nameTh: "asc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { total, items };
}

export async function GET(request: Request) {
  try {
    await requireApiAuth("agencies.read");
    const { page, limit, search } = pageParams(request);
    const result = await listAgencies(page, limit, search);
    return success(result.items.map(serializeAgency), { page, limit, total: result.total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("agencies.manage");
    const input = await parseBody(request, agencySchema);
    const agency = await prisma.agency.create({ data: { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn || null, description: input.description || null, contactName: input.contactName || null, contactPhone: input.contactPhone || null, contactEmail: input.contactEmail || null, isActive: input.isActive ?? true }, include: { _count: { select: { users: true } } } });
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "agencies", entityType: "agency", entityId: agency.id, afterData: { code: agency.code, nameTh: agency.nameTh } });
    return success(serializeAgency(agency), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
