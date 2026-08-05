import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { CctvClient } from "@/components/cctv/cctv-client";
import { getCctvOverview } from "@/lib/cctv/queries";

export const dynamic = "force-dynamic";

export default async function CctvPage() {
  const auth = await requirePageAuth("cctv.read");
  const overview = await getCctvOverview({ page: 1, limit: 12 });
  return <CctvClient initialData={overview} canManage={hasPermission(auth.user, "cctv.manage")} />;
}
