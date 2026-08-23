"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

interface TableToolbarProps {
  /** Libellé du champ de recherche, adapté à ce qu'on cherche. */
  searchLabel: string;
  placeholder: string;
  /** Filtres optionnels : libellé visible et valeurs possibles. */
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
}

/**
 * Recherche et filtres d'une table du tableau de bord.
 *
 * L'état vit dans l'URL (`?q=…&region=…`) et non dans un état React : la
 * page reste partageable et rechargeable, et la requête se fait côté
 * Supabase. Filtrer côté client aurait supposé de charger toutes les
 * lignes — ce que cette barre est justement là pour éviter.
 */
export function TableToolbar({ searchLabel, placeholder, filters = [] }: TableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const apply = (next: URLSearchParams) => {
    // Toute nouvelle recherche ramène en page 1 : rester en page 4 d'un
    // résultat qui n'en compte plus que 2 afficherait une liste vide.
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    if (query.trim()) next.set("q", query.trim());
    else next.delete("q");
    apply(next);
  };

  const handleFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    apply(next);
  };

  const hasQuery = (searchParams.get("q") ?? "") !== "";

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border px-5 py-3">
      <form onSubmit={handleSearch} className="flex flex-1 items-end gap-2">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold">
          {searchLabel}
          <span className="relative">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm font-normal"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  const next = new URLSearchParams(searchParams.toString());
                  next.delete("q");
                  apply(next);
                }}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </span>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="font-display h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "…" : "Rechercher"}
        </button>
      </form>

      {filters.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-xs font-semibold">
          {f.label}
          <select
            value={searchParams.get(f.name) ?? ""}
            onChange={(e) => handleFilter(f.name, e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
          >
            <option value="">Toutes</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {hasQuery && (
        <p className="w-full text-xs text-muted-foreground">
          Résultats filtrés sur «&nbsp;{searchParams.get("q")}&nbsp;».
        </p>
      )}
    </div>
  );
}
