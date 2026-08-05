export const MAP_LAYER_IDS = ["districts", "subdistricts", "locations", "cameras"] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

export type MapAreaLevel = "PROVINCE" | "DISTRICT" | "SUBDISTRICT";

export type MapMarkerKind = "LOCATION" | "CAMERA";

export const COMMAND_MAP_KINDS = ["LOCATION", "IOT", "CCTV", "ALERT", "INCIDENT"] as const;

export type CommandMapKind = (typeof COMMAND_MAP_KINDS)[number];

export type MapMarkerStatus =
  | "NORMAL"
  | "WARNING"
  | "CRITICAL"
  | "OFFLINE"
  | "MAINTENANCE"
  | "DEGRADED";

export type MapArea = {
  id: string;
  code: string;
  level: MapAreaLevel;
  nameTh: string;
  nameEn: string | null;
  parentName: string | null;
  latitude: number;
  longitude: number;
  population: number | null;
};

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  code: string;
  title: string;
  subtitle: string | null;
  category: string;
  categoryLabel: string;
  status: MapMarkerStatus;
  statusLabel: string;
  latitude: number;
  longitude: number;
  parentName: string | null;
  districtId: string | null;
  lastSeenAt: string | null;
};

export type CommandMapMetric = {
  key: string;
  label: string;
  value: number;
  unit: string | null;
  state: "NORMAL" | "WARNING" | "CRITICAL" | "NO_DATA";
};

export type CommandMapFeature = {
  id: string;
  kind: CommandMapKind;
  code: string;
  coordinates: [number, number];
  districtId: string | null;
  districtName: string | null;
  title: string;
  categoryLabel: string;
  status: MapMarkerStatus;
  statusLabel: string;
  lastUpdatedAt: string | null;
  summary: string;
  metrics: CommandMapMetric[];
  destinationHref: string;
};

export type MapSnapshot = {
  province: {
    id: string;
    code: string;
    nameTh: string;
    nameEn: string | null;
    center: [number, number];
  };
  areas: MapArea[];
  markers: MapMarker[];
  commandFeatures: CommandMapFeature[];
  boundary: {
    url: string;
    version: string;
    attribution: string;
  };
  bounds: [number, number, number, number] | null;
  counts: {
    districts: number;
    subdistricts: number;
    locations: number;
    cameras: number;
    iot: number;
    alerts: number;
    incidents: number;
  };
  capabilities: {
    cameras: boolean;
    iot: boolean;
    alerts: boolean;
    incidents: boolean;
  };
  freshness: string;
  isDemo: boolean;
};
