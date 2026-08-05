"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

type PaginationState = { page: number; limit: number; total: number };

export function ListPagination({
  pagination,
  loading = false,
  label = "รายการ",
  onPageChange,
}: {
  pagination: PaginationState;
  loading?: boolean;
  label?: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  if (pagination.total <= pagination.limit) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={`แบ่งหน้า${label}`}>
    <p className="text-[11px] text-slate-500" aria-live="polite">แสดง {formatNumber(start)}–{formatNumber(end)} จาก {formatNumber(pagination.total)} {label}</p>
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(pagination.page - 1)} disabled={loading || pagination.page <= 1} aria-label="หน้าก่อนหน้า"><ChevronLeft className="size-4" /></Button>
      <span className="min-w-24 text-center text-xs text-slate-400">หน้า {formatNumber(pagination.page)} / {formatNumber(totalPages)}</span>
      <Button type="button" variant="ghost" size="icon" onClick={() => onPageChange(pagination.page + 1)} disabled={loading || pagination.page >= totalPages} aria-label="หน้าถัดไป"><ChevronRight className="size-4" /></Button>
    </div>
  </nav>;
}
