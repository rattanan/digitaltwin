import { hasPermission } from "@/lib/auth/access";
import { AppShell } from "@/components/shell/app-shell";
import { requirePageAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const context = await requirePageAuth();
  return <AppShell aiCanRead={hasPermission(context.user, "ai.read")} aiCanUse={hasPermission(context.user, "ai.use")} user={{ displayName: context.user.displayName, username: context.user.username, agency: context.user.agency ? { nameTh: context.user.agency.nameTh } : null, roles: context.user.userRoles.map(({ role }) => ({ code: role.code, nameTh: role.nameTh })) }}>{children}</AppShell>;
}
