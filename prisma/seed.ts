import "dotenv/config";
import { createHash } from "node:crypto";
import { prisma } from "../lib/db/prisma";
import { serializeJsonText } from "../lib/db/legacy-json";
import { hashPassword } from "../lib/auth/password";
import { DEMO_PROVINCE } from "../lib/demo-data";
import { PERMISSION_DEFINITIONS, ROLE_CODES } from "../lib/permissions/constants";

const DEMO_NOW = new Date("2026-08-05T13:00:00.000Z");
const DEMO_PASSWORD_MESSAGE =
  "Set SEED_SUPER_ADMIN_PASSWORD and SEED_DEFAULT_USER_PASSWORD in .env before seeding.";

const roleLabels: Record<(typeof ROLE_CODES)[number], [string, string]> = {
  SUPER_ADMIN: ["ผู้ดูแลระบบสูงสุด", "Super administrator"],
  PROVINCIAL_ADMIN: ["ผู้ดูแลจังหวัด", "Provincial administrator"],
  AGENCY_ADMIN: ["ผู้ดูแลหน่วยงาน", "Agency administrator"],
  COMMAND_CENTER_OPERATOR: ["เจ้าหน้าที่ศูนย์บัญชาการ", "Command center operator"],
  CCTV_OPERATOR: ["เจ้าหน้าที่ CCTV", "CCTV operator"],
  IOT_OPERATOR: ["เจ้าหน้าที่ IoT", "IoT operator"],
  ANALYST: ["นักวิเคราะห์", "Analyst"],
  EXECUTIVE: ["ผู้บริหาร", "Executive"],
  VIEWER: ["ผู้ชมข้อมูล", "Read-only viewer"],
};

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map(([code]) => code),
  PROVINCIAL_ADMIN: PERMISSION_DEFINITIONS.filter(([code]) => code !== "settings.manage").map(([code]) => code),
  AGENCY_ADMIN: ["dashboard.read", "users.read", "users.create", "users.update", "agencies.read", "areas.read"],
  COMMAND_CENTER_OPERATOR: ["dashboard.read", "alerts.read", "alerts.manage", "incidents.read", "incidents.manage", "ai.read", "ai.use"],
  CCTV_OPERATOR: ["dashboard.read", "cctv.read", "cctv.manage"],
  IOT_OPERATOR: ["dashboard.read", "iot.read", "iot.manage"],
  ANALYST: ["dashboard.read", "areas.read", "exports.create", "ai.read", "ai.use"],
  EXECUTIVE: ["dashboard.read", "areas.read", "exports.create", "ai.read", "ai.use"],
  VIEWER: ["dashboard.read", "areas.read", "agencies.read"],
};

const agencySeeds = [
  ["PROVINCIAL_HALL", "ศาลากลางจังหวัดสิงห์บุรี", "Sing Buri Provincial Hall"],
  ["COMMAND_CENTER", "ศูนย์บัญชาการจังหวัด", "Provincial Command Center"],
  ["PROVINCIAL_OFFICE", "สำนักงานจังหวัดสิงห์บุรี", "Sing Buri Provincial Office"],
  ["DISASTER_PREVENTION", "สำนักงานป้องกันและบรรเทาสาธารณภัย", "Disaster Prevention Office"],
  ["POLICE", "ตำรวจภูธรจังหวัดสิงห์บุรี", "Sing Buri Provincial Police"],
  ["PUBLIC_HEALTH", "สำนักงานสาธารณสุขจังหวัดสิงห์บุรี", "Provincial Public Health Office"],
  ["ENVIRONMENT", "สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อม", "Natural Resources and Environment Office"],
  ["HIGHWAYS", "แขวงทางหลวงสิงห์บุรี", "Sing Buri Highways District"],
  ["TOURISM", "สำนักงานการท่องเที่ยวและกีฬาจังหวัด", "Tourism and Sports Office"],
  ["PAO", "องค์การบริหารส่วนจังหวัดสิงห์บุรี", "Sing Buri Provincial Administrative Organization"],
  ["MUNICIPALITY", "เทศบาลเมืองสิงห์บุรี", "Sing Buri Municipality"],
  ["HOSPITAL", "โรงพยาบาลสิงห์บุรี", "Sing Buri Hospital"],
] as const;

const districtSeeds = [
  ["1701", "เมืองสิงห์บุรี", "Mueang Sing Buri", 34100, 1380, 180.0],
  ["1702", "บางระจัน", "Bang Rachan", 26500, 1180, 152.5],
  ["1703", "ค่ายบางระจัน", "Khai Bang Rachan", 23750, 1080, 135.0],
  ["1704", "พรหมบุรี", "Phrom Buri", 25875, 1100, 120.5],
  ["1705", "ท่าช้าง", "Tha Chang", 17800, 780, 101.5],
  ["1706", "อินทร์บุรี", "In Buri", 37200, 1540, 133.0],
] as const;

const deviceTypeSeeds = [
  ["WATER", "ระดับน้ำ", "Water level"],
  ["RAINFALL", "ปริมาณฝน", "Rainfall"],
  ["AIR", "คุณภาพอากาศ", "Air quality"],
  ["WASTE", "การจัดเก็บขยะ", "Waste collection"],
  ["TRAFFIC", "การจราจร", "Traffic"],
  ["TOURISM", "การท่องเที่ยว", "Tourism"],
  ["HEALTH", "สาธารณสุข", "Public health"],
] as const;

const demoUsers = [
  ["superadmin", "ผู้ดูแลระบบสูงสุด", "SUPER_ADMIN", "PROVINCIAL_HALL"],
  ["province.admin", "ผู้ดูแลจังหวัด", "PROVINCIAL_ADMIN", "PROVINCIAL_HALL"],
  ["command.operator", "เจ้าหน้าที่ศูนย์บัญชาการ", "COMMAND_CENTER_OPERATOR", "COMMAND_CENTER"],
  ["cctv.operator", "เจ้าหน้าที่ CCTV", "CCTV_OPERATOR", "POLICE"],
  ["iot.operator", "เจ้าหน้าที่ IoT", "IOT_OPERATOR", "DISASTER_PREVENTION"],
  ["analyst", "นักวิเคราะห์ข้อมูล", "ANALYST", "PROVINCIAL_OFFICE"],
  ["executive", "ผู้บริหารจังหวัด", "EXECUTIVE", "PROVINCIAL_HALL"],
  ["viewer", "ผู้ชมข้อมูล", "VIEWER", "PROVINCIAL_HALL"],
] as const;

function stableId(key: string) {
  const hex = createHash("md5").update(`digitaltwin:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function valueAt(reference: Date, hoursAgo: number) {
  return new Date(reference.getTime() - hoursAgo * 60 * 60 * 1000);
}

function requiredSeedPassword(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${DEMO_PASSWORD_MESSAGE} Missing ${name}.`);
  return value;
}

async function seedPermissionsAndRoles() {
  const permissions = new Map<string, string>();
  for (const [code, module, action, nameTh, nameEn] of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { module, action, nameTh, nameEn },
      create: { id: stableId(`permission:${code}`), code, module, action, nameTh, nameEn },
    });
    permissions.set(code, permission.id);
  }

  const roles = new Map<string, string>();
  for (const code of ROLE_CODES) {
    const [nameTh, nameEn] = roleLabels[code];
    const role = await prisma.role.upsert({
      where: { code },
      update: { nameTh, nameEn, isSystem: true, deletedAt: null },
      create: {
        id: stableId(`role:${code}`),
        code,
        nameTh,
        nameEn,
        isSystem: true,
      },
    });
    roles.set(code, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissionIds = (rolePermissions[code] ?? []).map((permissionCode) => permissions.get(permissionCode)).filter(Boolean) as string[];
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      });
    }
  }
  return { permissions, roles };
}

async function seedAgencies() {
  const agencies = new Map<string, string>();
  for (const [code, nameTh, nameEn] of agencySeeds) {
    const agency = await prisma.agency.upsert({
      where: { code },
      update: { nameTh, nameEn, isActive: true, deletedAt: null },
      create: { id: stableId(`agency:${code}`), code, nameTh, nameEn },
    });
    agencies.set(code, agency.id);
  }
  return agencies;
}

async function assignRole(userId: string, roleId: string) {
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.create({ data: { userId, roleId } });
}

async function seedUsers(
  roles: Map<string, string>,
  agencies: Map<string, string>,
  full: boolean,
) {
  const superAdminPassword = requiredSeedPassword("SEED_SUPER_ADMIN_PASSWORD");
  const defaultPassword = full ? requiredSeedPassword("SEED_DEFAULT_USER_PASSWORD") : superAdminPassword;
  const users = full ? demoUsers : demoUsers.slice(0, 1);

  for (const [username, displayName, roleCode, agencyCode] of users) {
    const userId = stableId(`user:${username}`);
    const passwordHash = await hashPassword(username === "superadmin" ? superAdminPassword : defaultPassword);
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        displayName,
        passwordHash,
        isActive: true,
        failedLoginCount: 0,
        lockedUntil: null,
        deletedAt: null,
        agencyId: agencies.get(agencyCode),
      },
      create: {
        id: userId,
        publicId: userId,
        username,
        displayName,
        email: `${username.replace(/[^a-z0-9]+/gi, ".")}@demo.digitaltwin.local`,
        passwordHash,
        agencyId: agencies.get(agencyCode),
      },
    });
    await assignRole(user.id, roles.get(roleCode)!);
  }
}

async function seedSettings() {
  const settings = [
    ["platform.name", "Digital Twin – Intelligent City Platform", "platform"],
    ["platform.province", DEMO_PROVINCE.nameTh, "platform"],
    ["platform.locale", "th-TH", "platform"],
    ["platform.timezone", "Asia/Bangkok", "platform"],
    ["platform.currency", "THB", "platform"],
    ["ai.enabled", false, "ai"],
    ["demo.data", true, "system"],
  ] as const;
  for (const [settingKey, valueJson, category] of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey },
      update: { valueJson: serializeJsonText(valueJson)!, category },
      create: { id: stableId(`setting:${settingKey}`), settingKey, valueJson: serializeJsonText(valueJson)!, category },
    });
  }
}

async function seedAreas() {
  const provinceId = stableId("province:17");
  const province = await prisma.province.upsert({
    where: { code: "17" },
    update: {
      nameTh: DEMO_PROVINCE.nameTh,
      nameEn: DEMO_PROVINCE.nameEn,
      population: DEMO_PROVINCE.population,
      areaSqKm: DEMO_PROVINCE.areaSqKm,
      latitude: 14.89,
      longitude: 100.4,
      deletedAt: null,
    },
    create: {
      id: provinceId,
      publicId: provinceId,
      code: "17",
      nameTh: DEMO_PROVINCE.nameTh,
      nameEn: DEMO_PROVINCE.nameEn,
      population: DEMO_PROVINCE.population,
      areaSqKm: DEMO_PROVINCE.areaSqKm,
      latitude: 14.89,
      longitude: 100.4,
    },
  });
  const districts: { id: string; provinceId: string; nameTh: string }[] = [];
  let subdistrictIndex = 0;
  let villageIndex = 0;
  for (const [code, nameTh, nameEn, population, households, areaSqKm] of districtSeeds) {
    const districtId = stableId(`district:${code}`);
    const district = await prisma.district.upsert({
      where: { id: districtId },
      update: { nameTh, nameEn, population, households, areaSqKm, deletedAt: null },
      create: {
        id: districtId,
        publicId: districtId,
        provinceId: province.id,
        code,
        nameTh,
        nameEn,
        population,
        households,
        areaSqKm,
        latitude: 14.85 + Number(code.slice(-1)) * 0.015,
        longitude: 100.25 + Number(code.slice(-1)) * 0.035,
      },
    });
    districts.push({ id: district.id, provinceId: province.id, nameTh });
    const subdistrictCount = code === "1701" || code === "1706" ? 8 : 7;
    for (let index = 1; index <= subdistrictCount; index += 1) {
      subdistrictIndex += 1;
      const subdistrictId = stableId(`subdistrict:${code}:${index}`);
      const subdistrict = await prisma.subdistrict.upsert({
        where: { id: subdistrictId },
        update: { nameTh: `${nameTh} ตำบลที่ ${index}`, nameEn: `${nameEn} Subdistrict ${index}`, deletedAt: null },
        create: {
          id: subdistrictId,
          publicId: subdistrictId,
          districtId: district.id,
          code: `${code}-${String(index).padStart(2, "0")}`,
          nameTh: `${nameTh} ตำบลที่ ${index}`,
          nameEn: `${nameEn} Subdistrict ${index}`,
          population: Math.round(population / subdistrictCount),
          households: Math.round(households / subdistrictCount),
          areaSqKm: Number(areaSqKm) / subdistrictCount,
          latitude: 14.85 + subdistrictIndex * 0.004,
          longitude: 100.25 + subdistrictIndex * 0.006,
        },
      });
      const villageCount = 8 + (subdistrictIndex <= 20 ? 1 : 0);
      for (let village = 1; village <= villageCount; village += 1) {
        villageIndex += 1;
        const villageId = stableId(`village:${code}:${index}:${village}`);
        await prisma.village.upsert({
          where: { id: villageId },
          update: { nameTh: `หมู่บ้านที่ ${village}`, deletedAt: null },
          create: {
            id: villageId,
            publicId: villageId,
            subdistrictId: subdistrict.id,
            code: `${code}-${String(index).padStart(2, "0")}-${String(village).padStart(2, "02")}`,
            nameTh: `หมู่บ้านที่ ${village}`,
            nameEn: `Village ${village}`,
            population: Math.max(100, Math.round(population / (subdistrictCount * villageCount))),
            households: Math.max(30, Math.round(households / (subdistrictCount * villageCount))),
            areaSqKm: Number(areaSqKm) / (subdistrictCount * villageCount),
            latitude: 14.85 + villageIndex * 0.0005,
            longitude: 100.25 + villageIndex * 0.0007,
          },
        });
      }
    }
  }
  return { province, districts };
}

async function seedLocations(provinceId: string, agencyId: string) {
  const locations = [
    ["CITY_HALL", "ศาลากลางจังหวัดสิงห์บุรี", "Provincial Hall", "GOVERNMENT", 14.893, 100.401],
    ["HOSPITAL", "โรงพยาบาลสิงห์บุรี", "Sing Buri Hospital", "HOSPITAL", 14.895, 100.405],
    ["POLICE_STATION", "สถานีตำรวจภูธรเมืองสิงห์บุรี", "Mueang Police Station", "POLICE", 14.890, 100.398],
    ["BUS_STATION", "สถานีขนส่งผู้โดยสารจังหวัดสิงห์บุรี", "Sing Buri Bus Terminal", "TRANSPORT", 14.886, 100.410],
    ["TEMPLE", "วัดพระนอนจักรสีห์วรวิหาร", "Wat Phra Non Chak Si", "TOURISM", 14.845, 100.352],
    ["HERO_MONUMENT", "อนุสาวรีย์วีรชนค่ายบางระจัน", "Bang Rachan Heroes Monument", "TOURISM", 14.766, 100.312],
    ["MARKET", "ตลาดกลางจังหวัด", "Provincial Central Market", "MARKET", 14.901, 100.427],
    ["PARK", "สวนสาธารณะจังหวัด", "Provincial Park", "PUBLIC_SPACE", 14.899, 100.390],
    ["FLOOD_RISK", "จุดเสี่ยงน้ำท่วมตัวอย่าง", "Sample Flood Risk Area", "RISK_AREA", 14.930, 100.451],
    ["SHELTER", "ศูนย์อพยพตัวอย่าง", "Sample Evacuation Center", "SHELTER", 14.880, 100.377],
  ] as const;
  const ids = new Map<string, string>();
  for (const [code, nameTh, nameEn, category, latitude, longitude] of locations) {
    const id = stableId(`location:${code}`);
    await prisma.location.upsert({
      where: { id },
      update: { nameTh, nameEn, category, latitude, longitude, deletedAt: null },
      create: { id, publicId: id, nameTh, nameEn, category, latitude, longitude, provinceId, agencyId },
    });
    ids.set(code, id);
  }
  return ids;
}

async function seedCctv(provinceId: string, agencyId: string, locationIds: Map<string, string>) {
  const names = [
    "สะพานข้ามแม่น้ำเจ้าพระยา", "แยกศาลากลาง", "ทางเข้าโรงพยาบาลสิงห์บุรี", "สถานีขนส่ง", "ตลาดกลาง",
    "แยกบางระจัน", "หน้าสถานีตำรวจ", "ถนนสายเอเชียขาเข้า", "ถนนสายเอเชียขาออก", "จุดเสี่ยงน้ำท่วม",
    "ถนนเมืองสิงห์บุรี 11", "ถนนเมืองสิงห์บุรี 12", "แยกอินทร์บุรี", "ตลาดพรหมบุรี", "สะพานท่าช้าง",
    "ถนนค่ายบางระจัน", "ทางเข้าวัดพระนอน", "สวนสาธารณะจังหวัด", "หน้าศูนย์อพยพ", "จุดตรวจบางระจัน",
  ];
  const statuses = ["ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "ONLINE", "OFFLINE", "OFFLINE", "OFFLINE", "MAINTENANCE", "DEGRADED"];
  const cameras: { id: string; cameraCode: string }[] = [];
  for (let index = 0; index < names.length; index += 1) {
    const cameraCode = `CCTV-SB-${String(index + 1).padStart(3, "0")}`;
    const id = stableId(`camera:${cameraCode}`);
    const status = statuses[index];
    const camera = await prisma.cctvCamera.upsert({
      where: { id },
      update: { nameTh: names[index], status, lastImageAt: status === "OFFLINE" ? valueAt(DEMO_NOW, 1.5) : DEMO_NOW, lastHeartbeat: valueAt(DEMO_NOW, status === "OFFLINE" ? 1.5 : 0.1), deletedAt: null },
      create: {
        id,
        publicId: id,
        cameraCode,
        nameTh: names[index],
        nameEn: `CCTV ${index + 1}`,
        status,
        nfsFolderPath: `/mnt/nas/cctv/${cameraCode}`,
        lastImageAt: status === "OFFLINE" ? valueAt(DEMO_NOW, 1.5) : DEMO_NOW,
        lastHeartbeat: valueAt(DEMO_NOW, status === "OFFLINE" ? 1.5 : 0.1),
        latitude: 14.76 + index * 0.009,
        longitude: 100.31 + index * 0.006,
        agencyId,
        provinceId,
        locationId: index === 0 ? locationIds.get("CITY_HALL") : index === 2 ? locationIds.get("HOSPITAL") : undefined,
      },
    });
    cameras.push({ id: camera.id, cameraCode });
  }
  await prisma.cctvAiResult.deleteMany({ where: { cameraId: { in: cameras.map((camera) => camera.id) } } });
  await prisma.cctvSnapshot.deleteMany({ where: { cameraId: { in: cameras.map((camera) => camera.id) } } });
  await prisma.cctvSnapshot.createMany({
    data: cameras.flatMap(({ id, cameraCode }) =>
      Array.from({ length: 24 }, (_, hour) => ({
        cameraId: id,
        imagePath: `/mnt/nas/cctv/${cameraCode}/2026/08/05/${String(hour).padStart(2, "0")}0000.jpg`,
        capturedAt: valueAt(DEMO_NOW, hour),
        fileModifiedAt: valueAt(DEMO_NOW, hour),
        fileSizeBytes: BigInt(160_000 + hour * 2_000),
      })),
    ),
  });
  const eventTypes = ["TRAFFIC_CONGESTION", "FLOOD", "SMOKE", "CROWD", "ILLEGAL_PARKING", "CAMERA_BLOCKED"];
  await prisma.cctvAiResult.createMany({
    data: eventTypes.map((eventType, index) => ({
      cameraId: cameras[index].id,
      eventType,
      confidence: 0.6 + index * 0.06,
      detectedAt: valueAt(DEMO_NOW, index + 1),
      verification: index < 2 ? "VERIFIED" : "UNVERIFIED",
    })),
  });
}

function deviceSpecs() {
  return [
    ...Array.from({ length: 8 }, (_, index) => ({ prefix: "WATER-SB", index, type: "WATER", metricKey: "waterLevel", unit: "เมตร", primary: [12.45, 11.91, 11.98, 12.04, 11.78, 11.86, 12.11, 11.72][index] })),
    ...Array.from({ length: 6 }, (_, index) => ({ prefix: "RAIN-SB", index, type: "RAINFALL", metricKey: "dailyRainfall", unit: "มม.", primary: [12.6, 10.2, 8.6, 15.4, 7.2, 11.8][index] })),
    ...Array.from({ length: 6 }, (_, index) => ({ prefix: "AIR-SB", index, type: "AIR", metricKey: "pm25", unit: "µg/m³", primary: [18, 21, 24, 16, 19, 23][index] })),
    ...Array.from({ length: 6 }, (_, index) => ({ prefix: "WASTE-SB", index, type: "WASTE", metricKey: "collectedWeight", unit: "ตัน", primary: [56.8, 49.2, 45.1, 51.4, 42.7, 47.5][index] })),
    ...Array.from({ length: 6 }, (_, index) => ({ prefix: "TRAFFIC-SB", index, type: "TRAFFIC", metricKey: "averageSpeed", unit: "กม./ชม.", primary: [48, 43, 52, 39, 46, 41][index] })),
    ...Array.from({ length: 4 }, (_, index) => ({ prefix: "TOURISM-SB", index, type: "TOURISM", metricKey: "visitorCount", unit: "คน", primary: [2350, 1980, 1740, 2210][index] })),
    ...Array.from({ length: 4 }, (_, index) => ({ prefix: "HEALTH-SB", index, type: "HEALTH", metricKey: index === 0 ? "availableBeds" : "emergencyPatientsToday", unit: index === 0 ? "เตียง" : "ราย", primary: index === 0 ? 312 : 27 + index })),
  ];
}

async function seedIot(provinceId: string, agencyId: string, districtIds: string[], locationIds: Map<string, string>) {
  const typeIds = new Map<string, string>();
  const sensorLocationCodes = ["FLOOD_RISK", "PARK", "MARKET", "BUS_STATION", "TEMPLE", "HOSPITAL", "CITY_HALL", "SHELTER"] as const;
  for (const [code, nameTh, nameEn] of deviceTypeSeeds) {
    const type = await prisma.iotDeviceType.upsert({
      where: { code },
      update: { nameTh, nameEn },
      create: { id: stableId(`device-type:${code}`), code, nameTh, nameEn },
    });
    typeIds.set(code, type.id);
  }
  const deviceIds: string[] = [];
  for (const [deviceIndex, spec] of deviceSpecs().entries()) {
    const deviceCode = `${spec.prefix}-${String(spec.index + 1).padStart(3, "0")}`;
    const deviceId = stableId(`device:${deviceCode}`);
    const status = deviceIndex >= 36 ? "OFFLINE" : "ONLINE";
    const locationId = locationIds.get(sensorLocationCodes[deviceIndex % sensorLocationCodes.length]);
    const device = await prisma.iotDevice.upsert({
      where: { id: deviceId },
      update: { nameTh: `${spec.metricKey} ${spec.index + 1}`, status, battery: deviceIndex % 11 === 0 ? 16 : 82, locationId, deletedAt: null },
      create: {
        id: deviceId,
        publicId: deviceId,
        deviceCode,
        nameTh: `${spec.metricKey} ${spec.index + 1}`,
        status,
        unit: spec.unit,
        battery: deviceIndex % 11 === 0 ? 16 : 82,
        lastHeartbeat: valueAt(DEMO_NOW, status === "OFFLINE" ? 2 : 0.1),
        typeId: typeIds.get(spec.type)!,
        agencyId,
        locationId,
        provinceId,
        districtId: districtIds[deviceIndex % districtIds.length],
      },
    });
    deviceIds.push(device.id);
    const metricKeys = spec.type === "HEALTH" && spec.index === 0 ? ["availableBeds", "emergencyPatientsToday"] : [spec.metricKey];
    for (const [metricIndex, metricKey] of metricKeys.entries()) {
      const metricId = stableId(`metric:${deviceCode}:${metricKey}`);
      const value = metricKey === "availableBeds" ? 312 : metricKey === "emergencyPatientsToday" ? 27 : spec.primary + metricIndex;
      await prisma.iotMetric.upsert({
        where: { id: metricId },
        update: { nameTh: metricKey, unit: metricKey === "availableBeds" ? "เตียง" : metricKey === "emergencyPatientsToday" ? "ราย" : spec.unit },
        create: { id: metricId, deviceId: device.id, typeId: typeIds.get(spec.type)!, metricKey, nameTh: metricKey, unit: metricKey === "availableBeds" ? "เตียง" : metricKey === "emergencyPatientsToday" ? "ราย" : spec.unit, warning: metricKey === "pm25" ? 37.5 : undefined, critical: metricKey === "pm25" ? 75 : undefined },
      });
      await prisma.iotLatestValue.upsert({
        where: { deviceId_metricKey: { deviceId: device.id, metricKey } },
        update: { value, unit: metricKey === "availableBeds" ? "เตียง" : metricKey === "emergencyPatientsToday" ? "ราย" : spec.unit, recordedAt: DEMO_NOW },
        create: { id: stableId(`latest:${deviceCode}:${metricKey}`), deviceId: device.id, metricKey, value, unit: metricKey === "availableBeds" ? "เตียง" : metricKey === "emergencyPatientsToday" ? "ราย" : spec.unit, recordedAt: DEMO_NOW },
      });
      await prisma.iotReading.deleteMany({ where: { deviceId: device.id, metricKey } });
      await prisma.iotReading.createMany({
        data: Array.from({ length: 7 * 24 }, (_, hour) => ({
          deviceId: device.id,
          metricId,
          metricKey,
          value: value + Math.sin(hour / 5) * (metricKey === "pm25" ? 2 : 0.15),
          unit: metricKey === "availableBeds" ? "เตียง" : metricKey === "emergencyPatientsToday" ? "ราย" : spec.unit,
          recordedAt: valueAt(DEMO_NOW, hour),
          idempotencyKey: `demo:${deviceCode}:${metricKey}:${hour}`,
        })),
        skipDuplicates: true,
      });
    }
  }
  return deviceIds;
}

async function seedAlerts(provinceId: string, districtIds: string[]) {
  const alertSeeds = [
    ["ระดับน้ำเพิ่มขึ้นต่อเนื่องที่สถานี C7.A", "ระดับน้ำสูงกว่าค่าเฝ้าระวังและเพิ่มขึ้นต่อเนื่อง", "IOT", "CRITICAL", "NEW"],
    ["กล้อง CCTV-SB-004 Offline", "ไม่พบภาพใหม่จากกล้องนานเกิน 30 นาที", "CCTV", "HIGH", "ACKNOWLEDGED"],
    ["PM2.5 สูงกว่าค่าเฝ้าระวัง", "ค่าฝุ่นละอองเริ่มสูงขึ้นในพื้นที่ชุมชน", "IOT", "WARNING", "IN_PROGRESS"],
    ["พบกลุ่มควันจากภาพ CCTV", "ระบบตรวจพบกลุ่มควันบริเวณตลาดกลาง", "CCTV_AI", "HIGH", "NEW"],
    ["ปริมาณฝนสะสมสูงในอำเภอพรหมบุรี", "ปริมาณฝน 24 ชั่วโมงสูงกว่าค่าเฉลี่ย", "IOT", "WARNING", "NEW"],
    ["อุปกรณ์ IoT แบตเตอรี่ต่ำ", "อุปกรณ์ตรวจวัดมีแบตเตอรี่ต่ำกว่า 20%", "IOT", "LOW", "ACKNOWLEDGED"],
    ["รถเก็บขยะไม่ส่งข้อมูล", "ไม่พบ heartbeat จากชุดข้อมูลรถเก็บขยะ", "IOT", "HIGH", "IN_PROGRESS"],
    ["การจราจรหนาแน่นบนถนนสายเอเชีย", "ความเร็วเฉลี่ยต่ำกว่าค่าปกติ", "IOT", "WARNING", "NEW"],
    ["พบความเสี่ยงน้ำท่วมในพื้นที่ตัวอย่าง", "ระดับน้ำและฝนสะสมเข้าเกณฑ์เฝ้าระวัง", "RULE", "CRITICAL", "NEW"],
    ...Array.from({ length: 16 }, (_, index) => [
      `แจ้งเตือนสาธิตรายการที่ ${index + 10}`,
      "ข้อมูลนี้เป็นรายการสาธิตสำหรับศูนย์บัญชาการ",
      "MANUAL",
      ["INFO", "LOW", "WARNING", "HIGH", "CRITICAL"][index % 5],
      ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"][index % 5],
    ] as const),
  ] as const;
  const ids: string[] = [];
  for (const [index, [title, description, source, severity, status]] of alertSeeds.entries()) {
    const id = stableId(`alert:${index}`);
    ids.push(id);
    const cameraNumber = ({ 1: 4, 3: 5 } as Record<number, number>)[index] ?? (index % 20) + 1;
    const iotDevice = ({
      0: ["WATER-SB", 1],
      2: ["AIR-SB", 1],
      4: ["RAIN-SB", 1],
      5: ["WATER-SB", 2],
      6: ["WASTE-SB", 1],
      7: ["TRAFFIC-SB", 1],
    } as Record<number, [string, number]>)[index] ?? ["WATER-SB", (index % 8) + 1];
    const cameraId = source === "CCTV" || source === "CCTV_AI" ? stableId(`camera:CCTV-SB-${String(cameraNumber).padStart(3, "0")}`) : null;
    const deviceId = source === "IOT" ? stableId(`device:${iotDevice[0]}-${String(iotDevice[1]).padStart(3, "0")}`) : null;
    await prisma.alert.upsert({
      where: { id },
      update: { title, description, source, severity, status, provinceId, districtId: districtIds[index % districtIds.length], cameraId, deviceId },
      create: {
        id,
        publicId: id,
        title,
        description,
        source,
        severity,
        status,
        provinceId,
        districtId: districtIds[index % districtIds.length],
        cameraId: cameraId ?? undefined,
        deviceId: deviceId ?? undefined,
        createdAt: valueAt(DEMO_NOW, index),
        metadata: serializeJsonText({ seed: true }),
      },
    });
  }
  await prisma.alertHistory.deleteMany({ where: { alertId: { in: ids } } });
  await prisma.alertHistory.createMany({
    data: ids.map((alertId, index) => ({
      alertId,
      action: index % 2 === 0 ? "CREATED" : "ACKNOWLEDGED",
      note: "บันทึกเหตุการณ์จากข้อมูลสาธิต",
      createdAt: valueAt(DEMO_NOW, index),
    })),
  });
  return ids;
}

async function seedIncidents(provinceId: string, districtIds: string[], alertIds: string[]) {
  const incidentSeeds = [
    ["น้ำเอ่อล้นบริเวณชุมชนริมแม่น้ำ", "น้ำเอ่อล้นพื้นที่ตัวอย่างริมแม่น้ำเจ้าพระยา", "FLOOD", "CRITICAL", "IN_PROGRESS"],
    ["อุบัติเหตุบริเวณแยกกลางเมือง", "รถชนกีดขวางช่องทางจราจร", "ACCIDENT", "HIGH", "ASSIGNED"],
    ["กล้อง CCTV สำคัญ Offline", "กล้องบริเวณทางเข้าโรงพยาบาลไม่มีภาพ", "CCTV", "HIGH", "MONITORING"],
    ["พบควันผิดปกติใกล้ตลาด", "อยู่ระหว่างตรวจสอบโดยหน่วยงานภาคสนาม", "FIRE_RISK", "HIGH", "DETECTED"],
    ["ระบบวัดระดับน้ำขัดข้อง", "อุปกรณ์ส่งข้อมูลขาดช่วง", "IOT", "WARNING", "VERIFIED"],
    ["ขยะตกค้างเกินค่ามาตรฐาน", "ข้อมูลการเก็บขยะต่ำกว่าเป้าหมายรายวัน", "WASTE", "WARNING", "RESOLVED"],
    ["การจราจรติดขัดเป็นเวลานาน", "ความเร็วเฉลี่ยต่ำต่อเนื่อง 2 ชั่วโมง", "TRAFFIC", "HIGH", "CLOSED"],
    ["PM2.5 สูงในพื้นที่โรงเรียน", "เฝ้าระวังค่าฝุ่นสำหรับกลุ่มเสี่ยง", "AIR_QUALITY", "WARNING", "MONITORING"],
    ["เหตุการณ์สาธิตที่ 9", "รายการสำหรับทดสอบ workflow", "OTHER", "LOW", "DETECTED"],
    ["เหตุการณ์สาธิตที่ 10", "รายการสำหรับทดสอบ workflow", "OTHER", "INFO", "RESOLVED"],
    ["เหตุการณ์สาธิตที่ 11", "รายการสำหรับทดสอบ workflow", "OTHER", "HIGH", "IN_PROGRESS"],
    ["เหตุการณ์สาธิตที่ 12", "รายการสำหรับทดสอบ workflow", "OTHER", "CRITICAL", "MONITORING"],
  ] as const;
  const ids: string[] = [];
  for (const [index, [title, description, category, severity, status]] of incidentSeeds.entries()) {
    const id = stableId(`incident:${index}`);
    ids.push(id);
    await prisma.incident.upsert({
      where: { id },
      update: { title, description, category, severity, status, provinceId, districtId: districtIds[index % districtIds.length] },
      create: {
        id,
        publicId: id,
        incidentNo: `INC-SB-${String(index + 1).padStart(4, "0")}`,
        title,
        description,
        category,
        severity,
        status,
        dueAt: valueAt(DEMO_NOW, -24 + index),
        provinceId,
        districtId: districtIds[index % districtIds.length],
        alertId: alertIds[index % alertIds.length],
        cameraId: index % 3 === 0 ? stableId(`camera:CCTV-SB-${String((index % 20) + 1).padStart(3, "0")}`) : undefined,
        deviceId: index % 2 === 0 ? stableId(`device:WATER-SB-${String((index % 8) + 1).padStart(3, "0")}`) : undefined,
        createdAt: valueAt(DEMO_NOW, index + 1),
      },
    });
  }
  await prisma.incidentHistory.deleteMany({ where: { incidentId: { in: ids } } });
  await prisma.incidentHistory.createMany({
    data: ids.flatMap((incidentId, index) => {
      const currentStatus = incidentSeeds[index][4];
      return [
        { incidentId, status: "DETECTED", note: "ตรวจพบจากข้อมูลสาธิต", createdAt: valueAt(DEMO_NOW, index + 2) },
        { incidentId, status: currentStatus, note: "สถานะปัจจุบันของรายการสาธิต", createdAt: valueAt(DEMO_NOW, index) },
      ];
    }),
  });
  return ids;
}

async function seedStatistics(provinceId: string, districtIds: string[]) {
  const statistics = [
    ["DEMO_POPULATION", "ประชากร", "Population", "population", "คน", 165225],
    ["DEMO_HOUSEHOLDS", "ครัวเรือน", "Households", "households", "ครัวเรือน", 64300],
    ["DEMO_TOURISM", "นักท่องเที่ยว", "Tourism visitors", "tourism.visitors", "คน", 2350],
    ["DEMO_HEALTH", "ผู้ป่วยฉุกเฉิน", "Emergency patients", "health.emergency", "ราย", 27],
    ["DEMO_WASTE", "ขยะที่จัดเก็บ", "Waste collected", "waste.collected", "ตัน", 56.8],
    ["DEMO_ENVIRONMENT", "ค่า PM2.5 เฉลี่ย", "Average PM2.5", "environment.pm25", "µg/m³", 18],
    ["DEMO_WATER", "ระดับน้ำ", "Water level", "water.level", "เมตร", 12.45],
    ["DEMO_TRAFFIC", "ความเร็วเฉลี่ย", "Average traffic speed", "traffic.speed", "กม./ชม.", 48],
    ["DEMO_ECONOMY", "รายได้ท่องเที่ยว", "Tourism revenue", "tourism.revenue", "บาท", 1250000],
    ["DEMO_AREA", "พื้นที่จังหวัด", "Province area", "province.area", "ตร.กม.", 822.5],
  ] as const;
  for (const [code, nameTh, nameEn, metricKey, unit, value] of statistics) {
    const category = await prisma.statisticCategory.upsert({
      where: { id: stableId(`stat-category:${code}`) },
      update: { code, nameTh, nameEn },
      create: { id: stableId(`stat-category:${code}`), code, nameTh, nameEn },
    });
    const definition = await prisma.statisticDefinition.upsert({
      where: { metricKey },
      update: { categoryId: category.id, nameTh, nameEn, unit },
      create: { id: stableId(`stat-definition:${metricKey}`), categoryId: category.id, metricKey, nameTh, nameEn, unit },
    });
    await prisma.statisticValue.deleteMany({ where: { definitionId: definition.id } });
    await prisma.statisticValue.createMany({
      data: [
        { definitionId: definition.id, provinceId, periodStart: new Date("2025-01-01T00:00:00.000Z"), periodEnd: new Date("2025-12-31T23:59:59.000Z"), numericValue: Number(value) * 0.96 },
        { definitionId: definition.id, provinceId, periodStart: new Date("2026-01-01T00:00:00.000Z"), periodEnd: DEMO_NOW, numericValue: value },
        ...districtIds.slice(0, 3).map((districtId, index) => ({ definitionId: definition.id, districtId, periodStart: new Date("2026-01-01T00:00:00.000Z"), periodEnd: DEMO_NOW, numericValue: Number(value) / 6 * (index + 1) })),
      ],
    });
  }
}

async function seedNews() {
  const news = [
    ["แจ้งเตือนระดับน้ำในแม่น้ำเจ้าพระยาเพิ่มขึ้น", "ติดตามระดับน้ำอย่างใกล้ชิด", "WARNING", "PUBLISHED"],
    ["ฝนตกหนักในพื้นที่อำเภอพรหมบุรี", "ขอให้ประชาชนเตรียมพร้อมรับสถานการณ์", "HIGH", "PUBLISHED"],
    ["แจ้งปิดช่องทางจราจรชั่วคราว", "ปิดช่องทางบริเวณแยกกลางเมืองเพื่อดำเนินการ", "INFO", "PUBLISHED"],
    ["ประชาสัมพันธ์งานท่องเที่ยวจังหวัด", "เชิญร่วมกิจกรรมท่องเที่ยวชุมชน", "INFO", "PUBLISHED"],
    ["แจ้งกำหนดการเก็บขยะในพื้นที่เทศบาล", "ตารางการจัดเก็บประจำสัปดาห์", "INFO", "PUBLISHED"],
    ["รายงานสถานการณ์ PM2.5", "ค่าฝุ่นอยู่ในระดับที่ต้องติดตาม", "WARNING", "PUBLISHED"],
    ["ประกาศซ่อมบำรุงระบบ CCTV", "กล้องบางจุดจะหยุดให้บริการชั่วคราว", "INFO", "SCHEDULED"],
    ["แจ้งเตือนประชาชนหลีกเลี่ยงพื้นที่เกิดเหตุ", "โปรดใช้เส้นทางอื่นจนกว่าสถานการณ์จะคลี่คลาย", "HIGH", "PUBLISHED"],
    ["รายงานเตียงว่างโรงพยาบาล", "โรงพยาบาลสิงห์บุรีมีเตียงพร้อมรองรับ 312 เตียง", "INFO", "PUBLISHED"],
    ["ข่าวประชาสัมพันธ์จังหวัด", "ข่าวสารและบริการสำหรับประชาชน", "INFO", "DRAFT"],
  ] as const;
  for (const [index, [title, summary, priority, status]] of news.entries()) {
    const id = stableId(`news:${index}`);
    await prisma.news.upsert({
      where: { id },
      update: { title, summary, priority, status, type: "DEMO", isPinned: index === 0 },
      create: { id, publicId: id, title, summary, body: `${summary} ข้อมูลนี้จัดทำเพื่อการสาธิตระบบ`, type: "DEMO", priority, status, isPinned: index === 0, publishedAt: status === "PUBLISHED" ? valueAt(DEMO_NOW, index) : undefined },
    });
  }
}

async function seedAiData(userIds: string[]) {
  const questions = [
    ["command-center", "สรุปสถานการณ์สำคัญวันนี้"],
    ["command-center", "มี Alert ระดับ Critical กี่รายการ"],
    ["command-center", "อุปกรณ์ใด Offline อยู่บ้าง"],
    ["command-center", "อำเภอใดมีฝนสะสมสูงที่สุด"],
    ["cctv", "กล้องใด Offline เกิน 30 นาที"],
    ["cctv", "วันนี้ AI ตรวจพบเหตุอะไรบ้าง"],
    ["iot", "Sensor ใดมีค่าผิดปกติ"],
    ["iot", "PM2.5 วันนี้เทียบกับเมื่อวานเป็นอย่างไร"],
    ["reports", "สร้างรายงานสถานการณ์วันนี้"],
  ] as const;
  for (const [index, [module, questionTh]] of questions.entries()) {
    const id = stableId(`suggested-question:${index}`);
    await prisma.aiSuggestedQuestion.upsert({
      where: { id },
      update: { module, questionTh, isActive: true, sortOrder: index },
      create: { id, module, questionTh, sortOrder: index },
    });
  }
  for (const [index, userId] of userIds.slice(0, 3).entries()) {
    const conversationId = stableId(`conversation:${userId}`);
    await prisma.aiConversation.upsert({
      where: { id: conversationId },
      update: { title: "Demo: สรุปสถานการณ์จังหวัด", lastMessageAt: DEMO_NOW, deletedAt: null },
      create: { id: conversationId, publicId: conversationId, userId, title: "Demo: สรุปสถานการณ์จังหวัด", contextModule: "command-center", lastMessageAt: DEMO_NOW },
    });
    const messageId = stableId(`message:${userId}`);
    await prisma.aiMessage.upsert({
      where: { id: messageId },
      update: { content: "จังหวัดมี Alert ที่ยังเปิดอยู่ 8 รายการ โดยมี Critical 2 รายการ ข้อมูลนี้เป็นคำตอบสาธิตจากข้อมูล seed", structuredJson: serializeJsonText({ demo: true, relatedUrl: "/dashboard" }) },
      create: { id: messageId, conversationId, role: "ASSISTANT", content: "จังหวัดมี Alert ที่ยังเปิดอยู่ 8 รายการ โดยมี Critical 2 รายการ ข้อมูลนี้เป็นคำตอบสาธิตจากข้อมูล seed", structuredJson: serializeJsonText({ demo: true, relatedUrl: "/dashboard" }) },
    });
    await prisma.aiMessageSource.deleteMany({ where: { messageId } });
    await prisma.aiMessageSource.create({ data: { id: stableId(`message-source:${userId}`), messageId, sourceModule: "Dashboard", sourceType: "Alert", sourceName: "Alert Center (demo)", sourceTimestamp: DEMO_NOW, sourceUrl: "/dashboard" } });
    void index;
  }
}

async function seedDemo() {
  const { roles } = await seedPermissionsAndRoles();
  const agencies = await seedAgencies();
  await seedUsers(roles, agencies, true);
  await seedSettings();
  const { province, districts } = await seedAreas();
  const districtIds = districts.map((district) => district.id);
  const locationIds = await seedLocations(province.id, agencies.get("PROVINCIAL_HALL")!);
  await seedCctv(province.id, agencies.get("POLICE")!, locationIds);
  await seedIot(province.id, agencies.get("DISASTER_PREVENTION")!, districtIds, locationIds);
  const alertIds = await seedAlerts(province.id, districtIds);
  await seedIncidents(province.id, districtIds, alertIds);
  await seedStatistics(province.id, districtIds);
  await seedNews();
  const demoUserRecords = await prisma.user.findMany({ where: { username: { in: demoUsers.map(([username]) => username) } }, select: { id: true } });
  await seedAiData(demoUserRecords.map((user) => user.id));
  console.log("Demo seed complete: Sing Buri foundation and demonstration data created.");
}

async function seedMinimal() {
  const { roles } = await seedPermissionsAndRoles();
  const agencies = new Map<string, string>();
  const agency = await prisma.agency.upsert({
    where: { code: "SYSTEM" },
    update: { nameTh: "ศูนย์บริหารระบบ", nameEn: "System Administration Center", deletedAt: null },
    create: { id: stableId("agency:SYSTEM"), code: "SYSTEM", nameTh: "ศูนย์บริหารระบบ", nameEn: "System Administration Center" },
  });
  agencies.set("SYSTEM", agency.id);
  await seedUsers(roles, agencies, false);
  await seedSettings();
  console.log("Minimal seed complete: roles, permissions, Super Admin, and settings created.");
}

async function resetDemo() {
  if (process.env.ALLOW_DATABASE_RESET !== "true") {
    throw new Error("Database reset is disabled. Set ALLOW_DATABASE_RESET=true explicitly.");
  }
  const demoUsers = await prisma.user.findMany({ where: { username: { in: ["superadmin", "province.admin", "command.operator", "cctv.operator", "iot.operator", "analyst", "executive", "viewer"] } }, select: { id: true } });
  const demoConversations = await prisma.aiConversation.findMany({ where: { title: { startsWith: "Demo:" } }, select: { id: true } });
  await prisma.aiMessageSource.deleteMany({ where: { message: { conversationId: { in: demoConversations.map((item) => item.id) } } } });
  await prisma.aiMessage.deleteMany({ where: { conversationId: { in: demoConversations.map((item) => item.id) } } });
  await prisma.aiConversation.deleteMany({ where: { id: { in: demoConversations.map((item) => item.id) } } });
  await prisma.cctvAiResult.deleteMany({ where: { camera: { cameraCode: { startsWith: "CCTV-SB-" } } } });
  await prisma.cctvSnapshot.deleteMany({ where: { camera: { cameraCode: { startsWith: "CCTV-SB-" } } } });
  await prisma.incidentHistory.deleteMany({ where: { incident: { incidentNo: { startsWith: "INC-SB-" } } } });
  await prisma.incident.deleteMany({ where: { incidentNo: { startsWith: "INC-SB-" } } });
  const demoAlertIds = Array.from({ length: 25 }, (_, index) => stableId(`alert:${index}`));
  await prisma.alertHistory.deleteMany({ where: { alertId: { in: demoAlertIds } } });
  await prisma.alert.deleteMany({ where: { id: { in: demoAlertIds } } });
  const demoDevices = await prisma.iotDevice.findMany({ where: { deviceCode: { contains: "-SB-" } }, select: { id: true } });
  await prisma.iotReading.deleteMany({ where: { deviceId: { in: demoDevices.map((device) => device.id) } } });
  await prisma.iotLatestValue.deleteMany({ where: { deviceId: { in: demoDevices.map((device) => device.id) } } });
  await prisma.iotMetric.deleteMany({ where: { deviceId: { in: demoDevices.map((device) => device.id) } } });
  await prisma.iotDevice.deleteMany({ where: { id: { in: demoDevices.map((device) => device.id) } } });
  await prisma.cctvCamera.deleteMany({ where: { cameraCode: { startsWith: "CCTV-SB-" } } });
  const demoDefinitions = await prisma.statisticDefinition.findMany({ where: { metricKey: { startsWith: "demo." } }, select: { id: true } });
  await prisma.statisticValue.deleteMany({ where: { definitionId: { in: demoDefinitions.map((item) => item.id) } } });
  await prisma.statisticDefinition.deleteMany({ where: { id: { in: demoDefinitions.map((item) => item.id) } } });
  await prisma.statisticCategory.deleteMany({ where: { code: { startsWith: "DEMO_" } } });
  await prisma.news.deleteMany({ where: { id: { in: Array.from({ length: 10 }, (_, index) => stableId(`news:${index}`)) } } });
  await prisma.aiSuggestedQuestion.deleteMany({ where: { id: { in: Array.from({ length: 9 }, (_, index) => stableId(`suggested-question:${index}`)) } } });
  await prisma.location.deleteMany({ where: { id: { in: ["CITY_HALL", "HOSPITAL", "POLICE_STATION", "BUS_STATION", "TEMPLE", "HERO_MONUMENT", "MARKET", "PARK", "FLOOD_RISK", "SHELTER"].map((code) => stableId(`location:${code}`)) } } });
  const province = await prisma.province.findUnique({ where: { code: "17" }, select: { id: true } });
  if (province) {
    const districts = await prisma.district.findMany({ where: { provinceId: province.id }, select: { id: true } });
    const subdistricts = await prisma.subdistrict.findMany({ where: { districtId: { in: districts.map((item) => item.id) } }, select: { id: true } });
    await prisma.village.deleteMany({ where: { subdistrictId: { in: subdistricts.map((item) => item.id) } } });
    await prisma.subdistrict.deleteMany({ where: { id: { in: subdistricts.map((item) => item.id) } } });
    await prisma.district.deleteMany({ where: { id: { in: districts.map((item) => item.id) } } });
    await prisma.province.delete({ where: { id: province.id } });
  }
  await prisma.refreshToken.deleteMany({ where: { userId: { in: demoUsers.map((user) => user.id) } } });
  await prisma.session.deleteMany({ where: { userId: { in: demoUsers.map((user) => user.id) } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: demoUsers.map((user) => user.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: demoUsers.map((user) => user.id) } } });
  await prisma.agency.deleteMany({ where: { code: { in: agencySeeds.map(([code]) => code) } } });
  console.log("Demo data reset complete.");
}

async function main() {
  const mode = process.argv.includes("--mode") ? process.argv[process.argv.indexOf("--mode") + 1] : "demo";
  const reset = process.argv.includes("--reset");
  if (reset) await resetDemo();
  if (mode === "minimal") await seedMinimal();
  else await seedDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
