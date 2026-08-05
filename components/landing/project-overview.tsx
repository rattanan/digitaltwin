import { ArrowUpRight, Database, Radar, Sparkles, Target } from "lucide-react";
import { landingFeatures } from "@/lib/landing-content";
import { GradientCard } from "@/components/common/gradient-card";
import { SectionHeading } from "@/components/common/section-heading";

const icons = [Database, Radar, Sparkles, Target] as const;

export function ProjectOverview() {
  return (
    <section id="overview" className="scroll-mt-24 border-t border-white/[.06] px-5 py-24 sm:px-8 xl:px-12">
      <div className="mx-auto max-w-[1440px]"><SectionHeading eyebrow="Project overview" title="ศูนย์กลางข้อมูลเพื่อการบริหารเมืองอัจฉริยะ" description="ระบบทำหน้าที่รวบรวมข้อมูลจากหลายหน่วยงานและหลายประเภทอุปกรณ์เข้าสู่แพลตฟอร์มกลาง เพื่อให้ผู้บริหาร เจ้าหน้าที่ศูนย์ปฏิบัติการ และหน่วยงานที่เกี่ยวข้องติดตามสถานการณ์ วิเคราะห์ข้อมูล และสั่งการได้อย่างรวดเร็ว" />
        <div id="capabilities" className="mt-12 grid scroll-mt-24 gap-4 md:grid-cols-2 xl:grid-cols-4">{landingFeatures.map((feature, index) => { const Icon = icons[index]; return <GradientCard key={feature.title} className="group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--nt-blue-light)]/40"><span className="absolute -right-8 -top-8 size-28 rounded-full bg-[var(--nt-blue)]/10 blur-2xl transition group-hover:bg-[var(--nt-blue-light)]/20" /><div className="relative"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-xl border border-[var(--nt-blue-light)]/25 bg-[var(--nt-blue)]/10 text-[var(--nt-blue-light)]"><Icon className="size-5" /></span><span className="font-mono text-xs text-[var(--text-muted)]">{feature.eyebrow}</span></div><h3 className="mt-7 text-lg font-semibold text-white">{feature.titleTh}</h3><p className="mt-2 text-xs font-medium uppercase tracking-[.12em] text-[var(--nt-blue-light)]">{feature.title}</p><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{feature.description}</p><ArrowUpRight className="mt-6 size-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--nt-yellow)]" /></div></GradientCard>; })}</div>
      </div>
    </section>
  );
}
