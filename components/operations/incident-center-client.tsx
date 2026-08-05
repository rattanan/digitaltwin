"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, Check, ChevronRight, Clock3, ExternalLink, FilePlus2, MapPin, RefreshCw, Search, Siren, Smartphone, Video } from "lucide-react";
import { HistoryTimeline, IncidentStatusBadge, KpiCard, SeverityBadge } from "@/components/operations/operation-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ALERT_SEVERITIES, ALERT_SEVERITY_LABELS, INCIDENT_CATEGORIES, INCIDENT_CATEGORY_LABELS, INCIDENT_STATUSES, INCIDENT_STATUS_LABELS, type AlertSeverity, type IncidentCategory, type IncidentDetail, type IncidentOverview, type IncidentStatus } from "@/lib/operations/types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };
type IncidentOverviewPayload = Pick<IncidentOverview, "items" | "summary" | "districts" | "province" | "freshness" | "isDemo">;

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success || payload.data === undefined) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data;
}

function IncidentListCard({ item, selected, onSelect }: { item: IncidentOverview["items"][number]; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={cn("w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 motion-reduce:transition-none", selected ? "border-violet-200/35 bg-violet-200/[.08]" : "border-white/[.07] bg-white/[.02] hover:border-white/15 hover:bg-white/[.05]")}>
    <div className="flex items-start gap-3"><span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", item.isOverdue ? "bg-rose-300/15 text-rose-200" : "bg-violet-300/10 text-violet-200")}><Siren className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><SeverityBadge severity={item.severity} label={item.severityLabel} /><IncidentStatusBadge status={item.status} label={item.statusLabel} /></span><span className="mt-2 block text-sm font-medium leading-5 text-slate-200">{item.title}</span><span className="mt-1 block font-mono text-[10px] text-slate-600">{item.incidentNo} · {item.categoryLabel}</span></span><ChevronRight className={cn("mt-1 size-4 shrink-0 transition", selected ? "text-violet-200" : "text-slate-700")} /></div>
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600"><span className="flex items-center gap-1"><MapPin className="size-3" />{item.district?.nameTh ?? "ไม่ระบุพื้นที่"}</span>{item.dueAt && <span className={cn("flex items-center gap-1", item.isOverdue && "text-rose-200")}><Clock3 className="size-3" />{item.isOverdue ? "เกินกำหนด" : `กำหนด ${formatDateTime(item.dueAt)}`}</span>}<span className="ml-auto">{formatDateTime(item.createdAt)}</span></div>
  </button>;
}

function IncidentDetailPanel({ detail, canManage, onStatusSave }: { detail: IncidentDetail; canManage: boolean; onStatusSave: (status: IncidentStatus, note: string, resolution: string) => Promise<void> }) {
  const [nextStatus, setNextStatus] = useState<IncidentStatus>(detail.status);
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = nextStatus !== detail.status || note.trim().length > 0 || resolution.trim().length > 0;

  async function save() {
    setSaving(true);
    setError("");
    try { await onStatusSave(nextStatus, note, resolution); setNote(""); setResolution(""); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "บันทึกสถานะไม่สำเร็จ"); } finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-violet-200/70">Incident / {detail.incidentNo}</p><h3 className="mt-2 text-xl font-semibold leading-7 text-white">{detail.title}</h3><p className="mt-1 text-xs text-slate-500">สร้างเมื่อ {formatDateTime(detail.createdAt)}</p></div><div className="flex shrink-0 flex-col items-end gap-1.5"><SeverityBadge severity={detail.severity} label={detail.severityLabel} /><IncidentStatusBadge status={detail.status} label={detail.statusLabel} /></div></div>
    <div className={cn("rounded-2xl border p-4", detail.isOverdue ? "border-rose-300/20 bg-rose-300/[.06]" : "border-violet-300/15 bg-violet-300/[.05]")}><div className="flex gap-3"><AlertTriangle className={cn("mt-0.5 size-4 shrink-0", detail.isOverdue ? "text-rose-200" : "text-violet-200")} /><div><p className="text-sm font-medium text-slate-200">{detail.isOverdue ? "เหตุการณ์เกินกำหนดติดตาม" : "บริบทเหตุการณ์"}</p><p className="mt-1 text-sm leading-6 text-slate-400">{detail.description ?? "รายการนี้ยังไม่มีคำอธิบายเพิ่มเติม"}</p></div></div></div>
    <div className="grid gap-2 sm:grid-cols-2"><InfoCell icon={Siren} label="ประเภท" value={detail.categoryLabel} /><InfoCell icon={MapPin} label="พื้นที่" value={[detail.locationName, detail.district?.nameTh].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่"} /><InfoCell icon={Clock3} label="กำหนดติดตาม" value={detail.dueAt ? formatDateTime(detail.dueAt) : "ไม่ระบุ"} /><InfoCell icon={Smartphone} label="หน่วยงาน" value={detail.agencyName ?? "ไม่ระบุหน่วยงาน"} /></div>
    {detail.resolution && <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] px-4 py-3"><p className="text-[10px] uppercase tracking-wide text-emerald-200/70">ผลการแก้ไข</p><p className="mt-1 text-sm leading-6 text-slate-300">{detail.resolution}</p></div>}
    {(detail.alert || detail.camera || detail.device) && <Card><CardHeader className="pb-3"><CardTitle className="text-sm">ความสัมพันธ์ของเหตุการณ์</CardTitle></CardHeader><CardContent className="space-y-2">{detail.alert && <Link href="/alerts" className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 transition hover:border-amber-200/25 hover:bg-amber-200/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><BellRing className="size-4 text-amber-200" /><span className="min-w-0 flex-1"><span className="block truncate text-xs text-slate-200">{detail.alert.title}</span><span className="mt-0.5 block text-[10px] text-slate-600">การแจ้งเตือนต้นทาง</span></span><ExternalLink className="size-3 text-slate-600" /></Link>}{detail.camera && <Link href="/cctv" className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 transition hover:border-cyan-200/25 hover:bg-cyan-200/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Video className="size-4 text-cyan-200" /><span className="min-w-0 flex-1"><span className="block text-xs text-slate-200">{detail.camera.nameTh}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{detail.camera.code}</span></span><ExternalLink className="size-3 text-slate-600" /></Link>}{detail.device && <Link href="/iot" className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 transition hover:border-violet-200/25 hover:bg-violet-200/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Smartphone className="size-4 text-violet-200" /><span className="min-w-0 flex-1"><span className="block text-xs text-slate-200">{detail.device.nameTh}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{detail.device.code}</span></span><ExternalLink className="size-3 text-slate-600" /></Link>}</CardContent></Card>}
    {canManage && <Card className="border-violet-200/10"><CardHeader className="pb-3"><CardTitle className="text-sm">การจัดการเหตุการณ์</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><Select className="min-w-0 flex-1" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as IncidentStatus)} aria-label="สถานะเหตุการณ์">{INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}</Select><Button size="sm" onClick={() => void save()} disabled={!dirty || saving}><Check className="size-3.5" />{saving ? "กำลังบันทึก" : "บันทึกสถานะ"}</Button></div><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="หมายเหตุการดำเนินการ (ถ้ามี)" aria-label="หมายเหตุเหตุการณ์" /><Input value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="ผลการแก้ไข (ใช้เมื่อปิดเหตุการณ์)" aria-label="ผลการแก้ไข" />{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}</CardContent></Card>}
    <Card><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="text-sm">ประวัติสถานะ</CardTitle><Badge variant="neutral">{formatNumber(detail.history.length)} รายการ</Badge></CardHeader><CardContent><HistoryTimeline history={detail.history} /></CardContent></Card>
  </div>;
}

function CreateIncidentForm({ onCreated }: { onCreated: (incident: IncidentDetail) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("OTHER");
  const [severity, setSeverity] = useState<AlertSeverity>("WARNING");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api<IncidentDetail | null>("/api/v1/incidents", { method: "POST", body: JSON.stringify({ title, category, severity, ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}) }) });
      if (!created) throw new Error("ไม่สามารถโหลดเหตุการณ์ที่สร้างได้");
      setTitle(""); setDueAt(""); await onCreated(created);
    } catch (createError) { setError(createError instanceof Error ? createError.message : "สร้างเหตุการณ์ไม่สำเร็จ"); } finally { setSaving(false); }
  }

  return <Card className="border-violet-200/15"><CardHeader className="pb-3"><CardTitle className="text-sm">เปิดเหตุการณ์ใหม่</CardTitle><p className="text-xs text-slate-500">บันทึกเหตุการณ์จากการตรวจสอบภาคสนามหรือการประสานงาน</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-2 sm:grid-cols-2"><Input className="sm:col-span-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ชื่อเหตุการณ์" required minLength={2} maxLength={191} aria-label="ชื่อเหตุการณ์ใหม่" /><Select value={category} onChange={(event) => setCategory(event.target.value as IncidentCategory)} aria-label="ประเภทเหตุการณ์">{INCIDENT_CATEGORIES.map((item) => <option key={item} value={item}>{INCIDENT_CATEGORY_LABELS[item]}</option>)}</Select><Select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)} aria-label="ระดับความรุนแรง">{ALERT_SEVERITIES.map((item) => <option key={item} value={item}>{ALERT_SEVERITY_LABELS[item]}</option>)}</Select><Input className="sm:col-span-2" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} aria-label="กำหนดติดตาม" /><div className="flex items-center justify-end gap-2 sm:col-span-2"><Button type="submit" size="sm" disabled={saving || !title.trim()}><FilePlus2 className="size-3.5" />{saving ? "กำลังสร้าง" : "เปิดเหตุการณ์"}</Button></div>{error && <p role="alert" className="sm:col-span-2 text-xs text-rose-200">{error}</p>}</form></CardContent></Card>;
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof Siren; label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-600"><Icon className="size-3 text-violet-200/70" />{label}</p><p className="mt-1 truncate text-xs text-slate-300">{value}</p></div>;
}

export function IncidentCenterClient({ initialData, canManage, initialSelectedId = null }: { initialData: IncidentOverview; canManage: boolean; initialSelectedId?: string | null }) {
  const [overview, setOverview] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? initialData.items[0]?.id ?? "");
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "ALL">("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("th-TH");
    return overview.items.filter((item) => (
      (statusFilter === "ALL" || item.status === statusFilter)
      && (severityFilter === "ALL" || item.severity === severityFilter)
      && (categoryFilter === "ALL" || item.category === categoryFilter)
      && (districtFilter === "ALL" || item.district?.id === districtFilter)
      && (!normalizedSearch || [item.incidentNo, item.title, item.description, item.categoryLabel, item.district?.nameTh].filter(Boolean).some((value) => value!.toLocaleLowerCase("th-TH").includes(normalizedSearch)))
    ));
  }, [categoryFilter, districtFilter, overview.items, search, severityFilter, statusFilter]);

  const selectedMissing = Boolean(selectedId && !overview.items.some((item) => item.id === selectedId));
  const effectiveSelectedId = selectedMissing ? "" : visibleItems.some((item) => item.id === selectedId) ? selectedId : visibleItems[0]?.id ?? "";
  const activeDetail = detail?.id === effectiveSelectedId ? detail : null;

  useEffect(() => {
    if (!effectiveSelectedId) return;
    let active = true;
    api<IncidentDetail>(`/api/v1/incidents/${effectiveSelectedId}`).then((result) => { if (active) setDetail(result); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "โหลดรายละเอียดไม่สำเร็จ"); });
    return () => { active = false; };
  }, [effectiveSelectedId]);

  async function refresh() {
    setRefreshing(true);
    try {
      const result = await api<IncidentOverviewPayload>("/api/v1/incidents?limit=100");
      setOverview((current) => ({ ...current, ...result, pagination: { ...current.pagination, total: result.items.length } }));
      setError("");
    } catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "รีเฟรชข้อมูลไม่สำเร็จ"); } finally { setRefreshing(false); }
  }

  async function saveStatus(status: IncidentStatus, note: string, resolution: string) {
    const updated = await api<IncidentDetail>(`/api/v1/incidents/${effectiveSelectedId}`, { method: "PATCH", body: JSON.stringify({ status, note, resolution }) });
    setDetail(updated);
    setOverview((current) => ({ ...current, items: current.items.map((item) => item.id === updated.id ? updated : item) }));
    await refresh();
  }

  async function onCreated(created: IncidentDetail) {
    setShowCreate(false);
    setSelectedId(created.id);
    await refresh();
  }

  return <div className="mx-auto max-w-[1800px] space-y-5">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200"><Siren className="size-4" /></span><p className="text-xs font-medium uppercase tracking-[.18em] text-violet-200/70">Operational command · Phase 5</p></div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">จัดการเหตุการณ์</h2><p className="mt-1 text-sm text-slate-500">เปลี่ยนสัญญาณแจ้งเตือนให้เป็นงานที่มีผู้รับผิดชอบและกำหนดติดตาม</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] text-slate-400"><Clock3 className="size-3.5 text-violet-200" />อัปเดต {formatDateTime(overview.freshness)}{overview.isDemo && <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[9px] text-amber-200">DEMO</span>}</div><Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />รีเฟรช</Button>{canManage && <Button variant={showCreate ? "outline" : "default"} size="sm" onClick={() => setShowCreate((value) => !value)}><FilePlus2 className="size-3.5" />{showCreate ? "ปิดฟอร์ม" : "เปิดเหตุการณ์ใหม่"}</Button>}<Button asChild variant="outline" size="sm"><Link href="/alerts"><BellRing className="size-3.5" />กลับไปศูนย์แจ้งเตือน</Link></Button></div></div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")} className="rounded-lg px-2 py-1 hover:bg-rose-300/10" aria-label="ปิดข้อความแจ้งเตือน">ปิด</button></div>}
    {showCreate && canManage && <CreateIncidentForm onCreated={onCreated} />}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><KpiCard title="เหตุการณ์ทั้งหมด" value={overview.summary.total} caption="ทุกสถานะ" icon={Siren} tone="violet" /><KpiCard title="กำลังดำเนินการ" value={overview.summary.open} caption="ยังไม่ resolved / closed" icon={Clock3} tone="amber" /><KpiCard title="ระดับวิกฤต" value={overview.summary.critical} caption="Critical ที่ยังเปิด" icon={AlertTriangle} tone="rose" /><KpiCard title="ถึงกำหนดติดตาม" value={overview.summary.due} caption="เกินกำหนด" icon={Clock3} tone="rose" /><KpiCard title="ปิดแล้ว" value={overview.summary.resolved} caption="Resolved / Closed" icon={Check} tone="emerald" /></section>
    <Card><CardContent className="flex flex-col gap-2 p-3 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="ค้นหาเลขที่ ชื่อเหตุการณ์ ประเภท หรือพื้นที่" aria-label="ค้นหาเหตุการณ์" /></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex"><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IncidentStatus | "ALL")} aria-label="กรองสถานะเหตุการณ์"><option value="ALL">ทุกสถานะ</option>{INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status]}</option>)}</Select><Select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as AlertSeverity | "ALL")} aria-label="กรองระดับความรุนแรง"><option value="ALL">ทุกระดับ</option>{ALERT_SEVERITIES.map((severity) => <option key={severity} value={severity}>{ALERT_SEVERITY_LABELS[severity]}</option>)}</Select><Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as IncidentCategory | "ALL")} aria-label="กรองประเภทเหตุการณ์"><option value="ALL">ทุกประเภท</option>{INCIDENT_CATEGORIES.map((category) => <option key={category} value={category}>{INCIDENT_CATEGORY_LABELS[category]}</option>)}</Select><Select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} aria-label="กรองอำเภอ"><option value="ALL">ทุกอำเภอ</option>{overview.districts.map((district) => <option key={district.id} value={district.id}>{district.nameTh}</option>)}</Select></div></CardContent></Card>
    <section className="grid gap-5 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]"><Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-4"><div><CardTitle className="text-base">รายการเหตุการณ์</CardTitle><p className="mt-1 text-xs text-slate-500">แสดง {formatNumber(visibleItems.length)} จาก {formatNumber(overview.pagination.total)} รายการ</p></div><Badge variant="neutral">workflow ติดตาม</Badge></CardHeader><CardContent className="max-h-[760px] space-y-2 overflow-y-auto p-3">{visibleItems.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-xs text-slate-500">ไม่พบรายการตามตัวกรอง</div> : visibleItems.map((item) => <IncidentListCard key={item.id} item={item} selected={item.id === effectiveSelectedId} onSelect={() => setSelectedId(item.id)} />)}</CardContent></Card><Card className="min-h-[640px]"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-4"><div><CardTitle className="text-base">รายละเอียดและ workflow</CardTitle><p className="mt-1 text-xs text-slate-500">ตรวจสอบความสัมพันธ์และอัปเดตสถานะเหตุการณ์</p></div></CardHeader><CardContent className="p-4 sm:p-5">{activeDetail ? <IncidentDetailPanel key={`${activeDetail.id}-${activeDetail.updatedAt}`} detail={activeDetail} canManage={canManage} onStatusSave={saveStatus} /> : <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center text-sm text-slate-500">{selectedMissing ? <><Siren className="size-9 text-slate-700" /><p className="mt-3 text-slate-300">ไม่พบเหตุการณ์ที่ระบุ</p><button type="button" className="mt-3 text-xs text-cyan-200 hover:text-cyan-100" onClick={() => setSelectedId(overview.items[0]?.id ?? "")}>เปิดเหตุการณ์ล่าสุด</button></> : "เลือก incident เพื่อดูรายละเอียด"}</div>}</CardContent></Card></section>
  </div>;
}
