import { prisma } from "@/lib/db/prisma";
import { getCctvPreviewImage } from "@/lib/cctv/preview-images";
import { createDemoMapSnapshot } from "@/lib/map/demo-data";
import type { CommandMapFeature, CommandMapMetric, MapArea, MapMarker, MapMarkerStatus, MapSnapshot } from "@/lib/map/types";
import { decimalToNumber } from "@/lib/utils";

type MapQueryOptions = {
  includeCameras?: boolean;
  includeIot?: boolean;
  includeAlerts?: boolean;
  includeIncidents?: boolean;
};

const boundary = {
  url: "/data/sing-buri-districts.v1.geojson",
  version: "v1-2019",
  attribution: "geoBoundaries · Royal Thai Survey Department · OCHA ROAP (CC BY 3.0 IGO)",
};
const singBuriBoundaryBounds: [number, number, number, number] = [100.182456714, 14.721096421, 100.488093388, 15.120522984];

const categoryLabels: Record<string, string> = {
  GOVERNMENT: "หน่วยงานรัฐ",
  HOSPITAL: "สาธารณสุข",
  POLICE: "ความปลอดภัย",
  TRANSPORT: "การเดินทาง",
  TOURISM: "ท่องเที่ยว",
  MARKET: "เศรษฐกิจ",
  PUBLIC_SPACE: "พื้นที่สาธารณะ",
  RISK_AREA: "พื้นที่เสี่ยง",
  SHELTER: "ศูนย์อพยพ",
  CCTV: "กล้องวงจรปิด",
};

const cameraStatusMap: Record<string, { status: MapMarkerStatus; label: string }> = {
  ONLINE: { status: "NORMAL", label: "ออนไลน์" },
  OFFLINE: { status: "OFFLINE", label: "ออฟไลน์" },
  MAINTENANCE: { status: "MAINTENANCE", label: "ซ่อมบำรุง" },
  DEGRADED: { status: "DEGRADED", label: "คุณภาพลดลง" },
};

function coordinate(latitude: unknown, longitude: unknown) {
  const lat = decimalToNumber(latitude);
  const lng = decimalToNumber(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function getBounds(points: { latitude: number; longitude: number }[]) {
  if (points.length === 0) return null;
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)] as [number, number, number, number];
}

function operationalStatus(severity: string): MapMarkerStatus {
  if (severity === "CRITICAL" || severity === "HIGH") return "CRITICAL";
  if (severity === "WARNING") return "WARNING";
  return "NORMAL";
}

function deviceStatus(status: string, metrics: CommandMapMetric[]): MapMarkerStatus {
  if (metrics.some((metric) => metric.state === "CRITICAL")) return "CRITICAL";
  if (status === "OFFLINE") return "OFFLINE";
  if (status === "MAINTENANCE") return "MAINTENANCE";
  if (status === "DEGRADED" || metrics.some((metric) => metric.state === "WARNING")) return "WARNING";
  return "NORMAL";
}

function pointFromRelations(value: {
  location?: { latitude: unknown; longitude: unknown } | null;
  camera?: { latitude: unknown; longitude: unknown } | null;
  device?: { location?: { latitude: unknown; longitude: unknown } | null } | null;
  district?: { latitude: unknown; longitude: unknown } | null;
}) {
  return value.location
    ? coordinate(value.location.latitude, value.location.longitude)
    : value.camera
      ? coordinate(value.camera.latitude, value.camera.longitude)
      : value.device?.location
        ? coordinate(value.device.location.latitude, value.device.location.longitude)
        : value.district
          ? coordinate(value.district.latitude, value.district.longitude)
          : null;
}

export async function getMapSnapshot(options: MapQueryOptions = {}): Promise<MapSnapshot> {
  const includeCameras = options.includeCameras ?? false;
  const includeIot = options.includeIot ?? false;
  const includeAlerts = options.includeAlerts ?? false;
  const includeIncidents = options.includeIncidents ?? false;
  try {
    const province = await prisma.province.findFirst({
      where: { deletedAt: null },
      select: { id: true, code: true, nameTh: true, nameEn: true, latitude: true, longitude: true },
      orderBy: { nameTh: "asc" },
    });
    if (!province) return createDemoMapSnapshot(includeCameras, { iot: includeIot, alerts: includeAlerts, incidents: includeIncidents });

    const [districts, subdistricts, locations, cameras, devices, alerts, incidents] = await Promise.all([
      prisma.district.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: { id: true, code: true, nameTh: true, nameEn: true, latitude: true, longitude: true, population: true },
        orderBy: { nameTh: "asc" },
      }),
      prisma.subdistrict.findMany({
        where: { district: { provinceId: province.id }, deletedAt: null },
        select: { id: true, code: true, nameTh: true, nameEn: true, latitude: true, longitude: true, population: true, district: { select: { nameTh: true } } },
        orderBy: { nameTh: "asc" },
      }),
      prisma.location.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: { id: true, publicId: true, nameTh: true, nameEn: true, category: true, latitude: true, longitude: true, district: { select: { id: true, nameTh: true } } },
        orderBy: { nameTh: "asc" },
      }),
      includeCameras
        ? prisma.cctvCamera.findMany({
            where: { provinceId: province.id, deletedAt: null, latitude: { not: null }, longitude: { not: null } },
            select: { id: true, cameraCode: true, nameTh: true, nameEn: true, status: true, latitude: true, longitude: true, lastImageAt: true, lastHeartbeat: true, district: { select: { id: true, nameTh: true } } },
            orderBy: { cameraCode: "asc" },
          })
        : Promise.resolve([]),
      includeIot
        ? prisma.iotDevice.findMany({
            where: { provinceId: province.id, deletedAt: null },
            select: {
              id: true, deviceCode: true, nameTh: true, status: true, lastHeartbeat: true,
              type: { select: { nameTh: true } }, district: { select: { id: true, nameTh: true, latitude: true, longitude: true } },
              location: { select: { nameTh: true, latitude: true, longitude: true } },
              metrics: { select: { metricKey: true, nameTh: true, unit: true, warning: true, critical: true } },
              latestValues: { select: { metricKey: true, value: true, unit: true, recordedAt: true } },
            },
            orderBy: { deviceCode: "asc" },
          })
        : Promise.resolve([]),
      includeAlerts
        ? prisma.alert.findMany({
            where: { provinceId: province.id, status: { notIn: ["RESOLVED", "DISMISSED"] } },
            select: {
              id: true, publicId: true, title: true, description: true, severity: true, status: true, updatedAt: true,
              district: { select: { id: true, nameTh: true, latitude: true, longitude: true } },
              location: { select: { latitude: true, longitude: true } },
              camera: { select: { latitude: true, longitude: true } },
              device: { select: { location: { select: { latitude: true, longitude: true } } } },
            },
            orderBy: [{ severity: "desc" }, { createdAt: "desc" }], take: 100,
          })
        : Promise.resolve([]),
      includeIncidents
        ? prisma.incident.findMany({
            where: { provinceId: province.id, status: { notIn: ["RESOLVED", "CLOSED"] } },
            select: {
              id: true, incidentNo: true, title: true, description: true, category: true, severity: true, status: true, updatedAt: true,
              district: { select: { id: true, nameTh: true, latitude: true, longitude: true } },
              location: { select: { latitude: true, longitude: true } },
              camera: { select: { latitude: true, longitude: true } },
              device: { select: { location: { select: { latitude: true, longitude: true } } } },
            },
            orderBy: [{ severity: "desc" }, { createdAt: "desc" }], take: 100,
          })
        : Promise.resolve([]),
    ]);

    const areas: MapArea[] = [
      ...districts.flatMap((area) => {
        const point = coordinate(area.latitude, area.longitude);
        return point ? [{ id: area.id, code: area.code, level: "DISTRICT" as const, nameTh: area.nameTh, nameEn: area.nameEn, parentName: province.nameTh, ...point, population: area.population }] : [];
      }),
      ...subdistricts.flatMap((area) => {
        const point = coordinate(area.latitude, area.longitude);
        return point ? [{ id: area.id, code: area.code, level: "SUBDISTRICT" as const, nameTh: area.nameTh, nameEn: area.nameEn, parentName: area.district.nameTh, ...point, population: area.population }] : [];
      }),
    ];

    const markers: MapMarker[] = locations.flatMap((location) => {
      const point = coordinate(location.latitude, location.longitude);
      if (!point) return [];
      const status = location.category === "RISK_AREA" ? "WARNING" : "NORMAL";
      return [{
        id: location.id,
        kind: "LOCATION" as const,
        code: location.publicId,
        title: location.nameTh,
        subtitle: location.nameEn,
        category: location.category,
        categoryLabel: categoryLabels[location.category] ?? location.category,
        status: status as MapMarkerStatus,
        statusLabel: status === "WARNING" ? "เฝ้าระวัง" : "ปกติ",
        ...point,
        parentName: location.district?.nameTh ?? province.nameTh,
        districtId: location.district?.id ?? null,
        lastSeenAt: null,
      }];
    });

    if (includeCameras) {
      markers.push(...cameras.flatMap((camera) => {
        const point = coordinate(camera.latitude, camera.longitude);
        if (!point) return [];
        const state = cameraStatusMap[camera.status] ?? { status: "WARNING" as const, label: camera.status };
        return [{
          id: camera.id,
          kind: "CAMERA" as const,
          code: camera.cameraCode,
          title: camera.nameTh,
          subtitle: camera.nameEn,
          category: "CCTV",
          categoryLabel: categoryLabels.CCTV,
          status: state.status,
          statusLabel: state.label,
          ...point,
          parentName: camera.district?.nameTh ?? province.nameTh,
          districtId: camera.district?.id ?? null,
          lastSeenAt: camera.lastImageAt?.toISOString() ?? camera.lastHeartbeat?.toISOString() ?? null,
        }];
      }));
    }

    const commandFeatures: CommandMapFeature[] = markers.map((marker) => ({
      id: marker.id,
      kind: marker.kind === "CAMERA" ? "CCTV" : "LOCATION",
      code: marker.code,
      coordinates: [marker.longitude, marker.latitude],
      districtId: marker.districtId,
      districtName: marker.parentName,
      title: marker.title,
      categoryLabel: marker.categoryLabel,
      status: marker.status,
      statusLabel: marker.statusLabel,
      lastUpdatedAt: marker.lastSeenAt,
      previewImageUrl: marker.kind === "CAMERA" ? getCctvPreviewImage(marker.code) : null,
      summary: marker.kind === "CAMERA" ? "กล้องวงจรปิดสำหรับติดตามสถานการณ์และ AI events" : `${marker.categoryLabel}ในพื้นที่จังหวัดสิงห์บุรี`,
      metrics: [],
      destinationHref: marker.kind === "CAMERA" ? `/cctv?camera=${marker.id}` : `/map?feature=marker:${marker.id}`,
    }));

    commandFeatures.push(...devices.flatMap((device) => {
      const point = device.location
        ? coordinate(device.location.latitude, device.location.longitude)
        : device.district
          ? coordinate(device.district.latitude, device.district.longitude)
          : null;
      if (!point) return [];
      const latestByKey = new Map(device.latestValues.map((latest) => [latest.metricKey, latest]));
      const metrics: CommandMapMetric[] = device.metrics.flatMap((metric) => {
        const latest = latestByKey.get(metric.metricKey);
        if (!latest) return [];
        const value = decimalToNumber(latest.value);
        const warning = metric.warning === null ? null : decimalToNumber(metric.warning);
        const critical = metric.critical === null ? null : decimalToNumber(metric.critical);
        const state = critical !== null && value >= critical ? "CRITICAL" : warning !== null && value >= warning ? "WARNING" : "NORMAL";
        return [{ key: metric.metricKey, label: metric.nameTh, value, unit: latest.unit ?? metric.unit, state }];
      });
      const status = deviceStatus(device.status, metrics);
      const labels: Record<MapMarkerStatus, string> = { NORMAL: "ออนไลน์", WARNING: "เฝ้าระวัง", CRITICAL: "วิกฤต", OFFLINE: "ออฟไลน์", MAINTENANCE: "ซ่อมบำรุง", DEGRADED: "คุณภาพลดลง" };
      return [{
        id: device.id, kind: "IOT" as const, code: device.deviceCode, coordinates: [point.longitude, point.latitude] as [number, number],
        districtId: device.district?.id ?? null, districtName: device.district?.nameTh ?? null, title: device.nameTh, categoryLabel: device.type.nameTh,
        status, statusLabel: labels[status], lastUpdatedAt: device.lastHeartbeat?.toISOString() ?? device.latestValues[0]?.recordedAt.toISOString() ?? null,
        summary: device.location ? `ข้อมูล telemetry จาก ${device.location.nameTh}` : `ข้อมูล telemetry ระบุตำแหน่งโดยประมาณจากศูนย์กลาง${device.district?.nameTh ?? "พื้นที่"}`, metrics: metrics.slice(0, 3), destinationHref: `/iot?device=${device.id}`,
      }];
    }));

    commandFeatures.push(...alerts.flatMap((alert) => {
      const point = pointFromRelations(alert);
      if (!point) return [];
      const status = operationalStatus(alert.severity);
      return [{ id: alert.id, kind: "ALERT" as const, code: alert.publicId, coordinates: [point.longitude, point.latitude] as [number, number], districtId: alert.district?.id ?? null, districtName: alert.district?.nameTh ?? null, title: alert.title, categoryLabel: "การแจ้งเตือน", status, statusLabel: alert.severity === "CRITICAL" ? "วิกฤต" : alert.severity === "HIGH" ? "ระดับสูง" : alert.severity === "WARNING" ? "เฝ้าระวัง" : "ข้อมูล", lastUpdatedAt: alert.updatedAt.toISOString(), summary: alert.description ?? `สถานะ ${alert.status}`, metrics: [], destinationHref: `/alerts?alert=${alert.id}` }];
    }));

    commandFeatures.push(...incidents.flatMap((incident) => {
      const point = pointFromRelations(incident);
      if (!point) return [];
      const status = operationalStatus(incident.severity);
      return [{ id: incident.id, kind: "INCIDENT" as const, code: incident.incidentNo, coordinates: [point.longitude, point.latitude] as [number, number], districtId: incident.district?.id ?? null, districtName: incident.district?.nameTh ?? null, title: incident.title, categoryLabel: "เหตุการณ์", status, statusLabel: incident.status, lastUpdatedAt: incident.updatedAt.toISOString(), summary: incident.description ?? `เหตุการณ์ประเภท ${incident.category}`, metrics: [], destinationHref: `/incidents?incident=${incident.id}` }];
    }));

    const provincePoint = coordinate(province.latitude, province.longitude);
    const fallbackCenter = areas.length > 0
      ? { latitude: areas.reduce((total, area) => total + area.latitude, 0) / areas.length, longitude: areas.reduce((total, area) => total + area.longitude, 0) / areas.length }
      : { latitude: 14.89, longitude: 100.4 };
    const center = provincePoint ?? fallbackCenter;
    const dataBounds = getBounds([...areas, ...markers]);
    const bounds = province.code === "17" ? singBuriBoundaryBounds : dataBounds;

    return {
      province: { id: province.id, code: province.code, nameTh: province.nameTh, nameEn: province.nameEn, center: [center.longitude, center.latitude] },
      areas,
      markers,
      commandFeatures,
      boundary,
      bounds,
      counts: { districts: districts.length, subdistricts: subdistricts.length, locations: locations.length, cameras: includeCameras ? cameras.length : 0, iot: devices.length, alerts: alerts.length, incidents: incidents.length },
      capabilities: { cameras: includeCameras, iot: includeIot, alerts: includeAlerts, incidents: includeIncidents },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Map database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoMapSnapshot(includeCameras, { iot: includeIot, alerts: includeAlerts, incidents: includeIncidents });
  }
}
