import { describe, expect, it } from "vitest";
import { createDemoCctvDetail, createDemoCctvOverview } from "@/lib/cctv/demo-data";
import { cctvUpdateSchema } from "@/lib/validations/cctv";

describe("CCTV phase 3 data", () => {
  it("keeps the seeded camera status distribution", () => {
    const overview = createDemoCctvOverview();
    expect(overview.items).toHaveLength(20);
    expect(overview.summary).toMatchObject({ total: 20, online: 15, offline: 3, maintenance: 1, degraded: 1 });
    expect(overview.items[0]).toMatchObject({ cameraCode: "CCTV-SB-001", status: "ONLINE" });
  });

  it("supports search, status, district filters and camera detail", () => {
    const filtered = createDemoCctvOverview({ status: "OFFLINE", districtId: "demo-district-1704" });
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0]).toMatchObject({ status: "OFFLINE", district: { nameTh: "พรหมบุรี" } });

    const detail = createDemoCctvDetail("demo-camera-001");
    expect(detail).toMatchObject({ cameraCode: "CCTV-SB-001", aiEvents: [{ eventType: "TRAFFIC_CONGESTION", verification: "VERIFIED" }] });
    expect(detail?.snapshots).toHaveLength(8);
  });

  it("only accepts safe camera metadata updates", () => {
    expect(cctvUpdateSchema.parse({ status: "DEGRADED", latitude: 14.89, longitude: 100.4 })).toMatchObject({ status: "DEGRADED" });
    expect(cctvUpdateSchema.safeParse({ status: "UNKNOWN" }).success).toBe(false);
    expect(cctvUpdateSchema.safeParse({ nfsFolderPath: "/mnt/nas" }).success).toBe(false);
  });
});
