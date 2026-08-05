"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedCounter({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const duration = 850;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return <span className={cn("tabular-nums", className)}>{current.toLocaleString("th-TH")}{suffix}</span>;
}
