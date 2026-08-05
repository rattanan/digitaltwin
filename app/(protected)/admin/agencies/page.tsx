import { AgencyManagementPanel } from "@/components/admin/management-panels";
import { requirePageAuth } from "@/lib/auth/guards";

export default async function AgenciesPage() {
  await requirePageAuth("agencies.read");
  return <AgencyManagementPanel />;
}
