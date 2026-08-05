import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import { getMapSnapshot } from "@/lib/map/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await requirePageAuth("dashboard.read");
  const [summary, mapSnapshot] = await Promise.all([
    getDashboardSummary(),
    getMapSnapshot({
      includeCameras: hasPermission(auth.user, "cctv.read"),
      includeIot: hasPermission(auth.user, "iot.read"),
      includeAlerts: hasPermission(auth.user, "alerts.read"),
      includeIncidents: hasPermission(auth.user, "incidents.read"),
    }),
  ]);
  return <DashboardClient initialSummary={summary} initialMapSnapshot={mapSnapshot} />;
}
