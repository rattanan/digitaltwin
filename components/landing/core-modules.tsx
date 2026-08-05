import { BarChart3, Bot, Building2, Camera, CarFront, Map, RadioTower, ShieldCheck, Siren, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { landingModules } from "@/lib/landing-content";
import { GradientCard } from "@/components/common/gradient-card";
import { SectionHeading } from "@/components/common/section-heading";
import { StatusBadge } from "@/components/common/status-badge";

const icons: Record<string, LucideIcon> = { Map, Camera, RadioTower, Wind, CarFront, Siren, ShieldCheck, Building2, BarChart3, Bot };

export function CoreModules() {
  return (
    <section id="modules" className="scroll-mt-24 bg-[var(--background-secondary)] px-5 py-24 sm:px-8 xl:px-12"><div className="mx-auto max-w-[1440px]"><SectionHeading eyebrow="Core modules" title="มองเห็นเมืองเป็นระบบเดียว" description="เริ่มจากข้อมูลที่มีวันนี้ และค่อย ๆ ขยายความสามารถไปยังทุกมิติของการบริหารเมือง" /><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{landingModules.map((module) => { const Icon = icons[module.icon] ?? Building2; return <GradientCard key={module.title} className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--nt-blue-light)]/35 hover:bg-[var(--background-elevated)]"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-white/[.05] text-[var(--nt-blue-light)] transition group-hover:bg-[var(--nt-blue)]/20"><Icon className="size-5" /></span><StatusBadge status={module.status} /></div><h3 className="mt-6 text-base font-semibold text-white">{module.titleTh}</h3><p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{module.title}</p><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{module.description}</p></GradientCard>; })}</div></div></section>
  );
}
