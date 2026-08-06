import { DEMO_PROVINCE } from "@/lib/demo-data";
import { getCctvPreviewImage } from "@/lib/cctv/preview-images";
import type { CommandMapFeature, MapSnapshot } from "@/lib/map/types";

const districtSeeds = [
  ["1701", "เมืองสิงห์บุรี", "Mueang Sing Buri", 14.865, 100.285],
  ["1702", "บางระจัน", "Bang Rachan", 14.88, 100.32],
  ["1703", "ค่ายบางระจัน", "Khai Bang Rachan", 14.895, 100.355],
  ["1704", "พรหมบุรี", "Phrom Buri", 14.91, 100.39],
  ["1705", "ท่าช้าง", "Tha Chang", 14.925, 100.425],
  ["1706", "อินทร์บุรี", "In Buri", 14.94, 100.46],
] as const;

const locationSeeds = [
  ["CITY_HALL", "ศาลากลางจังหวัดสิงห์บุรี", "Provincial Hall", "GOVERNMENT", "หน่วยงานรัฐ", 14.893, 100.401, "ปกติ"],
  ["HOSPITAL", "โรงพยาบาลสิงห์บุรี", "Sing Buri Hospital", "HOSPITAL", "สาธารณสุข", 14.895, 100.405, "ปกติ"],
  ["POLICE_STATION", "สถานีตำรวจภูธรเมืองสิงห์บุรี", "Mueang Police Station", "POLICE", "ความปลอดภัย", 14.89, 100.398, "ปกติ"],
  ["BUS_STATION", "สถานีขนส่งผู้โดยสารจังหวัดสิงห์บุรี", "Sing Buri Bus Terminal", "TRANSPORT", "การเดินทาง", 14.886, 100.41, "ปกติ"],
  ["TEMPLE", "วัดพระนอนจักรสีห์วรวิหาร", "Wat Phra Non Chak Si", "TOURISM", "ท่องเที่ยว", 14.845, 100.352, "ปกติ"],
  ["HERO_MONUMENT", "อนุสาวรีย์วีรชนค่ายบางระจัน", "Bang Rachan Heroes Monument", "TOURISM", "ท่องเที่ยว", 14.766, 100.312, "ปกติ"],
  ["MARKET", "ตลาดกลางจังหวัด", "Provincial Central Market", "MARKET", "เศรษฐกิจ", 14.901, 100.427, "ปกติ"],
  ["PARK", "สวนสาธารณะจังหวัด", "Provincial Park", "PUBLIC_SPACE", "พื้นที่สาธารณะ", 14.899, 100.39, "ปกติ"],
  ["FLOOD_RISK", "จุดเสี่ยงน้ำท่วมตัวอย่าง", "Sample Flood Risk Area", "RISK_AREA", "พื้นที่เสี่ยง", 14.93, 100.451, "เฝ้าระวัง"],
  ["SHELTER", "ศูนย์อพยพตัวอย่าง", "Sample Evacuation Center", "SHELTER", "ศูนย์อพยพ", 14.88, 100.377, "ปกติ"],
] as const;

const cameraStatuses = [
  ...Array.from({ length: 14 }, () => ["ONLINE", "ออนไลน์"] as const),
  ...Array.from({ length: 3 }, () => ["OFFLINE", "ออฟไลน์"] as const),
  ["MAINTENANCE", "ซ่อมบำรุง"] as const,
  ["DEGRADED", "คุณภาพลดลง"] as const,
  ["ONLINE", "ออนไลน์"] as const,
] as const;

type DemoCommandCapabilities = { iot?: boolean; alerts?: boolean; incidents?: boolean };

export function createDemoMapSnapshot(includeCameras = false, command: DemoCommandCapabilities = {}): MapSnapshot {
  const districts = districtSeeds.map(([code, nameTh, nameEn, latitude, longitude]) => ({
      id: `demo-district-${code}`,
      code,
      level: "DISTRICT" as const,
      nameTh,
      nameEn,
      parentName: DEMO_PROVINCE.nameTh,
      latitude,
      longitude,
      population: null,
    }));
  const subdistricts = Array.from({ length: DEMO_PROVINCE.subdistricts }, (_, index) => {
    const district = districtSeeds[index % districtSeeds.length];
    return {
      id: `demo-subdistrict-${String(index + 1).padStart(2, "0")}`,
      code: `17-${String(index + 1).padStart(3, "0")}`,
      level: "SUBDISTRICT" as const,
      nameTh: `${district[1]} ตำบลที่ ${(index % 8) + 1}`,
      nameEn: `${district[2]} Subdistrict ${(index % 8) + 1}`,
      parentName: district[1],
      latitude: 14.82 + (index % 9) * 0.014,
      longitude: 100.27 + Math.floor(index / 9) * 0.045 + (index % 3) * 0.006,
      population: null,
    };
  });
  const areas = [...districts, ...subdistricts];

  const locations = locationSeeds.map(([code, title, subtitle, category, categoryLabel, latitude, longitude, statusLabel], index) => ({
    id: `demo-location-${code}`,
    kind: "LOCATION" as const,
    code,
    title,
    subtitle,
    category,
    categoryLabel,
    status: category === "RISK_AREA" ? ("WARNING" as const) : ("NORMAL" as const),
    statusLabel,
    latitude,
    longitude,
      parentName: DEMO_PROVINCE.nameTh,
      districtId: districts[index % districts.length]?.id ?? null,
      lastSeenAt: null,
  }));

  const cameras = Array.from({ length: 20 }, (_, index) => {
    const [status, statusLabel] = cameraStatuses[index];
    return {
      id: `demo-camera-${String(index + 1).padStart(3, "0")}`,
      kind: "CAMERA" as const,
      code: `CCTV-SB-${String(index + 1).padStart(3, "0")}`,
      title: `กล้อง CCTV จุดที่ ${index + 1}`,
      subtitle: `CCTV ${index + 1}`,
      category: "CCTV",
      categoryLabel: "กล้องวงจรปิด",
      status: status === "ONLINE" ? ("NORMAL" as const) : (status as "OFFLINE" | "MAINTENANCE" | "DEGRADED"),
      statusLabel,
      latitude: 14.76 + index * 0.009,
      longitude: 100.31 + index * 0.006,
      parentName: DEMO_PROVINCE.nameTh,
      districtId: districts[index % districts.length]?.id ?? null,
      lastSeenAt: "2026-08-05T13:00:00.000Z",
    };
  });

  const markers = includeCameras ? [...locations, ...cameras] : locations;
  const locationFeatures: CommandMapFeature[] = locations.map((location) => ({
    id: location.id,
    kind: "LOCATION",
    code: location.code,
    coordinates: [location.longitude, location.latitude],
    districtId: location.districtId,
    districtName: location.parentName,
    title: location.title,
    categoryLabel: location.categoryLabel,
    status: location.status,
    statusLabel: location.statusLabel,
    lastUpdatedAt: null,
    summary: location.category === "RISK_AREA" ? "พื้นที่ตัวอย่างที่ต้องติดตามสถานการณ์อย่างใกล้ชิด" : `${location.categoryLabel}ในจังหวัดสิงห์บุรี`,
    metrics: [],
    destinationHref: `/map?feature=marker:${location.id}`,
  }));
  const cameraFeatures: CommandMapFeature[] = includeCameras ? cameras.map((camera) => ({
    id: camera.id,
    kind: "CCTV",
    code: camera.code,
    coordinates: [camera.longitude, camera.latitude],
    districtId: camera.districtId,
    districtName: camera.parentName,
    title: camera.title,
    categoryLabel: camera.categoryLabel,
    status: camera.status,
    statusLabel: camera.statusLabel,
    lastUpdatedAt: camera.lastSeenAt,
    previewImageUrl: getCctvPreviewImage(camera.code),
    summary: "กล้องวงจรปิดสำหรับติดตามสถานการณ์และเหตุการณ์จาก AI",
    metrics: [],
    destinationHref: `/cctv?camera=${camera.id}`,
  })) : [];
  const iotFeatures: CommandMapFeature[] = command.iot ? [
    ["demo-device-001", "WATER-SB-001", "สถานีวัดระดับน้ำ C7.A", 100.365, 14.914, "ระดับน้ำ", 12.4, "เมตร", "WARNING"],
    ["demo-device-015", "AIR-SB-001", "สถานีตรวจวัดคุณภาพอากาศ", 100.401, 14.892, "PM2.5", 38, "µg/m³", "WARNING"],
    ["demo-device-009", "RAIN-SB-001", "สถานีวัดปริมาณฝนพรหมบุรี", 100.439, 14.874, "ฝนสะสม", 42, "มม.", "WARNING"],
  ].map(([id, code, title, longitude, latitude, label, value, unit, state], index) => ({
    id: String(id), kind: "IOT" as const, code: String(code), coordinates: [Number(longitude), Number(latitude)] as [number, number], districtId: districts[index % districts.length]?.id ?? null, districtName: districts[index % districts.length]?.nameTh ?? DEMO_PROVINCE.nameTh,
    title: String(title), categoryLabel: "อุปกรณ์ IoT", status: state as "NORMAL" | "WARNING", statusLabel: state === "WARNING" ? "เฝ้าระวัง" : "ออนไลน์", lastUpdatedAt: "2026-08-05T13:00:00.000Z",
    summary: "ข้อมูล telemetry ล่าสุดจากสถานีตรวจวัด", metrics: [{ key: String(label), label: String(label), value: Number(value), unit: String(unit), state: state as "NORMAL" | "WARNING" }], destinationHref: `/iot?device=${id}`,
  })) : [];
  const alertFeatures: CommandMapFeature[] = command.alerts ? [
    { id: "demo-alert-001", code: "ALT-SB-001", title: "ระดับน้ำเพิ่มขึ้นต่อเนื่อง", coordinates: [100.365, 14.914] as [number, number], status: "CRITICAL" as const, label: "วิกฤต" },
    { id: "demo-alert-002", code: "ALT-SB-002", title: "กล้องขาดการเชื่อมต่อ", coordinates: [100.412, 14.886] as [number, number], status: "WARNING" as const, label: "เฝ้าระวัง" },
  ].map((item, index) => ({ ...item, kind: "ALERT" as const, districtId: districts[index % districts.length]?.id ?? null, districtName: districts[index % districts.length]?.nameTh ?? DEMO_PROVINCE.nameTh, categoryLabel: "การแจ้งเตือน", statusLabel: item.label, lastUpdatedAt: "2026-08-05T13:05:00.000Z", summary: "สัญญาณที่ยังต้องรับทราบและติดตาม", metrics: [], destinationHref: `/alerts?alert=${item.id}` })) : [];
  const incidentFeatures: CommandMapFeature[] = command.incidents ? [{
    id: "demo-incident-001", kind: "INCIDENT" as const, code: "INC-SB-001", coordinates: [100.451, 14.93] as [number, number], districtId: districts[5]?.id ?? null, districtName: districts[5]?.nameTh ?? DEMO_PROVINCE.nameTh,
    title: "ติดตามจุดเสี่ยงน้ำท่วม", categoryLabel: "เหตุการณ์", status: "CRITICAL" as const, statusLabel: "กำลังดำเนินการ", lastUpdatedAt: "2026-08-05T13:10:00.000Z",
    summary: "เหตุการณ์ที่เปิด workflow เพื่อประสานงานหน่วยงาน", metrics: [], destinationHref: "/incidents?incident=demo-incident-001",
  }] : [];
  const commandFeatures = [...locationFeatures, ...iotFeatures, ...cameraFeatures, ...alertFeatures, ...incidentFeatures];
  return {
    province: {
      id: "demo-province-17",
      code: DEMO_PROVINCE.code,
      nameTh: DEMO_PROVINCE.nameTh,
      nameEn: DEMO_PROVINCE.nameEn,
      center: [100.4, 14.89],
    },
    areas,
    markers,
    commandFeatures,
    boundary: { url: "/data/sing-buri-districts.v1.geojson", version: "v1-2019", attribution: "geoBoundaries · Royal Thai Survey Department · OCHA ROAP (CC BY 3.0 IGO)" },
    bounds: [100.182456714, 14.721096421, 100.488093388, 15.120522984],
    counts: {
      districts: 6,
      subdistricts: DEMO_PROVINCE.subdistricts,
      locations: locations.length,
      cameras: includeCameras ? cameras.length : 0,
      iot: iotFeatures.length,
      alerts: alertFeatures.length,
      incidents: incidentFeatures.length,
    },
    capabilities: { cameras: includeCameras, iot: Boolean(command.iot), alerts: Boolean(command.alerts), incidents: Boolean(command.incidents) },
    freshness: new Date().toISOString(),
    isDemo: true,
  };
}
