import Link from "next/link";
import { ArrowRight, Bot, ChevronDown, Play, RadioTower } from "lucide-react";
import { NTLogo } from "@/components/branding/NTLogo";
import { Button } from "@/components/ui/button";

const networkNodes = [
  { left: "10%", top: "24%", delay: "0s", label: "CCTV" },
  { left: "28%", top: "62%", delay: "1.4s", label: "IoT" },
  { left: "52%", top: "18%", delay: "2.4s", label: "GIS" },
  { left: "72%", top: "68%", delay: ".8s", label: "AI" },
  { left: "88%", top: "32%", delay: "1.9s", label: "DATA" },
] as const;

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const dashboardHref = isAuthenticated ? "/dashboard" : "/login?next=/dashboard";
  return (
    <section className="relative flex min-h-[760px] items-center overflow-hidden px-5 pb-16 pt-32 sm:px-8 xl:px-12">
      <div className="nt-hero-grid absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(0,114,206,.24),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(33,168,246,.12),transparent_24%),linear-gradient(115deg,#080b12_4%,rgba(8,11,18,.84)_48%,rgba(0,79,158,.38)_100%)]" />
      <div className="absolute -right-24 top-28 size-80 rounded-full bg-[var(--nt-blue)]/15 blur-[110px]" />
      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] xl:gap-20">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-4"><NTLogo mode="dark" width={184} height={78} priority /><span className="h-10 w-px bg-white/15" /><span className="text-xs uppercase tracking-[.2em] text-[var(--text-muted)]">Smart City Intelligence</span></div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-[var(--nt-yellow)]"><span className="size-2 animate-pulse rounded-full bg-[var(--nt-yellow)]" />Sing Buri Provincial Pilot</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-white sm:text-6xl xl:text-8xl">Digital Twin<span className="block bg-gradient-to-r from-white via-[#9dd8ff] to-[var(--nt-blue-light)] bg-clip-text text-transparent">Intelligence City Platform</span></h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">แพลตฟอร์มบริหารจัดการเมืองอัจฉริยะที่รวบรวมข้อมูลจาก CCTV, IoT, สิ่งแวดล้อม การจราจร โครงสร้างพื้นฐาน และเหตุการณ์สำคัญของเมืองมาแสดงผล วิเคราะห์ และสนับสนุนการตัดสินใจจากศูนย์กลางเดียว</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">เชื่อมโยงข้อมูลเมืองแบบ Real-time พร้อม AI เพื่อยกระดับความปลอดภัย ประสิทธิภาพการบริหารจัดการ และคุณภาพชีวิตของประชาชน</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link href={dashboardHref}>เข้าสู่ Dashboard <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg"><a href="#capabilities"><Play className="size-4 text-[var(--nt-yellow)]" />ดูความสามารถของระบบ</a></Button><Button asChild variant="secondary" size="lg"><a href="#ai-assistant"><Bot className="size-4 text-[var(--nt-blue-light)]" />ทดลองถาม AI</a></Button></div>
          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-[var(--text-muted)]"><span className="flex items-center gap-2"><RadioTower className="size-4 text-[var(--nt-blue-light)]" />Unified city data</span><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-300" />Operational preview</span><span>v0.1 Foundation</span></div>
        </div>
        <div className="relative hidden min-h-[470px] lg:block" aria-label="ภาพจำลองเครือข่ายเมืองอัจฉริยะ">
          <div className="absolute inset-8 rounded-[3rem] border border-[var(--nt-blue-light)]/20 bg-[radial-gradient(circle_at_50%_50%,rgba(33,168,246,.12),transparent_52%),rgba(13,17,28,.55)] shadow-[0_0_100px_rgba(0,114,206,.16)] backdrop-blur-sm" />
          <div className="absolute inset-20 rounded-[2.3rem] border border-dashed border-white/10" />
          <div className="absolute left-1/2 top-1/2 z-10 flex size-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2rem] border border-[var(--nt-yellow)]/50 bg-[#0d111c]/95 text-center shadow-[0_0_50px_rgba(255,210,0,.14)]"><span className="text-3xl font-black tracking-[-.08em] text-[var(--nt-yellow)]">nt</span><span className="mt-1 text-[10px] uppercase tracking-[.18em] text-white">Command<br />Center</span></div>
          <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 600 470" fill="none" aria-hidden="true"><path d="M105 136C188 183 194 226 278 235M278 235C350 232 388 154 481 138M278 235C333 282 380 328 475 348M278 235C205 285 165 326 101 344" stroke="url(#heroLine)" strokeWidth="1.5" strokeDasharray="5 8" /><defs><linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#21A8F6" stopOpacity="0" /><stop offset=".45" stopColor="#21A8F6" /><stop offset="1" stopColor="#FFD200" stopOpacity=".2" /></linearGradient></defs></svg>
          {networkNodes.map((node) => <div key={node.label} className="absolute" style={{ left: node.left, top: node.top }}><div className="nt-data-pulse flex size-14 items-center justify-center rounded-2xl border border-[var(--nt-blue-light)]/35 bg-[#0d111c]/90 text-[10px] font-semibold text-[var(--text-secondary)] shadow-[0_0_28px_rgba(33,168,246,.12)]" style={{ animationDelay: node.delay }}><span className="absolute size-2 rounded-full bg-[var(--nt-yellow)]" /><span className="mt-10">{node.label}</span></div></div>)}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#0d111c]/80 px-4 py-2 text-[10px] text-[var(--text-muted)] backdrop-blur"><span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />Data pulse active · 24/7 visibility</div>
        </div>
      </div>
      <a href="#overview" className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[var(--text-muted)] hover:text-white"><span>Explore platform</span><ChevronDown className="size-4 animate-bounce" /></a>
    </section>
  );
}
