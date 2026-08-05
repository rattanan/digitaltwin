"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Bot, Building2, Camera, ChevronLeft, ChevronRight, Database, FileBarChart, LayoutDashboard, Map, RadioTower, Settings2, ShieldCheck, Siren, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NTLogo } from "@/components/branding/NTLogo";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon; disabled?: boolean; badge?: string };

const navigation: { label: string; items: NavItem[] }[] = [
  { label: "ภาพรวมเมือง", items: [{ label: "ศูนย์บัญชาการ", href: "/dashboard", icon: LayoutDashboard }] },
  { label: "ข้อมูลเชิงพื้นที่", items: [{ label: "แผนที่เมือง", href: "/map", icon: Map, disabled: true }, { label: "พื้นที่ปกครอง", href: "/admin/areas", icon: Database }] },
  { label: "โครงสร้างพื้นฐาน", items: [{ label: "CCTV", href: "/cctv", icon: Camera, disabled: true, badge: "Phase 3" }, { label: "อุปกรณ์ IoT", href: "/iot", icon: RadioTower, disabled: true, badge: "Phase 4" }] },
  { label: "การปฏิบัติการ", items: [{ label: "ศูนย์แจ้งเตือน", href: "/alerts", icon: BellRing, disabled: true, badge: "Phase 5" }, { label: "จัดการเหตุการณ์", href: "/incidents", icon: Siren, disabled: true, badge: "Phase 5" }] },
  { label: "การวิเคราะห์", items: [{ label: "AI Copilot", href: "/ai", icon: Bot, disabled: true, badge: "Phase 6" }, { label: "รายงาน", href: "/reports", icon: FileBarChart, disabled: true, badge: "Phase 8" }] },
  { label: "การบริหารระบบ", items: [{ label: "ผู้ใช้งาน", href: "/admin/users", icon: Users }, { label: "บทบาทและสิทธิ์", href: "/admin/roles", icon: ShieldCheck }, { label: "หน่วยงาน", href: "/admin/agencies", icon: Building2 }, { label: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings2, disabled: true }] },
];

export function AppSidebar({ collapsed, onCollapse, onNavigate, mobile = false }: { collapsed: boolean; onCollapse: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  return <aside className={cn("flex h-full w-[278px] flex-col border-r border-white/10 bg-[rgba(13,17,28,.96)] px-4 py-5 backdrop-blur-xl transition-[width,padding] duration-300 lg:sticky lg:top-0 lg:h-screen lg:self-start", collapsed && "lg:w-[88px] lg:px-3", !mobile && "max-lg:-translate-x-full")}>
    <div className={cn("mb-7 flex items-center gap-3 px-2", collapsed && "lg:justify-center lg:px-0")}><NTLogo compact={collapsed} mode="dark" width={154} height={65} className={cn(!collapsed && "bg-white")}/><div className={cn("min-w-0", collapsed && "lg:hidden")}><p className="truncate text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--nt-yellow)]">NT National Telecom</p><p className="text-sm font-semibold text-white">Digital Twin</p></div></div>
    <div className={cn("mb-5 rounded-2xl border border-white/[.07] bg-white/[.03] px-3 py-3", collapsed && "lg:hidden")}><p className="text-[10px] uppercase tracking-[.18em] text-[var(--text-muted)]">จังหวัดนำร่อง</p><p className="mt-1 text-sm font-medium text-white">สิงห์บุรี</p><p className="mt-0.5 text-xs text-[var(--text-muted)]">Operational environment · Demo data</p></div>
    <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto pr-1" aria-label="เมนูระบบ">{navigation.map((group) => <div key={group.label}><p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--text-muted)]", collapsed && "lg:hidden")}>{group.label}</p><div className="space-y-1">{group.items.map((item) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)); const Icon = item.icon; const label = item.disabled ? `${item.label} · กำลังพัฒนา` : item.label; const content = <><Icon className={cn("size-4 shrink-0", active ? "text-[var(--nt-yellow)]" : "text-[var(--text-muted)]")} /><span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>{item.badge && <span className={cn("ml-auto text-[9px] text-[var(--text-muted)]", collapsed && "lg:hidden")}>{item.badge}</span>}</>; if (item.disabled) return <div key={item.href} title={collapsed ? label : "กำลังพัฒนา"} aria-label={label} className={cn("flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm text-[var(--text-muted)] opacity-60", collapsed && "lg:justify-center")}>{content}</div>; return <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-label={item.label} className={cn("flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition", collapsed && "lg:justify-center", active ? "bg-[var(--nt-blue)]/15 text-white ring-1 ring-[var(--nt-blue-light)]/25" : "text-[var(--text-secondary)] hover:bg-white/[.05] hover:text-white")}>{content}</Link>; })}</div></div>)}</nav>
    <button type="button" onClick={onCollapse} className="mt-4 hidden h-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-white/[.06] hover:text-white lg:flex" aria-label={collapsed ? "ขยายเมนูด้านซ้าย" : "ย่อเมนูด้านซ้าย"} aria-expanded={!collapsed}>{collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span className="ml-2 text-xs">ย่อเมนู</span></>}</button>
  </aside>;
}
