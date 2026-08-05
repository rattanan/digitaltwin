import { prisma } from "@/lib/db/prisma";
import { demoDashboardSnapshot, type DashboardSnapshot } from "@/lib/demo-data";
import { decimalToNumber } from "@/lib/utils";

async function latestMetric(metricKey: string, deviceCode?: string) {
  return prisma.iotLatestValue.findFirst({
    where: { metricKey, ...(deviceCode ? { device: { deviceCode } } : {}) },
    orderBy: { recordedAt: "desc" },
  });
}

export async function getDashboardSummary(): Promise<DashboardSnapshot> {
  try {
    const province = await prisma.province.findFirst({ where: { deletedAt: null } });
    if (!province) return demoDashboardSnapshot;

    const [
      districtCount,
      subdistrictCount,
      villageCount,
      deviceOnline,
      deviceOffline,
      alertTotal,
      criticalAlerts,
      highAlerts,
      warningAlerts,
      openIncidents,
      criticalIncidents,
      cctvOnline,
      cctvOffline,
      cctvMaintenance,
      cctvDegraded,
      pm25,
      rainfall,
      waterLevel,
      traffic,
      waste,
      hospitalBeds,
      emergencyPatients,
      tourists,
      news,
      waterReadings,
    ] = await Promise.all([
      prisma.district.count({ where: { provinceId: province.id, deletedAt: null } }),
      prisma.subdistrict.count({ where: { district: { provinceId: province.id }, deletedAt: null } }),
      prisma.village.count({ where: { subdistrict: { district: { provinceId: province.id } }, deletedAt: null } }),
      prisma.iotDevice.count({ where: { provinceId: province.id, status: "ONLINE", deletedAt: null } }),
      prisma.iotDevice.count({ where: { provinceId: province.id, status: { not: "ONLINE" }, deletedAt: null } }),
      prisma.alert.count({ where: { provinceId: province.id, status: { not: "RESOLVED" } } }),
      prisma.alert.count({ where: { provinceId: province.id, severity: "CRITICAL", status: { not: "RESOLVED" } } }),
      prisma.alert.count({ where: { provinceId: province.id, severity: "HIGH", status: { not: "RESOLVED" } } }),
      prisma.alert.count({ where: { provinceId: province.id, severity: "WARNING", status: { not: "RESOLVED" } } }),
      prisma.incident.count({ where: { provinceId: province.id, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      prisma.incident.count({ where: { provinceId: province.id, severity: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      prisma.cctvCamera.count({ where: { provinceId: province.id, status: "ONLINE", deletedAt: null } }),
      prisma.cctvCamera.count({ where: { provinceId: province.id, status: "OFFLINE", deletedAt: null } }),
      prisma.cctvCamera.count({ where: { provinceId: province.id, status: "MAINTENANCE", deletedAt: null } }),
      prisma.cctvCamera.count({ where: { provinceId: province.id, status: "DEGRADED", deletedAt: null } }),
      latestMetric("pm25", "AIR-SB-001"),
      latestMetric("dailyRainfall", "RAIN-SB-001"),
      latestMetric("waterLevel", "WATER-SB-001"),
      latestMetric("averageSpeed", "TRAFFIC-SB-001"),
      latestMetric("collectedWeight", "WASTE-SB-001"),
      latestMetric("availableBeds", "HEALTH-SB-001"),
      latestMetric("emergencyPatientsToday", "HEALTH-SB-001"),
      latestMetric("visitorCount", "TOURISM-SB-001"),
      prisma.news.findMany({
        where: { status: "PUBLISHED", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: 3,
      }),
      prisma.iotReading.findMany({
        where: { metricKey: "waterLevel", device: { provinceId: province.id } },
        orderBy: { recordedAt: "desc" },
        take: 6,
      }),
    ]);

    const metric = (item: typeof pm25, fallback: number) =>
      item ? decimalToNumber(item.value) : fallback;
    const totalDevices = deviceOnline + deviceOffline;

    return {
      province: {
        nameTh: province.nameTh,
        nameEn: province.nameEn ?? "Sing Buri",
        code: province.code,
        population: province.population ?? 0,
        areaSqKm: decimalToNumber(province.areaSqKm),
        districts: districtCount,
        subdistricts: subdistrictCount,
        villages: villageCount,
      },
      metrics: {
        pm25: { value: metric(pm25, 0), unit: "µg/m³", status: "จากฐานข้อมูล", trend: 0 },
        rainfall: { value: metric(rainfall, 0), unit: "มม.", status: "จากฐานข้อมูล", trend: 0 },
        waterLevel: { value: metric(waterLevel, 0), unit: "เมตร", status: "จากฐานข้อมูล", trend: 0 },
        traffic: { value: metric(traffic, 0), unit: "กม./ชม.", status: "จากฐานข้อมูล", trend: 0 },
        waste: { value: metric(waste, 0), unit: "ตัน", status: "จากฐานข้อมูล", trend: 0 },
        hospitalBeds: { value: metric(hospitalBeds, 0), unit: "เตียง", status: "จากฐานข้อมูล", trend: 0 },
        emergencyPatients: { value: metric(emergencyPatients, 0), unit: "ราย", status: "จากฐานข้อมูล", trend: 0 },
        tourists: { value: metric(tourists, 0), unit: "คน", status: "จากฐานข้อมูล", trend: 0 },
      },
      devices: { online: deviceOnline, offline: deviceOffline, total: totalDevices },
      incidents: { open: openIncidents, critical: criticalIncidents },
      alerts: { total: alertTotal, critical: criticalAlerts, high: highAlerts, warning: warningAlerts },
      cctv: { online: cctvOnline, offline: cctvOffline, maintenance: cctvMaintenance, degraded: cctvDegraded },
      news: news.map((item) => ({
        title: item.title,
        severity: item.priority,
        time: item.publishedAt?.toISOString() ?? item.createdAt.toISOString(),
      })),
      waterTrend: waterReadings
        .slice()
        .reverse()
        .map((reading) => ({
          time: new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(reading.recordedAt),
          value: decimalToNumber(reading.value),
        })),
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Dashboard database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return demoDashboardSnapshot;
  }
}
