"use client";

import { useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { AppFooter } from "@/components/layout/app-footer";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

type ShellUser = { displayName: string; username: string; agency?: { nameTh: string } | null; roles: { code: string; nameTh: string }[] };

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  function toggleSidebar() { setCollapsed((value) => !value); }

  return <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)]"><div className={cn("fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden", !mobileOpen && "pointer-events-none hidden")} onClick={() => setMobileOpen(false)} aria-hidden="true" /><div className={cn("fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}><AppSidebar collapsed={false} mobile onCollapse={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} /><button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 hover:text-white" aria-label="ปิดเมนูด้านซ้าย"><X className="size-4" /></button></div><div className="flex min-h-screen"><div className="hidden lg:block"><AppSidebar collapsed={collapsed} onCollapse={toggleSidebar} /></div><div className="min-w-0 flex-1"><AppNavbar user={user} onOpenMenu={() => setMobileOpen(true)} /><main className="min-h-[calc(100vh-76px)] px-4 pb-6 pt-5 sm:px-7 lg:pb-7">{children}</main><AppFooter compact /></div></div><div className="fixed bottom-4 right-4 z-40 flex items-center gap-2"><button type="button" onClick={() => setHelpOpen((value) => !value)} className="flex size-11 items-center justify-center rounded-full bg-[var(--nt-yellow)] text-[var(--background-primary)] shadow-[0_0_25px_rgba(255,210,0,.22)] transition hover:bg-[var(--nt-yellow-hover)]" aria-label="ช่วยเหลือ" aria-expanded={helpOpen}><CircleHelp className="size-5" /></button>{helpOpen && <div className="absolute bottom-14 right-0 w-60 rounded-2xl border border-white/10 bg-[var(--background-card)] p-4 text-xs text-[var(--text-secondary)] shadow-2xl"><p className="font-semibold text-white">City Intelligence Copilot</p><p className="mt-2 leading-5 text-[var(--text-muted)]">ผู้ช่วย AI จะเปิดใช้งานใน Phase 6 พร้อมข้อมูลที่ควบคุมสิทธิ์แล้ว</p></div>}</div></div>;
}
