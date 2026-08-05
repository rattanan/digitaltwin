import { DEMO_PROVINCE } from "@/lib/demo-data";
import {
  ALERT_FINAL_STATUSES,
  ALERT_SEVERITY_LABELS,
  ALERT_SOURCE_LABELS,
  ALERT_STATUS_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_FINAL_STATUSES,
  INCIDENT_STATUS_LABELS,
  type AlertDetail,
  type AlertItem,
  type AlertOverview,
  type AlertSeverity,
  type AlertSource,
  type AlertStatus,
  type IncidentDetail,
  type IncidentItem,
  type IncidentOverview,
  type IncidentStatus,
  type OperationHistory,
} from "@/lib/operations/types";

const DEMO_NOW = "2026-08-05T13:00:00.000Z";

const districtSeeds = [
  ["demo-district-1701", "1701", "เมืองสิงห์บุรี"],
  ["demo-district-1702", "1702", "บางระจัน"],
  ["demo-district-1703", "1703", "ค่ายบางระจัน"],
  ["demo-district-1704", "1704", "พรหมบุรี"],
  ["demo-district-1705", "1705", "ท่าช้าง"],
  ["demo-district-1706", "1706", "อินทร์บุรี"],
] as const;

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

function hoursAgo(hours: number) {
  return new Date(new Date(DEMO_NOW).getTime() - hours * 60 * 60 * 1000).toISOString();
}

function district(index: number) {
  const [id, , nameTh] = districtSeeds[index % districtSeeds.length];
  return { id, nameTh };
}

function alertReference(index: number, kind: "camera" | "device") {
  if (kind === "camera" && index % 4 === 0) {
    const number = String((index % 20) + 1).padStart(3, "0");
    return { id: `demo-camera-${number}`, code: `CCTV-SB-${number}`, nameTh: `จุด CCTV ${number}` };
  }
  if (kind === "device" && index % 3 === 0) {
    const number = String((index % 8) + 1).padStart(3, "0");
    return { id: `demo-device-${number}`, code: `WATER-SB-${number}`, nameTh: `อุปกรณ์ตรวจวัด ${number}` };
  }
  return null;
}

function createAlert(index: number): AlertItem {
  const [title, description, source, severity, status] = alertSeeds[index];
  const alertSource = source as AlertSource;
  const alertSeverity = severity as AlertSeverity;
  const alertStatus = status as AlertStatus;
  const createdAt = hoursAgo(index + 1);
  const isFinal = ALERT_FINAL_STATUSES.includes(alertStatus);
  return {
    id: `demo-alert-${String(index + 1).padStart(3, "0")}`,
    publicId: `demo-alert-${String(index + 1).padStart(3, "0")}`,
    title,
    description,
    source: alertSource,
    sourceLabel: ALERT_SOURCE_LABELS[alertSource],
    severity: alertSeverity,
    severityLabel: ALERT_SEVERITY_LABELS[alertSeverity],
    status: alertStatus,
    statusLabel: ALERT_STATUS_LABELS[alertStatus],
    createdAt,
    updatedAt: hoursAgo(Math.max(0, index - 1)),
    acknowledgedAt: alertStatus === "NEW" ? null : hoursAgo(index),
    resolvedAt: isFinal ? hoursAgo(Math.max(0, index - 0.5)) : null,
    agencyName: index % 3 === 0 ? "สำนักงานป้องกันและบรรเทาสาธารณภัย" : "ศูนย์บัญชาการจังหวัด",
    locationName: index % 5 === 0 ? "สถานีตรวจวัด C7.A" : null,
    district: district(index),
    camera: alertReference(index, "camera"),
    device: alertReference(index, "device"),
    linkedIncidentCount: index < incidentSeeds.length ? 1 : index % 6 === 0 ? 1 : 0,
  };
}

const allDemoAlerts = alertSeeds.map((_, index) => createAlert(index));

function createIncident(index: number): IncidentItem {
  const [title, description, category, severity, status] = incidentSeeds[index];
  const incidentCategory = category as IncidentItem["category"];
  const incidentSeverity = severity as AlertSeverity;
  const incidentStatus = status as IncidentStatus;
  const dueAt = new Date(new Date(DEMO_NOW).getTime() + (index % 4 === 0 ? -2 : 6 + index) * 60 * 60 * 1000).toISOString();
  const isFinal = INCIDENT_FINAL_STATUSES.includes(incidentStatus);
  return {
    id: `demo-incident-${String(index + 1).padStart(3, "0")}`,
    publicId: `demo-incident-${String(index + 1).padStart(3, "0")}`,
    incidentNo: `INC-SB-${String(index + 1).padStart(4, "0")}`,
    title,
    description,
    category: incidentCategory,
    categoryLabel: INCIDENT_CATEGORY_LABELS[incidentCategory],
    severity: incidentSeverity,
    severityLabel: ALERT_SEVERITY_LABELS[incidentSeverity],
    status: incidentStatus,
    statusLabel: INCIDENT_STATUS_LABELS[incidentStatus],
    dueAt,
    createdAt: hoursAgo(index + 2),
    updatedAt: hoursAgo(Math.max(0, index - 1)),
    closedAt: isFinal ? hoursAgo(Math.max(0, index - 0.25)) : null,
    resolution: isFinal ? "ดำเนินการตามแผนและปิดติดตามแล้ว" : null,
    isOverdue: !isFinal && new Date(dueAt).getTime() < new Date(DEMO_NOW).getTime(),
    agencyName: index % 2 === 0 ? "สำนักงานป้องกันและบรรเทาสาธารณภัย" : "ศูนย์บัญชาการจังหวัด",
    locationName: index % 3 === 0 ? "พื้นที่เฝ้าระวังจังหวัดสิงห์บุรี" : null,
    district: district(index),
    alert: {
      id: `demo-alert-${String(index + 1).padStart(3, "0")}`,
      title: allDemoAlerts[index].title,
      severity: allDemoAlerts[index].severity,
      severityLabel: allDemoAlerts[index].severityLabel,
      status: allDemoAlerts[index].status,
      statusLabel: allDemoAlerts[index].statusLabel,
    },
    camera: index % 3 === 0 ? alertReference(index, "camera") : null,
    device: index % 2 === 0 ? alertReference(index, "device") : null,
  };
}

const allDemoIncidents = incidentSeeds.map((_, index) => createIncident(index));

function matchesSearch(values: (string | null | undefined)[], search?: string) {
  const normalized = search?.trim().toLocaleLowerCase("th-TH");
  if (!normalized) return true;
  return values.filter(Boolean).some((value) => value!.toLocaleLowerCase("th-TH").includes(normalized));
}

function alertHistory(alert: AlertItem): OperationHistory[] {
  return [
    { id: `${alert.id}-created`, state: "CREATED", stateLabel: "สร้างรายการ", note: "ตรวจพบจากระบบข้อมูลสาธิต", actorName: null, createdAt: alert.createdAt },
    ...(alert.status !== "NEW" ? [{ id: `${alert.id}-status`, state: alert.status, stateLabel: alert.statusLabel, note: "อัปเดตสถานะจากศูนย์บัญชาการ", actorName: "เจ้าหน้าที่ศูนย์บัญชาการ", createdAt: alert.updatedAt }] : []),
  ];
}

function incidentHistory(incident: IncidentItem): OperationHistory[] {
  return [
    { id: `${incident.id}-detected`, state: "DETECTED", stateLabel: "ตรวจพบ", note: "ตรวจพบจากข้อมูลสาธิต", actorName: null, createdAt: incident.createdAt },
    ...(incident.status !== "DETECTED" ? [{ id: `${incident.id}-status`, state: incident.status, stateLabel: incident.statusLabel, note: "อัปเดตสถานะจาก workflow เหตุการณ์", actorName: "เจ้าหน้าที่ศูนย์บัญชาการ", createdAt: incident.updatedAt }] : []),
  ];
}

const demoAlertDistricts = districtSeeds.map(([id, code, nameTh]) => ({ id, code, nameTh, itemCount: allDemoAlerts.filter((item) => item.district?.id === id).length }));
const demoIncidentDistricts = districtSeeds.map(([id, code, nameTh]) => ({ id, code, nameTh, itemCount: allDemoIncidents.filter((item) => item.district?.id === id).length }));

export function createDemoAlertOverview(options: { page?: number; limit?: number; search?: string; status?: AlertStatus; severity?: AlertSeverity; source?: AlertSource; districtId?: string } = {}): AlertOverview {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const filtered = allDemoAlerts.filter((item) => (
    (!options.status || item.status === options.status)
    && (!options.severity || item.severity === options.severity)
    && (!options.source || item.source === options.source)
    && (!options.districtId || item.district?.id === options.districtId)
    && matchesSearch([item.title, item.description, item.sourceLabel, item.district?.nameTh], options.search)
  ));
  const summary = allDemoAlerts.reduce((result, item) => {
    result.total += 1;
    if (!ALERT_FINAL_STATUSES.includes(item.status)) result.open += 1;
    if (item.status === "NEW") result.new += 1;
    if (item.severity === "CRITICAL" && !ALERT_FINAL_STATUSES.includes(item.status)) result.critical += 1;
    if (item.severity === "HIGH" && !ALERT_FINAL_STATUSES.includes(item.status)) result.high += 1;
    if (item.severity === "WARNING" && !ALERT_FINAL_STATUSES.includes(item.status)) result.warning += 1;
    if (ALERT_FINAL_STATUSES.includes(item.status)) result.resolved += 1;
    return result;
  }, { total: 0, open: 0, new: 0, critical: 0, high: 0, warning: 0, resolved: 0 });
  return { province: { code: DEMO_PROVINCE.code, nameTh: DEMO_PROVINCE.nameTh }, items: filtered.slice((page - 1) * limit, page * limit), summary, districts: demoAlertDistricts, pagination: { page, limit, total: filtered.length }, freshness: new Date().toISOString(), isDemo: true };
}

export function createDemoAlertDetail(id: string): AlertDetail | null {
  const alert = allDemoAlerts.find((item) => item.id === id || item.publicId === id);
  if (!alert) return null;
  return {
    ...alert,
    history: alertHistory(alert),
    incidents: allDemoIncidents.filter((incident) => incident.alert?.id === alert.id).map((incident) => ({ id: incident.id, incidentNo: incident.incidentNo, title: incident.title, status: incident.status, statusLabel: incident.statusLabel, severity: incident.severity, severityLabel: incident.severityLabel })),
  };
}

export function createDemoIncidentOverview(options: { page?: number; limit?: number; search?: string; status?: IncidentStatus; severity?: AlertSeverity; category?: IncidentItem["category"]; districtId?: string } = {}): IncidentOverview {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const filtered = allDemoIncidents.filter((item) => (
    (!options.status || item.status === options.status)
    && (!options.severity || item.severity === options.severity)
    && (!options.category || item.category === options.category)
    && (!options.districtId || item.district?.id === options.districtId)
    && matchesSearch([item.incidentNo, item.title, item.description, item.categoryLabel, item.district?.nameTh], options.search)
  ));
  const summary = allDemoIncidents.reduce((result, item) => {
    result.total += 1;
    if (!INCIDENT_FINAL_STATUSES.includes(item.status)) result.open += 1;
    if (item.severity === "CRITICAL" && !INCIDENT_FINAL_STATUSES.includes(item.status)) result.critical += 1;
    if (item.isOverdue) result.due += 1;
    if (INCIDENT_FINAL_STATUSES.includes(item.status)) result.resolved += 1;
    return result;
  }, { total: 0, open: 0, critical: 0, due: 0, resolved: 0 });
  return { province: { code: DEMO_PROVINCE.code, nameTh: DEMO_PROVINCE.nameTh }, items: filtered.slice((page - 1) * limit, page * limit), summary, districts: demoIncidentDistricts, pagination: { page, limit, total: filtered.length }, freshness: new Date().toISOString(), isDemo: true };
}

export function createDemoIncidentDetail(id: string): IncidentDetail | null {
  const incident = allDemoIncidents.find((item) => item.id === id || item.publicId === id);
  return incident ? { ...incident, history: incidentHistory(incident) } : null;
}

export { allDemoAlerts, allDemoIncidents };
