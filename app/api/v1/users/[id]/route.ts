import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { userUpdateSchema } from "@/lib/validations/admin";

type UserContext = { params: Promise<{ id: string }> };

async function findUser(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, include: { agency: true, userRoles: { include: { role: true } } } });
}

function serializeUser(user: NonNullable<Awaited<ReturnType<typeof findUser>>>) {
  return { id: user.id, publicId: user.publicId, username: user.username, displayName: user.displayName, email: user.email, isActive: user.isActive, lastLoginAt: user.lastLoginAt, agency: user.agency ? { id: user.agency.id, code: user.agency.code, nameTh: user.agency.nameTh } : null, roles: user.userRoles.map(({ role }) => ({ id: role.id, code: role.code, nameTh: role.nameTh })) };
}

export async function GET(_request: Request, context: UserContext) {
  try {
    await requireApiAuth("users.read");
    const { id } = await context.params;
    const user = await findUser(id);
    if (!user) throw new ApiError("ไม่พบผู้ใช้งาน", 404);
    return success(serializeUser(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: UserContext) {
  try {
    const auth = await requireApiAuth("users.update");
    const { id } = await context.params;
    const existing = await findUser(id);
    if (!existing) throw new ApiError("ไม่พบผู้ใช้งาน", 404);
    const input = await parseBody(request, userUpdateSchema);
    if (input.roleIds) {
      const roles = await prisma.role.findMany({ where: { id: { in: input.roleIds }, deletedAt: null } });
      if (roles.length !== input.roleIds.length) throw new ApiError("มีบทบาทที่ไม่พบในระบบ", 422);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: {
        displayName: input.displayName,
        email: input.email || null,
        agencyId: input.agencyId ?? null,
        isActive: input.isActive,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
        ...(input.roleIds ? { userRoles: { deleteMany: {}, create: input.roleIds.map((roleId) => ({ roleId })) } } : {}),
      },
      include: { agency: true, userRoles: { include: { role: true } } },
    });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "users", entityType: "user", entityId: id, beforeData: { displayName: existing.displayName, isActive: existing.isActive }, afterData: { displayName: updated.displayName, isActive: updated.isActive } });
    return success(serializeUser(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: UserContext) {
  try {
    const auth = await requireApiAuth("users.delete");
    const { id } = await context.params;
    if (id === auth.user.id) throw new ApiError("ไม่สามารถลบบัญชีที่กำลังใช้งานได้", 400);
    const existing = await findUser(id);
    if (!existing) throw new ApiError("ไม่พบผู้ใช้งาน", 404);
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "users", entityType: "user", entityId: id, beforeData: { username: existing.username, isActive: existing.isActive } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
