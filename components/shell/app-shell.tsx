"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BellRing,
  Bot,
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  FileBarChart,
  Fullscreen,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  RadioTower,
  Settings2,
  ShieldCheck,
  Siren,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShellUser = {
  displayName: string;
  username: string;
  agency?: { nameTh: string } | null;
  roles: { code: string; nameTh: string }[];
};

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; disabled?: boolean; badge?: string };

const navigation: { label: string; items: NavItem[] }[] = [
  { label: "ภาพรวมเมือง", items: [{ label: "ศูนย์บัญชาการ", href: "/dashboard", icon: LayoutDashboard }] },
  { label: "ข้อมูลเชิงพื้นที่", items: [{ label: "แผนที่เมือง", href: "/map", icon: Map, disabled: true }, { label: "พื้นที่ปกครอง", href: "/admin/areas", icon: Database }] },
  { label: "โครงสร้างพื้นฐาน", items: [{ label: "CCTV", href: "/cctv", icon: Camera, disabled: true, badge: "Phase 3" }, { label: "อุปกรณ์ IoT", href: "/iot", icon: RadioTower, disabled: true, badge: "Phase 4" }] },
  { label: "การปฏิบัติการ", items: [{ label: "ศูนย์แจ้งเตือน", href: "/alerts", icon: BellRing, disabled: true, badge: "Phase 5" }, { label: "จัดการเหตุการณ์", href: "/incidents", icon: Siren, disabled: true, badge: "Phase 5" }] },
  { label: "การวิเคราะห์", items: [{ label: "AI Copilot", href: "/ai", icon: Bot, disabled: true, badge: "Phase 6" }, { label: "รายงาน", href: "/reports", icon: FileBarChart, disabled: true, badge: "Phase 8" }] },
  { label: "การบริหารระบบ", items: [{ label: "ผู้ใช้งาน", href: "/admin/users", icon: Users }, { label: "บทบาทและสิทธิ์", href: "/admin/roles", icon: ShieldCheck }, { label: "หน่วยงาน", href: "/admin/agencies", icon: Building2 }, { label: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings2, disabled: true }] },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="hidden text-right sm:block">
      <p className="text-sm font-semibold text-slate-100">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(now)}</p>
      <p className="font-mono text-xs text-cyan-200/70">{new Intl.DateTimeFormat("th-TH", { timeStyle: "medium", timeZone: "Asia/Bangkok" }).format(now)} น.</p>
    </div>
  );
}

function Sidebar({ collapsed, onCollapse, onNavigate, mobile = false }: { collapsed: boolean; onCollapse: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col border-r border-white/10 bg-[#081526]/95 px-4 py-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0", collapsed && "lg:w-[88px] lg:px-3", !mobile && "max-lg:-translate-x-full")}>
      <div className={cn("mb-7 flex items-center gap-3 px-2", collapsed && "lg:justify-center lg:px-0")}>
        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-200/30">
          <Activity className="size-6 text-cyan-200" />
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
        </div>
        <div className={cn(collapsed && "lg:hidden")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Intelligent City</p>
          <p className="text-sm font-semibold text-white">Digital Twin</p>
        </div>
      </div>
      <div className={cn("mb-5 rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/[0.06]", collapsed && "lg:hidden")}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">จังหวัดนำร่อง</p>
        <p className="mt-1 text-sm font-medium text-slate-100">สิงห์บุรี</p>
        <p className="mt-0.5 text-xs text-slate-500">Operational environment · Demo data</p>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto pr-1">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600", collapsed && "lg:hidden")}>{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                const content = <><Icon className={cn("size-4 shrink-0", active ? "text-cyan-200" : "text-slate-500")} /><span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>{item.badge && <span className={cn("ml-auto text-[9px] text-slate-600", collapsed && "lg:hidden")}>{item.badge}</span>}</>;
                if (item.disabled) return <div key={item.href} title="กำลังพัฒนา" className="flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-slate-600">{content}</div>;
                return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition", active ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/15" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100")}>{content}</Link>;
              })}
            </div>
          </div>
        ))}
      </nav>
      <button onClick={onCollapse} className="mt-4 hidden h-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 lg:flex" aria-label="ย่อเมนู">
        {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span className="ml-2 text-xs">ย่อเมนู</span></>}
      </button>
    </aside>
  );
}

function Header({ user, onOpenMenu }: { user: ShellUser; onOpenMenu: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  async function fullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#07111f]/85 px-4 backdrop-blur-xl sm:px-7">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="เปิดเมนู"><Menu className="size-5" /></Button>
        <div>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/60 sm:block">Provincial Operations Center</p>
          <h1 className="text-base font-semibold text-slate-100 sm:text-lg">ศูนย์บัญชาการเมืองอัจฉริยะ</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 ring-1 ring-emerald-300/15 md:flex"><span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />ระบบปกติ</div>
        <div className="hidden items-center gap-2 text-slate-400 md:flex"><span className="text-lg">☼</span><span className="text-sm">29°C</span><span className="text-xs text-slate-600">ฝนเล็กน้อย</span></div>
        <LiveClock />
        <div className="hidden h-8 w-px bg-white/10 sm:block" />
        <div className="group relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300/30 to-blue-400/10 text-cyan-100 ring-1 ring-cyan-200/30"><UserRound className="size-4" /></div>
          <div className="hidden text-right xl:block"><p className="text-xs font-medium text-slate-200">{user.displayName}</p><p className="text-[10px] text-slate-500">{user.roles[0]?.nameTh ?? "ผู้ใช้งาน"}</p></div>
          <div className="absolute right-0 top-11 hidden w-48 rounded-2xl border border-white/10 bg-[#0b1d31] p-2 shadow-2xl group-focus-within:block group-hover:block">
            <div className="border-b border-white/10 px-3 py-2"><p className="text-xs text-slate-200">{user.username}</p><p className="mt-1 text-[10px] text-slate-500">{user.agency?.nameTh}</p></div>
            <button onClick={fullscreen} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06]"><Fullscreen className="size-3.5" />โหมดเต็มหน้าจอ</button>
            <button onClick={logout} disabled={loading} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10"><LogOut className="size-3.5" />{loading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className={cn(mobileOpen && "fixed inset-0 z-30 bg-slate-950/70 lg:hidden")} onClick={() => setMobileOpen(false)} />
      <div className={cn("fixed inset-y-0 left-0 z-50 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full", "transition-transform")}>
        <Sidebar collapsed={false} mobile onCollapse={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
        <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="ปิดเมนู"><X className="size-4" /></button>
      </div>
      <div className="flex min-h-screen">
        <div className="hidden lg:block"><Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} /></div>
        <div className="min-w-0 flex-1">
          <Header user={user} onOpenMenu={() => setMobileOpen(true)} />
          <main className="min-h-[calc(100vh-76px)] px-4 pb-24 pt-5 sm:px-7 lg:pb-7">{children}</main>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button onClick={() => setHelpOpen((value) => !value)} className="flex size-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300" aria-label="ช่วยเหลือ"><CircleHelp className="size-5" /></button>
        {helpOpen && <div className="absolute bottom-14 right-0 w-60 rounded-2xl border border-white/10 bg-[#0b1d31] p-4 text-xs text-slate-300 shadow-2xl"><p className="font-semibold text-slate-100">City Intelligence Copilot</p><p className="mt-2 leading-5 text-slate-500">ผู้ช่วย AI จะเปิดใช้งานใน Phase 6 พร้อมข้อมูลที่ควบคุมสิทธิ์แล้ว</p></div>}
      </div>
    </div>
  );
}
