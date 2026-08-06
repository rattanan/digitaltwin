import { describe, expect, it } from "vitest";
import { createDemoMapSnapshot } from "@/lib/map/demo-data";
import { pointInBoundaryGeometry } from "@/lib/map/geometry";
import { createSpiderfyPoints } from "@/lib/map/spiderfy";

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

  it("builds operational command markers with deep-link destinations", () => {
    const snapshot = createDemoMapSnapshot(true, { iot: true, alerts: true, incidents: true });
    expect(new Set(snapshot.commandFeatures.map((feature) => feature.kind))).toEqual(new Set(["LOCATION", "IOT", "CCTV", "ALERT", "INCIDENT"]));
    expect(snapshot.commandFeatures.find((feature) => feature.kind === "IOT")).toMatchObject({
      destinationHref: expect.stringMatching(/^\/iot\?device=/),
      metrics: [expect.objectContaining({ label: expect.any(String), value: expect.any(Number) })],
    });
    expect(snapshot.commandFeatures.find((feature) => feature.kind === "CCTV")).toMatchObject({
      destinationHref: expect.stringMatching(/^\/cctv\?camera=/),
      previewImageUrl: expect.stringMatching(/^\/images\/cctv\/cam-00[1-8]\.png$/),
    });
    expect(snapshot.commandFeatures.find((feature) => feature.kind === "ALERT")?.destinationHref).toMatch(/^\/alerts\?alert=/);
    expect(snapshot.commandFeatures.find((feature) => feature.kind === "INCIDENT")?.destinationHref).toMatch(/^\/incidents\?incident=/);
    expect(snapshot.boundary).toMatchObject({ url: "/data/sing-buri-districts.v1.geojson", version: "v1-2019" });
  });

  it("does not expose command layers that are outside the supplied capabilities", () => {
    const snapshot = createDemoMapSnapshot(false, { iot: true, alerts: false, incidents: false });
    expect(snapshot.capabilities).toMatchObject({ cameras: false, iot: true, alerts: false, incidents: false });
    expect(snapshot.counts).toMatchObject({ cameras: 0, iot: 3, alerts: 0, incidents: 0 });
    expect(snapshot.commandFeatures.some((feature) => feature.kind === "CCTV" || feature.kind === "ALERT" || feature.kind === "INCIDENT")).toBe(false);
  });

  it("spreads overlapping terminal markers into selectable positions", () => {
    const points = createSpiderfyPoints({ count: 12, anchorX: 400, anchorY: 300, viewportWidth: 800, viewportHeight: 600 });
    expect(points).toHaveLength(12);
    expect(new Set(points.map((point) => `${point.x.toFixed(2)}:${point.y.toFixed(2)}`))).toHaveLength(12);
    expect(points.every((point) => point.x >= 52 && point.x <= 748 && point.y >= 52 && point.y <= 548)).toBe(true);
  });

  it("keeps spiderfied markers inside the viewport near an edge", () => {
    const points = createSpiderfyPoints({ count: 8, anchorX: 4, anchorY: 4, viewportWidth: 360, viewportHeight: 560 });
    expect(points.every((point) => point.x >= 52 && point.x <= 308 && point.y >= 52 && point.y <= 508)).toBe(true);
  });

  it("selects markers by their actual coordinates inside a district boundary", () => {
    const geometry = {
      type: "Polygon" as const,
      coordinates: [[[100, 14], [101, 14], [101, 15], [100, 15], [100, 14]]],
    };

    expect(pointInBoundaryGeometry([100.5, 14.5], geometry)).toBe(true);
    expect(pointInBoundaryGeometry([101.5, 14.5], geometry)).toBe(false);
  });

  it("supports district multipolygons and excludes polygon holes", () => {
    const geometry = {
      type: "MultiPolygon" as const,
      coordinates: [
        [
          [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
          [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
        ],
        [[[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]]],
      ],
    };

    expect(pointInBoundaryGeometry([3, 3], geometry)).toBe(true);
    expect(pointInBoundaryGeometry([1.5, 1.5], geometry)).toBe(false);
    expect(pointInBoundaryGeometry([11, 11], geometry)).toBe(true);
  });
});
