import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { userCreateSchema } from "@/lib/validations/admin";

function serializeUser(user: Awaited<ReturnType<typeof listUsers>>["items"][number]) {
  return {
    id: user.id,
    publicId: user.publicId,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    agency: user.agency ? { id: user.agency.id, code: user.agency.code, nameTh: user.agency.nameTh } : null,
    roles: user.userRoles.map(({ role }) => ({ id: role.id, code: role.code, nameTh: role.nameTh })),
  };
}

async function listUsers(page: number, limit: number, search?: string) {
  const where = {
    deletedAt: null,
    ...(search
      ? { OR: [{ username: { contains: search } }, { displayName: { contains: search } }, { email: { contains: search } }] }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { agency: true, userRoles: { include: { role: true } } },
      orderBy: { displayName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { total, items: users };
}

export async function GET(request: Request) {
  try {
    await requireApiAuth("users.read");
    const { page, limit, search } = pageParams(request);
    const result = await listUsers(page, limit, search);
    return success(result.items.map(serializeUser), { page, limit, total: result.total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireApiAuth("users.create");
    const input = await parseBody(request, userCreateSchema);
    const roles = await prisma.role.findMany({ where: { id: { in: input.roleIds }, deletedAt: null } });
    if (roles.length !== input.roleIds.length) throw new ApiError("มีบทบาทที่ไม่พบในระบบ", 422);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        email: input.email || null,
        passwordHash: await hashPassword(input.password),
        agencyId: input.agencyId ?? null,
        userRoles: { create: input.roleIds.map((roleId) => ({ roleId })) },
      },
      include: { agency: true, userRoles: { include: { role: true } } },
    });
    await writeAuditLog({ actorId: context.user.id, action: "CREATE", module: "users", entityType: "user", entityId: user.id, afterData: { username: user.username, roles: input.roleIds } });
    return success(serializeUser(user), undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
