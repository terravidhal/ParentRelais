"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  /** Nom de ce qu'on compte, au pluriel : « facilitateurs », « séances ». */
  itemLabel: string;
  /**
   * Paramètre d'URL portant le numéro de page. Configurable pour que deux
   * tableaux d'une même page ne se marchent pas dessus.
   */
  paramName?: string;
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
  paramName = "page",
}: TablePaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Ces tableaux sont rendus côté serveur : sans retour au clic, l'utilisateur
  // appuie sur « 2 » et rien ne bouge pendant la requête.
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<number | null>(null);

  const goTo = (n: number) => {
    setTarget(n);
    startTransition(() => router.push(hrefFor(n)));
  };

  const hrefFor = (target: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete(paramName);
    else next.set(paramName, String(target));
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
        {/* Numéros seuls : Précédent/Suivant obligeaient à six clics pour
            atteindre la page 7. La fenêtre glissante évite d'aligner trente
            numéros quand le volume grandit. */}
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
            <button
              key={n}
              type="button"
              onClick={() => goTo(n)}
              aria-label={`Page ${n}`}
              className="font-display flex h-11 min-w-11 items-center justify-center rounded-xl border border-border px-2 text-sm font-semibold"
            >
              {isPending && target === n ? (
                <Loader2
                  size={14}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              ) : (
                n
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
