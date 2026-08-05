"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Check, ChevronRight, Clock3, ExternalLink, MapPin, RefreshCw, Search, Siren, Smartphone, Video } from "lucide-react";
import { AlertStatusBadge, HistoryTimeline, IncidentStatusBadge, KpiCard, SeverityBadge } from "@/components/operations/operation-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ALERT_SOURCES, ALERT_SOURCE_LABELS, ALERT_STATUSES, ALERT_STATUS_LABELS, type AlertDetail, type AlertOverview, type AlertSeverity, type AlertSource, type AlertStatus } from "@/lib/operations/types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };
type AlertOverviewPayload = Pick<AlertOverview, "items" | "summary" | "districts" | "province" | "freshness" | "isDemo">;

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success || payload.data === undefined) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data;
}

function AlertListCard({ item, selected, onSelect }: { item: AlertOverview["items"][number]; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={cn("w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 motion-reduce:transition-none", selected ? "border-cyan-200/35 bg-cyan-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.05]")}>
    <div className="flex items-start gap-3"><span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", item.severity === "CRITICAL" ? "bg-rose-300/15 text-rose-200" : item.severity === "HIGH" ? "bg-orange-300/15 text-orange-200" : "bg-cyan-300/10 text-cyan-200")}><AlertTriangle className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><SeverityBadge severity={item.severity} label={item.severityLabel} /><AlertStatusBadge status={item.status} label={item.statusLabel} /></span><span className="mt-2 block text-sm font-medium leading-5 text-slate-200">{item.title}</span><span className="mt-1 block line-clamp-2 text-[11px] leading-5 text-slate-500">{item.description ?? "ไม่มีรายละเอียด"}</span></span><ChevronRight className={cn("mt-1 size-4 shrink-0 transition", selected ? "text-cyan-200" : "text-slate-700")} /></div>
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600"><span className="flex items-center gap-1"><BellRing className="size-3" />{item.sourceLabel}</span><span className="flex items-center gap-1"><MapPin className="size-3" />{item.district?.nameTh ?? "ไม่ระบุพื้นที่"}</span><span className="ml-auto">{formatDateTime(item.createdAt)}</span></div>
  </button>;
}

function AlertDetailPanel({ detail, canManage, onStatusSave }: { detail: AlertDetail; canManage: boolean; onStatusSave: (status: AlertStatus, note: string) => Promise<void> }) {
  const [nextStatus, setNextStatus] = useState<AlertStatus>(detail.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = nextStatus !== detail.status || note.trim().length > 0;

  async function save() {
    setSaving(true);
    setError("");
    try { await onStatusSave(nextStatus, note); setNote(""); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "บันทึกสถานะไม่สำเร็จ"); } finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-200/70">Alert / {detail.publicId}</p><h3 className="mt-2 text-xl font-semibold leading-7 text-white">{detail.title}</h3><p className="mt-1 text-xs text-slate-500">สร้างเมื่อ {formatDateTime(detail.createdAt)}</p></div><div className="flex shrink-0 flex-col items-end gap-1.5"><SeverityBadge severity={detail.severity} label={detail.severityLabel} /><AlertStatusBadge status={detail.status} label={detail.statusLabel} /></div></div>
    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-200" /><p className="text-sm leading-6 text-slate-300">{detail.description ?? "รายการนี้ยังไม่มีคำอธิบายเพิ่มเติม"}</p></div></div>
    <div className="grid gap-2 sm:grid-cols-2"><InfoCell icon={BellRing} label="แหล่งที่มา" value={detail.sourceLabel} /><InfoCell icon={MapPin} label="พื้นที่" value={[detail.locationName, detail.district?.nameTh].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่"} /><InfoCell icon={Smartphone} label="หน่วยงาน" value={detail.agencyName ?? "ไม่ระบุหน่วยงาน"} /><InfoCell icon={Clock3} label="อัปเดตล่าสุด" value={formatDateTime(detail.updatedAt)} /></div>
    {(detail.camera || detail.device) && <Card><CardHeader className="pb-3"><CardTitle className="text-sm">แหล่งข้อมูลที่เชื่อมโยง</CardTitle></CardHeader><CardContent className="space-y-2">{detail.camera && <Link href="/cctv" className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 transition hover:border-cyan-200/25 hover:bg-cyan-200/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Video className="size-4 text-cyan-200" /><span className="min-w-0 flex-1"><span className="block text-xs text-slate-200">{detail.camera.nameTh}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{detail.camera.code}</span></span><ExternalLink className="size-3 text-slate-600" /></Link>}{detail.device && <Link href="/iot" className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 transition hover:border-cyan-200/25 hover:bg-cyan-200/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Smartphone className="size-4 text-violet-200" /><span className="min-w-0 flex-1"><span className="block text-xs text-slate-200">{detail.device.nameTh}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{detail.device.code}</span></span><ExternalLink className="size-3 text-slate-600" /></Link>}</CardContent></Card>}
    {canManage && <Card className="border-cyan-200/10"><CardHeader className="pb-3"><CardTitle className="text-sm">การตอบสนอง</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><Select className="min-w-0 flex-1" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as AlertStatus)} aria-label="สถานะแจ้งเตือน">{ALERT_STATUSES.map((status) => <option key={status} value={status}>{ALERT_STATUS_LABELS[status]}</option>)}</Select><Button size="sm" onClick={() => void save()} disabled={!dirty || saving}><Check className="size-3.5" />{saving ? "กำลังบันทึก" : "บันทึกสถานะ"}</Button></div><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="เพิ่มหมายเหตุ (ถ้ามี)" aria-label="หมายเหตุการอัปเดต" />{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}</CardContent></Card>}
    <Card><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-sm">ประวัติการดำเนินการ</CardTitle><Badge variant="neutral">{formatNumber(detail.history.length)} รายการ</Badge></CardHeader><CardContent><HistoryTimeline history={detail.history} /></CardContent></Card>
    <Card><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-sm">เหตุการณ์ที่เชื่อมโยง</CardTitle><Badge variant="neutral">{formatNumber(detail.incidents.length)} รายการ</Badge></CardHeader><CardContent className="space-y-2">{detail.incidents.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-slate-500">ยังไม่มี incident ที่เชื่อมโยง</p> : detail.incidents.map((incident) => <Link key={incident.id} href="/incidents" className="flex items-center gap-3 rounded-xl border border-white/[.07] px-3 py-2.5 transition hover:border-cyan-200/25 hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Siren className="size-4 text-rose-200" /><span className="min-w-0 flex-1"><span className="block truncate text-xs text-slate-200">{incident.title}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{incident.id}</span></span><IncidentStatusBadge status={incident.status} label={incident.statusLabel} /></Link>)}</CardContent></Card>
  </div>;
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof BellRing; label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-600"><Icon className="size-3 text-cyan-200/70" />{label}</p><p className="mt-1 truncate text-xs text-slate-300">{value}</p></div>;
}

export function AlertCenterClient({ initialData, canManage, initialSelectedId = null }: { initialData: AlertOverview; canManage: boolean; initialSelectedId?: string | null }) {
  const [overview, setOverview] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? initialData.items[0]?.id ?? "");
  const [detail, setDetail] = useState<AlertDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<AlertSource | "ALL">("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("th-TH");
    return overview.items.filter((item) => (
      (statusFilter === "ALL" || item.status === statusFilter)
      && (severityFilter === "ALL" || item.severity === severityFilter)
      && (sourceFilter === "ALL" || item.source === sourceFilter)
      && (districtFilter === "ALL" || item.district?.id === districtFilter)
      && (!normalizedSearch || [item.title, item.description, item.sourceLabel, item.district?.nameTh].filter(Boolean).some((value) => value!.toLocaleLowerCase("th-TH").includes(normalizedSearch)))
    ));
  }, [districtFilter, overview.items, search, severityFilter, sourceFilter, statusFilter]);

  const selectedMissing = Boolean(selectedId && !overview.items.some((item) => item.id === selectedId));
  const effectiveSelectedId = selectedMissing ? "" : visibleItems.some((item) => item.id === selectedId) ? selectedId : visibleItems[0]?.id ?? "";
  const activeDetail = detail?.id === effectiveSelectedId ? detail : null;

  useEffect(() => {
    if (!effectiveSelectedId) return;
    let active = true;
    api<AlertDetail>(`/api/v1/alerts/${effectiveSelectedId}`).then((result) => { if (active) setDetail(result); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "โหลดรายละเอียดไม่สำเร็จ"); });
    return () => { active = false; };
  }, [effectiveSelectedId]);

  async function refresh() {
    setRefreshing(true);
    try {
      const result = await api<AlertOverviewPayload>("/api/v1/alerts?limit=100");
      setOverview((current) => ({ ...current, ...result, pagination: { ...current.pagination, total: result.items.length } }));
      setError("");
    } catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "รีเฟรชข้อมูลไม่สำเร็จ"); } finally { setRefreshing(false); }
  }

  async function saveStatus(status: AlertStatus, note: string) {
    const updated = await api<AlertDetail>(`/api/v1/alerts/${effectiveSelectedId}`, { method: "PATCH", body: JSON.stringify({ status, note }) });
    setDetail(updated);
    setOverview((current) => ({ ...current, items: current.items.map((item) => item.id === updated.id ? updated : item) }));
    await refresh();
  }

  return <div className="mx-auto max-w-[1800px] space-y-5">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200"><BellRing className="size-4" /></span><p className="text-xs font-medium uppercase tracking-[.18em] text-amber-200/70">Operational command · Phase 5</p></div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">ศูนย์แจ้งเตือน</h2><p className="mt-1 text-sm text-slate-500">รวมสัญญาณจาก IoT, CCTV และ rule engine เพื่อจัดลำดับการตอบสนอง</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] text-slate-400"><Clock3 className="size-3.5 text-cyan-200" />อัปเดต {formatDateTime(overview.freshness)}{overview.isDemo && <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[9px] text-amber-200">DEMO</span>}</div><Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />รีเฟรช</Button><Button asChild variant="outline" size="sm"><Link href="/incidents"><Siren className="size-3.5" />ไปที่จัดการเหตุการณ์</Link></Button></div></div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")} className="rounded-lg px-2 py-1 hover:bg-rose-300/10" aria-label="ปิดข้อความแจ้งเตือน">ปิด</button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><KpiCard title="รายการทั้งหมด" value={overview.summary.total} caption="ทุกสถานะ" icon={BellRing} /><KpiCard title="ยังต้องติดตาม" value={overview.summary.open} caption="ยังไม่ปิดรายการ" icon={Clock3} tone="amber" /><KpiCard title="รายการใหม่" value={overview.summary.new} caption="รอรับทราบ" icon={AlertTriangle} tone="rose" /><KpiCard title="ระดับวิกฤต" value={overview.summary.critical} caption="Critical ที่ยังเปิด" icon={Siren} tone="rose" /><KpiCard title="แก้ไขแล้ว" value={overview.summary.resolved} caption="Resolved / Dismissed" icon={Check} tone="emerald" /></section>
    <Card><CardContent className="flex flex-col gap-2 p-3 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="ค้นหาชื่อแจ้งเตือน รายละเอียด หรือแหล่งที่มา" aria-label="ค้นหาการแจ้งเตือน" /></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex"><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatus | "ALL")} aria-label="กรองสถานะ"><option value="ALL">ทุกสถานะ</option>{ALERT_STATUSES.map((status) => <option key={status} value={status}>{ALERT_STATUS_LABELS[status]}</option>)}</Select><Select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as AlertSeverity | "ALL")} aria-label="กรองระดับความรุนแรง"><option value="ALL">ทุกระดับ</option><option value="CRITICAL">วิกฤต</option><option value="HIGH">สูง</option><option value="WARNING">เฝ้าระวัง</option><option value="LOW">ต่ำ</option><option value="INFO">ข้อมูล</option></Select><Select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as AlertSource | "ALL")} aria-label="กรองแหล่งที่มา"><option value="ALL">ทุกแหล่งที่มา</option>{ALERT_SOURCES.map((source) => <option key={source} value={source}>{ALERT_SOURCE_LABELS[source]}</option>)}</Select><Select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} aria-label="กรองอำเภอ"><option value="ALL">ทุกอำเภอ</option>{overview.districts.map((district) => <option key={district.id} value={district.id}>{district.nameTh}</option>)}</Select></div></CardContent></Card>
    <section className="grid gap-5 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]"><Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-4"><div><CardTitle className="text-base">รายการแจ้งเตือน</CardTitle><p className="mt-1 text-xs text-slate-500">แสดง {formatNumber(visibleItems.length)} จาก {formatNumber(overview.pagination.total)} รายการ</p></div><Badge variant="neutral">เรียงตามความสำคัญ</Badge></CardHeader><CardContent className="max-h-[760px] space-y-2 overflow-y-auto p-3">{visibleItems.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-xs text-slate-500">ไม่พบรายการตามตัวกรอง</div> : visibleItems.map((item) => <AlertListCard key={item.id} item={item} selected={item.id === effectiveSelectedId} onSelect={() => setSelectedId(item.id)} />)}</CardContent></Card><Card className="min-h-[640px]"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-4"><div><CardTitle className="text-base">รายละเอียดและการตอบสนอง</CardTitle><p className="mt-1 text-xs text-slate-500">ตรวจสอบบริบท, source และประวัติ status transition</p></div></CardHeader><CardContent className="p-4 sm:p-5">{activeDetail ? <AlertDetailPanel key={`${activeDetail.id}-${activeDetail.updatedAt}`} detail={activeDetail} canManage={canManage} onStatusSave={saveStatus} /> : <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center text-sm text-slate-500">{selectedMissing ? <><BellRing className="size-9 text-slate-700" /><p className="mt-3 text-slate-300">ไม่พบรายการแจ้งเตือนที่ระบุ</p><button type="button" className="mt-3 text-xs text-cyan-200 hover:text-cyan-100" onClick={() => setSelectedId(overview.items[0]?.id ?? "")}>เปิดรายการล่าสุด</button></> : "เลือก alert เพื่อดูรายละเอียด"}</div>}</CardContent></Card></section>
  </div>;
}
