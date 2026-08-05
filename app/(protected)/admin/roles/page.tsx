import { RoleManagementPanel } from "@/components/admin/management-panels";
import { requirePageAuth } from "@/lib/auth/guards";

export default async function RolesPage() {
  await requirePageAuth("roles.read");
  return <RoleManagementPanel />;
}
