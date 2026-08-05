import { UserManagementPanel } from "@/components/admin/management-panels";
import { requirePageAuth } from "@/lib/auth/guards";

export default async function UsersPage() {
  await requirePageAuth("users.read");
  return <UserManagementPanel />;
}
