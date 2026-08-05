"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

  async function onSubmit(input: LoginInput) {
    setServerError("");
    const response = await fetch("/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json() as { success?: boolean; message?: string };
    if (!response.ok || !payload.success) {
      setServerError(payload.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
    window.location.assign(nextPath || "/dashboard");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
        <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><Input id="username" autoComplete="username" className="pl-10" placeholder="เช่น superadmin" {...form.register("username")} /></div>
        {form.formState.errors.username && <p className="text-xs text-rose-300">{form.formState.errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label htmlFor="password">รหัสผ่าน</Label><span className="text-[10px] text-slate-600">กำหนดจาก .env</span></div>
        <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pl-10 pr-11" placeholder="รหัสผ่านของคุณ" {...form.register("password")} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
        {form.formState.errors.password && <p className="text-xs text-rose-300">{form.formState.errors.password.message}</p>}
      </div>
      {serverError && <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs leading-5 text-rose-200">{serverError}</div>}
      <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {form.formState.isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ศูนย์บัญชาการ"}
      </Button>
    </form>
  );
}
