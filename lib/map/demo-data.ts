import { DEMO_PROVINCE } from "@/lib/demo-data";
import type { MapSnapshot } from "@/lib/map/types";

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

export function createDemoMapSnapshot(includeCameras = false): MapSnapshot {
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

  const locations = locationSeeds.map(([code, title, subtitle, category, categoryLabel, latitude, longitude, statusLabel]) => ({
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
      lastSeenAt: "2026-08-05T13:00:00.000Z",
    };
  });

  const markers = includeCameras ? [...locations, ...cameras] : locations;
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
    bounds: [100.27, 14.75, 100.51, 14.95],
    counts: {
      districts: 6,
      subdistricts: DEMO_PROVINCE.subdistricts,
      locations: locations.length,
      cameras: includeCameras ? cameras.length : 0,
    },
    capabilities: { cameras: includeCameras },
    freshness: new Date().toISOString(),
    isDemo: true,
  };
}
