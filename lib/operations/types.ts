export const ALERT_SEVERITIES = ["INFO", "LOW", "WARNING", "HIGH", "CRITICAL"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_STATUSES = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const ALERT_SOURCES = ["IOT", "CCTV", "CCTV_AI", "RULE", "MANUAL"] as const;
export type AlertSource = (typeof ALERT_SOURCES)[number];

export const INCIDENT_CATEGORIES = ["FLOOD", "ACCIDENT", "CCTV", "FIRE_RISK", "IOT", "WASTE", "TRAFFIC", "AIR_QUALITY", "OTHER"] as const;
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const INCIDENT_STATUSES = ["DETECTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "MONITORING", "RESOLVED", "CLOSED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: "ข้อมูล",
  LOW: "ต่ำ",
  WARNING: "เฝ้าระวัง",
  HIGH: "สูง",
  CRITICAL: "วิกฤต",
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  NEW: "ใหม่",
  ACKNOWLEDGED: "รับทราบแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "แก้ไขแล้ว",
  DISMISSED: "ยกเลิก",
};

export const ALERT_SOURCE_LABELS: Record<AlertSource, string> = {
  IOT: "IoT",
  CCTV: "CCTV",
  CCTV_AI: "CCTV · AI",
  RULE: "กฎแจ้งเตือน",
  MANUAL: "บันทึกด้วยมือ",
};

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  FLOOD: "น้ำท่วม / น้ำเอ่อล้น",
  ACCIDENT: "อุบัติเหตุ",
  CCTV: "ระบบ CCTV",
  FIRE_RISK: "ความเสี่ยงอัคคีภัย",
  IOT: "อุปกรณ์ IoT",
  WASTE: "การจัดการขยะ",
  TRAFFIC: "การจราจร",
  AIR_QUALITY: "คุณภาพอากาศ",
  OTHER: "อื่น ๆ",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  DETECTED: "ตรวจพบ",
  VERIFIED: "ยืนยันแล้ว",
  ASSIGNED: "มอบหมายแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  MONITORING: "เฝ้าติดตาม",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิดเหตุการณ์",
};

export const ALERT_FINAL_STATUSES: AlertStatus[] = ["RESOLVED", "DISMISSED"];
export const INCIDENT_FINAL_STATUSES: IncidentStatus[] = ["RESOLVED", "CLOSED"];

export type OperationDistrictOption = { id: string; code: string; nameTh: string; itemCount: number };
export type OperationReference = { id: string; code: string; nameTh: string };
export type OperationHistory = { id: string; state: string; stateLabel: string; note: string | null; actorName: string | null; createdAt: string };

export type AlertCctvEvidence = {
  camera: OperationReference;
  imageUrl: string | null;
  capturedAt: string | null;
};

export type AlertIotMetricEvidence = {
  id: string;
  metricKey: string;
  nameTh: string;
  unit: string | null;
  warning: number | null;
  critical: number | null;
  latestValue: number | null;
  latestRecordedAt: string | null;
  state: "NORMAL" | "WARNING" | "CRITICAL" | "NO_DATA";
  stateLabel: string;
};

export type AlertIotEvidence = {
  device: OperationReference;
  metrics: AlertIotMetricEvidence[];
};

export type AlertItem = {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  source: AlertSource;
  sourceLabel: string;
  severity: AlertSeverity;
  severityLabel: string;
  status: AlertStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  agencyName: string | null;
  locationName: string | null;
  district: { id: string; nameTh: string } | null;
  camera: OperationReference | null;
  device: OperationReference | null;
  linkedIncidentCount: number;
};

export type AlertDetail = AlertItem & {
  cctvEvidence: AlertCctvEvidence | null;
  iotEvidence: AlertIotEvidence | null;
  history: OperationHistory[];
  incidents: { id: string; incidentNo: string; title: string; status: IncidentStatus; statusLabel: string; severity: AlertSeverity; severityLabel: string }[];
};

export type AlertOverview = {
  province: { code: string; nameTh: string };
  items: AlertItem[];
  summary: { total: number; open: number; new: number; critical: number; high: number; warning: number; resolved: number };
  districts: OperationDistrictOption[];
  pagination: { page: number; limit: number; total: number };
  freshness: string;
  isDemo: boolean;
};

export type IncidentItem = {
  id: string;
  publicId: string;
  incidentNo: string;
  title: string;
  description: string | null;
  category: IncidentCategory;
  categoryLabel: string;
  severity: AlertSeverity;
  severityLabel: string;
  status: IncidentStatus;
  statusLabel: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  resolution: string | null;
  isOverdue: boolean;
  agencyName: string | null;
  locationName: string | null;
  district: { id: string; nameTh: string } | null;
  alert: { id: string; title: string; severity: AlertSeverity; severityLabel: string; status: AlertStatus; statusLabel: string } | null;
  camera: OperationReference | null;
  device: OperationReference | null;
};

export type IncidentDetail = IncidentItem & {
  history: OperationHistory[];
};

export type IncidentOverview = {
  province: { code: string; nameTh: string };
  items: IncidentItem[];
  summary: { total: number; open: number; critical: number; due: number; resolved: number };
  districts: OperationDistrictOption[];
  pagination: { page: number; limit: number; total: number };
  freshness: string;
  isDemo: boolean;
};

export function isAlertSeverity(value: string): value is AlertSeverity {
  return ALERT_SEVERITIES.includes(value as AlertSeverity);
}

export function isAlertStatus(value: string): value is AlertStatus {
  return ALERT_STATUSES.includes(value as AlertStatus);
}

export function isAlertSource(value: string): value is AlertSource {
  return ALERT_SOURCES.includes(value as AlertSource);
}

export function isIncidentCategory(value: string): value is IncidentCategory {
  return INCIDENT_CATEGORIES.includes(value as IncidentCategory);
}

export function isIncidentStatus(value: string): value is IncidentStatus {
  return INCIDENT_STATUSES.includes(value as IncidentStatus);
}
