import { AreaManagementPanel } from "@/components/admin/management-panels";
import { requirePageAuth } from "@/lib/auth/guards";

export default async function AreasPage() {
  await requirePageAuth("areas.read");
  return <AreaManagementPanel />;
}
