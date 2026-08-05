import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", {
  variants: {
    variant: {
      default: "bg-[var(--nt-blue)]/15 text-[var(--nt-blue-light)] ring-1 ring-[var(--nt-blue-light)]/20",
      success: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20",
      warning: "bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/20",
      danger: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20",
      neutral: "bg-slate-300/10 text-slate-300 ring-1 ring-white/10",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
