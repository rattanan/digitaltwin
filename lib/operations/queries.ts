import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCctvPreviewImage } from "@/lib/cctv/preview-images";
import { createDemoAlertDetail, createDemoAlertOverview, createDemoIncidentDetail, createDemoIncidentOverview } from "@/lib/operations/demo-data";
import { IOT_METRIC_STATE_LABELS, type IotMetricState } from "@/lib/iot/types";
import {
  ALERT_FINAL_STATUSES,
  ALERT_SEVERITY_LABELS,
  ALERT_SOURCE_LABELS,
  ALERT_STATUS_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_FINAL_STATUSES,
  INCIDENT_STATUS_LABELS,
  isAlertSeverity,
  isAlertSource,
  isAlertStatus,
  isIncidentCategory,
  isIncidentStatus,
  type AlertIotMetricEvidence,
  type AlertOverview,
  type AlertSeverity,
  type AlertSource,
  type AlertStatus,
  type IncidentCategory,
  type IncidentOverview,
  type IncidentStatus,
  type OperationReference,
} from "@/lib/operations/types";
import { decimalToNumber } from "@/lib/utils";

export type AlertListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  source?: AlertSource;
  districtId?: string;
};

export type IncidentListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: IncidentStatus;
  severity?: AlertSeverity;
  category?: IncidentCategory;
  districtId?: string;
};

function normalizeAlertSeverity(value: string): AlertSeverity {
  return isAlertSeverity(value) ? value : "INFO";
}

function normalizeAlertStatus(value: string): AlertStatus {
  return isAlertStatus(value) ? value : "NEW";
}

function normalizeAlertSource(value: string): AlertSource {
  return isAlertSource(value) ? value : "MANUAL";
}

function normalizeIncidentCategory(value: string): IncidentCategory {
  return isIncidentCategory(value) ? value : "OTHER";
}

function normalizeIncidentStatus(value: string): IncidentStatus {
  return isIncidentStatus(value) ? value : "DETECTED";
}

function reference(item: { id: string; cameraCode: string; nameTh: string } | { id: string; deviceCode: string; nameTh: string } | null): OperationReference | null {
  if (!item) return null;
  return "cameraCode" in item
    ? { id: item.id, code: item.cameraCode, nameTh: item.nameTh }
    : { id: item.id, code: item.deviceCode, nameTh: item.nameTh };
}

function referenceFromCamera(item: { id: string; cameraCode: string; nameTh: string } | null) {
  return item ? { id: item.id, code: item.cameraCode, nameTh: item.nameTh } : null;
}

function referenceFromDevice(item: { id: string; deviceCode: string; nameTh: string } | null) {
  return item ? { id: item.id, code: item.deviceCode, nameTh: item.nameTh } : null;
}

function metricState(value: number | null, warning: number | null, critical: number | null, severity: AlertSeverity): IotMetricState {
  if (value === null) return "NO_DATA";
  if (critical !== null && value >= critical) return "CRITICAL";
  if (warning !== null && value >= warning) return "WARNING";
  if (severity === "CRITICAL" || severity === "HIGH") return "CRITICAL";
  if (severity === "WARNING") return "WARNING";
  return "NORMAL";
}

function serializeAlertIotMetrics(
  device: {
    metrics: { id: string; metricKey: string; nameTh: string; unit: string | null; warning: unknown; critical: unknown }[];
    latestValues: { metricKey: string; value: unknown; unit: string | null; recordedAt: Date }[];
  },
  severity: AlertSeverity,
): AlertIotMetricEvidence[] {
  const latestByMetric = new Map(device.latestValues.map((latest) => [latest.metricKey, latest]));
  return device.metrics.map((metric) => {
    const latest = latestByMetric.get(metric.metricKey);
    const latestValue = latest ? decimalToNumber(latest.value) : null;
    const warning = metric.warning === null ? null : decimalToNumber(metric.warning);
    const critical = metric.critical === null ? null : decimalToNumber(metric.critical);
    const state = metricState(latestValue, warning, critical, severity);
    return {
      id: metric.id,
      metricKey: metric.metricKey,
      nameTh: metric.nameTh,
      unit: latest?.unit ?? metric.unit,
      warning,
      critical,
      latestValue,
      latestRecordedAt: latest?.recordedAt.toISOString() ?? null,
      state,
      stateLabel: IOT_METRIC_STATE_LABELS[state],
    };
  });
}

function buildAlertWhere(provinceId: string, options: AlertListOptions): Prisma.AlertWhereInput {
  const where: Prisma.AlertWhereInput = { provinceId };
  if (options.status) where.status = options.status;
  if (options.severity) where.severity = options.severity;
  if (options.source) where.source = options.source;
  if (options.districtId) where.districtId = options.districtId;
  const search = options.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { source: { contains: search } },
    ];
  }
  return where;
}

async function findAlertRows(where: Prisma.AlertWhereInput, page: number, limit: number) {
  return prisma.alert.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      source: true,
      severity: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      acknowledgedAt: true,
      resolvedAt: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      camera: { select: { id: true, cameraCode: true, nameTh: true } },
      device: { select: { id: true, deviceCode: true, nameTh: true } },
      _count: { select: { incidents: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

type AlertRow = Awaited<ReturnType<typeof findAlertRows>>[number];

function serializeAlert(row: AlertRow) {
  const source = normalizeAlertSource(row.source);
  const severity = normalizeAlertSeverity(row.severity);
  const status = normalizeAlertStatus(row.status);
  return {
    id: row.id,
    publicId: row.publicId,
    title: row.title,
    description: row.description,
    source,
    sourceLabel: ALERT_SOURCE_LABELS[source],
    severity,
    severityLabel: ALERT_SEVERITY_LABELS[severity],
    status,
    statusLabel: ALERT_STATUS_LABELS[status],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    agencyName: row.agency?.nameTh ?? null,
    locationName: row.location?.nameTh ?? null,
    district: row.district,
    camera: reference(row.camera),
    device: reference(row.device),
    linkedIncidentCount: row._count.incidents,
  };
}

function pageOptions(page?: number, limit?: number) {
  return { page: Math.max(1, page ?? 1), limit: Math.min(100, Math.max(1, limit ?? 50)) };
}

export async function getAlertOverview(options: AlertListOptions = {}): Promise<AlertOverview> {
  const { page, limit } = pageOptions(options.page, options.limit);
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true, code: true, nameTh: true }, orderBy: { nameTh: "asc" } });
    if (!province) return createDemoAlertOverview({ ...options, page, limit });

    const where = buildAlertWhere(province.id, options);
    const overallWhere: Prisma.AlertWhereInput = { provinceId: province.id };
    const [total, rows, open, newCount, critical, high, warning, resolved, districts] = await Promise.all([
      prisma.alert.count({ where }),
      findAlertRows(where, page, limit),
      prisma.alert.count({ where: { ...overallWhere, status: { notIn: ALERT_FINAL_STATUSES } } }),
      prisma.alert.count({ where: { ...overallWhere, status: "NEW" } }),
      prisma.alert.count({ where: { ...overallWhere, severity: "CRITICAL", status: { notIn: ALERT_FINAL_STATUSES } } }),
      prisma.alert.count({ where: { ...overallWhere, severity: "HIGH", status: { notIn: ALERT_FINAL_STATUSES } } }),
      prisma.alert.count({ where: { ...overallWhere, severity: "WARNING", status: { notIn: ALERT_FINAL_STATUSES } } }),
      prisma.alert.count({ where: { ...overallWhere, status: { in: ALERT_FINAL_STATUSES } } }),
      prisma.district.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: { id: true, code: true, nameTh: true, _count: { select: { alerts: { where: overallWhere } } } },
        orderBy: { nameTh: "asc" },
      }),
    ]);

    return {
      province: { code: province.code, nameTh: province.nameTh },
      items: rows.map(serializeAlert),
      summary: { total: await prisma.alert.count({ where: overallWhere }), open, new: newCount, critical, high, warning, resolved },
      districts: districts.map((item) => ({ id: item.id, code: item.code, nameTh: item.nameTh, itemCount: item._count.alerts })),
      pagination: { page, limit, total },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Alert database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoAlertOverview({ ...options, page, limit });
  }
}

async function findAlertDetailRow(id: string, provinceId: string) {
  return prisma.alert.findFirst({
    where: { provinceId, OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      title: true,
      description: true,
      source: true,
      severity: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      acknowledgedAt: true,
      resolvedAt: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      camera: {
        select: {
          id: true,
          cameraCode: true,
          nameTh: true,
          lastImageAt: true,
          snapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { capturedAt: true } },
        },
      },
      device: {
        select: {
          id: true,
          deviceCode: true,
          nameTh: true,
          metrics: { select: { id: true, metricKey: true, nameTh: true, unit: true, warning: true, critical: true }, orderBy: { metricKey: "asc" } },
          latestValues: { select: { metricKey: true, value: true, unit: true, recordedAt: true } },
        },
      },
      histories: { orderBy: { createdAt: "asc" }, select: { id: true, action: true, note: true, actorId: true, createdAt: true } },
      incidents: { orderBy: { createdAt: "desc" }, select: { id: true, incidentNo: true, title: true, status: true, severity: true } },
    },
  });
}

export async function getAlertDetail(id: string) {
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true } });
    if (!province) return createDemoAlertDetail(id);
    const row = await findAlertDetailRow(id, province.id);
    if (!row) return null;
    const source = normalizeAlertSource(row.source);
    const severity = normalizeAlertSeverity(row.severity);
    const status = normalizeAlertStatus(row.status);
    return {
      id: row.id,
      publicId: row.publicId,
      title: row.title,
      description: row.description,
      source,
      sourceLabel: ALERT_SOURCE_LABELS[source],
      severity,
      severityLabel: ALERT_SEVERITY_LABELS[severity],
      status,
      statusLabel: ALERT_STATUS_LABELS[status],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      agencyName: row.agency?.nameTh ?? null,
      locationName: row.location?.nameTh ?? null,
      district: row.district,
      camera: referenceFromCamera(row.camera),
      device: referenceFromDevice(row.device),
      cctvEvidence: source === "CCTV" || source === "CCTV_AI"
        ? row.camera ? {
            camera: referenceFromCamera(row.camera)!,
            imageUrl: getCctvPreviewImage(row.camera.cameraCode),
            capturedAt: row.camera.snapshots[0]?.capturedAt.toISOString() ?? row.camera.lastImageAt?.toISOString() ?? null,
          } : null
        : null,
      iotEvidence: source === "IOT"
        ? row.device ? {
            device: referenceFromDevice(row.device)!,
            metrics: serializeAlertIotMetrics(row.device, severity),
          } : null
        : null,
      linkedIncidentCount: row.incidents.length,
      history: row.histories.map((item) => ({ id: item.id.toString(), state: item.action, stateLabel: item.action === "CREATED" ? "สร้างรายการ" : ALERT_STATUS_LABELS[normalizeAlertStatus(item.action)], note: item.note, actorName: null, createdAt: item.createdAt.toISOString() })),
      incidents: row.incidents.map((item) => {
        const itemStatus = normalizeIncidentStatus(item.status);
        const itemSeverity = normalizeAlertSeverity(item.severity);
        return { id: item.id, incidentNo: item.incidentNo, title: item.title, status: itemStatus, statusLabel: INCIDENT_STATUS_LABELS[itemStatus], severity: itemSeverity, severityLabel: ALERT_SEVERITY_LABELS[itemSeverity] };
      }),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Alert detail query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoAlertDetail(id);
  }
}

function buildIncidentWhere(provinceId: string, options: IncidentListOptions): Prisma.IncidentWhereInput {
  const where: Prisma.IncidentWhereInput = { provinceId };
  if (options.status) where.status = options.status;
  if (options.severity) where.severity = options.severity;
  if (options.category) where.category = options.category;
  if (options.districtId) where.districtId = options.districtId;
  const search = options.search?.trim();
  if (search) {
    where.OR = [
      { incidentNo: { contains: search } },
      { title: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search } },
    ];
  }
  return where;
}

async function findIncidentRows(where: Prisma.IncidentWhereInput, page: number, limit: number) {
  return prisma.incident.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      incidentNo: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      dueAt: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      resolution: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      alert: { select: { id: true, title: true, severity: true, status: true } },
      camera: { select: { id: true, cameraCode: true, nameTh: true } },
      device: { select: { id: true, deviceCode: true, nameTh: true } },
    },
    orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

type IncidentRow = Awaited<ReturnType<typeof findIncidentRows>>[number];

function serializeIncident(row: IncidentRow) {
  const category = normalizeIncidentCategory(row.category);
  const severity = normalizeAlertSeverity(row.severity);
  const status = normalizeIncidentStatus(row.status);
  const isFinal = INCIDENT_FINAL_STATUSES.includes(status);
  const isOverdue = !isFinal && row.dueAt !== null && row.dueAt.getTime() < Date.now();
  return {
    id: row.id,
    publicId: row.publicId,
    incidentNo: row.incidentNo,
    title: row.title,
    description: row.description,
    category,
    categoryLabel: INCIDENT_CATEGORY_LABELS[category],
    severity,
    severityLabel: ALERT_SEVERITY_LABELS[severity],
    status,
    statusLabel: INCIDENT_STATUS_LABELS[status],
    dueAt: row.dueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    resolution: row.resolution,
    isOverdue,
    agencyName: row.agency?.nameTh ?? null,
    locationName: row.location?.nameTh ?? null,
    district: row.district,
    alert: row.alert ? (() => {
      const alertSeverity = normalizeAlertSeverity(row.alert!.severity);
      const alertStatus = normalizeAlertStatus(row.alert!.status);
      return { id: row.alert!.id, title: row.alert!.title, severity: alertSeverity, severityLabel: ALERT_SEVERITY_LABELS[alertSeverity], status: alertStatus, statusLabel: ALERT_STATUS_LABELS[alertStatus] };
    })() : null,
    camera: referenceFromCamera(row.camera),
    device: referenceFromDevice(row.device),
  };
}

export async function getIncidentOverview(options: IncidentListOptions = {}): Promise<IncidentOverview> {
  const { page, limit } = pageOptions(options.page, options.limit);
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true, code: true, nameTh: true }, orderBy: { nameTh: "asc" } });
    if (!province) return createDemoIncidentOverview({ ...options, page, limit });

    const where = buildIncidentWhere(province.id, options);
    const overallWhere: Prisma.IncidentWhereInput = { provinceId: province.id };
    const dueWhere: Prisma.IncidentWhereInput = { ...overallWhere, dueAt: { not: null, lte: new Date() }, status: { notIn: INCIDENT_FINAL_STATUSES } };
    const [total, rows, open, critical, due, resolved, districts] = await Promise.all([
      prisma.incident.count({ where }),
      findIncidentRows(where, page, limit),
      prisma.incident.count({ where: { ...overallWhere, status: { notIn: INCIDENT_FINAL_STATUSES } } }),
      prisma.incident.count({ where: { ...overallWhere, severity: "CRITICAL", status: { notIn: INCIDENT_FINAL_STATUSES } } }),
      prisma.incident.count({ where: dueWhere }),
      prisma.incident.count({ where: { ...overallWhere, status: { in: INCIDENT_FINAL_STATUSES } } }),
      prisma.district.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: { id: true, code: true, nameTh: true, _count: { select: { incidents: { where: overallWhere } } } },
        orderBy: { nameTh: "asc" },
      }),
    ]);
    return {
      province: { code: province.code, nameTh: province.nameTh },
      items: rows.map(serializeIncident),
      summary: { total: await prisma.incident.count({ where: overallWhere }), open, critical, due, resolved },
      districts: districts.map((item) => ({ id: item.id, code: item.code, nameTh: item.nameTh, itemCount: item._count.incidents })),
      pagination: { page, limit, total },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Incident database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoIncidentOverview({ ...options, page, limit });
  }
}

async function findIncidentDetailRow(id: string, provinceId: string) {
  return prisma.incident.findFirst({
    where: { provinceId, OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      incidentNo: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      dueAt: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      resolution: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      alert: { select: { id: true, title: true, severity: true, status: true } },
      camera: { select: { id: true, cameraCode: true, nameTh: true } },
      device: { select: { id: true, deviceCode: true, nameTh: true } },
      histories: { orderBy: { createdAt: "asc" }, select: { id: true, status: true, note: true, actorId: true, createdAt: true } },
    },
  });
}

export async function getIncidentDetail(id: string) {
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true } });
    if (!province) return createDemoIncidentDetail(id);
    const row = await findIncidentDetailRow(id, province.id);
    if (!row) return null;
    const base = serializeIncident({ ...row, alert: row.alert, camera: row.camera, device: row.device } as IncidentRow);
    return {
      ...base,
      history: row.histories.map((item) => {
        const status = normalizeIncidentStatus(item.status);
        return { id: item.id.toString(), state: status, stateLabel: INCIDENT_STATUS_LABELS[status], note: item.note, actorName: null, createdAt: item.createdAt.toISOString() };
      }),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Incident detail query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoIncidentDetail(id);
  }
}

export { ALERT_FINAL_STATUSES, INCIDENT_FINAL_STATUSES };
