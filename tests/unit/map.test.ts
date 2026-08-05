import { describe, expect, it } from "vitest";
import { createDemoMapSnapshot } from "@/lib/map/demo-data";

describe("map foundation data", () => {
  it("returns the administrative and important-location layers", () => {
    const snapshot = createDemoMapSnapshot();
    expect(snapshot.province).toMatchObject({ code: "17", nameTh: "สิงห์บุรี" });
    expect(snapshot.areas).toHaveLength(49);
    expect(snapshot.markers).toHaveLength(10);
    expect(snapshot.counts).toMatchObject({ districts: 6, subdistricts: 43, locations: 10, cameras: 0 });
    expect(snapshot.markers.find((marker) => marker.category === "RISK_AREA")).toMatchObject({ status: "WARNING", statusLabel: "เฝ้าระวัง" });
  });

  it("keeps the camera layer permission-aware", () => {
    const snapshot = createDemoMapSnapshot(true);
    expect(snapshot.capabilities.cameras).toBe(true);
    expect(snapshot.counts.cameras).toBe(20);
    expect(snapshot.markers.filter((marker) => marker.kind === "CAMERA")).toHaveLength(20);
  });
});
