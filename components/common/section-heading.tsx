import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "left", className }: { eyebrow: string; title: string; description?: string; align?: "left" | "center"; className?: string }) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--nt-yellow)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{description}</p>}
    </div>
  );
}
