import { Activity, ArrowUpRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[32rem] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 -right-24 size-[34rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1a2d]/80 shadow-2xl shadow-slate-950/40 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="grid-bg relative hidden min-h-[650px] flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.15),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(59,130,246,0.18),transparent_40%)]" />
            <div className="relative">
              <div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-200/30"><Activity className="size-6 text-cyan-200" /></div><div><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/65">Digital Twin</p><p className="font-semibold">Intelligent City Platform</p></div></div>
              <div className="mt-24 max-w-md"><p className="text-sm font-medium text-cyan-200">จังหวัดสิงห์บุรี · Command Center</p><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">ข้อมูลเมืองที่มองเห็นได้<br /><span className="text-cyan-200">ตัดสินใจได้ทันเวลา</span></h1><p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">รวมข้อมูลพื้นที่ สถานการณ์ แจ้งเตือน และตัวชี้วัดสำคัญไว้ในมุมมองเดียวสำหรับทีมปฏิบัติการ.</p></div>
            </div>
            <div className="relative grid grid-cols-3 gap-3"><div className="rounded-2xl border border-cyan-200/10 bg-slate-950/30 p-4"><p className="text-2xl font-semibold text-cyan-100">125</p><p className="mt-1 text-[11px] text-slate-500">อุปกรณ์ติดตาม</p></div><div className="rounded-2xl border border-cyan-200/10 bg-slate-950/30 p-4"><p className="text-2xl font-semibold text-emerald-100">94%</p><p className="mt-1 text-[11px] text-slate-500">ระบบออนไลน์</p></div><div className="rounded-2xl border border-cyan-200/10 bg-slate-950/30 p-4"><p className="text-2xl font-semibold text-amber-100">24/7</p><p className="mt-1 text-[11px] text-slate-500">เฝ้าระวัง</p></div></div>
          </section>
          <section className="flex min-h-[650px] flex-col justify-center p-6 sm:p-10 xl:p-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-10 lg:hidden"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-200/30"><Activity className="size-5 text-cyan-200" /></div><div><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/65">Digital Twin</p><p className="text-sm font-semibold">Intelligent City Platform</p></div></div></div>
              <p className="text-sm font-medium text-cyan-200">ยินดีต้อนรับกลับ</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">เข้าสู่ระบบศูนย์บัญชาการ</h2><p className="mt-3 text-sm leading-6 text-slate-500">ใช้บัญชีที่ผู้ดูแลระบบกำหนดเพื่อเข้าถึงข้อมูลตามขอบเขตสิทธิ์.</p>
              <div className="mt-8"><LoginForm nextPath={nextPath} /></div>
              <div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-6 text-center"><div><ShieldCheck className="mx-auto size-4 text-emerald-300" /><p className="mt-2 text-[10px] text-slate-500">RBAC</p></div><div><LockKeyhole className="mx-auto size-4 text-cyan-300" /><p className="mt-2 text-[10px] text-slate-500">ปลอดภัย</p></div><div><CheckCircle2 className="mx-auto size-4 text-violet-300" /><p className="mt-2 text-[10px] text-slate-500">ตรวจสอบได้</p></div></div>
              <p className="mt-8 text-center text-[11px] text-slate-600">ข้อมูลในระบบนี้เป็นข้อมูลสาธิต · <span className="text-slate-500">Asia/Bangkok</span></p>
            </div>
          </section>
        </div>
      </div>
      <div className="fixed bottom-5 right-5 hidden items-center gap-2 text-[11px] text-slate-600 sm:flex"><Sparkles className="size-3 text-cyan-300/60" />พร้อมสำหรับการขยายสู่ GIS, CCTV, IoT และ AI <ArrowUpRight className="size-3" /></div>
    </main>
  );
}
