import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export const userAccessInclude = {
  agency: true,
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export async function findUserWithAccess(where: Prisma.UserWhereUniqueInput) {
  return prisma.user.findUnique({ where, include: userAccessInclude });
}

export type UserWithAccess = NonNullable<Awaited<ReturnType<typeof findUserWithAccess>>>;

export function roleCodes(user: UserWithAccess) {
  return user.userRoles.map(({ role }) => role.code);
}

export function permissionCodes(user: UserWithAccess) {
  return [
    ...new Set(
      user.userRoles.flatMap(({ role }) =>
        role.rolePermissions.map(({ permission }) => permission.code),
      ),
    ),
  ];
}

export function hasPermission(user: UserWithAccess, permission: string) {
  return roleCodes(user).includes("SUPER_ADMIN") || permissionCodes(user).includes(permission);
}

export function isLocked(user: UserWithAccess | { lockedUntil: Date | null }) {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}
