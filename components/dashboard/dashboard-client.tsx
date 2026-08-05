"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BrainCircuit, Camera, CarFront, CheckCircle2, ChevronDown, Clock3, CloudRain, Droplets, Expand, Gauge, Layers3, MapPin, RefreshCw, Siren, Smartphone, Sparkles, Truck, UsersRound, Wind, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CommandMap } from "@/components/dashboard/command-map";
import type { DashboardSnapshot } from "@/lib/demo-data";
import type { MapSnapshot } from "@/lib/map/types";
import { formatNumber, formatDateTime } from "@/lib/utils";

const metricCards: { key: keyof DashboardSnapshot["metrics"]; label: string; icon: LucideIcon; tone: string }[] = [
  { key: "pm25", label: "PM2.5", icon: Wind, tone: "text-violet-200" },
  { key: "rainfall", label: "ฝนสะสมวันนี้", icon: CloudRain, tone: "text-cyan-200" },
  { key: "waterLevel", label: "ระดับน้ำ C7.A", icon: Droplets, tone: "text-blue-200" },
  { key: "traffic", label: "ความเร็วเฉลี่ย", icon: CarFront, tone: "text-emerald-200" },
  { key: "waste", label: "ขยะที่จัดเก็บ", icon: Truck, tone: "text-amber-200" },
  { key: "hospitalBeds", label: "เตียงพร้อมใช้", icon: Activity, tone: "text-rose-200" },
];

function StatusDot({ status }: { status: string }) {
  const danger = /สูง|critical|ผิดปกติ/i.test(status);
  const warning = /เฝ้าระวัง|warning/i.test(status);
  return <span className={`size-2 rounded-full ${danger ? "bg-rose-300 shadow-[0_0_10px_#fda4af]" : warning ? "bg-amber-300 shadow-[0_0_10px_#fcd34d]" : "bg-emerald-300 shadow-[0_0_10px_#6ee7b7]"}`} />;
}

function MetricCard({ item, summary }: { item: (typeof metricCards)[number]; summary: DashboardSnapshot }) {
  const metric = summary.metrics[item.key];
  const Icon = item.icon;
  const trendUp = metric.trend >= 0;
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-6 -top-8 size-24 rounded-full bg-cyan-300/[0.04] blur-2xl" />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl bg-white/[0.06]"><Icon className={`size-4 ${item.tone}`} /></span><span className="text-xs text-slate-500">{item.label}</span></div><StatusDot status={metric.status} /></div>
        <div className="mt-4 flex items-end justify-between"><div><span className="text-2xl font-semibold tracking-tight text-white">{formatNumber(metric.value, { maximumFractionDigits: 1 })}</span><span className="ml-1 text-xs text-slate-500">{metric.unit}</span></div><div className={`flex items-center gap-0.5 text-[11px] ${trendUp ? "text-emerald-300" : "text-rose-300"}`}>{trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(metric.trend).toFixed(1)}%</div></div>
        <p className="mt-2 text-[11px] text-slate-600">{metric.status}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ initialSummary, initialMapSnapshot }: { initialSummary: DashboardSnapshot; initialMapSnapshot: MapSnapshot }) {
  const [summary, setSummary] = useState(initialSummary);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ district: "all", agency: "all", range: "today" });
  const [fullscreen, setFullscreen] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/v1/dashboard/summary", { cache: "no-store" });
      const payload = await response.json() as { success?: boolean; data?: DashboardSnapshot; message?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setSummary(payload.data);
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "ไม่สามารถโหลดข้อมูลล่าสุดได้");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  const activeAlerts = useMemo(() => summary.alerts.critical + summary.alerts.high + summary.alerts.warning, [summary.alerts]);

  return (
    <div className="mx-auto max-w-[1800px] space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200"><Activity className="size-4" /></span><p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70">Live provincial overview</p></div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">ภาพรวมสถานการณ์จังหวัด</h2><p className="mt-1 text-sm text-slate-500">มุมมองรวมสำหรับติดตามข้อมูลสำคัญและเหตุการณ์ที่ต้องตอบสนอง</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400"><Clock3 className="size-3.5 text-cyan-200" />อัปเดต {formatDateTime(summary.freshness)}{summary.isDemo && <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[9px] text-amber-200">DEMO</span>}</div>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh((value) => !value)}><RefreshCw className={`size-3.5 ${autoRefresh ? "text-cyan-200" : "text-slate-500"} ${refreshing ? "animate-spin" : ""}`} />{autoRefresh ? "Auto 60s" : "Manual"}</Button>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing}><RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />รีเฟรช</Button>
          <Button variant="secondary" size="sm" onClick={toggleFullscreen}><Expand className="size-3.5" />{fullscreen ? "ย่อหน้าจอ" : "เต็มจอ"}</Button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button onClick={refresh} className="rounded-lg p-1 hover:bg-rose-300/10" aria-label="ปิดข้อความ"><X className="size-4" /></button></div>}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3"><span className="mr-1 flex items-center gap-2 text-xs font-medium text-slate-400"><Layers3 className="size-4 text-cyan-200" />ตัวกรอง</span><Select value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} aria-label="เลือกอำเภอ"><option value="all">ทุกอำเภอ</option><option value="mueang">เมืองสิงห์บุรี</option><option value="phrom">พรหมบุรี</option><option value="inburi">อินทร์บุรี</option></Select><Select value={filters.agency} onChange={(event) => setFilters({ ...filters, agency: event.target.value })} aria-label="เลือกหน่วยงาน"><option value="all">ทุกหน่วยงาน</option><option value="command">ศูนย์บัญชาการจังหวัด</option><option value="disaster">ปภ.</option><option value="health">สาธารณสุข</option></Select><Select value={filters.range} onChange={(event) => setFilters({ ...filters, range: event.target.value })} aria-label="เลือกช่วงเวลา"><option value="today">วันนี้</option><option value="7d">7 วันล่าสุด</option><option value="30d">30 วันล่าสุด</option></Select><span className="ml-auto hidden items-center gap-1.5 text-[11px] text-slate-600 sm:flex"><span className="size-1.5 rounded-full bg-emerald-300" />ข้อมูลพร้อมใช้งาน</span></div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{metricCards.map((item) => <MetricCard key={item.key} item={item} summary={summary} />)}</section>

      <CommandMap initialSnapshot={initialMapSnapshot} />

      <section className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4 text-amber-200" />แจ้งเตือนสำคัญ</CardTitle><Badge variant="danger">{activeAlerts} รายการ</Badge></CardHeader><CardContent className="space-y-3">{summary.news.map((item) => <div key={item.title} className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className={`mt-1 size-2 shrink-0 rounded-full ${item.severity === "HIGH" ? "bg-rose-300" : item.severity === "WARNING" ? "bg-amber-300" : "bg-cyan-300"}`} /><div className="min-w-0"><p className="text-xs font-medium leading-5 text-slate-200">{item.title}</p><p className="mt-1 text-[10px] text-slate-600">{formatDateTime(item.time)}</p></div></div>)}<Button asChild variant="ghost" size="sm" className="w-full justify-center text-cyan-200"><Link href="/alerts">ดูศูนย์แจ้งเตือน <ChevronDown className="size-3.5 -rotate-90" /></Link></Button></CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Camera className="size-4 text-cyan-200" />สถานะ CCTV</CardTitle><span className="text-xs text-slate-500">{formatNumber(summary.cctv.online + summary.cctv.offline + summary.cctv.maintenance + summary.cctv.degraded)} จุด</span></CardHeader><CardContent><div className="grid grid-cols-2 gap-2">{[["ออนไลน์", summary.cctv.online, "text-emerald-200", "bg-emerald-300"], ["Offline", summary.cctv.offline, "text-rose-200", "bg-rose-300"], ["ซ่อมบำรุง", summary.cctv.maintenance, "text-amber-200", "bg-amber-300"], ["คุณภาพลดลง", summary.cctv.degraded, "text-violet-200", "bg-violet-300"]].map(([label, value, text, dot]) => <div key={label} className="rounded-xl bg-white/[0.035] p-3"><div className="flex items-center gap-2"><span className={`size-1.5 rounded-full ${dot}`} /><span className="text-[11px] text-slate-500">{label}</span></div><p className={`mt-2 text-xl font-semibold ${text}`}>{value}</p></div>)}</div><div className="mt-3 flex items-center justify-between text-[10px] text-slate-600"><span>อัปเดตพร้อม Dashboard</span><Link href="/cctv" className="flex items-center gap-1 text-cyan-200/80 hover:text-cyan-100"><Smartphone className="size-3" />เปิดศูนย์ CCTV</Link></div></CardContent></Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Droplets className="size-4 text-blue-200" />แนวโน้มระดับน้ำ</CardTitle><p className="mt-1 text-xs text-slate-500">สถานี C7.A · 24 ชั่วโมงล่าสุด</p></div><span className="text-right"><span className="block text-xl font-semibold text-blue-100">{summary.metrics.waterLevel.value.toFixed(2)} <small className="text-[10px] font-normal text-slate-500">เมตร</small></span><span className="text-[10px] text-rose-200">สูงขึ้นต่อเนื่อง</span></span></CardHeader><CardContent><div className="h-[220px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.waterTrend} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}><defs><linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#67e8f9" stopOpacity={0.3} /><stop offset="95%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.1)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} domain={[11.5, 12.7]} /><Tooltip contentStyle={{ background: "#0b1d31", border: "1px solid rgba(148,163,184,.15)", borderRadius: 12, fontSize: 11 }} labelStyle={{ color: "#94a3b8" }} formatter={(value) => [`${Number(value).toFixed(2)} เมตร`, "ระดับน้ำ"]} /><Area type="monotone" dataKey="value" stroke="#67e8f9" strokeWidth={2} fill="url(#waterFill)" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-violet-200" />AI Situation Summary</CardTitle><p className="mt-1 text-xs text-slate-500">สรุปจากข้อมูลสาธิต · เปิดใช้งานต่อใน AI Copilot ตามสิทธิ์ของบัญชี</p></CardHeader><CardContent><div className="rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-4"><div className="flex gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-violet-200" /><p className="text-sm leading-6 text-slate-300">ระดับน้ำที่สถานี C7.A เพิ่มขึ้นต่อเนื่อง ขณะที่ฝนสะสมสูงในพื้นที่อำเภอพรหมบุรี ควรติดตามสถานีต้นน้ำและเตรียมประสานหน่วยงานป้องกันและบรรเทาสาธารณภัย</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-lg font-semibold text-rose-200">{summary.alerts.critical}</p><p className="mt-1 text-[10px] text-slate-500">Critical</p></div><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-lg font-semibold text-amber-200">{summary.incidents.open}</p><p className="mt-1 text-[10px] text-slate-500">Incident เปิด</p></div><div className="rounded-xl bg-white/[0.035] p-3"><p className="text-lg font-semibold text-emerald-200">{summary.devices.online}</p><p className="mt-1 text-[10px] text-slate-500">อุปกรณ์ Online</p></div></div></CardContent></Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi title="ประชากร" value={summary.province.population} unit="คน" icon={UsersRound} tone="cyan" /><Kpi title="พื้นที่ทั้งหมด" value={summary.province.areaSqKm} unit="ตร.กม." icon={MapPin} tone="blue" decimals={2} /><Kpi title="ผู้ป่วยฉุกเฉินวันนี้" value={summary.metrics.emergencyPatients.value} unit="ราย" icon={Siren} tone="rose" /><Kpi title="นักท่องเที่ยววันนี้" value={summary.metrics.tourists.value} unit="คน" icon={Gauge} tone="amber" /></section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-slate-600"><span>แหล่งข้อมูล: Administrative Areas · IoT Metrics · CCTV Metadata · Alert Center</span><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-300/70" />Data freshness verified</span></div>
    </div>
  );
}

function Kpi({ title, value, unit, icon: Icon, tone, decimals = 0 }: { title: string; value: number; unit: string; icon: LucideIcon; tone: "cyan" | "blue" | "rose" | "amber"; decimals?: number }) {
  const toneClass = { cyan: "text-cyan-200 bg-cyan-300/10", blue: "text-blue-200 bg-blue-300/10", rose: "text-rose-200 bg-rose-300/10", amber: "text-amber-200 bg-amber-300/10" }[tone];
  return <Card><CardContent className="flex items-center gap-4 p-4"><span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="size-5" /></span><div><p className="text-xs text-slate-500">{title}</p><p className="mt-1 text-xl font-semibold text-white">{formatNumber(value, { maximumFractionDigits: decimals })} <span className="text-xs font-normal text-slate-600">{unit}</span></p></div></CardContent></Card>;
}
