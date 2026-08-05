import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createDemoIotDetail, createDemoIotOverview } from "@/lib/iot/demo-data";
import {
  IOT_METRIC_STATE_LABELS,
  IOT_STATUSES,
  IOT_STATUS_LABELS,
  IOT_TYPE_LABELS,
  type IotDeviceSummary,
  type IotDetail,
  type IotMetricState,
  type IotMetricSummary,
  type IotOverview,
  type IotReadingPoint,
  type IotStatus,
} from "@/lib/iot/types";
import { decimalToNumber } from "@/lib/utils";

export type IotListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: IotStatus;
  typeId?: string;
  districtId?: string;
};

function normalizeStatus(value: string): IotStatus {
  return IOT_STATUSES.includes(value as IotStatus) ? value as IotStatus : "DEGRADED";
}

function metricState(value: number | null, warning: number | null, critical: number | null): IotMetricState {
  if (value === null) return "NO_DATA";
  if (critical !== null && value >= critical) return "CRITICAL";
  if (warning !== null && value >= warning) return "WARNING";
  return "NORMAL";
}

function serializeMetric(
  metric: { id: string; metricKey: string; nameTh: string; unit: string | null; warning: unknown; critical: unknown },
  latest: { value: unknown; unit: string | null; recordedAt: Date } | undefined,
): IotMetricSummary {
  const value = latest ? decimalToNumber(latest.value) : null;
  const warning = metric.warning === null ? null : decimalToNumber(metric.warning);
  const critical = metric.critical === null ? null : decimalToNumber(metric.critical);
  const state = metricState(value, warning, critical);
  return {
    id: metric.id,
    metricKey: metric.metricKey,
    nameTh: metric.nameTh,
    unit: latest?.unit ?? metric.unit,
    warning,
    critical,
    latestValue: value,
    latestRecordedAt: latest?.recordedAt.toISOString() ?? null,
    state,
    stateLabel: IOT_METRIC_STATE_LABELS[state],
  };
}

async function findIotRows(where: Prisma.IotDeviceWhereInput, page: number, limit: number) {
  return prisma.iotDevice.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      deviceCode: true,
      nameTh: true,
      status: true,
      battery: true,
      lastHeartbeat: true,
      type: { select: { id: true, code: true, nameTh: true, nameEn: true } },
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, code: true, nameTh: true } },
      subdistrict: { select: { nameTh: true } },
      metrics: { select: { id: true, metricKey: true, nameTh: true, unit: true, warning: true, critical: true }, orderBy: { metricKey: "asc" } },
      latestValues: { select: { metricKey: true, value: true, unit: true, recordedAt: true } },
      _count: { select: { readings: true } },
    },
    orderBy: [{ status: "asc" }, { deviceCode: "asc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

type IotRow = Awaited<ReturnType<typeof findIotRows>>[number];

function serializeDevice(device: IotRow): IotDeviceSummary {
  const status = normalizeStatus(device.status);
  const latestByMetric = new Map(device.latestValues.map((latest) => [latest.metricKey, latest]));
  return {
    id: device.id,
    publicId: device.publicId,
    deviceCode: device.deviceCode,
    nameTh: device.nameTh,
    status,
    statusLabel: IOT_STATUS_LABELS[status],
    battery: device.battery === null ? null : decimalToNumber(device.battery),
    lastHeartbeat: device.lastHeartbeat?.toISOString() ?? null,
    type: device.type,
    agencyName: device.agency?.nameTh ?? null,
    locationName: device.location?.nameTh ?? null,
    district: device.district,
    subdistrictName: device.subdistrict?.nameTh ?? null,
    metrics: device.metrics.map((metric) => serializeMetric(metric, latestByMetric.get(metric.metricKey))),
    readingCount: device._count.readings,
  };
}

function buildWhere(provinceId: string, options: IotListOptions): Prisma.IotDeviceWhereInput {
  const where: Prisma.IotDeviceWhereInput = { provinceId, deletedAt: null };
  if (options.status) where.status = options.status;
  if (options.typeId) where.typeId = options.typeId;
  if (options.districtId) where.districtId = options.districtId;
  const search = options.search?.trim();
  if (search) {
    where.OR = [
      { deviceCode: { contains: search } },
      { nameTh: { contains: search } },
      { type: { nameTh: { contains: search } } },
    ];
  }
  return where;
}

export async function getIotOverview(options: IotListOptions = {}): Promise<IotOverview> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null }, select: { id: true, code: true, nameTh: true }, orderBy: { nameTh: "asc" } });
    if (!province) return createDemoIotOverview({ ...options, page, limit });

    const where = buildWhere(province.id, options);
    const overallWhere: Prisma.IotDeviceWhereInput = { provinceId: province.id, deletedAt: null };
    const [filteredTotal, items, total, online, offline, maintenance, degraded, lowBattery, withoutData, types, districts] = await Promise.all([
      prisma.iotDevice.count({ where }),
      findIotRows(where, page, limit),
      prisma.iotDevice.count({ where: overallWhere }),
      prisma.iotDevice.count({ where: { ...overallWhere, status: "ONLINE" } }),
      prisma.iotDevice.count({ where: { ...overallWhere, status: "OFFLINE" } }),
      prisma.iotDevice.count({ where: { ...overallWhere, status: "MAINTENANCE" } }),
      prisma.iotDevice.count({ where: { ...overallWhere, status: "DEGRADED" } }),
      prisma.iotDevice.count({ where: { ...overallWhere, battery: { lte: 20 } } }),
      prisma.iotDevice.count({ where: { ...overallWhere, latestValues: { none: {} } } }),
      prisma.iotDeviceType.findMany({
        select: { id: true, code: true, nameTh: true, _count: { select: { devices: { where: { provinceId: province.id, deletedAt: null } } } } },
        orderBy: { nameTh: "asc" },
      }),
      prisma.district.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: { id: true, code: true, nameTh: true, _count: { select: { iotDevices: { where: { deletedAt: null } } } } },
        orderBy: { nameTh: "asc" },
      }),
    ]);
    return {
      province: { code: province.code, nameTh: province.nameTh },
      items: items.map(serializeDevice),
      summary: { total, online, offline, maintenance, degraded, lowBattery, withoutData },
      types: types.map((type) => ({ id: type.id, code: type.code, nameTh: IOT_TYPE_LABELS[type.code] ?? type.nameTh, deviceCount: type._count.devices })),
      districts: districts.map((district) => ({ id: district.id, code: district.code, nameTh: district.nameTh, deviceCount: district._count.iotDevices })),
      pagination: { page, limit, total: filteredTotal },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("IoT database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoIotOverview({ ...options, page, limit });
  }
}

async function findIotDetailRow(id: string) {
  return prisma.iotDevice.findFirst({
    where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      deviceCode: true,
      nameTh: true,
      status: true,
      battery: true,
      lastHeartbeat: true,
      type: { select: { id: true, code: true, nameTh: true, nameEn: true } },
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, code: true, nameTh: true } },
      subdistrict: { select: { nameTh: true } },
      metrics: { select: { id: true, metricKey: true, nameTh: true, unit: true, warning: true, critical: true }, orderBy: { metricKey: "asc" } },
      latestValues: { select: { metricKey: true, value: true, unit: true, recordedAt: true } },
      readings: { orderBy: { recordedAt: "desc" }, take: 96, select: { id: true, metricKey: true, value: true, unit: true, recordedAt: true } },
      _count: { select: { readings: true } },
    },
  });
}

type IotDetailRow = NonNullable<Awaited<ReturnType<typeof findIotDetailRow>>>;

function serializeReading(reading: { id: bigint; metricKey: string; value: unknown; unit: string | null; recordedAt: Date }): IotReadingPoint {
  return { id: reading.id.toString(), metricKey: reading.metricKey, value: decimalToNumber(reading.value), unit: reading.unit, recordedAt: reading.recordedAt.toISOString() };
}

export async function getIotDetail(id: string): Promise<IotDetail | null> {
  try {
    const device = await findIotDetailRow(id);
    if (!device) return null;
    return { ...serializeDevice(device), readings: device.readings.map(serializeReading) };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("IoT detail query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoIotDetail(id);
  }
}

export type { IotDetailRow };
