"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Gauge, ImageOff, RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AlertCctvEvidence, type AlertIotEvidence, type AlertIotMetricEvidence, type AlertSeverity } from "@/lib/operations/types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

const ARC_RADIUS = 82;
const ARC_LENGTH = Math.PI * ARC_RADIUS;

const gaugeTone = {
  normal: {
    stroke: "stroke-emerald-300",
    text: "text-emerald-200",
    glow: "shadow-[0_0_32px_rgba(52,211,153,.12)]",
  },
  warning: {
    stroke: "stroke-amber-300",
    text: "text-amber-200",
    glow: "shadow-[0_0_32px_rgba(251,191,36,.14)]",
  },
  critical: {
    stroke: "stroke-rose-300",
    text: "text-rose-200",
    glow: "shadow-[0_0_32px_rgba(251,113,133,.16)]",
  },
  noData: {
    stroke: "stroke-slate-500",
    text: "text-slate-300",
    glow: "shadow-none",
  },
} as const;

function alertTone(severity: AlertSeverity): keyof typeof gaugeTone {
  if (severity === "CRITICAL" || severity === "HIGH") return "critical";
  if (severity === "WARNING" || severity === "LOW") return "warning";
  return "normal";
}

function metricTone(metric: AlertIotMetricEvidence, severity: AlertSeverity): keyof typeof gaugeTone {
  if (metric.state === "NO_DATA") return "noData";
  if (metric.state === "CRITICAL") return "critical";
  if (metric.state === "WARNING") return "warning";
  return alertTone(severity);
}

function metricMax(metric: AlertIotMetricEvidence) {
  const candidates = [metric.latestValue, metric.warning, metric.critical].filter((value): value is number => value !== null && Number.isFinite(value));
  const highest = Math.max(...candidates, 1);
  return Math.max(highest * 1.25, metric.critical ?? 0, 1);
}

function GaugeMeter({ metric, severity }: { metric: AlertIotMetricEvidence; severity: AlertSeverity }) {
  const max = metricMax(metric);
  const progress = metric.latestValue === null ? 0 : Math.min(100, Math.max(0, (metric.latestValue / max) * 100));
  const tone = gaugeTone[metricTone(metric, severity)];
  const label = metric.latestValue === null
    ? `${metric.nameTh}: ไม่มีข้อมูล`
    : `${metric.nameTh}: ${formatNumber(metric.latestValue, { maximumFractionDigits: 2 })}${metric.unit ? ` ${metric.unit}` : ""}`;

  return <div className={cn("rounded-2xl border border-white/[.07] bg-white/[.025] p-4", tone.glow)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-200">{metric.nameTh}</p>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{metric.metricKey}</p>
      </div>
      <Badge variant={metric.state === "CRITICAL" ? "danger" : metric.state === "WARNING" ? "warning" : metric.state === "NORMAL" ? "success" : "neutral"}>{metric.stateLabel}</Badge>
    </div>
    <div className="relative mx-auto mt-2 max-w-[250px]" role="img" aria-label={label}>
      <svg viewBox="0 0 220 128" className="w-full" aria-hidden="true">
        <path d="M 28 108 A 82 82 0 0 1 192 108" fill="none" pathLength={ARC_LENGTH} className="stroke-white/[.08]" strokeWidth="14" strokeLinecap="round" />
        <path d="M 28 108 A 82 82 0 0 1 192 108" fill="none" pathLength={ARC_LENGTH} className={tone.stroke} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`} strokeDashoffset={ARC_LENGTH - (progress / 100) * ARC_LENGTH} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className={cn("text-2xl font-semibold tracking-tight", tone.text)}>{metric.latestValue === null ? "—" : formatNumber(metric.latestValue, { maximumFractionDigits: 2 })}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{metric.unit ?? "ค่า"}</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-[10px] text-slate-600"><span>0</span><span>เต็ม {formatNumber(max, { maximumFractionDigits: 2 })}</span></div>
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[.06] pt-3 text-[10px] text-slate-500">
      <span>เตือน {metric.warning === null ? "—" : formatNumber(metric.warning, { maximumFractionDigits: 2 })}</span>
      <span>วิกฤต {metric.critical === null ? "—" : formatNumber(metric.critical, { maximumFractionDigits: 2 })}</span>
      {metric.latestRecordedAt && <span className="ml-auto">{formatDateTime(metric.latestRecordedAt)}</span>}
    </div>
  </div>;
}

function EvidenceEmpty({ icon: Icon, title, description }: { icon: typeof Camera; title: string; description: string }) {
  return <Card className="border-white/[.08] bg-white/[.02]"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[.04] text-slate-500"><Icon className="size-4" /></span><div><p className="text-xs font-medium text-slate-300">{title}</p><p className="mt-1 text-[11px] text-slate-600">{description}</p></div></CardContent></Card>;
}

export function CctvAlertEvidence({ evidence }: { evidence: AlertCctvEvidence | null }) {
  if (!evidence) return <EvidenceEmpty icon={ImageOff} title="ยังไม่มีภาพ CCTV ที่เชื่อมโยง" description="รายการนี้ไม่มีภาพ snapshot ที่พร้อมแสดง" />;

  return <Card className="overflow-hidden border-violet-200/15 bg-violet-300/[.03]">
    <CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-3">
      <div className="min-w-0"><CardTitle className="flex items-center gap-2 text-sm"><Camera className="size-4 text-violet-200" />ภาพจาก CCTV</CardTitle><p className="mt-1 truncate text-[10px] text-slate-500">{evidence.camera.nameTh} · {evidence.camera.code}</p></div>
      <Badge variant="neutral">Snapshot</Badge>
    </CardHeader>
    <CardContent className="p-3 sm:p-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-violet-200/15 bg-[#071725]">
        {evidence.imageUrl ? <Image src={evidence.imageUrl} alt={`ภาพที่เกี่ยวข้องจาก ${evidence.camera.code}`} fill sizes="(max-width: 1280px) 100vw, 520px" className="object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_42%,rgba(167,139,250,.2),transparent_22%),linear-gradient(135deg,rgba(15,23,42,.1),rgba(49,46,129,.65))] text-center"><ImageOff className="size-8 text-violet-200/60" /><p className="mt-2 text-xs text-slate-400">ไม่พบไฟล์ภาพสำหรับกล้องนี้</p></div>}
        {evidence.imageUrl && <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/70" />}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 text-[9px] font-mono uppercase tracking-[.14em] text-violet-100/75"><span>CCTV / {evidence.camera.code}</span><span>Related frame</span></div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2"><span className="rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-[9px] text-slate-300">{evidence.capturedAt ? formatDateTime(evidence.capturedAt) : "ไม่ทราบเวลาภาพ"}</span><Link href={`/cctv?camera=${encodeURIComponent(evidence.camera.id)}`} className="rounded-md border border-violet-200/20 bg-slate-950/60 px-2 py-1 text-[9px] text-violet-100 transition hover:bg-violet-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70">เปิดศูนย์ CCTV</Link></div>
      </div>
    </CardContent>
  </Card>;
}

export function IotAlertEvidence({ evidence, severity, severityLabel }: { evidence: AlertIotEvidence | null; severity: AlertSeverity; severityLabel: string }) {
  if (!evidence) return <EvidenceEmpty icon={RadioTower} title="ยังไม่มีค่า IoT ที่เชื่อมโยง" description="รายการนี้ไม่มี telemetry จากอุปกรณ์ที่พร้อมแสดง" />;

  const tone = alertTone(severity);
  const toneVariant = tone === "critical" ? "danger" : tone === "warning" ? "warning" : tone === "normal" ? "success" : "neutral";
  return <Card className="border-emerald-200/15 bg-emerald-300/[.025]">
    <CardHeader className="flex-row items-center justify-between gap-3 border-b border-white/[.06] pb-3">
      <div className="min-w-0"><CardTitle className="flex items-center gap-2 text-sm"><Gauge className="size-4 text-emerald-200" />ค่า IoT ที่เกี่ยวข้อง</CardTitle><p className="mt-1 truncate text-[10px] text-slate-500">{evidence.device.nameTh} · {evidence.device.code}</p></div>
      <Badge variant={toneVariant}>สถานะแจ้งเตือน · {severityLabel}</Badge>
    </CardHeader>
    <CardContent className="space-y-3 p-3 sm:p-4">
      {evidence.metrics.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">ยังไม่มี metric ล่าสุดจากอุปกรณ์นี้</div> : <div className={cn("grid gap-3", evidence.metrics.length > 1 && "sm:grid-cols-2")}>{evidence.metrics.map((metric) => <GaugeMeter key={metric.id} metric={metric} severity={severity} />)}</div>}
      <Link href={`/iot?device=${encodeURIComponent(evidence.device.id)}`} className="flex items-center justify-between rounded-xl border border-emerald-200/10 bg-emerald-300/[.04] px-3 py-2.5 text-[11px] text-emerald-100 transition hover:bg-emerald-300/[.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"><span>ดูรายละเอียดและ readings ทั้งหมด</span><RadioTower className="size-3.5" /></Link>
    </CardContent>
  </Card>;
}
