"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Camera, Check, Clock3, Eye, ImageOff, Map, MapPin, RefreshCw, Search, ShieldAlert, Trash2, Wifi, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import { ListPagination } from "@/components/common/list-pagination";
import { CCTV_STATUS_LABELS, CCTV_STATUSES, type CctvDetail, type CctvOverview, type CctvStatus } from "@/lib/cctv/types";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };
type CctvListResponse = Omit<CctvOverview, "pagination"> & { pagination?: CctvOverview["pagination"] };

const CCTV_PAGE_SIZE = 12;

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data as T;
}

function statusVariant(status: CctvStatus) {
  if (status === "ONLINE") return "success" as const;
  if (status === "OFFLINE") return "danger" as const;
  if (status === "MAINTENANCE") return "warning" as const;
  return "neutral" as const;
}

const statusIcons = { ONLINE: Wifi, OFFLINE: ShieldAlert, MAINTENANCE: Wrench, DEGRADED: Activity };

function formatFileSize(value: number | null) {
  if (value === null) return "ไม่ทราบขนาดไฟล์";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  return `${formatNumber(Math.round(value / 1000))} KB`;
}

function CameraStatus({ status }: { status: CctvStatus }) {
  const Icon = statusIcons[status];
  return <Badge variant={statusVariant(status)}><Icon className="mr-1.5 size-3" />{CCTV_STATUS_LABELS[status]}</Badge>;
}

function SnapshotPreview({ camera, large = false }: { camera: CctvOverview["items"][number]; large?: boolean }) {
  return <div className={cn("relative overflow-hidden rounded-xl border border-cyan-200/10 bg-[#071725]", large ? "aspect-video" : "aspect-[16/10]")}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.24),transparent_20%),linear-gradient(135deg,rgba(15,23,42,.1),rgba(8,47,73,.85)),repeating-linear-gradient(0deg,rgba(148,163,184,.08)_0px,rgba(148,163,184,.08)_1px,transparent_1px,transparent_5px)]" />
    <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[9px] font-mono uppercase tracking-[.16em] text-cyan-100/70"><span>Snapshot / {camera.cameraCode}</span><span className="flex items-center gap-1.5"><i className={cn("size-1.5 rounded-full", camera.status === "ONLINE" ? "animate-pulse bg-emerald-300" : "bg-amber-300")} />{camera.statusLabel}</span></div>
    <div className="absolute inset-0 flex items-center justify-center"><div className="flex size-14 items-center justify-center rounded-2xl border border-cyan-200/15 bg-slate-950/25 text-cyan-200/70 backdrop-blur-sm"><ImageOff className="size-6" aria-hidden="true" /></div></div>
    <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-medium text-slate-200">ภาพ snapshot ล่าสุด</p><p className="mt-1 text-[9px] text-slate-500">{camera.latestSnapshot ? formatDateTime(camera.latestSnapshot.capturedAt) : "ยังไม่มีข้อมูลภาพ"}</p></div><span className="rounded-md border border-white/10 bg-slate-950/55 px-2 py-1 text-[9px] text-slate-400">Media connector pending</span></div>
  </div>;
}

function CameraCard({ camera, selected, onSelect }: { camera: CctvOverview["items"][number]; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`เปิดรายละเอียด ${camera.nameTh} ${camera.cameraCode}`} className={cn("group w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 motion-reduce:transition-none", selected ? "border-cyan-200/35 bg-cyan-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.05]")}>
    <SnapshotPreview camera={camera} />
    <div className="mt-3 flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200"><Camera className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-200">{camera.nameTh}</span><span className="mt-1 block truncate font-mono text-[10px] text-slate-600">{camera.cameraCode}</span></span><CameraStatus status={camera.status} /></div>
    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span className="flex min-w-0 items-center gap-1.5 truncate"><MapPin className="size-3 shrink-0" />{camera.district?.nameTh ?? "ไม่ระบุพื้นที่"}</span><span>{camera.aiEventCount > 0 ? `${camera.aiEventCount} AI event` : "ไม่มี AI event"}</span></div>
  </button>;
}

function DetailPanel({ detail, canManage, onStatusSave, onDelete }: { detail: CctvDetail; canManage: boolean; onStatusSave: (status: CctvStatus) => Promise<void>; onDelete: () => Promise<void> }) {
  const [nextStatus, setNextStatus] = useState<CctvStatus>(detail.status);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");
  const dirty = nextStatus !== detail.status;

  async function saveStatus() {
    setSaving(true);
    setActionError("");
    try { await onStatusSave(nextStatus); } catch (error) { setActionError(error instanceof Error ? error.message : "บันทึกสถานะไม่สำเร็จ"); } finally { setSaving(false); }
  }

  async function removeCamera() {
    if (!window.confirm(`ยืนยันการซ่อน ${detail.cameraCode} จากระบบหรือไม่`)) return;
    setRemoving(true);
    setActionError("");
    try { await onDelete(); } catch (error) { setActionError(error instanceof Error ? error.message : "ซ่อนกล้องไม่สำเร็จ"); } finally { setRemoving(false); }
  }

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-200/70">{detail.cameraCode}</p><h3 className="mt-2 truncate text-xl font-semibold text-white">{detail.nameTh}</h3><p className="mt-1 truncate text-xs text-slate-500">{detail.nameEn ?? "CCTV monitoring point"}</p></div><CameraStatus status={detail.status} /></div>
    <SnapshotPreview camera={detail} large />
    <div className="grid gap-2 sm:grid-cols-2"><InfoCell icon={MapPin} label="พื้นที่" value={[detail.locationName, detail.district?.nameTh, detail.subdistrictName].filter(Boolean).join(" · ") || "ไม่ระบุ"} /><InfoCell icon={ShieldAlert} label="หน่วยงาน" value={detail.agencyName ?? "ไม่ระบุ"} /><InfoCell icon={Clock3} label="Heartbeat ล่าสุด" value={detail.lastHeartbeat ? formatDateTime(detail.lastHeartbeat) : "ไม่พบข้อมูล"} /><InfoCell icon={Activity} label="ภาพล่าสุด" value={detail.lastImageAt ? formatDateTime(detail.lastImageAt) : "ไม่พบข้อมูล"} /></div>
    {detail.latitude !== null && detail.longitude !== null && <p className="font-mono text-[10px] text-slate-600">พิกัด {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)}</p>}

    {canManage && <Card className="border-cyan-200/10"><CardHeader className="pb-3"><CardTitle className="text-sm">การจัดการสถานะ</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Select className="min-w-0 flex-1" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as CctvStatus)} aria-label="สถานะกล้อง"><option value="ONLINE">ออนไลน์</option><option value="OFFLINE">ออฟไลน์</option><option value="MAINTENANCE">ซ่อมบำรุง</option><option value="DEGRADED">คุณภาพลดลง</option></Select><Button size="sm" onClick={() => void saveStatus()} disabled={!dirty || saving}><Check className="size-3.5" />{saving ? "กำลังบันทึก" : "บันทึก"}</Button></div>{actionError && <p role="alert" className="text-xs text-rose-200">{actionError}</p>}<Button variant="danger" size="sm" className="w-full" onClick={() => void removeCamera()} disabled={removing}><Trash2 className="size-3.5" />{removing ? "กำลังดำเนินการ" : "ซ่อนกล้องจากรายการ"}</Button></CardContent></Card>}

    <Card><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-sm">AI events ล่าสุด</CardTitle><Badge variant="neutral">{formatNumber(detail.aiEventCount)} รายการ</Badge></CardHeader><CardContent className="space-y-2">{detail.aiEvents.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-slate-500">ยังไม่มี AI event สำหรับกล้องนี้</p> : detail.aiEvents.map((event) => <div key={event.id} className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-200">{event.eventLabel}</p><p className="mt-1 text-[10px] text-slate-600">{formatDateTime(event.detectedAt)}</p></div><Badge variant={event.verification === "VERIFIED" ? "success" : "warning"}>{event.verification === "VERIFIED" ? "ยืนยันแล้ว" : "รอตรวจสอบ"}</Badge></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, Math.max(0, event.confidence * 100))}%` }} /></div><p className="mt-1 text-right font-mono text-[9px] text-slate-500">ความเชื่อมั่น {(event.confidence * 100).toFixed(0)}%</p></div>)}</CardContent></Card>

    <Card><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-sm">Snapshot history</CardTitle><Badge variant="neutral">{formatNumber(detail.snapshotCount)} ภาพ</Badge></CardHeader><CardContent className="space-y-2">{detail.snapshots.length === 0 ? <p className="text-xs text-slate-500">ยังไม่มี snapshot</p> : detail.snapshots.slice(0, 5).map((snapshot) => <div key={snapshot.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[.06] px-3 py-2 text-[10px]"><span className="flex items-center gap-2 text-slate-300"><Camera className="size-3 text-cyan-200" />{formatDateTime(snapshot.capturedAt)}</span><span className="text-slate-600">{formatFileSize(snapshot.fileSizeBytes)}</span></div>)}</CardContent></Card>
  </div>;
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><p className="flex items-center gap-1.5 text-[10px] text-slate-600"><Icon className="size-3" />{label}</p><p className="mt-1 truncate text-xs text-slate-300">{value}</p></div>;
}

export function CctvClient({ initialData, canManage }: { initialData: CctvOverview; canManage: boolean }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CctvStatus>("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(initialData.items[0]?.id ?? null);
  const [detail, setDetail] = useState<CctvDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstFilterRender = useRef(true);

  const loadPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError("");
    try {
      let pageToLoad = Math.max(1, nextPage);
      while (true) {
        const params = new URLSearchParams({ page: String(pageToLoad), limit: String(CCTV_PAGE_SIZE) });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (districtFilter !== "ALL") params.set("districtId", districtFilter);

        const next = await api<CctvListResponse>(`/api/v1/cctv?${params.toString()}`);
        const pagination = next.pagination ?? { page: pageToLoad, limit: CCTV_PAGE_SIZE, total: next.items.length };
        const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
        if (pagination.total > 0 && pageToLoad > totalPages) {
          pageToLoad = totalPages;
          continue;
        }
        setData({ ...next, pagination });
        setDetail(null);
        setSelectedId(next.items[0]?.id ?? null);
        break;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูล CCTV ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [districtFilter, search, statusFilter]);

  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false;
      return;
    }
    const timer = window.setTimeout(() => { void loadPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [loadPage]);

  async function refresh() {
    await loadPage(data.pagination.page);
  }

  async function selectCamera(id: string) {
    setSelectedId(id);
    setLoadingDetail(true);
    setError("");
    try {
      setDetail(await api<CctvDetail>(`/api/v1/cctv/${id}`));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "โหลดรายละเอียดกล้องไม่สำเร็จ");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function updateStatus(status: CctvStatus) {
    if (!detail) return;
    const updated = await api<CctvDetail>(`/api/v1/cctv/${detail.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setDetail(updated);
    setData((current) => ({ ...current, items: current.items.map((camera) => camera.id === updated.id ? updated : camera) }));
  }

  async function deleteCamera() {
    if (!detail) return;
    await api<{ deleted: boolean }>(`/api/v1/cctv/${detail.id}`, { method: "DELETE" });
    setDetail(null);
    setSelectedId(null);
    await refresh();
  }

  const visibleCameras = data.items;
  const selectedSummary = data.items.find((camera) => camera.id === selectedId) ?? null;

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--nt-yellow)]">CCTV / Phase 3</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-white sm:text-4xl">ศูนย์ควบคุม CCTV</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">ติดตามสถานะกล้อง จุดติดตั้ง ภาพ snapshot และผลตรวจจับจาก AI เพื่อให้เจ้าหน้าที่เห็นสัญญาณผิดปกติในมุมเดียว</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={data.isDemo ? "warning" : "success"}><span className="mr-1.5 size-1.5 rounded-full bg-current" />{data.isDemo ? "Demo data" : "Live metadata"}</Badge><Button asChild variant="outline" size="sm"><Link href="/map"><Map className="size-3.5" />ดูบนแผนที่</Link></Button><Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={cn("size-3.5", loading && "animate-spin")} />รีเฟรช</Button></div></div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><CctvStat label="กล้องทั้งหมด" value={data.summary.total} hint={`${data.province.nameTh} · จุดที่ลงทะเบียน`} tone="cyan" icon={Camera} /><CctvStat label="ออนไลน์" value={data.summary.online} hint="heartbeat อยู่ในเกณฑ์ปกติ" tone="emerald" icon={Wifi} /><CctvStat label="ต้องติดตาม" value={data.summary.offline + data.summary.degraded} hint={`${data.summary.offline} offline · ${data.summary.degraded} คุณภาพลดลง`} tone="rose" icon={AlertTriangle} /><CctvStat label="ซ่อมบำรุง" value={data.summary.maintenance} hint="ไม่พร้อมให้บริการชั่วคราว" tone="amber" icon={Wrench} /></section>

    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="ปิดข้อความ">×</button></div>}

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
      <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-white/[.07]"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><CardTitle className="flex items-center gap-2 text-base"><Eye className="size-4 text-cyan-200" />รายการกล้อง</CardTitle><p className="mt-1 text-xs text-slate-500">เลือกกล้องเพื่อเปิดภาพ metadata และ AI events ล่าสุด</p></div><Badge variant="neutral">{formatNumber(visibleCameras.length)} / {formatNumber(data.pagination.total)} รายการ</Badge></div><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_190px]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสกล้อง..." className="pl-9" aria-label="ค้นหากล้อง CCTV" /></label><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | CctvStatus)} aria-label="กรองสถานะ"><option value="ALL">ทุกสถานะ</option>{CCTV_STATUSES.map((status) => <option key={status} value={status}>{CCTV_STATUS_LABELS[status]}</option>)}</Select><Select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} aria-label="กรองอำเภอ"><option value="ALL">ทุกอำเภอ</option>{data.districts.map((district) => <option key={district.id} value={district.id}>{district.nameTh} ({district.cameraCount})</option>)}</Select></div></CardHeader><CardContent className="p-3 sm:p-5"><div className="grid gap-3 md:grid-cols-2">{visibleCameras.map((camera) => <CameraCard key={camera.id} camera={camera} selected={camera.id === selectedId} onSelect={() => void selectCamera(camera.id)} />)}</div>{visibleCameras.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center"><Camera className="mx-auto size-8 text-slate-700" /><p className="mt-3 text-sm text-slate-400">ไม่พบกล้องตามตัวกรอง</p><p className="mt-1 text-xs text-slate-600">ลองเปลี่ยนสถานะ อำเภอ หรือคำค้นหา</p></div>}</CardContent>{data.pagination.total > data.pagination.limit && <div className="border-t border-white/[.07] px-3 py-3 sm:px-5"><ListPagination pagination={data.pagination} loading={loading} label="กล้อง CCTV" onPageChange={(page) => void loadPage(page)} /></div>}</Card>

      <Card className="min-w-0"><CardHeader className="border-b border-white/[.07]"><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-cyan-200" />รายละเอียดกล้อง</CardTitle><p className="mt-1 text-xs text-slate-500">ข้อมูลจาก CCTV metadata, snapshots และ AI result</p></CardHeader><CardContent className="p-4 sm:p-5" aria-live="polite">{loadingDetail ? <div className="flex min-h-[420px] items-center justify-center text-center"><RefreshCw className="size-6 animate-spin motion-reduce:animate-none text-cyan-200" /><span className="ml-3 text-sm text-slate-400">กำลังโหลดรายละเอียด...</span></div> : detail ? <DetailPanel key={detail.id} detail={detail} canManage={canManage} onStatusSave={updateStatus} onDelete={deleteCamera} /> : selectedSummary ? <div className="space-y-4"><SnapshotPreview camera={selectedSummary} large /><div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center"><p className="text-sm text-slate-300">กดรายการกล้องเพื่อโหลดรายละเอียด</p><Button className="mt-4" size="sm" onClick={() => void selectCamera(selectedSummary.id)}><Eye className="size-3.5" />เปิดรายละเอียด</Button></div></div> : <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><Camera className="size-10 text-slate-700" /><p className="mt-4 text-sm text-slate-400">ยังไม่ได้เลือกกล้อง</p><p className="mt-1 text-xs text-slate-600">เลือกกล้องจากรายการด้านซ้าย</p></div>}</CardContent></Card>
    </section>

    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[11px] text-slate-600"><span>ข้อมูล ณ {formatDateTime(data.freshness)} · {data.isDemo ? "ใช้ข้อมูลสาธิตเมื่อฐานข้อมูลไม่พร้อมใช้งาน" : "อ่านจากฐานข้อมูลระบบ"}</span><span>{canManage ? "ผู้ใช้มีสิทธิ์จัดการกล้อง" : "โหมดอ่านข้อมูลตามสิทธิ์ผู้ใช้งาน"}</span></div>
  </div>;
}

function CctvStat({ label, value, hint, tone, icon: Icon }: { label: string; value: number; hint: string; tone: "cyan" | "emerald" | "rose" | "amber"; icon: typeof Camera }) {
  const classes = { cyan: "bg-cyan-300/10 text-cyan-200", emerald: "bg-emerald-300/10 text-emerald-200", rose: "bg-rose-300/10 text-rose-200", amber: "bg-amber-300/10 text-amber-200" }[tone];
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", classes)}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-2xl font-semibold text-white">{formatNumber(value)}</p><p className="text-xs font-medium text-slate-300">{label}</p><p className="mt-1 truncate text-[10px] text-slate-600">{hint}</p></div></CardContent></Card>;
}
