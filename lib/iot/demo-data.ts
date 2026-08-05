import { DEMO_PROVINCE } from "@/lib/demo-data";
import {
  IOT_METRIC_STATE_LABELS,
  IOT_STATUS_LABELS,
  type IotDetail,
  type IotDeviceSummary,
  type IotMetricState,
  type IotOverview,
  type IotStatus,
} from "@/lib/iot/types";

const DEMO_NOW = "2026-08-05T13:00:00.000Z";

const districtSeeds = [
  ["demo-district-1701", "1701", "เมืองสิงห์บุรี"],
  ["demo-district-1702", "1702", "บางระจัน"],
  ["demo-district-1703", "1703", "ค่ายบางระจัน"],
  ["demo-district-1704", "1704", "พรหมบุรี"],
  ["demo-district-1705", "1705", "ท่าช้าง"],
  ["demo-district-1706", "1706", "อินทร์บุรี"],
] as const;

const typeSeeds = [
  { id: "demo-type-water", code: "WATER", nameTh: "ระดับน้ำ", nameEn: "Water level", prefix: "WATER-SB", unit: "เมตร", metricKey: "waterLevel", metricNameTh: "ระดับน้ำ", values: [12.45, 11.91, 11.98, 12.04, 11.78, 11.86, 12.11, 11.72] },
  { id: "demo-type-rainfall", code: "RAINFALL", nameTh: "ปริมาณฝน", nameEn: "Rainfall", prefix: "RAIN-SB", unit: "มม.", metricKey: "dailyRainfall", metricNameTh: "ฝนสะสม 24 ชั่วโมง", values: [12.6, 10.2, 8.6, 15.4, 7.2, 11.8] },
  { id: "demo-type-air", code: "AIR", nameTh: "คุณภาพอากาศ", nameEn: "Air quality", prefix: "AIR-SB", unit: "µg/m³", metricKey: "pm25", metricNameTh: "PM2.5", values: [18, 21, 24, 16, 19, 23] },
  { id: "demo-type-waste", code: "WASTE", nameTh: "การจัดเก็บขยะ", nameEn: "Waste collection", prefix: "WASTE-SB", unit: "ตัน", metricKey: "collectedWeight", metricNameTh: "น้ำหนักขยะที่จัดเก็บ", values: [56.8, 49.2, 45.1, 51.4, 42.7, 47.5] },
  { id: "demo-type-traffic", code: "TRAFFIC", nameTh: "การจราจร", nameEn: "Traffic", prefix: "TRAFFIC-SB", unit: "กม./ชม.", metricKey: "averageSpeed", metricNameTh: "ความเร็วเฉลี่ย", values: [48, 43, 52, 39, 46, 41] },
  { id: "demo-type-tourism", code: "TOURISM", nameTh: "การท่องเที่ยว", nameEn: "Tourism", prefix: "TOURISM-SB", unit: "คน", metricKey: "visitorCount", metricNameTh: "จำนวนผู้เข้าชม", values: [2350, 1980, 1740, 2210] },
  { id: "demo-type-health", code: "HEALTH", nameTh: "สาธารณสุข", nameEn: "Public health", prefix: "HEALTH-SB", unit: "ราย", metricKey: "emergencyPatientsToday", metricNameTh: "ผู้ป่วยฉุกเฉินวันนี้", values: [312, 28, 29, 30] },
] as const;

type DemoMetric = IotDeviceSummary["metrics"][number];

function hoursAgo(hours: number) {
  return new Date(new Date(DEMO_NOW).getTime() - hours * 60 * 60 * 1000).toISOString();
}

function metricState(value: number | null, warning: number | null, critical: number | null): IotMetricState {
  if (value === null) return "NO_DATA";
  if (critical !== null && value >= critical) return "CRITICAL";
  if (warning !== null && value >= warning) return "WARNING";
  return "NORMAL";
}

function createMetric(deviceId: string, metricKey: string, nameTh: string, unit: string, value: number, warning: number | null = null, critical: number | null = null): DemoMetric {
  const state = metricState(value, warning, critical);
  return {
    id: `demo-metric-${deviceId}-${metricKey}`,
    metricKey,
    nameTh,
    unit,
    warning,
    critical,
    latestValue: value,
    latestRecordedAt: DEMO_NOW,
    state,
    stateLabel: IOT_METRIC_STATE_LABELS[state],
  };
}

function createDetail(index: number): IotDetail {
  const type = typeSeeds.find((item) => {
    const start = typeSeeds.slice(0, typeSeeds.indexOf(item)).reduce((total, current) => total + current.values.length, 0);
    return index >= start && index < start + item.values.length;
  }) ?? typeSeeds[0];
  const typeStart = typeSeeds.slice(0, typeSeeds.indexOf(type)).reduce((total, current) => total + current.values.length, 0);
  const typeIndex = index - typeStart;
  const deviceCode = `${type.prefix}-${String(typeIndex + 1).padStart(3, "0")}`;
  const deviceId = `demo-device-${String(index + 1).padStart(3, "0")}`;
  const status: IotStatus = index >= 36 ? "OFFLINE" : "ONLINE";
  const battery = index % 11 === 0 ? 16 : 82;
  const district = districtSeeds[index % districtSeeds.length];
  const baseValue = type.values[typeIndex];
  const metrics = type.code === "HEALTH" && typeIndex === 0
    ? [
        createMetric(deviceId, "availableBeds", "เตียงว่าง", "เตียง", 312),
        createMetric(deviceId, "emergencyPatientsToday", "ผู้ป่วยฉุกเฉินวันนี้", "ราย", 27),
      ]
    : [createMetric(deviceId, type.metricKey, type.metricNameTh, type.unit, baseValue, type.code === "AIR" ? 37.5 : null, type.code === "AIR" ? 75 : null)];
  const readings = metrics.flatMap((metric, metricIndex) => Array.from({ length: 24 }, (_, hour) => ({
    id: `demo-reading-${deviceId}-${metric.metricKey}-${hour}`,
    metricKey: metric.metricKey,
    value: Number(((metric.latestValue ?? 0) + Math.sin((hour + metricIndex) / 4) * (metric.unit === "µg/m³" ? 2 : metric.unit === "คน" ? 30 : 0.15)).toFixed(3)),
    unit: metric.unit,
    recordedAt: hoursAgo(hour),
  })));
  const summary: IotDeviceSummary = {
    id: deviceId,
    publicId: deviceId,
    deviceCode,
    nameTh: `${type.nameTh} จุดที่ ${typeIndex + 1}`,
    status,
    statusLabel: IOT_STATUS_LABELS[status],
    battery,
    lastHeartbeat: hoursAgo(status === "OFFLINE" ? 2 : 0.1),
    type: { id: type.id, code: type.code, nameTh: type.nameTh, nameEn: type.nameEn },
    agencyName: "สำนักงานป้องกันและบรรเทาสาธารณภัย",
    locationName: null,
    district: { id: district[0], code: district[1], nameTh: district[2] },
    subdistrictName: null,
    metrics,
    readingCount: readings.length,
  };
  return { ...summary, readings };
}

const allDetails = Array.from({ length: typeSeeds.reduce((total, type) => total + type.values.length, 0) }, (_, index) => createDetail(index));
const allDevices = allDetails.map((detail) => {
  const { readings, ...device } = detail;
  void readings;
  return device;
});

function matchesSearch(device: IotDeviceSummary, search?: string) {
  const normalized = search?.trim().toLocaleLowerCase("th-TH");
  if (!normalized) return true;
  return [device.deviceCode, device.nameTh, device.type.nameTh, device.district?.nameTh, device.locationName]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("th-TH").includes(normalized));
}

export function createDemoIotOverview(options: { page?: number; limit?: number; search?: string; status?: IotStatus; typeId?: string; districtId?: string } = {}): IotOverview {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const filtered = allDevices.filter((device) => (
    (!options.status || device.status === options.status)
    && (!options.typeId || device.type.id === options.typeId)
    && (!options.districtId || device.district?.id === options.districtId)
    && matchesSearch(device, options.search)
  ));
  const summary = allDevices.reduce((result, device) => {
    result.total += 1;
    if (device.status === "ONLINE") result.online += 1;
    if (device.status === "OFFLINE") result.offline += 1;
    if (device.status === "MAINTENANCE") result.maintenance += 1;
    if (device.status === "DEGRADED") result.degraded += 1;
    if (device.battery !== null && device.battery <= 20) result.lowBattery += 1;
    if (device.metrics.every((metric) => metric.latestValue === null)) result.withoutData += 1;
    return result;
  }, { total: 0, online: 0, offline: 0, maintenance: 0, degraded: 0, lowBattery: 0, withoutData: 0 });
  return {
    province: { code: DEMO_PROVINCE.code, nameTh: DEMO_PROVINCE.nameTh },
    items: filtered.slice((page - 1) * limit, page * limit),
    summary,
    types: typeSeeds.map((type) => ({ id: type.id, code: type.code, nameTh: type.nameTh, deviceCount: allDevices.filter((device) => device.type.code === type.code).length })),
    districts: districtSeeds.map(([id, code, nameTh]) => ({ id, code, nameTh, deviceCount: allDevices.filter((device) => device.district?.id === id).length })),
    pagination: { page, limit, total: filtered.length },
    freshness: new Date().toISOString(),
    isDemo: true,
  };
}

export function createDemoIotDetail(id: string): IotDetail | null {
  return allDetails.find((device) => device.id === id || device.publicId === id) ?? null;
}

export { allDevices as demoIotDevices };
