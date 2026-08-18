import { describe, expect, it } from "vitest";
import { createDemoIotDetail, createDemoIotOverview } from "@/lib/iot/demo-data";
import { iotCreateSchema, iotReadingSchema, iotUpdateSchema } from "@/lib/validations/iot";

describe("IoT phase 4 data", () => {
  it("keeps the seeded device and status distribution", () => {
    const overview = createDemoIotOverview();
    expect(overview.items).toHaveLength(40);
    expect(overview.summary).toMatchObject({ total: 40, online: 36, offline: 4, lowBattery: 4, withoutData: 0 });
    expect(overview.types).toHaveLength(7);
    expect(overview.items[0]).toMatchObject({ deviceCode: "WATER-SB-001", status: "ONLINE", battery: 16 });
  });

  it("supports device filters and detail readings", () => {
    const filtered = createDemoIotOverview({ status: "OFFLINE", typeId: "demo-type-health" });
    expect(filtered.items).toHaveLength(4);
    expect(filtered.items.every((device) => device.type.code === "HEALTH")).toBe(true);

    const detail = createDemoIotDetail("demo-device-001");
    expect(detail).toMatchObject({ deviceCode: "WATER-SB-001", metrics: [{ metricKey: "waterLevel", latestValue: 12.45 }] });
    expect(detail?.readings).toHaveLength(24);
  });

  it("validates status updates and idempotent readings", () => {
    expect(iotCreateSchema.parse({ deviceCode: "WATER-SB-041", nameTh: "เซนเซอร์ทดสอบ", typeId: "type-water" })).toMatchObject({ status: "OFFLINE" });
    expect(iotUpdateSchema.parse({ status: "DEGRADED" })).toMatchObject({ status: "DEGRADED" });
    expect(iotUpdateSchema.parse({ battery: 10 })).toMatchObject({ battery: 10 });
    expect(iotUpdateSchema.safeParse({ battery: 101 }).success).toBe(false);
    expect(iotReadingSchema.parse({ deviceId: "WATER-SB-001", metricKey: "waterLevel", value: 12.5, idempotencyKey: "reading-1" })).toMatchObject({ value: 12.5 });
    expect(iotReadingSchema.safeParse({ deviceId: "WATER-SB-001", metricKey: "waterLevel", value: Number.NaN }).success).toBe(false);
  });
});
