import { describe, expect, it } from "vitest";
import { retainSelectedId, sameStringFilters } from "@/lib/client/list-detail-state";
import { createDemoCctvDetail, createDemoCctvOverview } from "@/lib/cctv/demo-data";
import { getCctvPreviewImage } from "@/lib/cctv/preview-images";
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

  it("maps the supplied preview images to the first eight cameras", () => {
    expect(getCctvPreviewImage("CCTV-SB-001")).toBe("/images/cctv/cam-001.png");
    expect(getCctvPreviewImage("CAM008")).toBe("/images/cctv/cam-008.png");
    expect(getCctvPreviewImage("CCTV-SB-009")).toMatch(/^\/images\/cctv\/cam-00[1-8]\.png$/);
    expect(getCctvPreviewImage("CCTV-SB-020")).toMatch(/^\/images\/cctv\/cam-00[1-8]\.png$/);
    expect(getCctvPreviewImage("CCTV-SB-009")).toBe(getCctvPreviewImage("CCTV-SB-009"));
  });

  it("only accepts safe camera metadata updates", () => {
    expect(cctvUpdateSchema.parse({ status: "DEGRADED", latitude: 14.89, longitude: 100.4 })).toMatchObject({ status: "DEGRADED" });
    expect(cctvUpdateSchema.safeParse({ status: "UNKNOWN" }).success).toBe(false);
    expect(cctvUpdateSchema.safeParse({ nfsFolderPath: "/mnt/nas" }).success).toBe(false);
  });

  it("keeps a deep-linked camera selected when list data refreshes", () => {
    const deepLinkedCameraId = "54460b36-9ea6-48ab-80ca-106c787157a0";
    const firstPageIds = ["camera-001", "camera-002"];

    expect(retainSelectedId(deepLinkedCameraId, firstPageIds)).toBe(deepLinkedCameraId);
    expect(retainSelectedId(null, firstPageIds)).toBe("camera-001");
  });

  it("does not treat the Strict Mode initial effect replay as a filter change", () => {
    const initialFilters = ["", "ALL", "ALL"];
    expect(sameStringFilters(initialFilters, ["", "ALL", "ALL"])).toBe(true);
    expect(sameStringFilters(initialFilters, ["offline", "ALL", "ALL"])).toBe(false);
  });
});
