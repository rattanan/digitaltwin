export const DEMO_PROVINCE = {
  nameTh: "สิงห์บุรี",
  nameEn: "Sing Buri",
  code: "17",
  population: 165225,
  areaSqKm: 822.5,
  districts: 6,
  subdistricts: 43,
  villages: 364,
};

export const demoDashboardSnapshot = {
  province: DEMO_PROVINCE,
  metrics: {
    pm25: { value: 18, unit: "µg/m³", status: "ปกติ", trend: -4.2 },
    rainfall: { value: 12.6, unit: "มม.", status: "เฝ้าระวัง", trend: 8.1 },
    waterLevel: { value: 12.45, unit: "เมตร", status: "สูงกว่าค่าปกติ", trend: 3.8 },
    traffic: { value: 48, unit: "กม./ชม.", status: "คล่องตัว", trend: 2.4 },
    waste: { value: 56.8, unit: "ตัน", status: "75% ของเป้าหมาย", trend: 6.5 },
    hospitalBeds: { value: 312, unit: "เตียง", status: "พร้อมรองรับ", trend: 0 },
    emergencyPatients: { value: 27, unit: "ราย", status: "วันนี้", trend: -2.1 },
    tourists: { value: 2350, unit: "คน", status: "วันนี้", trend: 12.4 },
  },
  devices: { online: 118, offline: 7, total: 125 },
  incidents: { open: 12, critical: 3 },
  alerts: { total: 25, critical: 3, high: 6, warning: 7 },
  cctv: { online: 15, offline: 3, maintenance: 1, degraded: 1 },
  news: [
    { title: "แจ้งเตือนระดับน้ำในแม่น้ำเจ้าพระยาเพิ่มขึ้น", severity: "HIGH", time: "10 นาทีที่แล้ว" },
    { title: "ฝนตกหนักในพื้นที่อำเภอพรหมบุรี", severity: "WARNING", time: "32 นาทีที่แล้ว" },
    { title: "ประกาศซ่อมบำรุงระบบ CCTV จุดเสี่ยงน้ำท่วม", severity: "INFO", time: "1 ชั่วโมงที่แล้ว" },
  ],
  waterTrend: [
    { time: "00:00", value: 11.92 },
    { time: "04:00", value: 12.01 },
    { time: "08:00", value: 12.12 },
    { time: "12:00", value: 12.23 },
    { time: "16:00", value: 12.37 },
    { time: "20:00", value: 12.45 },
  ],
  freshness: new Date().toISOString(),
  isDemo: true,
};

export type DashboardSnapshot = typeof demoDashboardSnapshot;
