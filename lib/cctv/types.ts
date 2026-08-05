export const CCTV_STATUSES = ["ONLINE", "OFFLINE", "MAINTENANCE", "DEGRADED"] as const;

export type CctvStatus = (typeof CCTV_STATUSES)[number];

export const CCTV_STATUS_LABELS: Record<CctvStatus, string> = {
  ONLINE: "ออนไลน์",
  OFFLINE: "ออฟไลน์",
  MAINTENANCE: "ซ่อมบำรุง",
  DEGRADED: "คุณภาพลดลง",
};

export const CCTV_EVENT_LABELS: Record<string, string> = {
  TRAFFIC_CONGESTION: "การจราจรหนาแน่น",
  FLOOD: "น้ำท่วม / น้ำขัง",
  SMOKE: "กลุ่มควัน",
  CROWD: "คนรวมกลุ่ม",
  ILLEGAL_PARKING: "จอดรถกีดขวาง",
  CAMERA_BLOCKED: "มุมกล้องถูกบดบัง",
};

export type CctvSnapshotSummary = {
  id: string;
  capturedAt: string;
  fileModifiedAt: string | null;
  fileSizeBytes: number | null;
};

export type CctvAiEvent = {
  id: string;
  eventType: string;
  eventLabel: string;
  confidence: number;
  detectedAt: string;
  verification: string;
};

export type CctvDistrictOption = {
  id: string;
  code: string;
  nameTh: string;
  cameraCount: number;
};

export type CctvCameraSummary = {
  id: string;
  publicId: string;
  cameraCode: string;
  nameTh: string;
  nameEn: string | null;
  status: CctvStatus;
  statusLabel: string;
  lastImageAt: string | null;
  lastHeartbeat: string | null;
  latitude: number | null;
  longitude: number | null;
  agencyName: string | null;
  locationName: string | null;
  district: { id: string; nameTh: string } | null;
  subdistrictName: string | null;
  latestSnapshot: CctvSnapshotSummary | null;
  snapshotCount: number;
  aiEventCount: number;
};

export type CctvOverview = {
  province: { code: string; nameTh: string };
  items: CctvCameraSummary[];
  summary: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    degraded: number;
  };
  districts: CctvDistrictOption[];
  pagination: { page: number; limit: number; total: number };
  freshness: string;
  isDemo: boolean;
};

export type CctvDetail = CctvCameraSummary & {
  snapshots: CctvSnapshotSummary[];
  aiEvents: CctvAiEvent[];
};
