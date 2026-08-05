import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { getMapSnapshot } from "@/lib/map/queries";
import { MapClient } from "@/components/map/map-client";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ feature?: string }> }) {
  const auth = await requirePageAuth("areas.read");
  const params = await searchParams;
  const snapshot = await getMapSnapshot({ includeCameras: hasPermission(auth.user, "cctv.read") });
  return <MapClient snapshot={snapshot} initialFeatureId={params.feature ?? null} />;
}
