import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { NTLogo } from "@/components/branding/NTLogo";

export function AppFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? "border-t border-white/[.06] px-4 py-4 sm:px-7" : "border-t border-white/10 bg-[var(--background-secondary)] px-5 py-10 sm:px-8 xl:px-12"}>
      <div className={compact ? "flex flex-wrap items-center justify-between gap-3 text-[10px] text-[var(--text-muted)]" : "mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1.5fr_1fr_1fr]"}>
        <div className={compact ? "flex items-center gap-2" : "space-y-4"}>
          <NTLogo compact={compact} width={132} height={56} className={compact ? "size-7 rounded-lg" : "max-w-[132px]"} />
          <div className={compact ? "flex items-center gap-2" : "space-y-1"}><p className={compact ? "" : "text-sm font-semibold text-white"}>Digital Twin – Intelligence City Platform</p>{!compact && <p className="text-xs text-[var(--text-muted)]">Powered by NT National Telecom · Sing Buri pilot</p>}</div>
        </div>
        {compact ? <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-300" />ระบบปกติ · v0.1.0</span> : <><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--text-muted)]">แพลตฟอร์ม</p><div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]"><Link href="/#overview" className="hover:text-white">ภาพรวมโครงการ</Link><Link href="/#modules" className="hover:text-white">ความสามารถ</Link><Link href="/dashboard" className="hover:text-white">เข้าสู่ Dashboard</Link></div></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--text-muted)]">การใช้งาน</p><div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]"><span>Privacy Policy</span><span>Terms of Use</span><span>Contact Administrator</span></div></div></>}
      </div>
    </footer>
  );
}
