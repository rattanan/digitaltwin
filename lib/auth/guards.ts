import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/http";
import { getCurrentAuthContext } from "@/lib/auth/session";
import { hasPermission, type UserWithAccess } from "@/lib/auth/access";

export async function requireApiAuth(permission?: string) {
  const context = await getCurrentAuthContext();
  if (!context) throw new ApiError("กรุณาเข้าสู่ระบบ", 401);
  if (permission && !hasPermission(context.user, permission)) {
    throw new ApiError("คุณไม่มีสิทธิ์ดำเนินการนี้", 403);
  }
  return context;
}

export async function requirePageAuth(permission?: string) {
  const context = await getCurrentAuthContext();
  if (!context) redirect("/login");
  if (permission && !hasPermission(context.user, permission)) redirect("/dashboard?forbidden=1");
  return context;
}

export function publicUser(user: UserWithAccess) {
  return {
    id: user.id,
    publicId: user.publicId,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    agency: user.agency ? { id: user.agency.id, code: user.agency.code, nameTh: user.agency.nameTh } : null,
    roles: user.userRoles.map(({ role }) => ({ code: role.code, nameTh: role.nameTh, nameEn: role.nameEn })),
  };
}
