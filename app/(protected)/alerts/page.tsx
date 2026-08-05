import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { AlertCenterClient } from "@/components/operations/alert-center-client";
import { getAlertOverview } from "@/lib/operations/queries";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const auth = await requirePageAuth("alerts.read");
  const overview = await getAlertOverview({ limit: 100 });
  return <AlertCenterClient initialData={overview} canManage={hasPermission(auth.user, "alerts.manage")} />;
}
