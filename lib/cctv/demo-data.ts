import { DEMO_PROVINCE } from "@/lib/demo-data";
import {
  CCTV_EVENT_LABELS,
  CCTV_STATUS_LABELS,
  type CctvDetail,
  type CctvOverview,
  type CctvStatus,
} from "@/lib/cctv/types";

const DEMO_NOW = "2026-08-05T13:00:00.000Z";

const districtSeeds = [
  ["demo-district-1701", "1701", "เมืองสิงห์บุรี"],
  ["demo-district-1702", "1702", "บางระจัน"],
  ["demo-district-1703", "1703", "ค่ายบางระจัน"],
  ["demo-district-1704", "1704", "พรหมบุรี"],
  ["demo-district-1705", "1705", "ท่าช้าง"],
  ["demo-district-1706", "1706", "อินทร์บุรี"],
] as const;

const cameraNames = [
  "สะพานข้ามแม่น้ำเจ้าพระยา",
  "แยกศาลากลาง",
  "ทางเข้าโรงพยาบาลสิงห์บุรี",
  "สถานีขนส่ง",
  "ตลาดกลาง",
  "แยกบางระจัน",
  "หน้าสถานีตำรวจ",
  "ถนนสายเอเชียขาเข้า",
  "ถนนสายเอเชียขาออก",
  "จุดเสี่ยงน้ำท่วม",
  "ถนนเมืองสิงห์บุรี 11",
  "ถนนเมืองสิงห์บุรี 12",
  "แยกอินทร์บุรี",
  "ตลาดพรหมบุรี",
  "สะพานท่าช้าง",
  "ถนนค่ายบางระจัน",
  "ทางเข้าวัดพระนอน",
  "สวนสาธารณะจังหวัด",
  "หน้าศูนย์อพยพ",
  "จุดตรวจบางระจัน",
] as const;

const statuses: CctvStatus[] = [
  ...Array.from({ length: 15 }, () => "ONLINE" as const),
  ...Array.from({ length: 3 }, () => "OFFLINE" as const),
  "MAINTENANCE",
  "DEGRADED",
];

function hoursAgo(hours: number) {
  return new Date(new Date(DEMO_NOW).getTime() - hours * 60 * 60 * 1000).toISOString();
}

function cameraSeed(index: number) {
  const district = districtSeeds[index % districtSeeds.length];
  const status = statuses[index];
  const latestSnapshot: CctvDetail["latestSnapshot"] = {
    id: `demo-snapshot-${String(index + 1).padStart(3, "0")}`,
    capturedAt: hoursAgo(status === "OFFLINE" ? 2 : 0),
    fileModifiedAt: hoursAgo(status === "OFFLINE" ? 2 : 0),
    fileSizeBytes: 160000 + index * 2000,
  };
  return {
    id: `demo-camera-${String(index + 1).padStart(3, "0")}`,
    publicId: `demo-camera-${String(index + 1).padStart(3, "0")}`,
    cameraCode: `CCTV-SB-${String(index + 1).padStart(3, "0")}`,
    nameTh: cameraNames[index],
    nameEn: `CCTV ${index + 1}`,
    status,
    statusLabel: CCTV_STATUS_LABELS[status],
    lastImageAt: latestSnapshot.capturedAt,
    lastHeartbeat: hoursAgo(status === "OFFLINE" ? 1.5 : status === "MAINTENANCE" ? 8 : 0.1),
    latitude: 14.76 + index * 0.009,
    longitude: 100.31 + index * 0.006,
    agencyName: "ตำรวจภูธรจังหวัดสิงห์บุรี",
    locationName: index === 0 ? "ศาลากลางจังหวัดสิงห์บุรี" : index === 2 ? "โรงพยาบาลสิงห์บุรี" : null,
    district: { id: district[0], nameTh: district[2] },
    subdistrictName: null,
    googleDriveFolderUrl: null,
    latestSnapshot,
    snapshotCount: 24,
    aiEventCount: index < 6 ? 1 : 0,
  } satisfies CctvOverview["items"][number];
}

const allCameras = cameraNames.map((_, index) => cameraSeed(index));

function matchesSearch(camera: CctvOverview["items"][number], search?: string) {
  const normalized = search?.trim().toLocaleLowerCase("th-TH");
  if (!normalized) return true;
  return [camera.cameraCode, camera.nameTh, camera.nameEn, camera.district?.nameTh, camera.locationName]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("th-TH").includes(normalized));
}

export function createDemoCctvOverview(options: { page?: number; limit?: number; search?: string; status?: CctvStatus; districtId?: string } = {}): CctvOverview {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const filtered = allCameras.filter((camera) => (
    (!options.status || camera.status === options.status)
    && (!options.districtId || camera.district?.id === options.districtId)
    && matchesSearch(camera, options.search)
  ));
  const summary = allCameras.reduce((result, camera) => {
    result.total += 1;
    if (camera.status === "ONLINE") result.online += 1;
    if (camera.status === "OFFLINE") result.offline += 1;
    if (camera.status === "MAINTENANCE") result.maintenance += 1;
    if (camera.status === "DEGRADED") result.degraded += 1;
    return result;
  }, { total: 0, online: 0, offline: 0, maintenance: 0, degraded: 0 });

  return {
    province: { code: DEMO_PROVINCE.code, nameTh: DEMO_PROVINCE.nameTh },
    items: filtered.slice((page - 1) * limit, page * limit),
    summary,
    districts: districtSeeds.map(([id, code, nameTh]) => ({
      id,
      code,
      nameTh,
      cameraCount: allCameras.filter((camera) => camera.district?.id === id).length,
    })),
    pagination: { page, limit, total: filtered.length },
    freshness: new Date().toISOString(),
    isDemo: true,
  };
}

export function createDemoCctvDetail(id: string): CctvDetail | null {
  const camera = allCameras.find((item) => item.id === id || item.publicId === id);
  if (!camera) return null;
  const index = Number(camera.cameraCode.slice(-3)) - 1;
  const eventTypes = ["TRAFFIC_CONGESTION", "FLOOD", "SMOKE", "CROWD", "ILLEGAL_PARKING", "CAMERA_BLOCKED"];
  const aiEvents = index < 6 ? [{
    id: `demo-ai-${String(index + 1).padStart(3, "0")}`,
    eventType: eventTypes[index],
    eventLabel: CCTV_EVENT_LABELS[eventTypes[index]],
    confidence: 0.6 + index * 0.06,
    detectedAt: hoursAgo(index + 1),
    verification: index < 2 ? "VERIFIED" : "UNVERIFIED",
  }] : [];
  const snapshots = Array.from({ length: 8 }, (_, snapshotIndex) => ({
    id: `demo-snapshot-${String(index + 1).padStart(3, "0")}-${snapshotIndex}`,
    capturedAt: hoursAgo(snapshotIndex),
    fileModifiedAt: hoursAgo(snapshotIndex),
    fileSizeBytes: 160000 + snapshotIndex * 2000,
  }));
  return { ...camera, snapshots, aiEvents };
}

export { allCameras as demoCctvCameras };
