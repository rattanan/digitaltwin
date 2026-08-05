"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AiChatWidget } from "@/components/ai/ai-chat-widget";
import { AppFooter } from "@/components/layout/app-footer";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

type ShellUser = { displayName: string; username: string; agency?: { nameTh: string } | null; roles: { code: string; nameTh: string }[] };

export function AppShell({ user, children, aiCanRead, aiCanUse }: { user: ShellUser; children: React.ReactNode; aiCanRead: boolean; aiCanUse: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() { setCollapsed((value) => !value); }

  return <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)]"><div className={cn("fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden", !mobileOpen && "pointer-events-none hidden")} onClick={() => setMobileOpen(false)} aria-hidden="true" /><div className={cn("fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}><AppSidebar collapsed={false} mobile onCollapse={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} /><button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 hover:text-white" aria-label="ปิดเมนูด้านซ้าย"><X className="size-4" /></button></div><div className="flex min-h-screen"><div className="hidden lg:block"><AppSidebar collapsed={collapsed} onCollapse={toggleSidebar} /></div><div className="min-w-0 flex-1"><AppNavbar user={user} onOpenMenu={() => setMobileOpen(true)} /><main className="min-h-[calc(100vh-76px)] px-4 pb-6 pt-5 sm:px-7 lg:pb-7">{children}</main><AppFooter compact /></div></div><AiChatWidget canRead={aiCanRead} canUse={aiCanUse} /></div>;
}
