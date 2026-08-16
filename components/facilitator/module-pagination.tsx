"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulePaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function ModulePagination({
  page,
  pageCount,
  onPageChange,
}: ModulePaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Pagination des modules"
      className="mt-4 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Page précédente"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold motion-safe:transition",
            p === page
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground",
          )}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Page suivante"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
