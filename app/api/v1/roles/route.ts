import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { roleCreateSchema } from "@/lib/validations/admin";

function serializeRole(role: Awaited<ReturnType<typeof listRoles>>["items"][number]) {
  return { id: role.id, publicId: role.publicId, code: role.code, nameTh: role.nameTh, nameEn: role.nameEn, description: role.description, isSystem: role.isSystem, permissions: role.rolePermissions.map(({ permission }) => ({ id: permission.id, code: permission.code, nameTh: permission.nameTh })) };
}

async function listRoles(page: number, limit: number, search?: string) {
  const where = { deletedAt: null, ...(search ? { OR: [{ code: { contains: search } }, { nameTh: { contains: search } }, { nameEn: { contains: search } }] } : {}) };
  const [total, items, permissions] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({ where, include: { rolePermissions: { include: { permission: true } } }, orderBy: { code: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] }),
  ]);
  return { total, items, permissions };
}

async function validatePermissionIds(permissionIds: string[]) {
  const count = await prisma.permission.count({ where: { id: { in: permissionIds } } });
  if (count !== permissionIds.length) throw new ApiError("มีสิทธิ์ที่ไม่พบในระบบ", 422);
}

export async function GET(request: Request) {
  try {
    await requireApiAuth("roles.read");
    const { page, limit, search } = pageParams(request);
    const result = await listRoles(page, limit, search);
    return success({ items: result.items.map(serializeRole), permissions: result.permissions }, { page, limit, total: result.total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("roles.manage");
    const input = await parseBody(request, roleCreateSchema);
    await validatePermissionIds(input.permissionIds);
    const role = await prisma.role.create({ data: { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn, description: input.description || null, rolePermissions: { create: input.permissionIds.map((permissionId) => ({ permissionId })) } }, include: { rolePermissions: { include: { permission: true } } } });
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "roles", entityType: "role", entityId: role.id, afterData: { code: role.code } });
    return success(serializeRole(role), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
