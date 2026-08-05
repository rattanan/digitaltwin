import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ALERT_SEVERITY_LABELS, ALERT_STATUS_LABELS, INCIDENT_STATUS_LABELS, type AlertSeverity, type AlertStatus, type IncidentStatus, type OperationHistory } from "@/lib/operations/types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

export function severityVariant(severity: AlertSeverity) {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger" as const;
  if (severity === "WARNING") return "warning" as const;
  if (severity === "INFO") return "default" as const;
  return "neutral" as const;
}

export function statusVariant(status: AlertStatus | IncidentStatus) {
  if (status === "RESOLVED" || status === "CLOSED" || status === "DISMISSED") return "success" as const;
  if (status === "NEW" || status === "DETECTED") return "danger" as const;
  if (status === "IN_PROGRESS" || status === "ASSIGNED" || status === "VERIFIED") return "warning" as const;
  return "neutral" as const;
}

export function SeverityBadge({ severity, label }: { severity: AlertSeverity; label?: string }) {
  return <Badge variant={severityVariant(severity)}>{label ?? ALERT_SEVERITY_LABELS[severity]}</Badge>;
}

export function AlertStatusBadge({ status, label }: { status: AlertStatus; label?: string }) {
  return <Badge variant={statusVariant(status)}>{label ?? ALERT_STATUS_LABELS[status]}</Badge>;
}

export function IncidentStatusBadge({ status, label }: { status: IncidentStatus; label?: string }) {
  return <Badge variant={statusVariant(status)}>{label ?? INCIDENT_STATUS_LABELS[status]}</Badge>;
}

export function KpiCard({ title, value, caption, icon: Icon, tone = "cyan" }: { title: string; value: number; caption: string; icon: LucideIcon; tone?: "cyan" | "rose" | "amber" | "emerald" | "violet" }) {
  const toneClass = { cyan: "bg-cyan-300/10 text-cyan-200", rose: "bg-rose-300/10 text-rose-200", amber: "bg-amber-300/10 text-amber-200", emerald: "bg-emerald-300/10 text-emerald-200", violet: "bg-violet-300/10 text-violet-200" }[tone];
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", toneClass)}><Icon className="size-5" /></span><div className="min-w-0"><p className="truncate text-[11px] text-slate-500">{title}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-white">{formatNumber(value)}</p><p className="mt-0.5 truncate text-[10px] text-slate-600">{caption}</p></div></CardContent></Card>;
}

export function HistoryTimeline({ history }: { history: OperationHistory[] }) {
  if (history.length === 0) return <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">ยังไม่มีประวัติการดำเนินการ</p>;
  return <div className="space-y-0">{history.map((item, index) => <div key={item.id} className="relative flex gap-3 pb-4 last:pb-0"><div className="relative flex w-4 shrink-0 justify-center"><span className={cn("mt-1.5 size-2.5 rounded-full ring-4 ring-[#0b1d31]", index === history.length - 1 ? "bg-cyan-200" : "bg-slate-600")} />{index < history.length - 1 && <span className="absolute top-4 h-full w-px bg-white/10" />}</div><div className="min-w-0 flex-1 rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-slate-200">{item.stateLabel}</p><time className="text-[10px] text-slate-600" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></div>{item.note && <p className="mt-1 text-xs leading-5 text-slate-400">{item.note}</p>}{item.actorName && <p className="mt-1 text-[10px] text-slate-600">โดย {item.actorName}</p>}</div></div>)}</div>;
}
