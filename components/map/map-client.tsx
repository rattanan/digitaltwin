"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup, StyleSpecification } from "maplibre-gl";
import { LocateFixed, MapPin, Maximize2, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type { MapArea, MapLayerId, MapMarkerStatus, MapSnapshot } from "@/lib/map/types";

type MapLibreModule = typeof import("maplibre-gl");

type MapFeature = {
  id: string;
  layer: MapLayerId;
  kind: "AREA" | "LOCATION" | "CAMERA";
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
  population: number | null;
};

type SortMode = "name" | "status" | "type";

const configuredMapStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || "";
const mapWorkerUrl = process.env.NEXT_PUBLIC_MAP_WORKER_URL?.trim() || "/maplibre/maplibre-gl-worker.mjs";

const fallbackMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "fallback-background", type: "background", paint: { "background-color": "#081726" } },
    { id: "openstreetmap", type: "raster", source: "openstreetmap", paint: { "raster-opacity": 0.78 } },
  ],
};

const initialMapStyle: string | StyleSpecification = configuredMapStyle || fallbackMapStyle;

const layerOptions: { id: MapLayerId; label: string; color: string }[] = [
  { id: "districts", label: "อำเภอ", color: "bg-cyan-300" },
  { id: "subdistricts", label: "ตำบล", color: "bg-blue-300" },
  { id: "locations", label: "จุดสำคัญ", color: "bg-amber-300" },
  { id: "cameras", label: "CCTV", color: "bg-violet-300" },
];

const statusClasses: Record<MapMarkerStatus, string> = {
  NORMAL: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  WARNING: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  CRITICAL: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  OFFLINE: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  MAINTENANCE: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  DEGRADED: "border-violet-300/25 bg-violet-300/10 text-violet-200",
};

const markerClasses: Record<MapFeature["kind"], string> = {
  AREA: "map-marker map-marker-area",
  LOCATION: "map-marker map-marker-location",
  CAMERA: "map-marker map-marker-camera",
};

function featureFromArea(area: MapArea): MapFeature {
  return {
    id: `area:${area.id}`,
    layer: area.level === "DISTRICT" ? "districts" : "subdistricts",
    kind: "AREA",
    code: area.code,
    title: area.nameTh,
    subtitle: area.nameEn,
    category: area.level,
    categoryLabel: area.level === "DISTRICT" ? "อำเภอ" : "ตำบล",
    status: "NORMAL",
    statusLabel: "ปกติ",
    latitude: area.latitude,
    longitude: area.longitude,
    parentName: area.parentName,
    lastSeenAt: null,
    population: area.population,
  };
}

function featureFromMarker(marker: MapSnapshot["markers"][number]): MapFeature {
  return {
    id: `marker:${marker.id}`,
    layer: marker.kind === "CAMERA" ? "cameras" : "locations",
    kind: marker.kind,
    code: marker.code,
    title: marker.title,
    subtitle: marker.subtitle,
    category: marker.category,
    categoryLabel: marker.categoryLabel,
    status: marker.status,
    statusLabel: marker.statusLabel,
    latitude: marker.latitude,
    longitude: marker.longitude,
    parentName: marker.parentName,
    lastSeenAt: marker.lastSeenAt,
    population: null,
  };
}

function statusClass(status: MapMarkerStatus) {
  return statusClasses[status];
}

function createMarkerElement(feature: MapFeature, selected: boolean, onSelect: () => void) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = cn(markerClasses[feature.kind], selected && "map-marker-selected");
  element.setAttribute("aria-label", `${feature.title} · ${feature.statusLabel}`);
  element.title = `${feature.title} · ${feature.statusLabel}`;
  element.textContent = feature.kind === "CAMERA" ? "C" : feature.kind === "AREA" ? "•" : "◆";
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect();
  });
  return element;
}

function createPopupContent(feature: MapFeature) {
  const root = document.createElement("div");
  root.className = "map-popup-content";

  const eyebrow = document.createElement("p");
  eyebrow.className = "map-popup-eyebrow";
  eyebrow.textContent = `${feature.categoryLabel} · ${feature.code}`;
  root.appendChild(eyebrow);

  const title = document.createElement("p");
  title.className = "map-popup-title";
  title.textContent = feature.title;
  root.appendChild(title);

  const status = document.createElement("p");
  status.className = "map-popup-status";
  status.textContent = `สถานะ: ${feature.statusLabel}`;
  root.appendChild(status);

  if (feature.parentName) {
    const parent = document.createElement("p");
    parent.className = "map-popup-meta";
    parent.textContent = `พื้นที่: ${feature.parentName}`;
    root.appendChild(parent);
  }

  if (feature.population !== null) {
    const population = document.createElement("p");
    population.className = "map-popup-meta";
    population.textContent = `ประชากร: ${formatNumber(feature.population)} คน`;
    root.appendChild(population);
  }

  if (feature.lastSeenAt) {
    const lastSeen = document.createElement("p");
    lastSeen.className = "map-popup-meta";
    lastSeen.textContent = `สัญญาณล่าสุด: ${formatDateTime(feature.lastSeenAt)}`;
    root.appendChild(lastSeen);
  }

  return root;
}

export function MapClient({ snapshot, initialFeatureId = null }: { snapshot: MapSnapshot; initialFeatureId?: string | null }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [selectedId, setSelectedId] = useState<string | null>(initialFeatureId);
  const [activeLayers, setActiveLayers] = useState<Record<MapLayerId, boolean>>({
    districts: true,
    subdistricts: false,
    locations: true,
    cameras: snapshot.capabilities.cameras && snapshot.counts.cameras > 0,
  });

  const features = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("th-TH");
    const allFeatures = [
      ...snapshot.areas.map(featureFromArea),
      ...snapshot.markers.map(featureFromMarker),
    ];
    const filteredFeatures = allFeatures.filter((feature) => {
      if (!activeLayers[feature.layer]) return false;
      if (!normalizedSearch) return true;
      return [feature.title, feature.subtitle, feature.code, feature.categoryLabel, feature.parentName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("th-TH").includes(normalizedSearch));
    });
    const statusRank: Record<MapMarkerStatus, number> = { CRITICAL: 0, OFFLINE: 1, WARNING: 2, MAINTENANCE: 3, DEGRADED: 4, NORMAL: 5 };
    return filteredFeatures.sort((left, right) => {
      if (sortMode === "status") return statusRank[left.status] - statusRank[right.status] || left.title.localeCompare(right.title, "th");
      if (sortMode === "type") return left.categoryLabel.localeCompare(right.categoryLabel, "th") || left.title.localeCompare(right.title, "th");
      return left.title.localeCompare(right.title, "th");
    });
  }, [activeLayers, search, sortMode, snapshot.areas, snapshot.markers]);

  const selectedFeature = useMemo(() => features.find((feature) => feature.id === selectedId) ?? null, [features, selectedId]);

  const fitToData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (snapshot.bounds) {
      map.fitBounds([[snapshot.bounds[0], snapshot.bounds[1]], [snapshot.bounds[2], snapshot.bounds[3]]], { padding: 64, maxZoom: 12, duration: 500 });
      return;
    }
    map.flyTo({ center: snapshot.province.center, zoom: 10.5, duration: 500 });
  }, [snapshot.bounds, snapshot.province.center]);

  const resizeMap = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | null = null;
    let hasLoaded = false;
    let fallbackActive = !configuredMapStyle;
    let loadTimeout: number | undefined;

    const markMapReady = () => {
      if (disposed || hasLoaded) return;
      hasLoaded = true;
      if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
      setMapReady(true);
      setMapLoading(false);
      fitToData();
    };

    const activateFallbackStyle = (message: string) => {
      const currentMap = map;
      if (disposed || fallbackActive || !currentMap) return;
      fallbackActive = true;
      setMapError(`${message} กำลังใช้แผนที่สำรอง`);
      try {
        currentMap.setStyle(fallbackMapStyle);
      } catch (error) {
        setMapLoading(false);
        setMapError(error instanceof Error ? error.message : message);
      }
    };

    async function initializeMap() {
      try {
        const maplibre = await import("maplibre-gl");
        if (disposed || !mapContainerRef.current) return;
        maplibreRef.current = maplibre;
        maplibre.setWorkerUrl(mapWorkerUrl);
        map = new maplibre.Map({
          container: mapContainerRef.current,
          style: initialMapStyle,
          center: snapshot.province.center,
          zoom: 10.5,
          minZoom: 7,
          maxZoom: 17,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: true }), "top-right");
        map.addControl(new maplibre.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
        map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
        const clearSelection = () => setSelectedId(null);
        map.on("click", clearSelection);
        map.on("load", markMapReady);
        map.on("style.load", markMapReady);
        map.on("error", (event) => {
          if (disposed || hasLoaded || !event.error) return;
          if (!fallbackActive) activateFallbackStyle("ไม่สามารถโหลดแผนที่พื้นฐานได้");
          else {
            setMapLoading(false);
            setMapError(event.error.message || "ไม่สามารถโหลดแผนที่พื้นฐานได้");
          }
        });
        loadTimeout = window.setTimeout(() => {
          if (!hasLoaded && !fallbackActive) activateFallbackStyle("โหลดแผนที่พื้นฐานนานเกินไป");
        }, 8000);
      } catch (error) {
        if (disposed) return;
        setMapLoading(false);
        setMapError(error instanceof Error ? error.message : "ไม่สามารถเริ่มต้นแผนที่ได้");
      }
    }

    void initializeMap();
    return () => {
      disposed = true;
      if (loadTimeout !== undefined) window.clearTimeout(loadTimeout);
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (map) map.remove();
      mapRef.current = null;
      maplibreRef.current = null;
      setMapReady(false);
    };
  }, [fitToData, snapshot.province.center]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !maplibre || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    const markers = features.map((feature) => {
      const element = createMarkerElement(feature, feature.id === selectedId, () => setSelectedId(feature.id));
      return new maplibre.Marker({ element, anchor: "bottom" }).setLngLat([feature.longitude, feature.latitude]).addTo(map);
    });
    markersRef.current = markers;

    return () => {
      markers.forEach((marker) => marker.remove());
      if (markersRef.current === markers) markersRef.current = [];
    };
  }, [features, mapReady, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedFeature) return;
    map.flyTo({ center: [selectedFeature.longitude, selectedFeature.latitude], zoom: selectedFeature.kind === "AREA" ? 11.5 : 13, duration: 500 });
  }, [mapReady, selectedFeature]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    popupRef.current?.remove();
    popupRef.current = null;
    if (!map || !maplibre || !mapReady || !selectedFeature) return;

    const popup = new maplibre.Popup({ closeButton: true, closeOnClick: false, offset: 18, maxWidth: "280px" })
      .setLngLat([selectedFeature.longitude, selectedFeature.latitude])
      .setDOMContent(createPopupContent(selectedFeature))
      .addTo(map);
    popupRef.current = popup;
    return () => {
      popup.remove();
      if (popupRef.current === popup) popupRef.current = null;
    };
  }, [mapReady, selectedFeature]);

  function toggleLayer(layer: MapLayerId) {
    setActiveLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function focusFeature(feature: MapFeature) {
    setSelectedId(feature.id);
  }

  const visibleLayerOptions = layerOptions.filter((option) => option.id !== "cameras" || snapshot.capabilities.cameras);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--nt-yellow)]">GIS / Phase 2</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-white sm:text-4xl">แผนที่เมือง</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">มองเห็นพื้นที่ปกครองและจุดข้อมูลสำคัญของจังหวัดสิงห์บุรีบนแผนที่เดียว พร้อมค้นหา กรองชั้นข้อมูล และเปิดดูรายละเอียดแต่ละจุด</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={snapshot.isDemo ? "warning" : "success"}><span className="mr-1.5 size-1.5 rounded-full bg-current" />{snapshot.isDemo ? "Demo data" : "Live layer"}</Badge>
          <span className="text-xs text-slate-500">{snapshot.province.nameTh} · อัปเดต {formatDateTime(snapshot.freshness)}</span>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MapStat label="อำเภอ" value={snapshot.counts.districts} hint="พื้นที่ปกครองระดับอำเภอ" tone="cyan" />
        <MapStat label="ตำบล" value={snapshot.counts.subdistricts} hint="พื้นที่ปกครองระดับตำบล" tone="blue" />
        <MapStat label="จุดสำคัญ" value={snapshot.counts.locations} hint="หน่วยงานและสถานที่สำคัญ" tone="amber" />
        <MapStat label="CCTV" value={snapshot.counts.cameras} hint={snapshot.capabilities.cameras ? "จุดกล้องที่มีพิกัด" : "จำกัดตามสิทธิ์ผู้ใช้งาน"} tone="violet" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b border-white/[.07] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4 text-cyan-200" />สถานการณ์เชิงพื้นที่ · {snapshot.province.nameTh}</CardTitle>
              <p className="mt-1 text-xs text-slate-500">คลิก marker เพื่อดูรายละเอียด · ลากแผนที่หรือใช้ปุ่มซูมเพื่อสำรวจพื้นที่</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fitToData}><LocateFixed className="size-3.5" />กลับไปข้อมูลทั้งหมด</Button>
              <Button variant="outline" size="icon" onClick={resizeMap} aria-label="ปรับขนาดแผนที่"><Maximize2 className="size-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="map-shell relative min-h-[560px] overflow-hidden rounded-2xl border border-cyan-200/10 bg-[#081726]">
              <div ref={mapContainerRef} className="absolute inset-0" role="application" aria-label={`แผนที่จังหวัด${snapshot.province.nameTh}`} />
              {mapLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#081726]/90 backdrop-blur-sm"><div className="text-center"><span className="mx-auto block size-8 animate-spin rounded-full border-2 border-cyan-200/20 border-t-cyan-200" /><p className="mt-4 text-sm text-slate-300">กำลังโหลดแผนที่...</p><p className="mt-1 text-xs text-slate-500">MapLibre GL</p></div></div>}
              {mapError && <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-amber-300/20 bg-[#0b1d31]/95 px-4 py-3 text-xs text-amber-100 shadow-xl"><p className="font-semibold">แผนที่พื้นฐานไม่พร้อมใช้งาน</p><p className="mt-1 leading-5 text-amber-100/70">{mapError}</p></div>}
              <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#081526]/85 px-3 py-2 text-[10px] text-slate-300 backdrop-blur">
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-cyan-300" />อำเภอ</span>
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-300" />จุดสำคัญ</span>
                {snapshot.capabilities.cameras && <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-violet-300" />CCTV</span>}
                <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-rose-300" />เฝ้าระวัง / Offline</span>
              </div>
              <div className="absolute right-4 top-4 z-10 rounded-xl border border-white/10 bg-[#081526]/85 px-3 py-2 text-[10px] text-slate-400 backdrop-blur">{features.length} จุดบนแผนที่</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="size-4 text-cyan-200" />ชั้นข้อมูลและตัวกรอง</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อ รหัส หรือประเภท..." className="pl-9" aria-label="ค้นหาจุดบนแผนที่" /></label>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {visibleLayerOptions.map((option) => {
                  const count = option.id === "districts" ? snapshot.counts.districts : option.id === "subdistricts" ? snapshot.counts.subdistricts : option.id === "locations" ? snapshot.counts.locations : snapshot.counts.cameras;
                  return <button key={option.id} type="button" onClick={() => toggleLayer(option.id)} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition", activeLayers[option.id] ? "border-cyan-200/20 bg-cyan-200/[.07]" : "border-white/[.07] bg-white/[.02] opacity-60 hover:opacity-100")} aria-pressed={activeLayers[option.id]}><span className={cn("size-2.5 rounded-full", option.color)} /><span className="min-w-0 flex-1 text-xs text-slate-300">{option.label}</span><span className="font-mono text-[10px] text-slate-500">{formatNumber(count)}</span><span className={cn("flex size-4 items-center justify-center rounded border text-[10px]", activeLayers[option.id] ? "border-cyan-200/40 bg-cyan-200/15 text-cyan-100" : "border-white/15 text-transparent")}>✓</span></button>;
                })}
              </div>
              <div className="border-t border-white/[.07] pt-4"><label className="mb-1.5 block text-[11px] text-slate-500" htmlFor="map-status-filter">เรียงรายการตาม</label><Select id="map-status-filter" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="w-full"><option value="name">ชื่อพื้นที่ / จุดข้อมูล</option><option value="status">สถานะล่าสุด</option><option value="type">ประเภทข้อมูล</option></Select></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">รายการบนแผนที่</CardTitle><Badge variant="neutral">{formatNumber(features.length)} จุด</Badge></CardHeader>
            <CardContent className="max-h-[390px] space-y-2 overflow-y-auto pr-3">
              {features.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-slate-500">ไม่พบข้อมูลตามตัวกรอง</p> : features.map((feature) => <button key={feature.id} type="button" onClick={() => focusFeature(feature)} className={cn("flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition", selectedId === feature.id ? "border-cyan-200/30 bg-cyan-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.05]")}><span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", feature.kind === "AREA" ? "bg-cyan-300/10 text-cyan-200" : feature.kind === "CAMERA" ? "bg-violet-300/10 text-violet-200" : "bg-amber-300/10 text-amber-200")}>{feature.kind === "AREA" ? "พื้นที่" : feature.kind === "CAMERA" ? "CCTV" : "จุด"}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-200">{feature.title}</span><span className="mt-1 block truncate text-[10px] text-slate-600">{feature.categoryLabel} · {feature.code}</span></span><span className={cn("mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[9px]", statusClass(feature.status))}>{feature.statusLabel}</span></button>)}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[11px] text-slate-600"><span>แหล่งข้อมูล: Administrative Areas · Important Locations{snapshot.capabilities.cameras ? " · CCTV Metadata" : ""}</span><span>ศูนย์กลางแผนที่: {snapshot.province.nameTh} · {snapshot.province.center[1].toFixed(4)}, {snapshot.province.center[0].toFixed(4)}</span></div>

      {selectedFeature && <div className="sr-only" aria-live="polite">เลือก {selectedFeature.title} สถานะ {selectedFeature.statusLabel}</div>}
    </div>
  );
}

function MapStat({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: "cyan" | "blue" | "amber" | "violet" }) {
  const classes = { cyan: "bg-cyan-300/10 text-cyan-200", blue: "bg-blue-300/10 text-blue-200", amber: "bg-amber-300/10 text-amber-200", violet: "bg-violet-300/10 text-violet-200" }[tone];
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold", classes)}>{formatNumber(value)}</span><div className="min-w-0"><p className="text-sm font-medium text-slate-200">{label}</p><p className="mt-1 truncate text-[10px] text-slate-600">{hint}</p></div></CardContent></Card>;
}
