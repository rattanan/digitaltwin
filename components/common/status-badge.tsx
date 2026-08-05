import { cn } from "@/lib/utils";

const statusStyles = {
  Available: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  Pilot: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  Planned: "border-amber-300/20 bg-amber-300/10 text-amber-200",
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide", statusStyles[status])}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}
