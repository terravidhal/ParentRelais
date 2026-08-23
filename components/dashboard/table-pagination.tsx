"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  /** Nom de ce qu'on compte, au pluriel : « facilitateurs », « séances ». */
  itemLabel: string;
}

/**
 * Pagination fondée sur l'URL, pour que la page reste partageable et que le
 * découpage se fasse côté Supabase (`.range()`) plutôt qu'en mémoire.
 */
/**
 * Fenêtre de numéros autour de la page courante : 1 … 4 5 6 … 12.
 * `null` marque une ellipse.
 */
function pageNumbers(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push(null);
  for (let n = start; n <= end; n++) out.push(n);
  if (end < pageCount - 1) out.push(null);
  out.push(pageCount);
  return out;
}

export function TablePagination({
  page,
  pageCount,
  totalCount,
  itemLabel,
}: TablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (target: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (pageCount <= 1) {
    return (
      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {totalCount} {itemLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
      <p className="text-xs text-muted-foreground">
        Page {page} sur {pageCount} · {totalCount} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Numéros de page : avec Précédent/Suivant seuls, atteindre la page
            7 demandait six clics. La fenêtre glissante évite d'aligner
            trente numéros quand le volume grandit. */}
        {pageNumbers(page, pageCount).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : n === page ? (
            <span
              key={n}
              aria-current="page"
              className="font-display flex h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-2 text-sm font-semibold text-primary-foreground"
            >
              {n}
            </span>
          ) : (
            <Link
              key={n}
              href={hrefFor(n)}
              aria-label={`Page ${n}`}
              className="font-display flex h-11 min-w-11 items-center justify-center rounded-xl border border-border px-2 text-sm font-semibold"
            >
              {n}
            </Link>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            rel="prev"
            className="flex h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold"
          >
            <ChevronLeft size={15} aria-hidden="true" /> Précédent
          </Link>
        ) : (
          <span className="flex h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold opacity-40">
            <ChevronLeft size={15} aria-hidden="true" /> Précédent
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={hrefFor(page + 1)}
            rel="next"
            className="flex h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold"
          >
            Suivant <ChevronRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold opacity-40">
            Suivant <ChevronRight size={15} aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
