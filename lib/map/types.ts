export const MAP_LAYER_IDS = ["districts", "subdistricts", "locations", "cameras"] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

export type MapAreaLevel = "PROVINCE" | "DISTRICT" | "SUBDISTRICT";

export type MapMarkerKind = "LOCATION" | "CAMERA";

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
  lastSeenAt: string | null;
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
  bounds: [number, number, number, number] | null;
  counts: {
    districts: number;
    subdistricts: number;
    locations: number;
    cameras: number;
  };
  capabilities: {
    cameras: boolean;
  };
  freshness: string;
  isDemo: boolean;
};
