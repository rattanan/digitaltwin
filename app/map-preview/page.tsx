import { MapClient } from "@/components/map/map-client";
import { createDemoMapSnapshot } from "@/lib/map/demo-data";

export default function MapPreviewPage() {
  return <MapClient snapshot={createDemoMapSnapshot(true)} />;
}
