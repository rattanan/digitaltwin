import { getCurrentAuthContext } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import { demoDashboardSnapshot } from "@/lib/demo-data";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [context, summary] = await Promise.all([
    getCurrentAuthContext(),
    getDashboardSummary().catch(() => demoDashboardSnapshot),
  ]);
  return <LandingPage summary={summary} isAuthenticated={Boolean(context)} />;
}
