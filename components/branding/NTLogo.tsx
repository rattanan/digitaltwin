"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NTLogoProps = {
  mode?: "dark" | "light";
  compact?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function NTLogo({ mode = "dark", compact = false, width = 176, height = 74, className, priority = false }: NTLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (compact) {
    return (
      <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--background-primary)] shadow-[0_0_22px_rgba(255,210,0,.16)]", className)} style={{ backgroundColor: "var(--nt-yellow)" }} aria-label="NT National Telecom">
        <span className="text-sm font-black tracking-[-0.04em]">NT</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex max-w-full items-center justify-center overflow-hidden rounded-xl px-2 py-1.5", mode === "dark" ? "bg-white" : "bg-transparent", className)}>
      {imageFailed ? (
        <span className="flex min-w-0 items-center gap-2 px-2 py-1">
          <span className="text-lg font-black tracking-[-0.08em] text-[var(--nt-blue)]">NT</span>
          <span className={cn("text-xs font-semibold leading-tight", mode === "dark" ? "text-slate-700" : "text-white")}>National<br />Telecom</span>
        </span>
      ) : (
        <Image
          src="/images/nt-logo.png"
          alt="NT National Telecom"
          width={width}
          height={height}
          priority={priority}
          className="h-auto max-w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}
