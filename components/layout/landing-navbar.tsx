"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NTLogo } from "@/components/branding/NTLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "ภาพรวม", href: "#overview" },
  { label: "ความสามารถ", href: "#capabilities" },
  { label: "โมดูล", href: "#modules" },
  { label: "AI Assistant", href: "#ai-assistant" },
  { label: "สถาปัตยกรรม", href: "#architecture" },
  { label: "ประโยชน์", href: "#benefits" },
] as const;

export function LandingNavbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dashboardHref = isAuthenticated ? "/dashboard" : "/login?next=/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all", scrolled && "border-white/10 bg-[rgba(8,11,18,.88)] shadow-[0_12px_40px_rgba(0,0,0,.22)] backdrop-blur-xl")}>
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 xl:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="กลับหน้าแรก Digital Twin">
          <NTLogo compact />
          <span className="hidden min-w-0 sm:block"><span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--nt-yellow)]">NT National Telecom</span><span className="block truncate text-sm font-semibold text-white">Digital Twin</span></span>
        </Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="เมนูหน้าโครงการ">
          {links.map((link) => <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-white/[.05] hover:text-white">{link.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:text-white">เข้าสู่ระบบ</Link>
          <Button asChild size="sm"><Link href={dashboardHref}>เข้าสู่ Dashboard <ArrowRight className="size-3.5" /></Link></Button>
        </div>
        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-[var(--text-secondary)] transition hover:bg-white/[.06] hover:text-white md:hidden" aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={menuOpen}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {menuOpen && <div className="border-t border-white/10 bg-[rgba(8,11,18,.97)] px-5 py-4 shadow-2xl backdrop-blur-xl md:hidden"><nav className="grid gap-1" aria-label="เมนูมือถือ">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[var(--text-secondary)] hover:bg-white/[.05] hover:text-white">{link.label}</a>)}</nav><div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><Link href="/login" onClick={() => setMenuOpen(false)} className="flex h-10 items-center justify-center rounded-xl border border-white/10 text-sm text-[var(--text-secondary)]">เข้าสู่ระบบ</Link><Button asChild size="sm" className="h-10"><Link href={dashboardHref}>เข้าสู่ Dashboard</Link></Button></div></div>}
    </header>
  );
}
