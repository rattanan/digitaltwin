import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { IotClient } from "@/components/iot/iot-client";
import { getIotOverview } from "@/lib/iot/queries";

export const dynamic = "force-dynamic";

export default async function IotPage({ searchParams }: { searchParams: Promise<{ device?: string }> }) {
  const auth = await requirePageAuth("iot.read");
  const params = await searchParams;
  const overview = await getIotOverview({ page: 1, limit: 12 });
  return <IotClient initialData={overview} canManage={hasPermission(auth.user, "iot.manage")} initialSelectedId={params.device ?? null} />;
}
