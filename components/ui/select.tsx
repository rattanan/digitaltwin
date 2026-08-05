import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn("h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10", className)} {...props} />
));
Select.displayName = "Select";
