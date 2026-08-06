"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { Activity, BellRing, Camera, ChevronRight, CircleAlert, CloudRain, Droplets, Expand, Layers3, LocateFixed, MapPin, RadioTower, RefreshCw, Siren, Thermometer, Wind, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pointInBoundaryGeometry } from "@/lib/map/geometry";
import { createSpiderfyPoints } from "@/lib/map/spiderfy";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type { CommandMapFeature, CommandMapKind, MapMarkerStatus, MapSnapshot } from "@/lib/map/types";

type BoundaryFeature = {
  type: "Feature";
  properties: { code: string; nameTh: string; nameEn: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
};

type BoundaryCollection = { type: "FeatureCollection"; features: BoundaryFeature[] };
type MapApiPayload = { success?: boolean; data?: MapSnapshot; message?: string };
type ProjectedDistrict = { code: string; name: string; path: string; labelX: number; labelY: number };
type ProjectedMarker = { x: number; y: number; featureIds: string[]; anchorX?: number; anchorY?: number };

const fallbackStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
  },
  layers: [
    { id: "command-fallback-background", type: "background", paint: { "background-color": "#06111e" } },
    { id: "command-fallback-map", type: "raster", source: "openstreetmap", paint: { "raster-opacity": 0.3, "raster-saturation": -0.82, "raster-contrast": 0.22, "raster-brightness-max": 0.42 } },
  ],
};

const commandMapStyle: string | StyleSpecification = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || fallbackStyle;

const kindMeta: Record<CommandMapKind, { label: string; short: string; icon: LucideIcon; tone: string }> = {
  LOCATION: { label: "จุดสำคัญ", short: "◆", icon: MapPin, tone: "text-amber-200 bg-amber-300/10" },
  IOT: { label: "IoT", short: "I", icon: RadioTower, tone: "text-emerald-200 bg-emerald-300/10" },
  CCTV: { label: "CCTV", short: "C", icon: Camera, tone: "text-violet-200 bg-violet-300/10" },
  ALERT: { label: "แจ้งเตือน", short: "!", icon: BellRing, tone: "text-rose-200 bg-rose-300/10" },
  INCIDENT: { label: "เหตุการณ์", short: "▲", icon: Siren, tone: "text-orange-200 bg-orange-300/10" },
};

const statusTone: Record<MapMarkerStatus, string> = {
  NORMAL: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  WARNING: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  CRITICAL: "border-rose-300/30 bg-rose-300/12 text-rose-100",
  OFFLINE: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  MAINTENANCE: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  DEGRADED: "border-violet-300/25 bg-violet-300/10 text-violet-100",
};

function geometryBounds(geometry: BoundaryFeature["geometry"]) {
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  function visit(value: unknown) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      bounds[0] = Math.min(bounds[0], value[0]);
      bounds[1] = Math.min(bounds[1], value[1]);
      bounds[2] = Math.max(bounds[2], value[0]);
      bounds[3] = Math.max(bounds[3], value[1]);
      return;
    }
    value.forEach(visit);
  }
  visit(geometry.coordinates);
  return bounds.every(Number.isFinite) ? bounds : null;
}

function featurePriority(feature: CommandMapFeature) {
  const status = { CRITICAL: 0, OFFLINE: 1, WARNING: 2, MAINTENANCE: 3, DEGRADED: 4, NORMAL: 5 }[feature.status];
  const kind = { INCIDENT: 0, ALERT: 1, IOT: 2, CCTV: 3, LOCATION: 4 }[feature.kind];
  return status * 10 + kind;
}

function sensorIconKind(feature: CommandMapFeature) {
  if (feature.kind !== "IOT") return "GENERIC";
  const source = [feature.code, feature.categoryLabel, ...feature.metrics.flatMap((metric) => [metric.key, metric.label, metric.unit ?? ""])].join(" ").toLocaleLowerCase("th-TH");
  if (/(น้ำ|water)/i.test(source)) return "WATER";
  if (/(ฝน|rain)/i.test(source)) return "RAIN";
  if (/(อากาศ|pm2[._ -]?5|air)/i.test(source)) return "AIR";
  if (/(อุณหภูมิ|temperature|temp)/i.test(source)) return "TEMPERATURE";
  return "GENERIC";
}

function FeatureIcon({ feature, className, ariaHidden }: { feature: CommandMapFeature; className?: string; ariaHidden?: boolean }) {
  if (feature.kind === "IOT") {
    const sensorKind = sensorIconKind(feature);
    if (sensorKind === "WATER") return <Droplets className={className} aria-hidden={ariaHidden} />;
    if (sensorKind === "RAIN") return <CloudRain className={className} aria-hidden={ariaHidden} />;
    if (sensorKind === "AIR") return <Wind className={className} aria-hidden={ariaHidden} />;
    if (sensorKind === "TEMPERATURE") return <Thermometer className={className} aria-hidden={ariaHidden} />;
    return <Activity className={className} aria-hidden={ariaHidden} />;
  }
  if (feature.kind === "CCTV") return <Camera className={className} aria-hidden={ariaHidden} />;
  if (feature.kind === "LOCATION") return <MapPin className={className} aria-hidden={ariaHidden} />;
  if (feature.kind === "ALERT") return <BellRing className={className} aria-hidden={ariaHidden} />;
  return <Siren className={className} aria-hidden={ariaHidden} />;
}

function formatMetricBadge(metric: CommandMapFeature["metrics"][number] | undefined) {
  if (!metric) return "—";
  return `${formatNumber(metric.value, { maximumFractionDigits: 2 })}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function FeaturePinBadge({ feature }: { feature: CommandMapFeature }) {
  if (feature.kind === "CCTV" && feature.previewImageUrl) {
    return <span className="absolute -right-3 -top-3 overflow-hidden rounded-md border border-slate-950/80 bg-slate-950 shadow-lg" title="ภาพ Preview ล่าสุด"><Image src={feature.previewImageUrl} alt={`ภาพล่าสุด ${feature.title}`} width={36} height={24} className="size-9 object-cover" /></span>;
  }
  if (feature.kind === "IOT") {
    const metric = feature.metrics[0];
    return <span className={cn("absolute -right-7 -top-3 max-w-[84px] truncate rounded-full border px-1.5 py-0.5 text-[8px] font-semibold leading-3 shadow-lg backdrop-blur", statusTone[feature.status])} title={metric ? `${metric.label}: ${formatMetricBadge(metric)}` : "ยังไม่มีค่าล่าสุด"}>{formatMetricBadge(metric)}</span>;
  }
  return null;
}

function geometryRings(geometry: BoundaryFeature["geometry"]) {
  const rings: number[][][] = [];
  function visit(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) return;
    if (Array.isArray(value[0]) && typeof value[0][0] === "number") {
      rings.push(value as number[][]);
      return;
    }
    value.forEach(visit);
  }
  visit(geometry.coordinates);
  return rings;
}

function DetailPanel({ feature, onClose }: { feature: CommandMapFeature; onClose: () => void }) {
  const meta = kindMeta[feature.kind];
  return <aside role="dialog" className="absolute inset-x-3 bottom-3 z-30 max-h-[72%] overflow-y-auto rounded-2xl border border-white/15 bg-[#091624]/95 p-4 shadow-2xl backdrop-blur-xl motion-safe:animate-[command-panel-in_.24s_ease-out] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[350px] sm:max-h-[calc(100%-2rem)]" aria-label={`รายละเอียด ${feature.title}`}>
    <div className="flex items-start gap-3">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", meta.tone)}><FeatureIcon feature={feature} className="size-5" ariaHidden /></span>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-200/70">{meta.label} · {feature.code}</p><h3 className="mt-1 text-base font-semibold leading-6 text-white">{feature.title}</h3></div>
      <button type="button" onClick={onClose} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" aria-label="ปิดรายละเอียด"><X className="size-4" /></button>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><Badge className={statusTone[feature.status]}>{feature.statusLabel}</Badge><span className="text-[11px] text-slate-400">{feature.categoryLabel}</span></div>
    <p className="mt-4 text-sm leading-6 text-slate-300">{feature.summary}</p>
    {feature.kind === "CCTV" && feature.previewImageUrl && <div className="relative mt-4 aspect-video overflow-hidden rounded-xl border border-violet-200/15 bg-slate-950"><Image src={feature.previewImageUrl} alt={`ภาพ Preview ล่าสุดจาก ${feature.title}`} fill sizes="(max-width: 640px) 100vw, 350px" className="object-cover" /><span className="absolute left-2 top-2 rounded-full border border-white/15 bg-slate-950/75 px-2 py-1 text-[9px] font-medium text-violet-100 backdrop-blur">ภาพล่าสุด</span></div>}
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><p className="text-[10px] text-slate-500">พื้นที่</p><p className="mt-1 text-slate-200">{feature.districtName ?? "จังหวัดสิงห์บุรี"}</p></div>
      <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><p className="text-[10px] text-slate-500">ข้อมูลล่าสุด</p><p className="mt-1 text-slate-200">{feature.lastUpdatedAt ? formatDateTime(feature.lastUpdatedAt) : "ข้อมูลคงที่"}</p></div>
    </div>
    {feature.metrics.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{feature.metrics.map((metric) => <div key={metric.key} className="rounded-xl border border-cyan-200/10 bg-cyan-200/[.04] p-3"><p className="text-[10px] text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-semibold text-cyan-50">{formatNumber(metric.value, { maximumFractionDigits: 2 })} <span className="text-[10px] font-normal text-slate-500">{metric.unit}</span></p></div>)}</div>}
    <Button asChild className="mt-4 w-full"><Link href={feature.destinationHref}>{feature.kind === "CCTV" ? "เปิดรายละเอียดกล้อง" : feature.kind === "IOT" ? "เปิดรายละเอียดอุปกรณ์" : "เปิดรายละเอียดในระบบ"} <ChevronRight className="size-4" /></Link></Button>
  </aside>;
}

export function CommandMap({ initialSnapshot }: { initialSnapshot: MapSnapshot }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const boundaryRef = useRef<BoundaryCollection | null>(null);
  const snapshotRef = useRef(initialSnapshot);
  const visibleFeaturesRef = useRef<CommandMapFeature[]>(initialSnapshot.commandFeatures);
  const selectedIdRef = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ id: string; code: string; name: string; geometry: BoundaryFeature["geometry"] } | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState("");
  const [projectedDistricts, setProjectedDistricts] = useState<ProjectedDistrict[]>([]);
  const [projectedMarkers, setProjectedMarkers] = useState<ProjectedMarker[]>([]);
  const [activeKinds, setActiveKinds] = useState<Record<CommandMapKind, boolean>>({ LOCATION: true, IOT: true, CCTV: true, ALERT: true, INCIDENT: true });

  const availableKinds = useMemo(() => (Object.keys(kindMeta) as CommandMapKind[]).filter((kind) => snapshot.commandFeatures.some((feature) => feature.kind === kind)), [snapshot.commandFeatures]);
  const filteredFeatures = useMemo(() => snapshot.commandFeatures
    .filter((feature) => activeKinds[feature.kind] && (!selectedDistrict || pointInBoundaryGeometry(feature.coordinates, selectedDistrict.geometry)))
    .sort((left, right) => featurePriority(left) - featurePriority(right)), [activeKinds, selectedDistrict, snapshot.commandFeatures]);
  const selectedFeature = snapshot.commandFeatures.find((feature) => feature.id === selectedId) ?? null;
  const priorityFeatures = filteredFeatures.slice(0, 5);

  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const fitProvince = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedDistrict(null);
    const current = snapshotRef.current;
    if (current.bounds) map.fitBounds([[current.bounds[0], current.bounds[1]], [current.bounds[2], current.bounds[3]]], { padding: 48, maxZoom: 11, duration: 450 });
    else map.flyTo({ center: current.province.center, zoom: 9.4, duration: 450 });
  }, []);

  const selectFeature = useCallback((id: string) => {
    const feature = snapshotRef.current.commandFeatures.find((item) => item.id === id);
    if (!feature) return;
    setSelectedId(id);
    mapRef.current?.flyTo({ center: feature.coordinates, zoom: Math.max(mapRef.current.getZoom(), 13), duration: 420 });
  }, []);

  const selectBoundary = useCallback((code: string) => {
    const boundaryFeature = boundaryRef.current?.features.find((feature) => feature.properties.code === code);
    const district = snapshotRef.current.areas.find((area) => area.level === "DISTRICT" && area.code === code);
    if (!boundaryFeature || !district) return;
    setSelectedDistrict({ id: district.id, code, name: boundaryFeature.properties.nameTh, geometry: boundaryFeature.geometry });
    setSelectedId(null);
    const bounds = geometryBounds(boundaryFeature.geometry);
    if (bounds) mapRef.current?.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding: 72, maxZoom: 12.5, duration: 500 });
  }, []);

  const projectOverlay = useCallback(() => {
    const map = mapRef.current;
    const boundaries = boundaryRef.current;
    const shell = shellRef.current;
    if (!map || !boundaries || !shell) return;
    const districts = boundaries.features.map((feature) => {
      const projectedRings = geometryRings(feature.geometry).map((ring) => ring.map(([longitude, latitude]) => map.project([longitude, latitude])));
      const points = projectedRings.flat();
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      return {
        code: feature.properties.code,
        name: feature.properties.nameTh,
        path: projectedRings.map((ring) => ring.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ") + " Z").join(" "),
        labelX: (minX + maxX) / 2,
        labelY: (minY + maxY) / 2,
      };
    });
    const width = shell.clientWidth;
    const height = shell.clientHeight;
    const projected = visibleFeaturesRef.current.flatMap((feature) => {
      const point = map.project(feature.coordinates);
      return point.x < -32 || point.y < -32 || point.x > width + 32 || point.y > height + 32 ? [] : [{ feature, x: point.x, y: point.y }];
    });
    const zoom = map.getZoom();
    const radius = zoom >= 16 ? 6 : zoom >= 15 ? 14 : zoom >= 13 ? 28 : 48;
    const groups: { x: number; y: number; items: typeof projected }[] = [];
    projected.forEach((item) => {
      const forceSingle = item.feature.id === selectedIdRef.current;
      const group = forceSingle ? undefined : groups.find((candidate) => !candidate.items.some((entry) => entry.feature.id === selectedIdRef.current) && Math.hypot(candidate.x - item.x, candidate.y - item.y) < radius);
      if (!group) groups.push({ x: item.x, y: item.y, items: [item] });
      else {
        group.items.push(item);
        group.x = group.items.reduce((sum, entry) => sum + entry.x, 0) / group.items.length;
        group.y = group.items.reduce((sum, entry) => sum + entry.y, 0) / group.items.length;
      }
    });
    setProjectedDistricts(districts);
    const terminalZoom = zoom >= Math.min(16, map.getMaxZoom() - 0.15);
    setProjectedMarkers(groups.flatMap((group) => {
      if (!terminalZoom || group.items.length === 1) {
        return [{ x: group.x, y: group.y, featureIds: group.items.map((item) => item.feature.id) }];
      }
      const points = createSpiderfyPoints({ count: group.items.length, anchorX: group.x, anchorY: group.y, viewportWidth: width, viewportHeight: height });
      return group.items.map((item, index) => ({
        x: points[index].x,
        y: points[index].y,
        anchorX: group.x,
        anchorY: group.y,
        featureIds: [item.feature.id],
      }));
    }));
  }, []);

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | null = null;
    const controller = new AbortController();
    async function initialize() {
      try {
        const initial = snapshotRef.current;
        const [maplibre, boundaryResponse] = await Promise.all([import("maplibre-gl"), fetch(initial.boundary.url, { signal: controller.signal })]);
        if (!boundaryResponse.ok) throw new Error("โหลดขอบเขตอำเภอไม่สำเร็จ");
        const boundaries = await boundaryResponse.json() as BoundaryCollection;
        if (disposed || !containerRef.current) return;
        boundaryRef.current = boundaries;
        map = new maplibre.Map({ container: containerRef.current, style: commandMapStyle, center: initial.province.center, zoom: 9.4, minZoom: 7, maxZoom: 17, attributionControl: false });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
        map.addControl(new maplibre.AttributionControl({ compact: true, customAttribution: initial.boundary.attribution }), "bottom-right");
        let fallbackUsed = false;
        let styleAvailable = false;
        map.on("error", () => {
          if (!map || fallbackUsed || styleAvailable) return;
          fallbackUsed = true;
          setError("ไม่สามารถโหลด basemap หลักได้ กำลังใช้แผนที่สำรอง");
          map.setStyle(fallbackStyle);
        });
        let overlayReady = false;
        let projectionFrame = 0;
        const scheduleProjection = () => {
          window.cancelAnimationFrame(projectionFrame);
          projectionFrame = window.requestAnimationFrame(projectOverlay);
        };
        const setupCommandOverlay = () => {
          if (!map || disposed || overlayReady) return;
          overlayReady = true;
          styleAvailable = true;
          setMapReady(true);
          setLoading(false);
          if (initial.bounds) map.fitBounds([[initial.bounds[0], initial.bounds[1]], [initial.bounds[2], initial.bounds[3]]], { padding: 44, maxZoom: 10.6, duration: 0 });
          map.on("move", scheduleProjection);
          map.on("resize", scheduleProjection);
          window.setTimeout(scheduleProjection, 50);
        };
        map.on("style.load", setupCommandOverlay);
        map.on("load", setupCommandOverlay);
      } catch (cause) {
        if (disposed || controller.signal.aborted) return;
        setLoading(false);
        setMapFailed(true);
        setError(cause instanceof Error ? cause.message : "ไม่สามารถเริ่มต้นแผนที่ได้");
      }
    }
    void initialize();
    return () => { disposed = true; controller.abort(); map?.remove(); mapRef.current = null; };
  }, [projectOverlay]);

  useEffect(() => {
    visibleFeaturesRef.current = filteredFeatures;
    if (!mapReady) return;
    const frame = window.requestAnimationFrame(projectOverlay);
    return () => window.cancelAnimationFrame(frame);
  }, [filteredFeatures, mapReady, projectOverlay]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      setRefreshing(true);
      try {
        const response = await fetch("/api/v1/dashboard/map", { cache: "no-store" });
        const payload = await response.json() as MapApiPayload;
        if (!response.ok || !payload.success || !payload.data) throw new Error(payload.message ?? "รีเฟรชข้อมูลแผนที่ไม่สำเร็จ");
        if (active) { setSnapshot(payload.data); setError(""); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "รีเฟรชข้อมูลแผนที่ไม่สำเร็จ");
      } finally { if (active) setRefreshing(false); }
    }
    const timer = window.setInterval(() => { void refresh(); }, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  function openProjectedMarker(marker: ProjectedMarker) {
    const features = marker.featureIds.flatMap((id) => snapshot.commandFeatures.find((feature) => feature.id === id) ?? []);
    if (features.length === 1) {
      selectFeature(features[0].id);
      return;
    }
    if (features.length > 1) {
      const center: [number, number] = [features.reduce((sum, feature) => sum + feature.coordinates[0], 0) / features.length, features.reduce((sum, feature) => sum + feature.coordinates[1], 0) / features.length];
      setSelectedId(null);
      const map = mapRef.current;
      map?.easeTo({ center, zoom: Math.min(17, (map?.getZoom() ?? 13) + 2), duration: 380 });
    }
  }

  function toggleKind(kind: CommandMapKind) {
    if (selectedFeature?.kind === kind && activeKinds[kind]) setSelectedId(null);
    setActiveKinds((current) => ({ ...current, [kind]: !current[kind] }));
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
    window.setTimeout(() => mapRef.current?.resize(), 100);
  }

  return <section className="overflow-hidden rounded-[1.5rem] border border-cyan-200/10 bg-[#07121e] shadow-[0_30px_90px_rgba(2,8,23,.45)]">
    <div className="flex flex-col gap-4 border-b border-white/[.07] bg-gradient-to-r from-cyan-300/[.06] via-transparent to-violet-300/[.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div><div className="flex items-center gap-2"><MapPin className="size-4 text-cyan-200" /><h3 className="text-sm font-semibold text-white sm:text-base">Command Map · จังหวัดสิงห์บุรี</h3><Badge variant={snapshot.isDemo ? "warning" : "success"}>{snapshot.isDemo ? "DEMO" : "LIVE"}</Badge></div><p className="mt-1 text-xs text-slate-400">เลือกอำเภอแล้วกดกลุ่มหมุดซ้ำเพื่อเห็นตำแหน่งอุปกรณ์จริง พร้อมภาพ CCTV หรือค่าล่าสุดของ Sensor</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] text-slate-500">{formatNumber(filteredFeatures.length)} จุด · อัปเดต {formatDateTime(snapshot.freshness)}</span><Button variant="ghost" size="sm" onClick={fitProvince}><LocateFixed className="size-3.5" />ทั้งจังหวัด</Button><Button variant="outline" size="icon" onClick={() => void toggleFullscreen()} aria-label="แสดงแผนที่เต็มหน้าจอ"><Expand className="size-4" /></Button></div>
    </div>
    <div ref={shellRef} className="map-shell command-map-shell relative min-h-[560px] bg-[#06111e] sm:min-h-[620px] lg:min-h-[65vh] lg:max-h-[820px]">
      <div ref={containerRef} className="absolute inset-0" role="region" aria-label="แผนที่สถานการณ์จังหวัดสิงห์บุรี" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_35%,rgba(3,10,20,.38)_100%)]" />
      <svg className="pointer-events-none absolute inset-0 z-[5] size-full overflow-hidden" aria-hidden="true">
        {projectedDistricts.map((district) => <g key={district.code}>
          <path d={district.path} className={cn("pointer-events-auto cursor-pointer transition-[fill,stroke,opacity] duration-200", selectedDistrict?.code === district.code ? "fill-cyan-300/30 stroke-cyan-100" : "fill-cyan-700/20 stroke-cyan-300/80 hover:fill-cyan-400/25 hover:stroke-cyan-100")} strokeWidth={selectedDistrict?.code === district.code ? 2.8 : 1.8} onClick={() => selectBoundary(district.code)} onMouseEnter={() => setHoveredDistrict(district.name)} onMouseLeave={() => setHoveredDistrict("")} />
          <text x={district.labelX} y={district.labelY} textAnchor="middle" className="select-none fill-cyan-50/80 text-[10px] font-medium [paint-order:stroke] [stroke:#06111e] [stroke-width:3px]">{district.name}</text>
        </g>)}
      </svg>
      <svg className="pointer-events-none absolute inset-0 z-[7] size-full overflow-hidden" aria-hidden="true">
        {projectedMarkers.flatMap((marker) => marker.anchorX === undefined || marker.anchorY === undefined ? [] : <line key={`spider:${marker.featureIds[0]}`} x1={marker.anchorX} y1={marker.anchorY} x2={marker.x} y2={marker.y} stroke="rgba(207,250,254,.42)" strokeWidth="1.5" strokeDasharray="3 4" />)}
      </svg>
      <div className="pointer-events-none absolute inset-0 z-[8]">{projectedMarkers.map((marker) => {
        const features = marker.featureIds.flatMap((id) => snapshot.commandFeatures.find((feature) => feature.id === id) ?? []);
        const primary = features.sort((left, right) => featurePriority(left) - featurePriority(right))[0];
        if (!primary) return null;
        const critical = features.some((feature) => feature.status === "CRITICAL" || feature.status === "OFFLINE");
        return <button key={marker.featureIds.join(":")} type="button" onClick={() => openProjectedMarker(marker)} style={{ left: marker.x, top: marker.y }} className={cn("pointer-events-auto absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-visible rounded-full border-2 border-slate-950/80 text-slate-950 shadow-[0_0_0_5px_rgba(103,232,249,.12),0_8px_24px_rgba(2,8,23,.5)] transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none", primary.kind === "LOCATION" ? "bg-amber-300" : primary.kind === "IOT" ? "bg-emerald-300" : primary.kind === "CCTV" ? "bg-violet-300" : primary.kind === "ALERT" ? "bg-rose-300" : "bg-orange-300", critical && "animate-pulse motion-reduce:animate-none")} aria-label={features.length > 1 ? `กลุ่มข้อมูล ${features.length} จุด กดเพื่อขยาย` : `${primary.title} สถานะ ${primary.statusLabel}`} title={features.length > 1 ? `${features.length} จุด` : primary.title}>{features.length > 1 ? <span className="text-xs font-bold">{features.length}</span> : <FeatureIcon feature={primary} className="size-4" />} {features.length === 1 && <FeaturePinBadge feature={primary} />}</button>;
      })}</div>
      {loading && <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06111e]/95"><div className="text-center"><RefreshCw className="mx-auto size-7 animate-spin motion-reduce:animate-none text-cyan-200" /><p className="mt-3 text-sm text-slate-300">กำลังเตรียม Command Map</p><p className="mt-1 text-xs text-slate-500">โหลดขอบเขตจริงและข้อมูลสถานการณ์</p></div></div>}
      {mapFailed && <div className="absolute inset-0 z-30 overflow-y-auto bg-[#06111e] px-4 pb-24 pt-20 sm:px-6 sm:pt-24"><div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-200" /><div><p className="text-sm font-medium text-slate-100">แสดงข้อมูลแบบรายการแทนแผนที่</p><p className="mt-1 text-xs leading-5 text-slate-400">ยังเลือกจุดและเปิดระบบที่เกี่ยวข้องได้ตามปกติ</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{filteredFeatures.map((feature) => <button key={`fallback:${feature.kind}:${feature.id}`} type="button" onClick={() => setSelectedId(feature.id)} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[.07] bg-slate-950/40 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><FeatureIcon feature={feature} className="size-4 shrink-0 text-cyan-200" /><span className="min-w-0 flex-1"><span className="block truncate text-xs text-slate-200">{feature.title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{feature.districtName ?? "จังหวัดสิงห์บุรี"}</span></span><Badge className={statusTone[feature.status]}>{feature.statusLabel}</Badge></button>)}</div></div></div>}
      {error && <div className="absolute inset-x-3 top-3 z-40 flex items-start gap-2 rounded-xl border border-amber-300/25 bg-[#19160d]/95 px-3 py-2 text-xs text-amber-100 shadow-xl sm:left-4 sm:right-auto sm:max-w-md"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span className="leading-5">{error}</span><button type="button" onClick={() => setError("")} className="ml-auto flex size-7 items-center justify-center rounded-lg hover:bg-white/10" aria-label="ปิดข้อความ"><X className="size-3.5" /></button></div>}
      <div className="absolute left-3 top-3 z-20 rounded-2xl border border-white/10 bg-[#071522]/88 p-2 shadow-xl backdrop-blur-xl sm:left-4 sm:top-4 sm:p-3">
        <p className="mb-2 hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 sm:flex"><Layers3 className="size-3" />ชั้นข้อมูล</p>
        <div className="flex flex-wrap gap-1.5 sm:max-w-[290px]">{availableKinds.map((kind) => { const meta = kindMeta[kind]; const Icon = meta.icon; return <button key={kind} type="button" onClick={() => toggleKind(kind)} aria-pressed={activeKinds[kind]} className={cn("flex min-h-11 items-center gap-1.5 rounded-xl border px-2.5 text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200", activeKinds[kind] ? "border-cyan-200/20 bg-cyan-200/10 text-cyan-50" : "border-white/10 bg-slate-950/40 text-slate-500")}><Icon className="size-3.5" />{meta.label}</button>; })}</div>
        <label className="mt-2 block border-t border-white/[.07] pt-2"><span className="sr-only">เลือกอำเภอบนแผนที่</span><select value={selectedDistrict?.code ?? "ALL"} onChange={(event) => event.target.value === "ALL" ? fitProvince() : selectBoundary(event.target.value)} className="min-h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/70 px-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-cyan-200"><option value="ALL">ทั้งจังหวัดสิงห์บุรี</option>{snapshot.areas.filter((area) => area.level === "DISTRICT").map((area) => <option key={area.id} value={area.code}>{area.nameTh}</option>)}</select></label>
      </div>
      {(hoveredDistrict || selectedDistrict) && <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl border border-cyan-200/15 bg-[#071522]/90 px-4 py-2 text-center shadow-xl backdrop-blur-xl"><p className="text-[10px] text-slate-500">{selectedDistrict ? "กำลังดูพื้นที่" : "คลิกเพื่อเจาะพื้นที่"}</p><p className="mt-0.5 text-sm font-medium text-cyan-50">{selectedDistrict?.name ?? hoveredDistrict}</p></div>}
      {selectedDistrict && filteredFeatures.length === 0 && !loading && !mapFailed && <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(90%,320px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#071522]/92 px-5 py-4 text-center shadow-2xl backdrop-blur-xl"><MapPin className="mx-auto size-5 text-slate-500" /><p className="mt-2 text-sm font-medium text-slate-200">ยังไม่มีจุดข้อมูลในอำเภอ{selectedDistrict.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">ลองเปิดชั้นข้อมูลอื่น หรือกลับไปดูทั้งจังหวัด</p></div>}
      <div className="absolute bottom-4 left-4 z-20 hidden w-64 rounded-2xl border border-white/10 bg-[#071522]/88 p-3 shadow-xl backdrop-blur-xl lg:block"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">จุดที่ควรติดตาม</p>{refreshing && <RefreshCw className="size-3 animate-spin text-cyan-200" />}</div><div className="space-y-1.5">{priorityFeatures.map((feature) => <button key={`${feature.kind}:${feature.id}`} type="button" onClick={() => selectFeature(feature.id)} className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.025] px-2.5 text-left transition hover:border-cyan-200/20 hover:bg-cyan-200/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><FeatureIcon feature={feature} className="size-3.5 shrink-0 text-cyan-200" /><span className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{feature.title}</span><span className={cn("size-2 rounded-full", feature.status === "CRITICAL" || feature.status === "OFFLINE" ? "bg-rose-300" : feature.status === "WARNING" ? "bg-amber-300" : "bg-emerald-300")} /></button>)}</div></div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-[#071522]/82 px-3 py-2 text-[9px] text-slate-300 backdrop-blur sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-300" />ปกติ</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-300" />เฝ้าระวัง</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-rose-300" />วิกฤต / Offline</span></div>
      {selectedFeature && <DetailPanel feature={selectedFeature} onClose={() => setSelectedId(null)} />}
      <div className="sr-only" aria-live="polite">{selectedFeature ? `เลือก ${selectedFeature.title} สถานะ ${selectedFeature.statusLabel}` : selectedDistrict ? `กำลังดูอำเภอ${selectedDistrict.name}` : "กำลังดูทั้งจังหวัดสิงห์บุรี"}</div>
    </div>
    <div className="grid gap-2 border-t border-white/[.07] p-3 lg:hidden">{priorityFeatures.map((feature) => <button key={`mobile:${feature.kind}:${feature.id}`} type="button" onClick={() => selectFeature(feature.id)} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><FeatureIcon feature={feature} className="size-4 text-cyan-200" /><span className="min-w-0 flex-1 truncate text-xs text-slate-200">{feature.title}</span><Badge className={statusTone[feature.status]}>{feature.statusLabel}</Badge></button>)}</div>
  </section>;
}
