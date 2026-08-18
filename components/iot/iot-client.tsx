"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BatteryLow, Check, Edit3, Eye, Map, MapPin, Plus, RadioTower, RefreshCw, Search, Signal, Trash2, Wifi, Wrench, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import { ListPagination } from "@/components/common/list-pagination";
import { retainSelectedId, sameStringFilters } from "@/lib/client/list-detail-state";
import { IOT_METRIC_STATE_LABELS, IOT_STATUSES, IOT_STATUS_LABELS, type IotDetail, type IotMetricState, type IotOverview, type IotStatus } from "@/lib/iot/types";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };
type IotListResponse = Omit<IotOverview, "pagination"> & { pagination?: IotOverview["pagination"] };
type IotFormValue = { deviceCode: string; nameTh: string; status: IotStatus; typeId: string; battery: string; districtId: string };

const IOT_PAGE_SIZE = 12;

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data as T;
}

function statusVariant(status: IotStatus) {
  if (status === "ONLINE") return "success" as const;
  if (status === "OFFLINE") return "danger" as const;
  if (status === "MAINTENANCE") return "warning" as const;
  return "neutral" as const;
}

function metricVariant(state: IotMetricState) {
  if (state === "NORMAL") return "success" as const;
  if (state === "WARNING") return "warning" as const;
  if (state === "CRITICAL") return "danger" as const;
  return "neutral" as const;
}

const statusIcons = { ONLINE: Wifi, OFFLINE: Signal, MAINTENANCE: Wrench, DEGRADED: Activity };

function formatMetricValue(value: number | null, unit: string | null) {
  if (value === null) return "—";
  return `${formatNumber(value, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

function DeviceStatus({ status }: { status: IotStatus }) {
  const Icon = statusIcons[status];
  return <Badge variant={statusVariant(status)}><Icon className="mr-1.5 size-3" />{IOT_STATUS_LABELS[status]}</Badge>;
}

function BatteryBar({ battery }: { battery: number | null }) {
  if (battery === null) return <span className="text-slate-600">แบตเตอรี่ —</span>;
  const low = battery <= 20;
  return <span className={cn("flex items-center gap-1.5", low ? "text-amber-200" : "text-slate-500")}><BatteryLow className="size-3" /><span>{formatNumber(battery)}%</span><span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10"><span className={cn("block h-full rounded-full", low ? "bg-amber-300" : "bg-emerald-300")} style={{ width: `${Math.min(100, Math.max(0, battery))}%` }} /></span></span>;
}

function MetricPill({ metric }: { metric: IotOverview["items"][number]["metrics"][number] }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><div className="flex items-start justify-between gap-2"><span className="truncate text-[10px] text-slate-500">{metric.nameTh}</span><Badge variant={metricVariant(metric.state)}>{metric.stateLabel}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-200">{formatMetricValue(metric.latestValue, metric.unit)}</p><p className="mt-1 text-[9px] text-slate-600">{metric.latestRecordedAt ? formatDateTime(metric.latestRecordedAt) : "ยังไม่มีข้อมูลล่าสุด"}</p></div>;
}

function DeviceCard({ device, selected, onSelect }: { device: IotOverview["items"][number]; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`เปิดรายละเอียด ${device.nameTh} ${device.deviceCode}`} className={cn("group w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 motion-reduce:transition-none", selected ? "border-emerald-200/35 bg-emerald-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.05]")}>
    <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><RadioTower className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-200">{device.nameTh}</span><span className="mt-1 block font-mono text-[10px] text-slate-600">{device.deviceCode}</span></span><DeviceStatus status={device.status} /></div>
    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span className="truncate">{device.type.nameTh} · {device.district?.nameTh ?? "ไม่ระบุพื้นที่"}</span><BatteryBar battery={device.battery} /></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{device.metrics.slice(0, 2).map((metric) => <MetricPill key={metric.id} metric={metric} />)}</div>
  </button>;
}

function DeviceForm({ detail, types, districts, onSave, onCancel }: { detail?: IotDetail; types: IotOverview["types"]; districts: IotOverview["districts"]; onSave: (value: IotFormValue) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<IotFormValue>({ deviceCode: detail?.deviceCode ?? "", nameTh: detail?.nameTh ?? "", status: detail?.status ?? "OFFLINE", typeId: detail?.type.id ?? types[0]?.id ?? "", battery: detail?.battery?.toString() ?? "", districtId: detail?.district?.id ?? "" });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    try { await onSave(form); } catch (error) { setActionError(error instanceof Error ? error.message : "บันทึกข้อมูลอุปกรณ์ไม่สำเร็จ"); } finally { setSaving(false); }
  }

  return <Card className="border-emerald-200/15"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm">{detail ? <Edit3 className="size-4 text-emerald-200" /> : <Plus className="size-4 text-emerald-200" />}{detail ? "แก้ไขอุปกรณ์ IoT" : "เพิ่มอุปกรณ์ IoT"}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-3"><div className="space-y-1.5"><Label>รหัสอุปกรณ์</Label><Input value={form.deviceCode} onChange={(event) => setForm({ ...form, deviceCode: event.target.value.toUpperCase() })} disabled={Boolean(detail)} required minLength={2} /></div><div className="space-y-1.5"><Label>ชื่ออุปกรณ์</Label><Input value={form.nameTh} onChange={(event) => setForm({ ...form, nameTh: event.target.value })} required minLength={2} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>ชนิดอุปกรณ์</Label><Select className="w-full" value={form.typeId} onChange={(event) => setForm({ ...form, typeId: event.target.value })} required><option value="" disabled>เลือกชนิด</option>{types.map((type) => <option key={type.id} value={type.id}>{type.nameTh}</option>)}</Select></div><div className="space-y-1.5"><Label>สถานะ</Label><Select className="w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as IotStatus })}>{IOT_STATUSES.map((status) => <option key={status} value={status}>{IOT_STATUS_LABELS[status]}</option>)}</Select></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>แบตเตอรี่ (%)</Label><Input type="number" min="0" max="100" step="0.01" value={form.battery} onChange={(event) => setForm({ ...form, battery: event.target.value })} /></div><div className="space-y-1.5"><Label>อำเภอ</Label><Select className="w-full" value={form.districtId} onChange={(event) => setForm({ ...form, districtId: event.target.value })}><option value="">ไม่ระบุ</option>{districts.map((district) => <option key={district.id} value={district.id}>{district.nameTh}</option>)}</Select></div></div>{actionError && <p role="alert" className="text-xs text-rose-200">{actionError}</p>}<div className="flex gap-2 pt-1"><Button type="submit" size="sm" className="flex-1" disabled={saving}><Check className="size-3.5" />{saving ? "กำลังบันทึก" : "บันทึก"}</Button><Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}><X className="size-3.5" />ยกเลิก</Button></div></form></CardContent></Card>;
}

function DetailPanel({ detail, canManage, types, districts, onSave, onDelete }: { detail: IotDetail; canManage: boolean; types: IotOverview["types"]; districts: IotOverview["districts"]; onSave: (value: IotFormValue) => Promise<void>; onDelete: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] = useState(detail.metrics[0]?.metricKey ?? "");
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");
  const metric = detail.metrics.find((item) => item.metricKey === selectedMetricKey) ?? detail.metrics[0] ?? null;
  const chartData = useMemo(() => detail.readings.filter((reading) => reading.metricKey === metric?.metricKey).slice().sort((left, right) => left.recordedAt.localeCompare(right.recordedAt)).map((reading) => ({ ...reading, time: new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(reading.recordedAt)) })), [detail.readings, metric?.metricKey]);

  async function removeDevice() {
    if (!window.confirm(`ยืนยันการลบ ${detail.deviceCode} ออกจากระบบหรือไม่`)) return;
    setRemoving(true);
    setActionError("");
    try { await onDelete(); } catch (error) { setActionError(error instanceof Error ? error.message : "ลบอุปกรณ์ไม่สำเร็จ"); } finally { setRemoving(false); }
  }

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-emerald-200/70">{detail.deviceCode}</p><h3 className="mt-2 truncate text-xl font-semibold text-white">{detail.nameTh}</h3><p className="mt-1 truncate text-xs text-slate-500">{detail.type.nameTh} · {detail.type.nameEn ?? "IoT device"}</p></div><DeviceStatus status={detail.status} /></div>
    <div className="grid gap-2 sm:grid-cols-2"><InfoCell icon={MapPin} label="พื้นที่" value={[detail.locationName, detail.district?.nameTh, detail.subdistrictName].filter(Boolean).join(" · ") || "ไม่ระบุ"} /><InfoCell icon={Signal} label="Heartbeat ล่าสุด" value={detail.lastHeartbeat ? formatDateTime(detail.lastHeartbeat) : "ไม่พบข้อมูล"} /><InfoCell icon={BatteryLow} label="แบตเตอรี่" value={detail.battery === null ? "ไม่พบข้อมูล" : `${formatNumber(detail.battery)}%${detail.battery <= 20 ? " · ต่ำ" : ""}`} /><InfoCell icon={Activity} label="จำนวน readings" value={`${formatNumber(detail.readingCount)} รายการ`} /></div>

    <Card className="border-emerald-200/10"><CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-sm">Telemetry ล่าสุด</CardTitle><p className="mt-1 text-[10px] text-slate-500">เลือก metric เพื่อดูแนวโน้ม readings</p></div>{metric && <Badge variant={metricVariant(metric.state)}>{IOT_METRIC_STATE_LABELS[metric.state]}</Badge>}</CardHeader><CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-2">{detail.metrics.map((item) => <button key={item.id} type="button" onClick={() => setSelectedMetricKey(item.metricKey)} aria-pressed={item.metricKey === metric?.metricKey} className={cn("rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70", item.metricKey === metric?.metricKey ? "border-emerald-200/25 bg-emerald-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:bg-white/[.05]")}><span className="block truncate text-[10px] text-slate-500">{item.nameTh}</span><span className="mt-1 block text-sm font-semibold text-slate-200">{formatMetricValue(item.latestValue, item.unit)}</span></button>)}</div>{metric && <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600"><span>เตือนเมื่อ {metric.warning === null ? "—" : formatMetricValue(metric.warning, metric.unit)}</span><span>·</span><span>วิกฤตเมื่อ {metric.critical === null ? "—" : formatMetricValue(metric.critical, metric.unit)}</span></div>}{chartData.length === 0 ? <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500">ยังไม่มี reading สำหรับ metric นี้</div> : <div className="h-52 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id={`iot-fill-${detail.id}-${metric?.metricKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.32} /><stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.1)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} interval="preserveStartEnd" /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} domain={["auto", "auto"]} /><Tooltip contentStyle={{ background: "#0b1d31", border: "1px solid rgba(148,163,184,.15)", borderRadius: 12, fontSize: 11 }} labelStyle={{ color: "#94a3b8" }} formatter={(value) => [formatMetricValue(Number(value), metric?.unit ?? null), metric?.nameTh ?? "ค่า"]} /><Area type="monotone" dataKey="value" stroke="#6ee7b7" strokeWidth={2} fill={`url(#iot-fill-${detail.id}-${metric?.metricKey})`} /></AreaChart></ResponsiveContainer></div>}</CardContent></Card>

    {canManage && (editing ? <DeviceForm detail={detail} types={types} districts={districts} onSave={async (value) => { await onSave(value); setEditing(false); }} onCancel={() => setEditing(false)} /> : <Card className="border-emerald-200/10"><CardHeader className="pb-3"><CardTitle className="text-sm">จัดการอุปกรณ์</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 className="size-3.5" />แก้ไข</Button><Button variant="danger" size="sm" onClick={() => void removeDevice()} disabled={removing}><Trash2 className="size-3.5" />{removing ? "กำลังลบ" : "ลบ"}</Button></div>{actionError && <p role="alert" className="text-xs text-rose-200">{actionError}</p>}</CardContent></Card>)}
  </div>;
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><p className="flex items-center gap-1.5 text-[10px] text-slate-600"><Icon className="size-3" />{label}</p><p className="mt-1 truncate text-xs text-slate-300">{value}</p></div>;
}

export function IotClient({ initialData, canManage, initialSelectedId = null }: { initialData: IotOverview; canManage: boolean; initialSelectedId?: string | null }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | IotStatus>("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? initialData.items[0]?.id ?? null);
  const [detail, setDetail] = useState<IotDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const appliedFiltersRef = useRef<readonly string[]>([search, statusFilter, typeFilter, districtFilter]);

  const loadPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError("");
    try {
      let pageToLoad = Math.max(1, nextPage);
      while (true) {
        const params = new URLSearchParams({ page: String(pageToLoad), limit: String(IOT_PAGE_SIZE) });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (typeFilter !== "ALL") params.set("typeId", typeFilter);
        if (districtFilter !== "ALL") params.set("districtId", districtFilter);

        const next = await api<IotListResponse>(`/api/v1/iot?${params.toString()}`);
        const pagination = next.pagination ?? { page: pageToLoad, limit: IOT_PAGE_SIZE, total: next.items.length };
        const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
        if (pagination.total > 0 && pageToLoad > totalPages) {
          pageToLoad = totalPages;
          continue;
        }
        setData({ ...next, pagination });
        setSelectedId((current) => retainSelectedId(current, next.items.map((device) => device.id)));
        break;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูล IoT ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [districtFilter, search, statusFilter, typeFilter]);

  useEffect(() => {
    const nextFilters = [search, statusFilter, typeFilter, districtFilter];
    if (sameStringFilters(appliedFiltersRef.current, nextFilters)) return;
    appliedFiltersRef.current = nextFilters;
    const timer = window.setTimeout(() => { void loadPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [districtFilter, loadPage, search, statusFilter, typeFilter]);

  async function refresh() {
    await loadPage(data.pagination.page);
  }

  const selectDevice = useCallback(async (id: string) => {
    setCreating(false);
    setSelectedId(id);
    setLoadingDetail(true);
    setError("");
    try {
      setDetail(await api<IotDetail>(`/api/v1/iot/${id}`));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "โหลดรายละเอียดอุปกรณ์ไม่สำเร็จ");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSelectedId) return;
    const timer = window.setTimeout(() => { void selectDevice(initialSelectedId); }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSelectedId, selectDevice]);

  function devicePayload(value: IotFormValue, includeCode: boolean) {
    return { ...(includeCode ? { deviceCode: value.deviceCode.trim() } : {}), nameTh: value.nameTh.trim(), status: value.status, typeId: value.typeId, battery: value.battery === "" ? null : Number(value.battery), districtId: value.districtId || null };
  }

  async function updateDevice(value: IotFormValue) {
    if (!detail) return;
    const updated = await api<IotDetail>(`/api/v1/iot/${detail.id}`, { method: "PATCH", body: JSON.stringify(devicePayload(value, false)) });
    setDetail(updated);
    setData((current) => ({ ...current, items: current.items.map((device) => device.id === updated.id ? updated : device) }));
  }

  async function createDevice(value: IotFormValue) {
    const created = await api<IotDetail>("/api/v1/iot", { method: "POST", body: JSON.stringify(devicePayload(value, true)) });
    setCreating(false);
    setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); setDistrictFilter("ALL");
    setSelectedId(created.id); setDetail(created);
    await loadPage(1);
  }

  async function deleteDevice() {
    if (!detail) return;
    await api<{ deleted: boolean }>(`/api/v1/iot/${detail.id}`, { method: "DELETE" });
    setDetail(null);
    setSelectedId(null);
    await refresh();
  }

  const visibleDevices = data.items;
  const selectedSummary = data.items.find((device) => device.id === selectedId) ?? null;

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--nt-yellow)]">IoT / Phase 4</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-white sm:text-4xl">ศูนย์ติดตามอุปกรณ์ IoT</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">รวมสถานะอุปกรณ์ ค่า telemetry ล่าสุด และแนวโน้ม readings ของระบบเซนเซอร์จังหวัด เพื่อช่วยตรวจจับอุปกรณ์ที่ขาดการเชื่อมต่อหรือมีค่าผิดปกติ</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={data.isDemo ? "warning" : "success"}><span className="mr-1.5 size-1.5 rounded-full bg-current" />{data.isDemo ? "Demo data" : "Live telemetry"}</Badge>{canManage && <Button size="sm" onClick={() => { setCreating(true); setDetail(null); setSelectedId(null); }}><Plus className="size-3.5" />เพิ่มอุปกรณ์</Button>}<Button asChild variant="outline" size="sm"><Link href="/map"><Map className="size-3.5" />ดูบนแผนที่</Link></Button><Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={cn("size-3.5", loading && "animate-spin motion-reduce:animate-none")} />รีเฟรช</Button></div></div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><IotStat label="อุปกรณ์ทั้งหมด" value={data.summary.total} hint={`${data.province.nameTh} · จุดที่ลงทะเบียน`} tone="cyan" icon={RadioTower} /><IotStat label="ออนไลน์" value={data.summary.online} hint="heartbeat อยู่ในเกณฑ์ปกติ" tone="emerald" icon={Wifi} /><IotStat label="ต้องติดตาม" value={data.summary.offline + data.summary.degraded + data.summary.maintenance} hint={`${data.summary.offline} offline · ${data.summary.degraded} degraded`} tone="rose" icon={AlertTriangle} /><IotStat label="แบตเตอรี่ต่ำ" value={data.summary.lowBattery} hint="ระดับแบตเตอรี่ไม่เกิน 20%" tone="amber" icon={BatteryLow} /></section>

    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="ปิดข้อความ">×</button></div>}

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_440px]">
      <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-white/[.07]"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><CardTitle className="flex items-center gap-2 text-base"><Eye className="size-4 text-emerald-200" />รายการอุปกรณ์</CardTitle><p className="mt-1 text-xs text-slate-500">เลือกอุปกรณ์เพื่อดู telemetry และแนวโน้มค่าล่าสุด</p></div><Badge variant="neutral">{formatNumber(visibleDevices.length)} / {formatNumber(data.pagination.total)} รายการ</Badge></div><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_170px_170px]"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสอุปกรณ์..." className="pl-9" aria-label="ค้นหาอุปกรณ์ IoT" /></label><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | IotStatus)} aria-label="กรองสถานะ"><option value="ALL">ทุกสถานะ</option>{IOT_STATUSES.map((status) => <option key={status} value={status}>{IOT_STATUS_LABELS[status]}</option>)}</Select><Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="กรองชนิดอุปกรณ์"><option value="ALL">ทุกชนิด</option>{data.types.map((type) => <option key={type.id} value={type.id}>{type.nameTh} ({type.deviceCount})</option>)}</Select><Select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} aria-label="กรองอำเภอ"><option value="ALL">ทุกอำเภอ</option>{data.districts.map((district) => <option key={district.id} value={district.id}>{district.nameTh} ({district.deviceCount})</option>)}</Select></div></CardHeader><CardContent className="p-3 sm:p-5"><div className="grid gap-3 md:grid-cols-2">{visibleDevices.map((device) => <DeviceCard key={device.id} device={device} selected={device.id === selectedId} onSelect={() => void selectDevice(device.id)} />)}</div>{visibleDevices.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 px-4 py-14 text-center"><RadioTower className="mx-auto size-8 text-slate-700" /><p className="mt-3 text-sm text-slate-400">ไม่พบอุปกรณ์ตามตัวกรอง</p><p className="mt-1 text-xs text-slate-600">ลองเปลี่ยนสถานะ ชนิด อำเภอ หรือคำค้นหา</p></div>}</CardContent>{data.pagination.total > data.pagination.limit && <div className="border-t border-white/[.07] px-3 py-3 sm:px-5"><ListPagination pagination={data.pagination} loading={loading} label="อุปกรณ์ IoT" onPageChange={(page) => void loadPage(page)} /></div>}</Card>

      <Card className="min-w-0"><CardHeader className="border-b border-white/[.07]"><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-emerald-200" />{creating ? "เพิ่มอุปกรณ์ IoT" : "รายละเอียดอุปกรณ์"}</CardTitle><p className="mt-1 text-xs text-slate-500">ข้อมูลจาก device metadata, latest values และ readings</p></CardHeader><CardContent className="p-4 sm:p-5" aria-live="polite">{creating ? <DeviceForm types={data.types} districts={data.districts} onSave={createDevice} onCancel={() => setCreating(false)} /> : loadingDetail ? <div className="flex min-h-[520px] items-center justify-center text-center"><RefreshCw className="size-6 animate-spin motion-reduce:animate-none text-emerald-200" /><span className="ml-3 text-sm text-slate-400">กำลังโหลดรายละเอียด...</span></div> : detail ? <DetailPanel key={detail.id} detail={detail} canManage={canManage} types={data.types} districts={data.districts} onSave={updateDevice} onDelete={deleteDevice} /> : selectedSummary ? <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center"><RadioTower className="size-10 text-slate-700" /><p className="mt-4 text-sm text-slate-300">{selectedSummary.nameTh}</p><p className="mt-1 text-xs text-slate-600">เลือกเพื่อโหลด telemetry รายละเอียด</p><Button className="mt-4" size="sm" onClick={() => void selectDevice(selectedSummary.id)}><Eye className="size-3.5" />เปิดรายละเอียด</Button></div> : <div className="flex min-h-[520px] flex-col items-center justify-center text-center"><RadioTower className="size-10 text-slate-700" /><p className="mt-4 text-sm text-slate-400">ยังไม่ได้เลือกอุปกรณ์</p><p className="mt-1 text-xs text-slate-600">เลือกอุปกรณ์จากรายการด้านซ้าย</p></div>}</CardContent></Card>
    </section>

    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[11px] text-slate-600"><span>ข้อมูล ณ {formatDateTime(data.freshness)} · {data.isDemo ? "ใช้ข้อมูลสาธิตเมื่อฐานข้อมูลไม่พร้อมใช้งาน" : "อ่านจากฐานข้อมูลระบบ"}</span><span>{canManage ? "ผู้ใช้มีสิทธิ์จัดการและรับ telemetry" : "โหมดอ่านข้อมูลตามสิทธิ์ผู้ใช้งาน"}</span></div>
  </div>;
}

function IotStat({ label, value, hint, tone, icon: Icon }: { label: string; value: number; hint: string; tone: "cyan" | "emerald" | "rose" | "amber"; icon: typeof RadioTower }) {
  const classes = { cyan: "bg-cyan-300/10 text-cyan-200", emerald: "bg-emerald-300/10 text-emerald-200", rose: "bg-rose-300/10 text-rose-200", amber: "bg-amber-300/10 text-amber-200" }[tone];
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", classes)}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-2xl font-semibold text-white">{formatNumber(value)}</p><p className="text-xs font-medium text-slate-300">{label}</p><p className="mt-1 truncate text-[10px] text-slate-600">{hint}</p></div></CardContent></Card>;
}
