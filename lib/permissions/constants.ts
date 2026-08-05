export const ROLE_CODES = [
  "SUPER_ADMIN",
  "PROVINCIAL_ADMIN",
  "AGENCY_ADMIN",
  "COMMAND_CENTER_OPERATOR",
  "CCTV_OPERATOR",
  "IOT_OPERATOR",
  "ANALYST",
  "EXECUTIVE",
  "VIEWER",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_DEFINITIONS = [
  ["dashboard.read", "dashboard", "read", "ดูแดชบอร์ด", "View dashboard"],
  ["alerts.read", "alerts", "read", "ดูการแจ้งเตือน", "View alerts"],
  ["alerts.manage", "alerts", "manage", "จัดการการแจ้งเตือน", "Manage alerts"],
  ["incidents.read", "incidents", "read", "ดูเหตุการณ์", "View incidents"],
  ["incidents.manage", "incidents", "manage", "จัดการเหตุการณ์", "Manage incidents"],
  ["ai.read", "ai", "read", "ดู AI Copilot", "View AI Copilot"],
  ["ai.use", "ai", "use", "ใช้งาน AI Copilot", "Use AI Copilot"],
  ["cctv.read", "cctv", "read", "ดูกล้อง CCTV", "View CCTV"],
  ["cctv.manage", "cctv", "manage", "จัดการกล้อง CCTV", "Manage CCTV"],
  ["iot.read", "iot", "read", "ดูอุปกรณ์ IoT", "View IoT"],
  ["iot.manage", "iot", "manage", "จัดการอุปกรณ์ IoT", "Manage IoT"],
  ["users.read", "users", "read", "ดูผู้ใช้งาน", "View users"],
  ["users.create", "users", "create", "สร้างผู้ใช้งาน", "Create users"],
  ["users.update", "users", "update", "แก้ไขผู้ใช้งาน", "Update users"],
  ["users.delete", "users", "delete", "ลบผู้ใช้งาน", "Delete users"],
  ["roles.read", "roles", "read", "ดูบทบาท", "View roles"],
  ["roles.manage", "roles", "manage", "จัดการบทบาท", "Manage roles"],
  ["agencies.read", "agencies", "read", "ดูหน่วยงาน", "View agencies"],
  ["agencies.manage", "agencies", "manage", "จัดการหน่วยงาน", "Manage agencies"],
  ["areas.read", "areas", "read", "ดูพื้นที่ปกครอง", "View areas"],
  ["areas.manage", "areas", "manage", "จัดการพื้นที่ปกครอง", "Manage areas"],
  ["audit.read", "audit", "read", "ดูประวัติการใช้งาน", "View audit logs"],
  ["settings.manage", "settings", "manage", "จัดการการตั้งค่า", "Manage settings"],
  ["exports.create", "exports", "create", "ส่งออกข้อมูล", "Export data"],
] as const;

export type PermissionCode = (typeof PERMISSION_DEFINITIONS)[number][0];
