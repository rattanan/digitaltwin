import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  return <DashboardClient initialSummary={summary} />;
}
