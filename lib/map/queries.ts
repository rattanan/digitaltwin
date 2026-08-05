import { prisma } from "@/lib/db/prisma";
import { createDemoMapSnapshot } from "@/lib/map/demo-data";
import type { MapArea, MapMarker, MapMarkerStatus, MapSnapshot } from "@/lib/map/types";
import { decimalToNumber } from "@/lib/utils";

type MapQueryOptions = {
  includeCameras?: boolean;
};

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

export async function getMapSnapshot(options: MapQueryOptions = {}): Promise<MapSnapshot> {
  const includeCameras = options.includeCameras ?? false;
  try {
    const province = await prisma.province.findFirst({
      where: { deletedAt: null },
      select: { id: true, code: true, nameTh: true, nameEn: true, latitude: true, longitude: true },
      orderBy: { nameTh: "asc" },
    });
    if (!province) return createDemoMapSnapshot(includeCameras);

    const [districts, subdistricts, locations, cameras] = await Promise.all([
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
        select: { id: true, publicId: true, nameTh: true, nameEn: true, category: true, latitude: true, longitude: true },
        orderBy: { nameTh: "asc" },
      }),
      includeCameras
        ? prisma.cctvCamera.findMany({
            where: { provinceId: province.id, deletedAt: null, latitude: { not: null }, longitude: { not: null } },
            select: { id: true, cameraCode: true, nameTh: true, nameEn: true, status: true, latitude: true, longitude: true, lastHeartbeat: true, district: { select: { nameTh: true } } },
            orderBy: { cameraCode: "asc" },
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
        parentName: province.nameTh,
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
          lastSeenAt: camera.lastHeartbeat?.toISOString() ?? null,
        }];
      }));
    }

    const provincePoint = coordinate(province.latitude, province.longitude);
    const fallbackCenter = areas.length > 0
      ? { latitude: areas.reduce((total, area) => total + area.latitude, 0) / areas.length, longitude: areas.reduce((total, area) => total + area.longitude, 0) / areas.length }
      : { latitude: 14.89, longitude: 100.4 };
    const center = provincePoint ?? fallbackCenter;
    const bounds = getBounds([...areas, ...markers]);

    return {
      province: { id: province.id, code: province.code, nameTh: province.nameTh, nameEn: province.nameEn, center: [center.longitude, center.latitude] },
      areas,
      markers,
      bounds,
      counts: { districts: districts.length, subdistricts: subdistricts.length, locations: locations.length, cameras: includeCameras ? cameras.length : 0 },
      capabilities: { cameras: includeCameras },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Map database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoMapSnapshot(includeCameras);
  }
}
