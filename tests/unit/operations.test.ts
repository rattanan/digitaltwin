import { describe, expect, it } from "vitest";
import { createDemoAlertDetail, createDemoAlertOverview, createDemoIncidentDetail, createDemoIncidentOverview } from "@/lib/operations/demo-data";
import { ALERT_FINAL_STATUSES, INCIDENT_FINAL_STATUSES } from "@/lib/operations/types";
import { alertUpdateSchema, incidentCreateSchema, incidentUpdateSchema } from "@/lib/validations/operations";

describe("Phase 5 operations data", () => {
  it("keeps the seeded alert and incident volumes", () => {
    const alerts = createDemoAlertOverview({ limit: 100 });
    const incidents = createDemoIncidentOverview({ limit: 100 });
    expect(alerts.items).toHaveLength(25);
    expect(alerts.summary).toMatchObject({ total: 25, open: 19, new: 9, critical: 2 });
    expect(incidents.items).toHaveLength(12);
    expect(incidents.summary).toMatchObject({ total: 12, open: 9, critical: 2, due: 3 });
  });

  it("filters alerts and incidents while preserving linked detail", () => {
    const alerts = createDemoAlertOverview({ status: "NEW", severity: "CRITICAL", limit: 100 });
    expect(alerts.items.every((item) => item.status === "NEW" && item.severity === "CRITICAL")).toBe(true);

    const incidents = createDemoIncidentOverview({ category: "FLOOD", limit: 100 });
    expect(incidents.items).toHaveLength(1);
    const detail = createDemoAlertDetail(incidents.items[0].alert!.id);
    expect(detail?.incidents[0]).toMatchObject({ incidentNo: "INC-SB-0001", status: "IN_PROGRESS" });
    expect(createDemoIncidentDetail("demo-incident-001")?.history).toHaveLength(2);
  });

  it("attaches source-specific evidence to alert details", () => {
    const cctv = createDemoAlertDetail("demo-alert-002");
    expect(cctv).toMatchObject({
      source: "CCTV",
      cctvEvidence: {
        camera: { code: "CCTV-SB-004" },
        imageUrl: "/images/cctv/cam-004.png",
      },
      iotEvidence: {
        device: { code: "WATER-SB-002" },
        metrics: [{ metricKey: "waterLevel", latestValue: 11.91 }],
      },
    });

    const iot = createDemoAlertDetail("demo-alert-001");
    expect(iot).toMatchObject({
      source: "IOT",
      iotEvidence: {
        device: { code: "WATER-SB-001" },
        metrics: [{ metricKey: "waterLevel", latestValue: 12.45 }],
      },
    });
  });

  it("links IoT telemetry to every seeded alert", () => {
    const alerts = createDemoAlertOverview({ limit: 100 });
    const details = alerts.items.map((alert) => createDemoAlertDetail(alert.id));
    expect(details.every((detail) => detail?.device && detail.iotEvidence && detail.iotEvidence.metrics.length > 0)).toBe(true);
  });

  it("exposes final status sets for workflow summaries", () => {
    expect(ALERT_FINAL_STATUSES).toEqual(["RESOLVED", "DISMISSED"]);
    expect(INCIDENT_FINAL_STATUSES).toEqual(["RESOLVED", "CLOSED"]);
  });

  it("accepts controlled status updates and rejects unsafe fields", () => {
    expect(alertUpdateSchema.safeParse({ status: "ACKNOWLEDGED", note: "รับทราบแล้ว" }).success).toBe(true);
    expect(alertUpdateSchema.safeParse({ status: "UNKNOWN" }).success).toBe(false);
    expect(alertUpdateSchema.safeParse({ status: "NEW", imagePath: "/mnt/nas" }).success).toBe(false);
    expect(incidentUpdateSchema.safeParse({ status: "RESOLVED", resolution: "ประสานงานเสร็จแล้ว" }).success).toBe(true);
    expect(incidentUpdateSchema.safeParse({ status: "CLOSED", metadata: {} }).success).toBe(false);
  });

  it("validates incident creation inputs", () => {
    expect(incidentCreateSchema.safeParse({ title: "อุบัติเหตุใหม่", category: "ACCIDENT", severity: "HIGH" }).success).toBe(true);
    expect(incidentCreateSchema.safeParse({ title: "x", category: "OTHER", severity: "INFO", dueAt: "not-a-date" }).success).toBe(false);
  });
});
