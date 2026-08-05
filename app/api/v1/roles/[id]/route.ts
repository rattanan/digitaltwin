import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { roleUpdateSchema } from "@/lib/validations/admin";

type RoleContext = { params: Promise<{ id: string }> };

async function findRole(id: string) {
  return prisma.role.findFirst({ where: { id, deletedAt: null }, include: { rolePermissions: { include: { permission: true } } } });
}

function serializeRole(role: NonNullable<Awaited<ReturnType<typeof findRole>>>) {
  return { id: role.id, publicId: role.publicId, code: role.code, nameTh: role.nameTh, nameEn: role.nameEn, description: role.description, isSystem: role.isSystem, permissions: role.rolePermissions.map(({ permission }) => ({ id: permission.id, code: permission.code, nameTh: permission.nameTh })) };
}

export async function GET(_request: Request, context: RoleContext) {
  try {
    await requireApiAuth("roles.read");
    const { id } = await context.params;
    const role = await findRole(id);
    if (!role) throw new ApiError("ไม่พบบทบาท", 404);
    return success(serializeRole(role));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RoleContext) {
  try {
    const auth = await requireApiAuth("roles.manage");
    const { id } = await context.params;
    const existing = await findRole(id);
    if (!existing) throw new ApiError("ไม่พบบทบาท", 404);
    const input = await parseBody(request, roleUpdateSchema);
    if (existing.isSystem && input.code && input.code !== existing.code) throw new ApiError("ไม่สามารถเปลี่ยนรหัสบทบาทระบบ", 400);
    if (input.permissionIds) {
      const count = await prisma.permission.count({ where: { id: { in: input.permissionIds } } });
      if (count !== input.permissionIds.length) throw new ApiError("มีสิทธิ์ที่ไม่พบในระบบ", 422);
    }
    const role = await prisma.role.update({ where: { id }, data: { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn, description: input.description, ...(input.permissionIds ? { rolePermissions: { deleteMany: {}, create: input.permissionIds.map((permissionId) => ({ permissionId })) } } : {}) }, include: { rolePermissions: { include: { permission: true } } } });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "roles", entityType: "role", entityId: id, beforeData: { code: existing.code }, afterData: { code: role.code } });
    return success(serializeRole(role));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RoleContext) {
  try {
    const auth = await requireApiAuth("roles.manage");
    const { id } = await context.params;
    const existing = await findRole(id);
    if (!existing) throw new ApiError("ไม่พบบทบาท", 404);
    if (existing.isSystem) throw new ApiError("ไม่สามารถลบบทบาทระบบได้", 400);
    await prisma.role.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "roles", entityType: "role", entityId: id, beforeData: { code: existing.code } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
