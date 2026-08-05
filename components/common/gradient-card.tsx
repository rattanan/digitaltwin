import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GradientCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-[var(--border-primary)] bg-[linear-gradient(145deg,rgba(24,32,51,.9),rgba(18,24,39,.72))] shadow-[0_18px_60px_rgba(0,0,0,.22)]", className)} {...props} />;
}
