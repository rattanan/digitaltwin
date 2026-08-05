"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";
import { BellRing, Camera, ChevronRight, CircleAlert, Expand, Layers3, LocateFixed, MapPin, RadioTower, RefreshCw, Siren, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type { CommandMapFeature, CommandMapKind, MapMarkerStatus, MapSnapshot } from "@/lib/map/types";

type BoundaryFeature = {
  type: "Feature";
  properties: { code: string; nameTh: string; nameEn: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
};

type BoundaryCollection = { type: "FeatureCollection"; features: BoundaryFeature[] };
type MapApiPayload = { success?: boolean; data?: MapSnapshot; message?: string };

const mapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || "https://demotiles.maplibre.org/style.json";

const fallbackStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
  },
  layers: [
    { id: "command-fallback-background", type: "background", paint: { "background-color": "#06111e" } },
    { id: "command-fallback-map", type: "raster", source: "openstreetmap", paint: { "raster-opacity": 0.32, "raster-saturation": -0.72, "raster-contrast": 0.18 } },
  ],
};

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

function pointCollection(features: CommandMapFeature[]) {
  return {
    type: "FeatureCollection" as const,
    features: features.map((feature) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: feature.coordinates },
      properties: { commandId: feature.id, kind: feature.kind, status: feature.status, short: kindMeta[feature.kind].short },
    })),
  };
}

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

function DetailPanel({ feature, onClose }: { feature: CommandMapFeature; onClose: () => void }) {
  const meta = kindMeta[feature.kind];
  const Icon = meta.icon;
  return <aside className="absolute inset-x-3 bottom-3 z-30 max-h-[72%] overflow-y-auto rounded-2xl border border-white/15 bg-[#091624]/95 p-4 shadow-2xl backdrop-blur-xl motion-safe:animate-[command-panel-in_.24s_ease-out] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[350px] sm:max-h-[calc(100%-2rem)]" aria-label={`รายละเอียด ${feature.title}`}>
    <div className="flex items-start gap-3">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", meta.tone)}><Icon className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-200/70">{meta.label} · {feature.code}</p><h3 className="mt-1 text-base font-semibold leading-6 text-white">{feature.title}</h3></div>
      <button type="button" onClick={onClose} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" aria-label="ปิดรายละเอียด"><X className="size-4" /></button>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><Badge className={statusTone[feature.status]}>{feature.statusLabel}</Badge><span className="text-[11px] text-slate-400">{feature.categoryLabel}</span></div>
    <p className="mt-4 text-sm leading-6 text-slate-300">{feature.summary}</p>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
      <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><p className="text-[10px] text-slate-500">พื้นที่</p><p className="mt-1 text-slate-200">{feature.districtName ?? "จังหวัดสิงห์บุรี"}</p></div>
      <div className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><p className="text-[10px] text-slate-500">ข้อมูลล่าสุด</p><p className="mt-1 text-slate-200">{feature.lastUpdatedAt ? formatDateTime(feature.lastUpdatedAt) : "ข้อมูลคงที่"}</p></div>
    </div>
    {feature.metrics.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{feature.metrics.map((metric) => <div key={metric.key} className="rounded-xl border border-cyan-200/10 bg-cyan-200/[.04] p-3"><p className="text-[10px] text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-semibold text-cyan-50">{formatNumber(metric.value, { maximumFractionDigits: 2 })} <span className="text-[10px] font-normal text-slate-500">{metric.unit}</span></p></div>)}</div>}
    <Button asChild className="mt-4 w-full"><Link href={feature.destinationHref}>เปิดรายละเอียดในระบบ <ChevronRight className="size-4" /></Link></Button>
  </aside>;
}

export function CommandMap({ initialSnapshot }: { initialSnapshot: MapSnapshot }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const boundaryRef = useRef<BoundaryCollection | null>(null);
  const snapshotRef = useRef(initialSnapshot);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ id: string; code: string; name: string } | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState("");
  const [activeKinds, setActiveKinds] = useState<Record<CommandMapKind, boolean>>({ LOCATION: true, IOT: true, CCTV: true, ALERT: true, INCIDENT: true });

  const availableKinds = useMemo(() => (Object.keys(kindMeta) as CommandMapKind[]).filter((kind) => snapshot.commandFeatures.some((feature) => feature.kind === kind)), [snapshot.commandFeatures]);
  const filteredFeatures = useMemo(() => snapshot.commandFeatures
    .filter((feature) => activeKinds[feature.kind] && (!selectedDistrict || feature.districtId === selectedDistrict.id))
    .sort((left, right) => featurePriority(left) - featurePriority(right)), [activeKinds, selectedDistrict, snapshot.commandFeatures]);
  const selectedFeature = snapshot.commandFeatures.find((feature) => feature.id === selectedId) ?? null;
  const priorityFeatures = filteredFeatures.slice(0, 5);

  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);

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
    setSelectedDistrict({ id: district.id, code, name: boundaryFeature.properties.nameTh });
    setSelectedId(null);
    const bounds = geometryBounds(boundaryFeature.geometry);
    if (bounds) mapRef.current?.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding: 72, maxZoom: 12.5, duration: 500 });
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
        map = new maplibre.Map({ container: containerRef.current, style: mapStyle, center: initial.province.center, zoom: 9.4, minZoom: 7, maxZoom: 17, attributionControl: false });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
        map.addControl(new maplibre.AttributionControl({ compact: true, customAttribution: initial.boundary.attribution }), "bottom-right");
        let fallbackUsed = false;
        map.on("error", () => {
          if (!map || fallbackUsed || map.loaded()) return;
          fallbackUsed = true;
          setError("ไม่สามารถโหลด basemap หลักได้ กำลังใช้แผนที่สำรอง");
          map.setStyle(fallbackStyle);
        });
        map.on("load", () => {
          if (!map || disposed) return;
          map.addSource("command-districts", { type: "geojson", data: boundaries as never });
          map.addLayer({ id: "command-district-fill", type: "fill", source: "command-districts", paint: { "fill-color": ["case", ["==", ["get", "code"], "1701"], "#22d3ee", "#1686b8"], "fill-opacity": 0.14 } });
          map.addLayer({ id: "command-district-glow", type: "line", source: "command-districts", paint: { "line-color": "#67e8f9", "line-width": 1.6, "line-opacity": 0.7 } });
          map.addLayer({ id: "command-district-label", type: "symbol", source: "command-districts", layout: { "text-field": ["get", "nameTh"], "text-size": 11, "text-font": ["Open Sans Regular"] }, paint: { "text-color": "#bae6fd", "text-halo-color": "#06111e", "text-halo-width": 1.5 } });
          map.addSource("command-points", { type: "geojson", data: pointCollection(initial.commandFeatures), cluster: true, clusterRadius: 48, clusterMaxZoom: 13 });
          map.addLayer({ id: "command-clusters", type: "circle", source: "command-points", filter: ["has", "point_count"], paint: { "circle-color": "#0e7490", "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 30, 28], "circle-stroke-color": "#a5f3fc", "circle-stroke-width": 2, "circle-opacity": 0.92 } });
          map.addLayer({ id: "command-cluster-count", type: "symbol", source: "command-points", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 11 }, paint: { "text-color": "#ecfeff" } });
          map.addLayer({ id: "command-point-halo", type: "circle", source: "command-points", filter: ["!", ["has", "point_count"]], paint: { "circle-radius": ["case", ["==", ["get", "status"], "CRITICAL"], 16, 13], "circle-color": ["match", ["get", "status"], "CRITICAL", "#fb7185", "WARNING", "#fbbf24", "OFFLINE", "#fb7185", "MAINTENANCE", "#fbbf24", "DEGRADED", "#c4b5fd", "#34d399"], "circle-opacity": 0.2, "circle-blur": 0.35 } });
          map.addLayer({ id: "command-points-visible", type: "circle", source: "command-points", filter: ["!", ["has", "point_count"]], paint: { "circle-radius": 9, "circle-color": ["match", ["get", "kind"], "LOCATION", "#fbbf24", "IOT", "#34d399", "CCTV", "#a78bfa", "ALERT", "#fb7185", "#fb923c"], "circle-stroke-color": "#06111e", "circle-stroke-width": 2 } });
          map.addLayer({ id: "command-point-symbol", type: "symbol", source: "command-points", filter: ["!", ["has", "point_count"]], layout: { "text-field": ["get", "short"], "text-size": 10, "text-font": ["Open Sans Bold"], "text-allow-overlap": true }, paint: { "text-color": "#07111f" } });

          const pointClick = (event: MapLayerMouseEvent) => {
            const id = event.features?.[0]?.properties?.commandId;
            if (typeof id === "string") selectFeature(id);
          };
          map.on("click", "command-points-visible", pointClick);
          map.on("click", "command-point-symbol", pointClick);
          map.on("click", "command-clusters", async (event) => {
            const feature = event.features?.[0];
            const clusterId = feature?.properties?.cluster_id;
            if (!feature || typeof clusterId !== "number" || feature.geometry.type !== "Point") return;
            const source = map?.getSource("command-points") as GeoJSONSource | undefined;
            const zoom = await source?.getClusterExpansionZoom(clusterId);
            if (zoom !== undefined) map?.easeTo({ center: feature.geometry.coordinates as [number, number], zoom, duration: 350 });
          });
          map.on("click", "command-district-fill", (event) => {
            const code = event.features?.[0]?.properties?.code;
            if (typeof code === "string") selectBoundary(code);
          });
          map.on("mousemove", "command-district-fill", (event) => {
            if (map) map.getCanvas().style.cursor = "pointer";
            setHoveredDistrict(String(event.features?.[0]?.properties?.nameTh ?? ""));
          });
          map.on("mouseleave", "command-district-fill", () => { if (map) map.getCanvas().style.cursor = ""; setHoveredDistrict(""); });
          ["command-points-visible", "command-point-symbol", "command-clusters"].forEach((layer) => {
            map?.on("mouseenter", layer, () => { if (map) map.getCanvas().style.cursor = "pointer"; });
            map?.on("mouseleave", layer, () => { if (map) map.getCanvas().style.cursor = ""; });
          });
          setMapReady(true);
          setLoading(false);
          if (initial.bounds) map.fitBounds([[initial.bounds[0], initial.bounds[1]], [initial.bounds[2], initial.bounds[3]]], { padding: 44, maxZoom: 10.6, duration: 0 });
        });
      } catch (cause) {
        if (disposed || controller.signal.aborted) return;
        setLoading(false);
        setError(cause instanceof Error ? cause.message : "ไม่สามารถเริ่มต้นแผนที่ได้");
      }
    }
    void initialize();
    return () => { disposed = true; controller.abort(); map?.remove(); mapRef.current = null; };
  }, [selectBoundary, selectFeature]);

  useEffect(() => {
    if (!mapReady) return;
    const source = mapRef.current?.getSource("command-points") as GeoJSONSource | undefined;
    source?.setData(pointCollection(filteredFeatures));
    if (selectedId && !filteredFeatures.some((feature) => feature.id === selectedId)) setSelectedId(null);
  }, [filteredFeatures, mapReady, selectedId]);

  useEffect(() => {
    if (!mapReady) return;
    mapRef.current?.setPaintProperty("command-district-fill", "fill-opacity", selectedDistrict ? ["case", ["==", ["get", "code"], selectedDistrict.code], 0.34, 0.06] : 0.14);
  }, [mapReady, selectedDistrict]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      setRefreshing(true);
      try {
        const response = await fetch("/api/v1/map", { cache: "no-store" });
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

  function toggleKind(kind: CommandMapKind) {
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
      <div><div className="flex items-center gap-2"><MapPin className="size-4 text-cyan-200" /><h3 className="text-sm font-semibold text-white sm:text-base">Command Map · จังหวัดสิงห์บุรี</h3><Badge variant={snapshot.isDemo ? "warning" : "success"}>{snapshot.isDemo ? "DEMO" : "LIVE"}</Badge></div><p className="mt-1 text-xs text-slate-400">เลือกอำเภอเพื่อเจาะพื้นที่ หรือเลือกจุดเพื่อดูค่าล่าสุดและไปยังระบบที่เกี่ยวข้อง</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] text-slate-500">{formatNumber(filteredFeatures.length)} จุด · อัปเดต {formatDateTime(snapshot.freshness)}</span><Button variant="ghost" size="sm" onClick={fitProvince}><LocateFixed className="size-3.5" />ทั้งจังหวัด</Button><Button variant="outline" size="icon" onClick={() => void toggleFullscreen()} aria-label="แสดงแผนที่เต็มหน้าจอ"><Expand className="size-4" /></Button></div>
    </div>
    <div ref={shellRef} className="map-shell command-map-shell relative min-h-[560px] bg-[#06111e] sm:min-h-[620px] lg:min-h-[65vh] lg:max-h-[820px]">
      <div ref={containerRef} className="absolute inset-0" role="region" aria-label="แผนที่สถานการณ์จังหวัดสิงห์บุรี" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_35%,rgba(3,10,20,.38)_100%)]" />
      {loading && <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06111e]/95"><div className="text-center"><RefreshCw className="mx-auto size-7 animate-spin motion-reduce:animate-none text-cyan-200" /><p className="mt-3 text-sm text-slate-300">กำลังเตรียม Command Map</p><p className="mt-1 text-xs text-slate-500">โหลดขอบเขตจริงและข้อมูลสถานการณ์</p></div></div>}
      {error && <div className="absolute inset-x-3 top-3 z-40 flex items-start gap-2 rounded-xl border border-amber-300/25 bg-[#19160d]/95 px-3 py-2 text-xs text-amber-100 shadow-xl sm:left-4 sm:right-auto sm:max-w-md"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span className="leading-5">{error}</span><button type="button" onClick={() => setError("")} className="ml-auto flex size-7 items-center justify-center rounded-lg hover:bg-white/10" aria-label="ปิดข้อความ"><X className="size-3.5" /></button></div>}
      <div className="absolute left-3 top-3 z-20 rounded-2xl border border-white/10 bg-[#071522]/88 p-2 shadow-xl backdrop-blur-xl sm:left-4 sm:top-4 sm:p-3">
        <p className="mb-2 hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 sm:flex"><Layers3 className="size-3" />ชั้นข้อมูล</p>
        <div className="flex flex-wrap gap-1.5 sm:max-w-[290px]">{availableKinds.map((kind) => { const meta = kindMeta[kind]; const Icon = meta.icon; return <button key={kind} type="button" onClick={() => toggleKind(kind)} aria-pressed={activeKinds[kind]} className={cn("flex min-h-11 items-center gap-1.5 rounded-xl border px-2.5 text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200", activeKinds[kind] ? "border-cyan-200/20 bg-cyan-200/10 text-cyan-50" : "border-white/10 bg-slate-950/40 text-slate-500")}><Icon className="size-3.5" />{meta.label}</button>; })}</div>
      </div>
      {(hoveredDistrict || selectedDistrict) && <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl border border-cyan-200/15 bg-[#071522]/90 px-4 py-2 text-center shadow-xl backdrop-blur-xl"><p className="text-[10px] text-slate-500">{selectedDistrict ? "กำลังดูพื้นที่" : "คลิกเพื่อเจาะพื้นที่"}</p><p className="mt-0.5 text-sm font-medium text-cyan-50">{selectedDistrict?.name ?? hoveredDistrict}</p></div>}
      <div className="absolute bottom-4 left-4 z-20 hidden w-64 rounded-2xl border border-white/10 bg-[#071522]/88 p-3 shadow-xl backdrop-blur-xl lg:block"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">จุดที่ควรติดตาม</p>{refreshing && <RefreshCw className="size-3 animate-spin text-cyan-200" />}</div><div className="space-y-1.5">{priorityFeatures.map((feature) => { const Icon = kindMeta[feature.kind].icon; return <button key={`${feature.kind}:${feature.id}`} type="button" onClick={() => selectFeature(feature.id)} className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.025] px-2.5 text-left transition hover:border-cyan-200/20 hover:bg-cyan-200/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Icon className="size-3.5 shrink-0 text-cyan-200" /><span className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{feature.title}</span><span className={cn("size-2 rounded-full", feature.status === "CRITICAL" || feature.status === "OFFLINE" ? "bg-rose-300" : feature.status === "WARNING" ? "bg-amber-300" : "bg-emerald-300")} /></button>; })}</div></div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-[#071522]/82 px-3 py-2 text-[9px] text-slate-300 backdrop-blur sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-300" />ปกติ</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-300" />เฝ้าระวัง</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-rose-300" />วิกฤต / Offline</span></div>
      {selectedFeature && <DetailPanel feature={selectedFeature} onClose={() => setSelectedId(null)} />}
      <div className="sr-only" aria-live="polite">{selectedFeature ? `เลือก ${selectedFeature.title} สถานะ ${selectedFeature.statusLabel}` : selectedDistrict ? `กำลังดูอำเภอ${selectedDistrict.name}` : "กำลังดูทั้งจังหวัดสิงห์บุรี"}</div>
    </div>
    <div className="grid gap-2 border-t border-white/[.07] p-3 lg:hidden">{priorityFeatures.map((feature) => { const Icon = kindMeta[feature.kind].icon; return <button key={`mobile:${feature.kind}:${feature.id}`} type="button" onClick={() => selectFeature(feature.id)} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><Icon className="size-4 text-cyan-200" /><span className="min-w-0 flex-1 truncate text-xs text-slate-200">{feature.title}</span><Badge className={statusTone[feature.status]}>{feature.statusLabel}</Badge></button>; })}</div>
  </section>;
}
