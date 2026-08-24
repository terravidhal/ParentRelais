"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Clock, Search, Users } from "lucide-react";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import { useAllSessionsQuery } from "@/lib/hooks/use-outbox-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";

/** Petit écran : au-delà, la liste dépasse la hauteur visible. */
const PAGE_SIZE = 4;

/**
 * Historique local des séances animées par ce facilitateur — lit
 * uniquement Dexie.outbox (jamais Supabase), donc disponible hors-ligne
 * comme le reste de la zone facilitateur. Les séances "synced" ne sont
 * jamais supprimées de l'outbox précisément pour alimenter cet écran
 * (voir lib/db/outbox.ts, markSessionsSynced).
 */
export default function HistoryPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessionsQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  const totalFamilies = sessions
    .filter((s) => s.status === "synced")
    .reduce((n, s) => n + s.parents_total, 0);

  // Recherche et filtre locaux : l'historique vit dans Dexie, il n'y a rien
  // à demander au réseau. Un facilitateur actif accumule une séance par
  // animation — la liste devient vite longue sur un petit écran.
  const sorted = [...sessions]
    .filter((s) => {
      if (statusFilter === "pending" && s.status !== "pending") return false;
      if (statusFilter === "synced" && s.status !== "synced") return false;
      if (!search.trim()) return true;
      return s.locality.toLowerCase().includes(search.trim().toLowerCase());
    })
    .sort(
      (a, b) => new Date(b.held_at).getTime() - new Date(a.held_at).getTime(),
    );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const syncedCount = sessions.filter((s) => s.status === "synced").length;
  const pendingCount = sessions.length - syncedCount;

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </button>

      <PageHeading>Mes séances</PageHeading>

      {/* Deux zones à partir de lg: — un résumé qui tient dans le champ de
          vision à gauche, la liste à droite. En dessous, tout s'empile.
          Avant, cette page n'occupait que 40 % de la largeur en 1440px,
          avec 432px de vide de chaque côté (mesuré). */}
      <div className="mt-4 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-6">
        <div className="lg:sticky lg:top-24 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-accent-soft p-3">
            <Users size={18} className="text-accent-ink" aria-hidden="true" />
            <span className="font-display text-sm font-semibold">
              {totalFamilies} famille{totalFamilies > 1 ? "s" : ""} touchée
              {totalFamilies > 1 ? "s" : ""}
            </span>
          </div>
          {sessions.length > 0 && (
            <div className="surface">
              <p className="text-xs font-semibold text-muted-foreground">
                Vos séances
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 size={14} className="text-success" aria-hidden="true" />
                  Synchronisées
                </span>
                <span className="font-display font-bold tabular-nums">{syncedCount}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={14} className="text-accent-ink" aria-hidden="true" />
                  En attente
                </span>
                <span className="font-display font-bold tabular-nums">{pendingCount}</span>
              </div>
            </div>
          )}
        </div>

      <div className="mt-4 flex flex-col gap-2.5 lg:mt-0">
        {/* Masqués tant que la liste tient à l'écran : sur un petit écran,
            une barre inutile coûte de la place au contenu. */}
        {!sessionsLoading && sessions.length > PAGE_SIZE && (
          <div className="mb-1 flex flex-wrap items-end gap-2">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-semibold">
              Rechercher une localité
              <span className="relative">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Maroua…"
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-3 text-base font-normal"
                />
              </span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Statut
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-border bg-background px-3 text-base font-normal"
              >
                <option value="">Toutes</option>
                <option value="synced">Envoyées</option>
                <option value="pending">En attente</option>
              </select>
            </label>
          </div>
        )}

        {sessionsLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {search.trim() || statusFilter
              ? "Aucune séance ne correspond à cette recherche."
              : "Aucune séance animée pour l'instant. Ouvrez un module puis « Animer une séance »."}
          </p>
        ) : (
          paged.map((s) => (
            <div
              key={s.client_uuid}
              className="flex items-center justify-between surface"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {s.locality}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  · {s.parents_total} parents · quiz {s.quiz_score}/{s.quiz_max}
                </p>
              </div>
              {s.status === "synced" ? (
                <span
                  className="flex items-center gap-1 text-xs font-semibold text-success"
                  title="Synchronisée"
                >
                  <CheckCircle2 size={16} aria-hidden="true" /> Synced
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-xs font-semibold text-accent-ink"
                  title="En attente de synchronisation"
                >
                  <Clock size={16} aria-hidden="true" /> En attente
                </span>
              )}
            </div>
          ))
        )}

        {pageCount > 1 && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} sur {pageCount} · {sorted.length} séance
              {sorted.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={
                    n === currentPage
                      ? "font-display flex h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-2 text-sm font-semibold text-primary-foreground"
                      : "font-display flex h-11 min-w-11 items-center justify-center rounded-xl border border-border px-2 text-sm font-semibold"
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
