import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[var(--nt-blue-light)]/50 focus:ring-2 focus:ring-[var(--nt-blue-light)]/10 disabled:opacity-50", className)} {...props} />
));
Input.displayName = "Input";
