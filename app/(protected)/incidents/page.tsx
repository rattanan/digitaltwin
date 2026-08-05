import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { IncidentCenterClient } from "@/components/operations/incident-center-client";
import { getIncidentOverview } from "@/lib/operations/queries";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const auth = await requirePageAuth("incidents.read");
  const overview = await getIncidentOverview({ limit: 100 });
  return <IncidentCenterClient initialData={overview} canManage={hasPermission(auth.user, "incidents.manage")} />;
}
