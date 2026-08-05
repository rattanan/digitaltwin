export const IOT_STATUSES = ["ONLINE", "OFFLINE", "MAINTENANCE", "DEGRADED"] as const;

export type IotStatus = (typeof IOT_STATUSES)[number];

export const IOT_STATUS_LABELS: Record<IotStatus, string> = {
  ONLINE: "ออนไลน์",
  OFFLINE: "ออฟไลน์",
  MAINTENANCE: "ซ่อมบำรุง",
  DEGRADED: "คุณภาพลดลง",
};

export const IOT_TYPE_LABELS: Record<string, string> = {
  WATER: "ระดับน้ำ",
  RAINFALL: "ปริมาณฝน",
  AIR: "คุณภาพอากาศ",
  WASTE: "การจัดเก็บขยะ",
  TRAFFIC: "การจราจร",
  TOURISM: "การท่องเที่ยว",
  HEALTH: "สาธารณสุข",
};

export type IotMetricState = "NORMAL" | "WARNING" | "CRITICAL" | "NO_DATA";

export const IOT_METRIC_STATE_LABELS: Record<IotMetricState, string> = {
  NORMAL: "ปกติ",
  WARNING: "เฝ้าระวัง",
  CRITICAL: "วิกฤต",
  NO_DATA: "ไม่มีข้อมูล",
};

export type IotMetricSummary = {
  id: string;
  metricKey: string;
  nameTh: string;
  unit: string | null;
  warning: number | null;
  critical: number | null;
  latestValue: number | null;
  latestRecordedAt: string | null;
  state: IotMetricState;
  stateLabel: string;
};

export type IotReadingPoint = {
  id: string;
  metricKey: string;
  value: number;
  unit: string | null;
  recordedAt: string;
};

export type IotDeviceSummary = {
  id: string;
  publicId: string;
  deviceCode: string;
  nameTh: string;
  status: IotStatus;
  statusLabel: string;
  battery: number | null;
  lastHeartbeat: string | null;
  type: { id: string; code: string; nameTh: string; nameEn: string | null };
  agencyName: string | null;
  locationName: string | null;
  district: { id: string; code: string; nameTh: string } | null;
  subdistrictName: string | null;
  metrics: IotMetricSummary[];
  readingCount: number;
};

export type IotTypeOption = {
  id: string;
  code: string;
  nameTh: string;
  deviceCount: number;
};

export type IotDistrictOption = {
  id: string;
  code: string;
  nameTh: string;
  deviceCount: number;
};

export type IotOverview = {
  province: { code: string; nameTh: string };
  items: IotDeviceSummary[];
  summary: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    degraded: number;
    lowBattery: number;
    withoutData: number;
  };
  types: IotTypeOption[];
  districts: IotDistrictOption[];
  pagination: { page: number; limit: number; total: number };
  freshness: string;
  isDemo: boolean;
};

export type IotDetail = IotDeviceSummary & {
  readings: IotReadingPoint[];
};
