import { describe, expect, it } from "vitest";
import { DEMO_PROVINCE, demoDashboardSnapshot } from "@/lib/demo-data";
import { PERMISSION_DEFINITIONS, ROLE_CODES } from "@/lib/permissions/constants";

describe("demo foundation data", () => {
  it("keeps the dashboard anchors consistent with the brief", () => {
    expect(DEMO_PROVINCE).toMatchObject({ population: 165225, areaSqKm: 822.5, districts: 6 });
    expect(demoDashboardSnapshot.metrics.pm25.value).toBe(18);
    expect(demoDashboardSnapshot.metrics.rainfall.value).toBe(12.6);
    expect(demoDashboardSnapshot.metrics.waterLevel.value).toBe(12.45);
    expect(demoDashboardSnapshot.metrics.traffic.value).toBe(48);
  });

  it("defines all required system roles and a non-empty permission catalog", () => {
    expect(ROLE_CODES).toContain("SUPER_ADMIN");
    expect(ROLE_CODES).toContain("VIEWER");
    expect(PERMISSION_DEFINITIONS.length).toBeGreaterThan(10);
    expect(PERMISSION_DEFINITIONS.map(([code]) => code)).toContain("users.create");
  });
});
